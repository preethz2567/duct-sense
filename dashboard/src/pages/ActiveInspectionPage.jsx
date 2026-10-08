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
import SpatialViewer from '../components/spatial-viewer';

export default function ActiveInspectionPage({
  session,
  floorPlans,
  findings,
  onOpenEvidenceDrawer,
  onOpenPhotoCapture,
  onOpenWorkflowModal,
  onUpdatePlanLocation,
  onSelectSection,
}) {
  const [isManualPlacing, setIsManualPlacing] = useState(false);
  const activeSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];
  const { activeAnomaly } = session;

  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const activeFloorPlan = floorPlans?.find(p => p.id === selectedPlanId) || floorPlans?.[0]; // Fallback to first plan
  const floorPlanUrl = activeFloorPlan?.url || '';

  const handleMapClick = (e) => {
    // Handled by SpatialViewer now
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
            <span className="ds-vp-title">Facility Blueprint</span>
            <div className="ds-header-actions">
              <select 
                className="ds-select-compact" 
                value={activeFloorPlan?.id || ''}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                {floorPlans?.map(p => (
                  <option key={p.id} value={p.id}>{p.label || p.name || p.filename}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ds-map-svg-wrap" style={{ position: 'relative', height: '100%', minHeight: '500px', overflow: 'hidden' }}>
            <SpatialViewer findings={findings} floorPlanUrl={floorPlanUrl} />
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
                    <AlertTriangle size={14} /> ● LEAK ANOMALY DETECTED
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
                  <span className="ds-cs-val ds-cs-avail">
                    ✓ Available ({session.telemetry?.calibratedDeltaPPa > 0 ? '+' : ''}{(session.telemetry?.calibratedDeltaPPa || 0).toFixed(1)} Pa)
                  </span>
                </div>
                <div className="ds-compact-sensor-item">
                  <span className="ds-cs-name">Thermal Gradient (FLIR)</span>
                  <span className="ds-cs-val ds-cs-avail">
                    ✓ Available (ΔT {session.telemetry?.deltaTC > 0 ? '+' : ''}{(session.telemetry?.deltaTC || 0).toFixed(1)} °C)
                  </span>
                </div>
                <div className="ds-compact-sensor-item">
                  <span className="ds-cs-name">Acoustic Anomaly (INMP441)</span>
                  <span className="ds-cs-val ds-cs-avail">
                    ✓ Available (Score: {(session.telemetry?.acousticScore || 0).toFixed(2)})
                  </span>
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
