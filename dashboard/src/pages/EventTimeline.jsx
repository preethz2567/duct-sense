import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RotateCcw,
  ShieldCheck,
  Table,
  List,
} from 'lucide-react';
import { sampleEventLog } from '../services/mockDataService';

export default function EventTimeline({ session, onOpenWorkflow }) {
  const [viewMode, setViewMode] = useState('TIMELINE'); // 'TIMELINE' or 'TABLE'

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">DOCUMENTATION LAYER</div>
          <h1 className="ds-page-title">INSPECTION EVENT TIMELINE</h1>
        </div>

        <div className="ds-header-actions">
          <div className="ds-mode-pill-group">
            <button
              className={`ds-mode-pill ${viewMode === 'TIMELINE' ? 'ds-mode-pill--sim' : ''}`}
              onClick={() => setViewMode('TIMELINE')}
            >
              <List size={12} /> Timeline Log
            </button>
            <button
              className={`ds-mode-pill ${viewMode === 'TABLE' ? 'ds-mode-pill--live' : ''}`}
              onClick={() => setViewMode('TABLE')}
            >
              <Table size={12} /> Full Data Table
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'TIMELINE' ? (
        /* Chronological Inspection Timeline */
        <div className="ds-card ds-timeline-card">
          <div className="ds-timeline-container">
            {session.timeline.map((item, idx) => {
              const isAnomaly = item.type === 'ANOMALY' || item.type === 'CONFIRM';
              const isRepair = item.type === 'REPAIR' || item.type === 'RESCAN';
              const isVerify = item.type === 'VERIFY' || item.result === 'PASS';

              return (
                <div key={idx} className="ds-timeline-entry">
                  <div className="ds-timeline-time-col">
                    <Clock size={12} />
                    <span>{item.time}</span>
                  </div>

                  <div className="ds-timeline-marker-col">
                    <div
                      className={`ds-timeline-bullet ${
                        isAnomaly ? 'ds-bullet-red' : isRepair ? 'ds-bullet-amber' : isVerify ? 'ds-bullet-green' : 'ds-bullet-navy'
                      }`}
                    />
                    {idx < session.timeline.length - 1 && <div className="ds-timeline-stem" />}
                  </div>

                  <div className="ds-timeline-content-col">
                    <div className="ds-timeline-label">{item.label}</div>
                    {item.evidence && (
                      <div className="ds-timeline-evidence-tag">
                        Evidence: <strong>{item.evidence}</strong>
                      </div>
                    )}
                    {item.sectionId && (
                      <span className="ds-timeline-sec-pill">Section {item.sectionId}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Event Data Table */
        <div className="ds-card ds-table-card">
          <div className="ds-table-responsive">
            <table className="ds-engineering-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Pduct (hPa)</th>
                  <th>Pambient (hPa)</th>
                  <th>ΔP (Pa)</th>
                  <th>Audio</th>
                  <th>Thermal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sampleEventLog.map((row) => (
                  <tr key={row.id}>
                    <td className="ds-td-mono">{row.id}</td>
                    <td className="ds-td-mono">{row.timestamp}</td>
                    <td className="ds-td-bold">{row.event}</td>
                    <td className="ds-td-mono">{row.pduct.toFixed(1)}</td>
                    <td className="ds-td-mono">{row.pambient.toFixed(1)}</td>
                    <td className="ds-td-mono ds-td-highlight">+{row.deltaP.toFixed(1)}</td>
                    <td className="ds-td-mono">{row.audio.toFixed(2)}</td>
                    <td className="ds-td-mono">{row.thermal.toFixed(2)}</td>
                    <td>
                      <span className="ds-pill-tag">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
