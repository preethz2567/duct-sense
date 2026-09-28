// field-app/src/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// DuctSense Field App — core data types
// Designed for clean mapping to the existing backend WalkthroughReport model.
// ─────────────────────────────────────────────────────────────────────────────

export type FindingType = 'SUSPECTED_LEAK' | 'CONFIRMED_LEAK' | 'OBSERVATION';

export type SyncStatus = 'LOCAL' | 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED';

export type FindingStatus = 'OPEN' | 'RESOLVED';

export interface Finding {
  finding_id: string;
  inspection_id: string;
  floor_plan_id: string;
  floor_plan_page: number;      // 1-indexed; always 1 for image plans
  finding_type: FindingType;
  /** Normalised X position (0.0–1.0) relative to plan display area */
  x: number;
  /** Normalised Y position (0.0–1.0) relative to plan display area */
  y: number;
  created_at: string;           // ISO 8601
  updated_at: string;
  photo: string | null;         // base64 data URL or null
  notes: string;
  status: FindingStatus;
  sync_status: SyncStatus;
}

export interface FloorPlan {
  id: string;
  filename: string;
  type: 'image' | 'pdf';
  url: string;                  // resolved URL under /floor-plans/
  label: string;                // display name derived from filename
}

export interface Inspection {
  id: string;
  site: string;
  building: string;
  level: string;
  hvac_system: string;
  floor_plan_id: string;        // references a FloorPlan.id
  technician: string;
  date: string;                 // ISO date
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}
