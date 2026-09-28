// field-app/src/services/db.ts
// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB wrapper using the `idb` helper library.
// Stores: inspections, findings
// All writes are local-first; sync is handled separately by syncService.
// ─────────────────────────────────────────────────────────────────────────────

import { openDB, IDBPDatabase } from 'idb';
import type { Finding, Inspection } from '../types';

const DB_NAME = 'ductsense-field';
const DB_VERSION = 1;

export interface FieldDB {
  inspections: {
    key: string;
    value: Inspection;
  };
  findings: {
    key: string;
    value: Finding;
    indexes: { 'by-inspection': string };
  };
}

let _db: IDBPDatabase<FieldDB> | null = null;

async function getDB(): Promise<IDBPDatabase<FieldDB>> {
  if (_db) return _db;
  _db = await openDB<FieldDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('inspections')) {
        db.createObjectStore('inspections', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('findings')) {
        const store = db.createObjectStore('findings', { keyPath: 'finding_id' });
        store.createIndex('by-inspection', 'inspection_id');
      }
    },
  });
  return _db;
}

// ── Inspections ───────────────────────────────────────────────────────────────

export async function getAllInspections(): Promise<Inspection[]> {
  const db = await getDB();
  return db.getAll('inspections');
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  const db = await getDB();
  return db.get('inspections', id);
}

export async function upsertInspection(inspection: Inspection): Promise<void> {
  const db = await getDB();
  await db.put('inspections', inspection);
}

export async function deleteInspection(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('inspections', id);
}

// ── Findings ─────────────────────────────────────────────────────────────────

export async function getFindingsByInspection(inspectionId: string): Promise<Finding[]> {
  const db = await getDB();
  return db.getAllFromIndex('findings', 'by-inspection', inspectionId);
}

export async function getFinding(id: string): Promise<Finding | undefined> {
  const db = await getDB();
  return db.get('findings', id);
}

export async function upsertFinding(finding: Finding): Promise<void> {
  const db = await getDB();
  await db.put('findings', finding);
}

export async function deleteFinding(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('findings', id);
}

export async function getLocalFindings(): Promise<Finding[]> {
  const db = await getDB();
  return db.getAll('findings');
}
