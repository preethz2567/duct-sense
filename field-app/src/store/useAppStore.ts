// field-app/src/store/useAppStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight React state store using useState + Context.
// No heavy state library needed for this simple field app.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext } from 'react';
import type { Inspection, FloorPlan } from '../types';

export type Screen = 'INSPECTIONS' | 'MAP' | 'FINDINGS' | 'SYNC';

export interface AppState {
  screen: Screen;
  activeInspection: Inspection | null;
  activeFloorPlan: FloorPlan | null;
  floorPlans: FloorPlan[];
  online: boolean;
  pendingCount: number;
  setScreen: (s: Screen) => void;
  setActiveInspection: (i: Inspection | null) => void;
  setActiveFloorPlan: (fp: FloorPlan | null) => void;
  setFloorPlans: (fps: FloorPlan[]) => void;
  setOnline: (v: boolean) => void;
  setPendingCount: (n: number) => void;
}

export const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
