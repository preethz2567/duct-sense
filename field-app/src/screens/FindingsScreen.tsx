import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../store/useAppStore';
import { getFindingsByInspection, deleteFinding } from '../services/db';
import type { Finding, FindingType } from '../types';
import { MapPin, Check, X, RefreshCw, AlertTriangle, HelpCircle, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_COLOR: Record<FindingType, string> = {
  SUSPECTED_LEAK: '#D88A19',
  CONFIRMED_LEAK: '#B83A32',
  OBSERVATION:    '#3F7655',
};

const TYPE_LABEL: Record<FindingType, string> = {
  SUSPECTED_LEAK: 'Suspected Leak',
  CONFIRMED_LEAK: 'Confirmed Leak',
  OBSERVATION:    'Observation',
};

const SYNC_LABEL: Record<Finding['sync_status'], string> = {
  LOCAL:   'LOCAL',
  QUEUED:  'QUEUED',
  SYNCING: 'SYNCING',
  SYNCED:  'SYNCED',
  FAILED:  'FAILED',
};

const SYNC_COLOR: Record<Finding['sync_status'], string> = {
  LOCAL:   '#667078',
  QUEUED:  '#D88A19',
  SYNCING: '#176B73',
  SYNCED:  '#3F7655',
  FAILED:  '#B83A32',
};

export default function FindingsScreen() {
  const { activeInspection, setScreen, floorPlans, setActiveFloorPlan } = useApp();
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

  function handleOpenInMap(finding: Finding) {
    if (finding.floor_plan_id && floorPlans.length > 0) {
      const fp = floorPlans.find(f => f.id === finding.floor_plan_id);
      if (fp) setActiveFloorPlan(fp);
    }
    setScreen('MAP');
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
                style={{ cursor: 'pointer', padding: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TYPE_COLOR[f.finding_type], fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={16} fill={f.finding_type === 'CONFIRMED_LEAK' ? TYPE_COLOR[f.finding_type] : 'none'} />
                    {TYPE_LABEL[f.finding_type]}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="sync-badge"
                    style={{ color: SYNC_COLOR[f.sync_status], display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {f.sync_status === 'SYNCED' ? <Check size={10} /> : (f.sync_status === 'FAILED' ? <X size={10} /> : <RefreshCw size={10} />)}
                    {SYNC_LABEL[f.sync_status]}
                  </span>
                  <span className="expand-chevron" style={{ color: '#667078' }}>
                    {expanded === f.finding_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {expanded === f.finding_id && (
                <div className="finding-detail" style={{ padding: '0 12px 12px 12px' }}>
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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 6 }}
                      onClick={() => handleOpenInMap(f)}
                    >
                      <MapIcon size={14} /> VIEW ON MAP
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleDelete(f.finding_id)}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
