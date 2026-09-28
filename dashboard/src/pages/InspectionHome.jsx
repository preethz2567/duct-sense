import React from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sliders,
  Play,
  FileText,
} from 'lucide-react';

export default function InspectionHome({
  session,
  onNavigate,
  onStartWalkthrough,
}) {
  const completedCount = session.sections.filter((s) => s.status === 'COMPLETED').length;
  const remainingCount = session.sections.filter((s) => s.status === 'PENDING').length;
  const activeSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Session Title Bar */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">COMMISSIONING INSPECTION</div>
          <h1 className="ds-page-title">CURRENT INSPECTION · #{session.id}</h1>
        </div>

        <div className="ds-header-actions">
          <span className="ds-pill-tag ds-pill-amber">IN PROGRESS</span>
          <span className="ds-pill-tag"><Clock size={12} /> {session.date}</span>
        </div>
      </header>

      {/* Facility & Metadata Summary Block */}
      <div className="ds-card ds-card-meta-summary">
        <div className="ds-meta-grid-4">
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">FACILITY / SITE</span>
            <span className="ds-meta-val">{session.site}</span>
          </div>
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">BUILDING & LEVEL</span>
            <span className="ds-meta-val">{session.building} · {session.level}</span>
          </div>
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">HVAC SYSTEM</span>
            <span className="ds-meta-val">{session.system}</span>
          </div>
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">INSPECTOR / TECHNICIAN</span>
            <span className="ds-meta-val">{session.technician}</span>
          </div>
        </div>
      </div>

      {/* Section Progress Strip */}
      <div className="ds-card ds-card-progress">
        <div className="ds-card-header ds-card-header-clean">
          <span className="ds-card-title">INSPECTION ROUTE PROGRESS</span>
          <span className="ds-progress-ratio">
            <strong>{completedCount}</strong> of {session.sections.length} sections completed ({remainingCount} remaining)
          </span>
        </div>

        <div className="ds-route-progress-track">
          {session.sections.map((sec, idx) => {
            const isCompleted = sec.status === 'COMPLETED';
            const isCurrent = sec.id === session.activeSectionId;
            return (
              <div
                key={sec.id}
                className={`ds-route-node ${isCurrent ? 'ds-node-current' : isCompleted ? 'ds-node-completed' : 'ds-node-pending'}`}
              >
                <div className="ds-node-badge">
                  {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                </div>
                <div className="ds-node-info">
                  <span className="ds-node-id">{sec.id}</span>
                  <span className="ds-node-name">{sec.name}</span>
                </div>
                {isCurrent && <span className="ds-current-pill">CURRENT</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Section & Action Block */}
      <div className="ds-grid-2col">
        {/* Left: Active Section Card */}
        <div className="ds-card ds-active-section-panel">
          <div className="ds-kicker-label">ACTIVE TASK</div>
          <h2 className="ds-active-sec-title">Section {activeSection.id}: {activeSection.name}</h2>
          <div className="ds-active-sec-meta">
            <span>Route: AHU-02 Main Trunk → Server Room</span>
            <span>Length: {activeSection.lengthM.toFixed(1)} m</span>
          </div>

          <div className="ds-sec-state-alert">
            <AlertTriangle size={15} className="ds-icon-amber" />
            <div>
              <strong>Anomaly Under Verification:</strong> Controlled test leak detected at 0.50 m. Ready for inspection scan.
            </div>
          </div>

          <div className="ds-active-actions-row">
            <button className="ds-btn ds-btn-amber ds-btn-lg" onClick={onStartWalkthrough}>
              <Play size={14} /> Continue Inspection Walkthrough
            </button>
            <button className="ds-btn ds-btn-secondary" onClick={() => onNavigate('inspection_map')}>
              <MapPin size={14} /> View on Map
            </button>
          </div>
        </div>

        {/* Right: Quick Telemetry Baseline Snapshot */}
        <div className="ds-card ds-snapshot-panel">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">INSTRUMENT BASELINE</span>
            <span className="ds-pill-tag">BMP280 + FLIR</span>
          </div>

          <div className="ds-snapshot-metrics">
            <div className="ds-snap-row">
              <span className="ds-snap-key">Pduct Static Pressure</span>
              <span className="ds-snap-val">{session.telemetry.pductHpa.toFixed(1)} hPa</span>
            </div>
            <div className="ds-snap-row">
              <span className="ds-snap-key">Pambient Reference</span>
              <span className="ds-snap-val">{session.telemetry.pambientHpa.toFixed(1)} hPa</span>
            </div>
            <div className="ds-snap-row ds-snap-highlight">
              <span className="ds-snap-key">Calibrated Differential (ΔP)</span>
              <span className="ds-snap-val">+{session.telemetry.calibratedDeltaPPa.toFixed(1)} Pa</span>
            </div>
            <div className="ds-snap-row">
              <span className="ds-snap-key">Zero-Offset Calibration</span>
              <span className="ds-snap-val">+{session.telemetry.calibrationOffsetPa.toFixed(1)} Pa</span>
            </div>
          </div>

          <div className="ds-snapshot-footer">
            <button className="ds-btn ds-btn-secondary ds-btn-full" onClick={() => onNavigate('commissioning_report')}>
              <FileText size={13} /> View Current Commissioning Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
