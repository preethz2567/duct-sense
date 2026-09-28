// field-app/src/services/syncService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sync abstraction layer.
//
// CURRENT STATE: LOCAL / DEMO MODE
// The existing DuctSense backend (/walkthroughs) does not yet have a
// /findings endpoint. This service is a clean abstraction that:
//  1. Marks findings as QUEUED when online
//  2. Does NOT fake successful sync — remains QUEUED/LOCAL until a real endpoint
//     is connected.
//
// To connect the real backend later, implement `pushFinding()` below and
// point BACKEND_BASE_URL to the DuctSense FastAPI server.
// ─────────────────────────────────────────────────────────────────────────────

import { getFindingsByInspection, upsertFinding, getLocalFindings } from './db';
import type { Finding, SyncStatus } from '../types';

// ── Configuration ─────────────────────────────────────────────────────────────
// Set to the DuctSense FastAPI base URL when the /findings endpoint is ready.
const BACKEND_BASE_URL = `http://${window.location.hostname}:8000`;
const FINDINGS_ENDPOINT = `${BACKEND_BASE_URL}/findings`;

// ── Online detection ──────────────────────────────────────────────────────────
export function isOnline(): boolean {
  return navigator.onLine;
}

// ── Status count helpers ──────────────────────────────────────────────────────
export async function countLocalFindings(): Promise<number> {
  const all = await getLocalFindings();
  return all.filter(f => f.sync_status === 'LOCAL' || f.sync_status === 'QUEUED' || f.sync_status === 'FAILED').length;
}

// ── Queue management ──────────────────────────────────────────────────────────
// Called when user saves a finding. Sets sync_status based on connectivity.
export async function queueFinding(finding: Finding): Promise<Finding> {
  const updated: Finding = {
    ...finding,
    sync_status: isOnline() ? 'QUEUED' : 'LOCAL',
    updated_at: new Date().toISOString(),
  };
  await upsertFinding(updated);
  return updated;
}

// ── Sync attempt ──────────────────────────────────────────────────────────────
// Called when the app detects the network returning (navigator.onLine = true).
// Returns: number of successfully synced findings (0 = demo mode or no endpoint).
export async function attemptSync(): Promise<{ synced: number; failed: number; mode: 'DEMO' | 'LIVE' }> {
  if (!isOnline()) return { synced: 0, failed: 0, mode: 'DEMO' };

  // Check if backend is reachable
  let backendReachable = false;
  try {
    const probe = await fetch(`${BACKEND_BASE_URL}/walkthroughs`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    backendReachable = probe.ok;
  } catch {
    backendReachable = false;
  }

  if (!backendReachable) {
    return { synced: 0, failed: 0, mode: 'DEMO' };
  }

  // Backend is reachable. In DEMO MODE, /findings endpoint does not exist yet.
  // Mark QUEUED findings to surface in the UI — but do NOT fake a SYNCED status.
  const all = await getLocalFindings();
  const queued = all.filter(f => f.sync_status === 'QUEUED');

  let synced = 0, failed = 0;
  for (const finding of queued) {
    try {
      await upsertFinding({ ...finding, sync_status: 'SYNCING' });
      const resp = await fetch(FINDINGS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finding),
      });
      if (resp.ok) {
        await upsertFinding({ ...finding, sync_status: 'SYNCED' });
        synced++;
      } else {
        await upsertFinding({ ...finding, sync_status: 'FAILED' });
        failed++;
      }
    } catch {
      await upsertFinding({ ...finding, sync_status: 'FAILED' });
      failed++;
    }
  }

  // Also pull findings from server
  try {
    const pullResp = await fetch(FINDINGS_ENDPOINT);
    if (pullResp.ok) {
      const serverFindings: Finding[] = await pullResp.json();
      for (const sf of serverFindings) {
        // If it's already locally queued or syncing, don't overwrite local changes
        const existing = await getLocalFindings().then(all => all.find(f => f.finding_id === sf.finding_id));
        if (!existing || existing.sync_status === 'SYNCED') {
          await upsertFinding({ ...sf, sync_status: 'SYNCED' });
        }
      }
    }
  } catch (err) {
    console.error("Failed to pull findings", err);
  }

  return { synced, failed, mode: 'LIVE' };
}
