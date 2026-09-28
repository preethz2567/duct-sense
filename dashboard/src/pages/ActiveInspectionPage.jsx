// src/pages/ActiveInspectionPage.jsx
import React, { useState } from 'react';
import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  RotateCcw,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export default function ActiveInspectionPage({
  session,
  onSelectSection,
  onOpenEvidenceDrawer,
  onOpenPhotoCapture,
  onOpenWorkflowModal,
  onUpdatePlanLocation,
}) {
  const [isManualPlacing, setIsManualPlacing] = useState(false);
  const activeSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];
  const { activeAnomaly } = session;

  const handleMapClick = (e) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - svgRect.left;
    const width = svgRect.width;
    // Map click along 0m to 1m
    const relX = Math.max(0, Math.min(1, clickX / width));
    const positionM = parseFloat((relX * 1.0).toFixed(2));
    onUpdatePlanLocation(positionM);
    setIsManualPlacing(false);
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Active Inspection Top Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">DUCTSENSE ACTIVE INSPECTION</div>
          <h1 className="ds-page-title">
            {session.id} · {session.system} · {session.level}
          </h1>
        </div>

        <div className="ds-header-actions">
          <span className="ds-pill-tag ds-pill-amber">INSPECTION ACTIVE</span>
          <span className="ds-pill-tag">{session.site}</span>
        </div>
      </header>

      {/* Spatial Duct Route Ribbon (D-01 to D-05) */}
      <div className="ds-card ds-route-ribbon-card">
        <div className="ds-card-header ds-card-header-clean">
          <span className="ds-card-title">DUCT INSPECTION ROUTE</span>
          <span className="ds-sec-sub">Select section to inspect or view evidence</span>
        </div>

        <div className="ds-duct-route-line">
          {session.sections.map((sec, idx) => {
            const isSelected = sec.id === session.activeSectionId;
            const isGreen = sec.status === 'VERIFIED_PASS' || sec.status === 'COMPLETED';
            const isRed = sec.status === 'CONFIRMED_LEAK';
            const isAmber = sec.status === 'IN_INSPECTION' || (isSelected && !isGreen && !isRed);
            const isGray = sec.status === 'PENDING';

            let stateClass = 'ds-route-node-gray';
            if (isGreen) stateClass = 'ds-route-node-green';
            else if (isRed) stateClass = 'ds-route-node-red';
            else if (isAmber) stateClass = 'ds-route-node-amber';

            return (
              <React.Fragment key={sec.id}>
                <div
                  className={`ds-route-section-box ${stateClass} ${isSelected ? 'ds-section-active-ring' : ''}`}
                  onClick={() => onSelectSection(sec.id)}
                >
                  <div className="ds-route-sec-top">
                    <span className="ds-route-sec-id">{sec.id}</span>
                    <span className="ds-route-sec-state-dot" />
                  </div>
                  <div className="ds-route-sec-name">{sec.name}</div>
                  <div className="ds-route-sec-status-text">
                    {isGreen ? 'Verified (Pass)' : isRed ? 'Confirmed Leak' : isAmber ? 'Inspecting' : 'Pending'}
                  </div>
                </div>

                {idx < session.sections.length - 1 && (
                  <div className={`ds-route-segment-connector ${isGreen ? 'ds-connector-green' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left 2D Inspection Map (60%), Right Current Section Panel (40%) */}
      <div className="ds-grid-active-inspection">
        {/* Left: 1.0 m POC Prototype Duct Plan */}
        <div className="ds-card ds-map-container-card">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">1.0 m POC Duct Rig Plan · Section {activeSection.id}</span>
            <div className="ds-header-actions">
              <button
                className={`ds-btn ds-btn-compact ${isManualPlacing ? 'ds-btn-amber' : 'ds-btn-secondary'}`}
                onClick={() => setIsManualPlacing(!isManualPlacing)}
              >
                <MapPin size={12} /> {isManualPlacing ? 'Click on duct to place' : 'Mark Plan Location'}
              </button>
            </div>
          </div>

          <div className="ds-map-svg-wrap">
            <svg
              viewBox="0 0 600 240"
              className="ds-map-svg"
              onClick={isManualPlacing ? handleMapClick : undefined}
              style={{ cursor: isManualPlacing ? 'crosshair' : 'default' }}
            >
              <defs>
                <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="#F8FAFC" />
              <rect width="100%" height="100%" fill="url(#gridPattern)" opacity="0.6" />

              {/* Physical Rig Frame */}
              <rect x="20" y="20" width="560" height="200" fill="none" stroke="#CDD0CE" strokeWidth="1.5" strokeDasharray="5 3" />
              <text x="35" y="40" fill="#667078" fontSize="10" fontWeight="bold">
                PHYSICAL POC DUCT RIG (1000 mm × 100 mm)
              </text>

              {/* Blower Unit @ 0.0 m */}
              <rect x="40" y="70" width="50" height="90" fill="#20252A" stroke="#344B5E" strokeWidth="1.5" rx="2" />
              <text x="65" y="120" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">BLOWER</text>
              <text x="65" y="180" fill="#667078" fontSize="9" textAnchor="middle">0.0 m</text>

              {/* Main 1.0 m Duct Cylinder */}
              <rect x="90" y="80" width="440" height="70" fill="#FFFFFF" stroke="#344B5E" strokeWidth="2" />

              {/* Distance Scale Markers along duct */}
              <line x1="90" y1="160" x2="530" y2="160" stroke="#344B5E" strokeWidth="1.5" />
              {[
                { pos: '0.0 m', x: 90 },
                { pos: '0.25 m', x: 200 },
                { pos: '0.50 m', x: 310 },
                { pos: '0.75 m', x: 420 },
                { pos: '1.0 m', x: 530 },
              ].map((m, idx) => (
                <g key={idx}>
                  <line x1={m.x} y1="155" x2={m.x} y2="165" stroke="#344B5E" strokeWidth="1.5" />
                  <text x={m.x} y="178" fill="#667078" fontSize="9" textAnchor="middle">{m.pos}</text>
                </g>
              ))}

              {/* Static Tap @ 0.15 m */}
              <g transform="translate(156, 75)">
                <circle cx="0" cy="0" r="4" fill="#176B73" />
                <line x1="0" y1="0" x2="0" y2="-18" stroke="#176B73" strokeWidth="1.5" />
                <text x="0" y="-22" fill="#176B73" fontSize="8" fontWeight="bold" textAnchor="middle">
                  BMP280 Tap (0.15m)
                </text>
              </g>

              {/* Controlled Joint Seam @ 0.50 m */}
              <line x1="310" y1="75" x2="310" y2="155" stroke="#D88A19" strokeWidth="2" strokeDasharray="3 2" />

              {/* Plan Location Pin (@ activeAnomaly.positionM) */}
              {activeAnomaly && (
                <g transform={`translate(${90 + (activeAnomaly.positionM / 1.0) * 440}, 115)`}>
                  <circle cx="0" cy="0" r="16" fill={activeAnomaly.status === 'CONFIRMED' ? 'rgba(184, 58, 50, 0.25)' : 'rgba(216, 138, 25, 0.25)'} />
                  <circle cx="0" cy="0" r="7" fill={activeAnomaly.status === 'CONFIRMED' ? '#B83A32' : '#D88A19'} />
                  <path d="M 0 -7 L 0 -22" stroke={activeAnomaly.status === 'CONFIRMED' ? '#B83A32' : '#D88A19'} strokeWidth="2" />
                  <rect x="-60" y="-42" width="120" height="18" fill="#20252A" rx="2" />
                  <text x="0" y="-30" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                    PLAN LOCATION: {activeAnomaly.positionM.toFixed(2)} m
                  </text>
                </g>
              )}

              {/* End Cap @ 1.0 m */}
              <rect x="530" y="70" width="16" height="90" fill="#20252A" stroke="#344B5E" strokeWidth="1.5" rx="2" />
              <text x="538" y="120" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">CAP</text>
            </svg>
          </div>
        </div>

        {/* Right: Current Section & Anomaly Action Panel */}
        <div className="ds-col-right">
          <div className="ds-card ds-current-section-panel">
            <div className="ds-kicker-label">SELECTED DUCT SECTION</div>
            <h2 className="ds-active-sec-title">
              Section {activeSection.id} · {activeAnomaly?.jointName || 'Joint 03'}
            </h2>
            <div className="ds-sec-sub" style={{ marginBottom: '14px' }}>
              {activeSection.name} ({activeSection.lengthM.toFixed(1)} m)
            </div>

            {/* Section Status Badge */}
            <div className="ds-section-status-strip">
              <span className="ds-meta-lbl">SECTION INTEGRITY STATUS</span>
              <div style={{ marginTop: '4px' }}>
                {activeAnomaly?.status === 'CONFIRMED' ? (
                  <span className="ds-status-indicator ds-status-red">
                    <AlertTriangle size={14} /> ● CONFIRMED LEAK (Action Required)
                  </span>
                ) : activeAnomaly?.status === 'VERIFIED' ? (
                  <span className="ds-status-indicator ds-status-green">
                    <CheckCircle2 size={14} /> ● VERIFIED & SEALED (PASS)
                  </span>
                ) : activeAnomaly?.status === 'POSSIBLE_LEAK' ? (
                  <span className="ds-status-indicator ds-status-amber">
                    <AlertTriangle size={14} /> ⚠ POSSIBLE LEAK DETECTED
                  </span>
                ) : (
                  <span className="ds-status-indicator ds-status-green">
                    <CheckCircle2 size={14} /> ● NORMAL
                  </span>
                )}
              </div>
            </div>

            {/* Compact Evidence Indicators (Clean, no formulas) */}
            <div className="ds-compact-evidence-block">
              <div className="ds-meta-lbl">SENSOR EVIDENCE SIGNALS</div>

              <div className="ds-compact-sensor-rows">
                <div className="ds-compact-sensor-item">
                  <span className="ds-cs-name">Pressure Differential</span>
                  <span className="ds-cs-val ds-cs-avail">✓ Available (+205.8 Pa)</span>
                </div>
                <div className="ds-compact-sensor-item">
                  <span className="ds-cs-name">Thermal Gradient (FLIR)</span>
                  <span className="ds-cs-val ds-cs-avail">✓ Available (ΔT +9.3 °C)</span>
                </div>
                <div className="ds-compact-sensor-item">
                  <span className="ds-cs-name">Acoustic Anomaly (INMP441)</span>
                  <span className="ds-cs-val ds-cs-avail">✓ Available (Audible turbulence)</span>
                </div>
                <div className="ds-compact-sensor-item">
                  <span className="ds-cs-name">Field Inspection Photo</span>
                  <span className={activeAnomaly?.fieldPhotos?.length ? 'ds-cs-val ds-cs-avail' : 'ds-cs-val'}>
                    {activeAnomaly?.fieldPhotos?.length ? '✓ Photo Attached' : '— Not Attached'}
                  </span>
                </div>
              </div>
            </div>

            {/* Anomaly Notification & Action Toolbar */}
            <div className="ds-active-section-actions">
              <div className="ds-anomaly-alert-box">
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#20252A', marginBottom: '2px' }}>
                  {activeAnomaly?.status === 'CONFIRMED' ? 'Remediation Sequence Active' : 'Anomaly Flagged @ 0.50 m'}
                </div>
                <div style={{ fontSize: '11px', color: '#667078' }}>
                  Attach physical photo, review multimodal evidence, and confirm defect.
                </div>
              </div>

              <div className="ds-active-btn-grid">
                <button
                  className="ds-btn ds-btn-secondary"
                  onClick={() => setIsManualPlacing(true)}
                >
                  <MapPin size={13} /> Mark Location
                </button>
                <button
                  className="ds-btn ds-btn-secondary"
                  onClick={onOpenPhotoCapture}
                >
                  <Camera size={13} /> Take / Upload Photo
                </button>
              </div>

              <button
                className="ds-btn ds-btn-primary ds-btn-full"
                onClick={onOpenEvidenceDrawer}
              >
                <Layers size={14} /> Review Multimodal Evidence
              </button>

              <button
                className="ds-btn ds-btn-amber ds-btn-full"
                onClick={onOpenWorkflowModal}
              >
                <Wrench size={14} />
                {activeAnomaly?.status === 'CONFIRMED' ? 'Execute Repair & Rescan' : 'Verify & Remediate Joint'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
