import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import SensorEvidencePanel from '../components/SensorEvidencePanel';

const TEAL = '#0D9488';

export function computeLocalization(events) {
  if (!events || events.length === 0) return null;
  const positions = events.map((e) => e.position_m);
  const confs = events.map((e) => e.leak_confidence);

  const peakIdx = confs.indexOf(Math.max(...confs));
  const peakPos = positions[peakIdx];
  const peakConf = confs[peakIdx];

  const regionStart = Math.min(...positions);
  const regionEnd = Math.max(...positions);
  const regionWidth = regionEnd - regionStart;
  const ductLength = 1.0;

  return {
    peakPos,
    peakConf,
    regionStart,
    regionEnd,
    regionWidth,
    ductLength,
  };
}

export default function Reports({ walkthroughs, selectedWalkthrough, onSelectWalkthrough, onBack }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (selectedWalkthrough) {
    const events = selectedWalkthrough.leak_events || [];
    const loc = computeLocalization(events);
    const activeEv = selectedEvent || (events.length > 0 ? events[0] : null);

    return (
      <div className="ds-page-container ds-instrument-view">
        <header className="ds-page-header ds-header-compact">
          <div>
            <div className="ds-back-action" onClick={onBack}>
              <ArrowLeft size={14} /> Back to Sessions
            </div>
            <h1 className="ds-page-title">
              Session Report: {selectedWalkthrough.walkthrough_id.slice(0, 8)}
            </h1>
          </div>
          <div className="ds-header-actions">
            <span className="ds-pill-tag"><Calendar size={12} /> {selectedWalkthrough.date}</span>
          </div>
        </header>

        {events.length === 0 ? (
          <div className="ds-card ds-clean-report-card">
            <CheckCircle2 size={32} style={{ color: 'var(--accent-teal)', marginBottom: 8 }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Clean Walkthrough Session</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No leak events detected along the duct path.</p>
          </div>
        ) : (
          <div className="ds-report-details-layout">
            {/* Top row: Key Metrics */}
            <div className="ds-grid-3col">
              <div className="ds-card">
                <div className="ds-card-header ds-card-header-clean">
                  <span className="ds-card-title">Peak Localization</span>
                </div>
                <div className="ds-readout-val ds-val-navy">
                  {loc?.peakPos.toFixed(2)} <span className="ds-val-unit">m</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Span: {loc?.regionStart.toFixed(2)}m – {loc?.regionEnd.toFixed(2)}m</span>
              </div>

              <div className="ds-card">
                <div className="ds-card-header ds-card-header-clean">
                  <span className="ds-card-title">Peak Confidence</span>
                </div>
                <div className="ds-readout-val ds-val-orange">
                  {loc ? (loc.peakConf * 100).toFixed(0) + '%' : '—'}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-sensor fused cutoff exceeded</span>
              </div>

              <div className="ds-card">
                <div className="ds-card-header ds-card-header-clean">
                  <span className="ds-card-title">Event Count</span>
                </div>
                <div className="ds-readout-val" style={{ color: 'var(--accent-red)' }}>
                  {events.length} <span className="ds-val-unit">points</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Logged across walkthrough scan</span>
              </div>
            </div>

            {/* Evidence Panel */}
            {activeEv && (
              <SensorEvidencePanel
                pressureDifferentialPa={activeEv.pressure_differential_pa}
                normalizedPressure={activeEv.normalized_pressure}
                thermalScore={activeEv.thermal_confidence}
                acousticScore={activeEv.audio_confidence}
                fusedConfidence={activeEv.leak_confidence}
              />
            )}

            {/* Events Table */}
            <div className="ds-card ds-table-card">
              <div className="ds-card-header">
                <span className="ds-card-title">Recorded Points</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click row to view evidence</span>
              </div>
              <div className="ds-table-responsive">
                <table className="ds-engineering-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Pos (m)</th>
                      <th>Confidence</th>
                      <th>Thermal</th>
                      <th>ΔP (Pa)</th>
                      <th>Audio</th>
                      <th>Time (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, idx) => (
                      <tr
                        key={idx}
                        className={activeEv?.position_m === ev.position_m ? 'ds-row-selected' : ''}
                        onClick={() => setSelectedEvent(ev)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="ds-td-mono">{idx + 1}</td>
                        <td className="ds-td-mono ds-td-bold">{ev.position_m.toFixed(3)}</td>
                        <td className="ds-td-mono ds-td-highlight">{(ev.leak_confidence * 100).toFixed(0)}%</td>
                        <td className="ds-td-mono">{ev.thermal_confidence ? `${(ev.thermal_confidence * 100).toFixed(0)}%` : '—'}</td>
                        <td className="ds-td-mono">{ev.pressure_differential_pa ? `+${ev.pressure_differential_pa.toFixed(1)}` : '—'}</td>
                        <td className="ds-td-mono">{ev.audio_confidence ? `${(ev.audio_confidence * 100).toFixed(0)}%` : '—'}</td>
                        <td className="ds-td-mono">{ev.timestamp.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Walkthrough List View - Modern Card Grid
  const barData = walkthroughs.map((wt) => ({
    date: wt.date,
    count: wt.leak_events.length,
  }));

  return (
    <div className="ds-page-container ds-instrument-view">
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Inspection Reports</h1>
        </div>
        <div className="ds-header-actions">
          <span className="ds-pill-tag"><strong>{walkthroughs.length}</strong> Sessions Recorded</span>
        </div>
      </header>

      {/* Bar Chart Overview */}
      {walkthroughs.length > 0 && (
        <div className="ds-card ds-chart-card">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">Leak Count History</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} width={25} />
              <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11 }} />
              <Bar dataKey="count" fill={TEAL} radius={[3, 3, 0, 0]} maxBarSize={40} name="Leaks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grid of Walkthrough Session Cards */}
      <div className="ds-walkthrough-cards-grid">
        {walkthroughs.map((wt) => {
          const count = wt.leak_events.length;
          return (
            <div key={wt.walkthrough_id} className="ds-card ds-wt-card">
              <div>
                <div className="ds-wt-card-top">
                  <span className="ds-wt-date"><Calendar size={13} /> {wt.date}</span>
                  <StatusBadge status={count > 0 ? 'LEAK_DETECTED' : 'NORMAL'} size="small" />
                </div>
                <div className="ds-wt-id-code">{wt.walkthrough_id}</div>
                <div className="ds-wt-leak-count">
                  {count > 0 ? (
                    <span><strong>{count}</strong> leak event{count !== 1 ? 's' : ''} detected</span>
                  ) : (
                    <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>Zero leaks detected</span>
                  )}
                </div>
              </div>
              <button className="ds-btn ds-btn-primary ds-btn-full" onClick={() => onSelectWalkthrough(wt)}>
                <Eye size={13} /> Inspect Report
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
