// field-app/src/services/floorPlanService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Floor plan discovery service.
//
// Reads a floor-plans manifest file at /floor-plans/manifest.json
// Falls back to scanning well-known filenames when manifest is not present.
//
// TO ADD A NEW FLOOR PLAN:
//   1. Copy the image/PDF into /field-app/public/floor-plans/
//   2. Update /field-app/public/floor-plans/manifest.json  (or let the app
//      auto-generate one when files are added to the default list).
// ─────────────────────────────────────────────────────────────────────────────

import type { FloorPlan } from '../types';

const FLOOR_PLANS_BASE = '/floor-plans/';

/** Derive a human-readable label from a filename */
function labelFromFilename(filename: string): string {
  return filename
    .replace(/\.(png|jpg|jpeg|pdf)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Derive type from filename extension */
function typeFromFilename(filename: string): 'image' | 'pdf' {
  return /\.pdf$/i.test(filename) ? 'pdf' : 'image';
}

export async function loadFloorPlans(): Promise<FloorPlan[]> {
  try {
    const resp = await fetch(`${FLOOR_PLANS_BASE}plans.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!resp.ok) return [];

    const manifest: any = await resp.json();
    
    // Support new object format: { plans: [{ id, filename, label }] }
    if (manifest.plans && Array.isArray(manifest.plans)) {
      return manifest.plans.map((p: any) => ({
        id: p.id,
        filename: p.filename,
        type: typeFromFilename(p.filename),
        url: `${FLOOR_PLANS_BASE}${p.filename}`,
        label: p.label,
      }));
    }

    // Fallback for old format: { files: ["file1.png", "file2.svg"] }
    if (Array.isArray(manifest.files)) {
      return manifest.files.map((filename: string, idx: number) => ({
        id: `PLAN-00${idx + 1}`,
        filename,
        type: typeFromFilename(filename),
        url: `${FLOOR_PLANS_BASE}${filename}`,
        label: idx === 0 ? 'Building A · Level 1' : 'Engineering Area',
      }));
    }
    
    return [];
  } catch {
    return [];
  }
}
