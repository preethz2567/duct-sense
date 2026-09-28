// field-app/src/screens/FindingsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../store/useAppStore';
import { getFindingsByInspection, deleteFinding } from '../services/db';
import type { Finding, FindingType } from '../types';

const TYPE_COLOR: Record<FindingType, string> = {
  SUSPECTED_LEAK: '#D88A19',
  CONFIRMED_LEAK: '#B83A32',
  OBSERVATION:    '#3F7655',
};

const TYPE_LABEL: Record<FindingType, string> = {
  SUSPECTED_LEAK: '⚠ Suspected Leak',
  CONFIRMED_LEAK: '● Confirmed Leak',
  OBSERVATION:    '○ Observation',
};

const SYNC_LABEL: Record<Finding['sync_status'], string> = {
  LOCAL:   '● LOCAL',
  QUEUED:  '⏳ QUEUED',
  SYNCING: '⟳ SYNCING',
  SYNCED:  '✓ SYNCED',
  FAILED:  '✕ FAILED',
};

const SYNC_COLOR: Record<Finding['sync_status'], string> = {
  LOCAL:   '#667078',
  QUEUED:  '#D88A19',
  SYNCING: '#176B73',
  SYNCED:  '#3F7655',
  FAILED:  '#B83A32',
};

export default function FindingsScreen() {
  const { activeInspection, setScreen } = useApp();
  const [findings, setFindings]   = useState<Finding[]>([]);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeInspection) return;
    setFindings(await getFindingsByInspection(activeInspection.id));
  }, [activeInspection]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this finding?')) return;
    await deleteFinding(id);
    load();
  }

  if (!activeInspection) {
    return (
      <div className="screen screen-centered">
        <p className="hint-text">No active inspection.</p>
        <button className="btn btn-primary" onClick={() => setScreen('INSPECTIONS')}>
          SELECT INSPECTION
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">FINDINGS</h1>
        <div className="screen-sub">{activeInspection.id} · {activeInspection.building} {activeInspection.level}</div>
      </div>

      {findings.length === 0 ? (
        <div className="empty-findings">
          <p>No findings recorded yet.</p>
          <button className="btn btn-primary" onClick={() => setScreen('MAP')}>
            OPEN MAP
          </button>
        </div>
      ) : (
        <div className="findings-list">
          {findings.map(f => (
            <div key={f.finding_id} className="finding-card">
              <div
                className="finding-card-header"
                onClick={() => setExpanded(expanded === f.finding_id ? null : f.finding_id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TYPE_COLOR[f.finding_type], fontWeight: 700 }}>
                    {TYPE_LABEL[f.finding_type]}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="sync-badge"
                    style={{ color: SYNC_COLOR[f.sync_status] }}
                  >
                    {SYNC_LABEL[f.sync_status]}
                  </span>
                  <span className="expand-chevron">{expanded === f.finding_id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === f.finding_id && (
                <div className="finding-detail">
                  <div className="detail-row">
                    <span className="detail-lbl">PLAN LOCATION</span>
                    <span className="detail-val">
                      X {(f.x * 100).toFixed(1)}% · Y {(f.y * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-lbl">RECORDED</span>
                    <span className="detail-val">
                      {new Date(f.created_at).toLocaleString()}
                    </span>
                  </div>
                  {f.notes && (
                    <div className="detail-row">
                      <span className="detail-lbl">NOTE</span>
                      <span className="detail-val">{f.notes}</span>
                    </div>
                  )}
                  {f.photo && (
                    <div className="finding-photo-wrap">
                      <img src={f.photo} alt="Finding" className="finding-photo" />
                    </div>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(f.finding_id)}
                  >
                    DELETE FINDING
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
