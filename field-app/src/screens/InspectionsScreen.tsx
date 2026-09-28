// field-app/src/screens/InspectionsScreen.tsx
import React, { useEffect, useState } from 'react';
import { useApp } from '../store/useAppStore';
import { getAllInspections, upsertInspection } from '../services/db';
import type { Inspection } from '../types';

// Default sample inspections seeded on first run so the app isn't empty.
const SEED_INSPECTIONS: Inspection[] = [
  {
    id: 'INS-1042',
    site: 'North Campus Facility',
    building: 'Building A',
    level: 'Level 2',
    hvac_system: 'AHU-02 (Supply Air)',
    floor_plan_id: '',        // technician picks from available plans
    technician: 'D. Preethi',
    date: new Date().toISOString().slice(0, 10),
    status: 'IN_PROGRESS',
  },
  {
    id: 'INS-1041',
    site: 'North Campus Facility',
    building: 'Building B',
    level: 'Level 1',
    hvac_system: 'AHU-01 (Main Return)',
    floor_plan_id: '',
    technician: 'D. Preethi',
    date: '2026-09-27',
    status: 'COMPLETED',
  },
];

export default function InspectionsScreen() {
  const { setScreen, setActiveInspection, floorPlans, setActiveFloorPlan } = useApp();
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    (async () => {
      let stored = await getAllInspections();
      if (stored.length === 0) {
        for (const ins of SEED_INSPECTIONS) await upsertInspection(ins);
        stored = SEED_INSPECTIONS;
      }
      setInspections(stored);
    })();
  }, []);

  function handleOpen(inspection: Inspection) {
    setActiveInspection(inspection);
    // Auto-select floor plan if the inspection specifies one
    if (inspection.floor_plan_id && floorPlans.length > 0) {
      const fp = floorPlans.find(f => f.id === inspection.floor_plan_id);
      if (fp) setActiveFloorPlan(fp);
    } else if (floorPlans.length > 0 && !inspection.floor_plan_id) {
      setActiveFloorPlan(floorPlans[0]);
    }
    setScreen('MAP');
  }

  function statusColor(status: Inspection['status']) {
    if (status === 'IN_PROGRESS') return '#D88A19';
    if (status === 'COMPLETED') return '#3F7655';
    return '#667078';
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">INSPECTIONS</h1>
        {floorPlans.length === 0 && (
          <p className="hint-text">
            No floor plans found. Add files to{' '}
            <code>/field-app/public/floor-plans/</code> and update{' '}
            <code>manifest.json</code>.
          </p>
        )}
      </div>

      <div className="inspection-list">
        {inspections.length === 0 && (
          <p className="empty-text">No inspections on this device.</p>
        )}
        {inspections.map(ins => (
          <div key={ins.id} className="insp-card">
            <div className="insp-card-header">
              <span className="insp-id">{ins.id}</span>
              <span
                className="insp-status-pill"
                style={{ color: statusColor(ins.status) }}
              >
                {ins.status.replace('_', ' ')}
              </span>
            </div>
            <div className="insp-site">{ins.site}</div>
            <div className="insp-meta">
              {ins.building} · {ins.level}
            </div>
            <div className="insp-meta">{ins.hvac_system}</div>
            <div className="insp-meta insp-date">{ins.date}</div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => handleOpen(ins)}
            >
              START INSPECTION →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
