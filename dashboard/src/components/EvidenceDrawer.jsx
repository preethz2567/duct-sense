// src/components/EvidenceDrawer.jsx
import React from 'react';
import {
  X,
  Thermometer,
  Gauge,
  Mic,
  Camera,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

export default function EvidenceDrawer({
  isOpen,
  onClose,
  session,
  onConfirmLeak,
  onDismissAnomaly,
  onOpenRepairWorkflow,
  onOpenPhotoCapture,
}) {
  if (!isOpen) return null;

  const { activeAnomaly } = session;
  const currentSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];

  const hasPhoto = activeAnomaly?.fieldPhotos && activeAnomaly.fieldPhotos.length > 0;
  const latestPhoto = hasPhoto ? activeAnomaly.fieldPhotos[0] : null;

  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div className="ds-modal-instrument ds-evidence-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ds-modal-instrument-header">
          <div className="ds-modal-header-tag">
            <span className="ds-tag-amber">EVIDENCE REVIEW</span>
            <span className="ds-tag-mono">{currentSection.id} · {activeAnomaly?.jointName || 'Joint 03'}</span>
          </div>
          <button className="ds-btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ds-modal-instrument-body">
          {/* Top Status & Plan Location Header */}
          <div className="ds-drawer-top-banner">
            <div>
              <div className="ds-kicker-label">SUSPECTED DEFECT LOCATION</div>
              <h2 className="ds-drawer-title">
                Section {currentSection.id} · {activeAnomaly?.jointName || 'Joint 03'}
              </h2>
              <div className="ds-drawer-loc-pill">
                <MapPin size={12} /> Plan Location: {activeAnomaly?.positionM?.toFixed(2) || '0.50'} m from inlet flange
              </div>
            </div>

            <div className="ds-drawer-status-box">
              <span className="ds-meta-lbl">CURRENT STATUS</span>
              <span className={`ds-pill-tag ${
                activeAnomaly?.status === 'VERIFIED' ? 'ds-pill-green' :
                activeAnomaly?.status === 'CONFIRMED' ? 'ds-pill-red' :
                activeAnomaly?.status === 'REPAIRED' ? 'ds-pill-teal' : 'ds-pill-amber'
              }`}>
                {activeAnomaly?.status || 'POSSIBLE_LEAK'}
              </span>
            </div>
          </div>

          {/* 4 Compact Multimodal Evidence Blocks */}
          <div className="ds-drawer-evidence-grid">
            {/* 1. FIELD PHOTO */}
            <div className="ds-evidence-tile">
              <div className="ds-tile-head">
                <div className="ds-tile-title-wrap">
                  <Camera size={14} className="ds-icon-petrol" />
                  <span>FIELD PHOTO</span>
                </div>
                <span className="ds-tile-subtag">{hasPhoto ? 'ATTACHED' : 'REQUIRED'}</span>
              </div>
              <div className="ds-tile-body">
                {hasPhoto && latestPhoto?.url ? (
                  <div className="ds-photo-thumbnail-wrap">
                    <img src={latestPhoto.url} alt="Defect" className="ds-photo-thumb" />
                    <div className="ds-photo-caption">Recorded {latestPhoto.timestamp}</div>
                  </div>
                ) : (
                  <div className="ds-photo-empty-tile">
                    <span style={{ fontSize: '11px', color: '#667078', marginBottom: '8px' }}>
                      Visual field photo not yet captured for this joint.
                    </span>
                    <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={onOpenPhotoCapture}>
                      <Camera size={12} /> Take / Upload Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. THERMAL EVIDENCE */}
            <div className="ds-evidence-tile">
              <div className="ds-tile-head">
                <div className="ds-tile-title-wrap">
                  <Thermometer size={14} className="ds-icon-amber" />
                  <span>THERMAL EVIDENCE</span>
                </div>
                <span className="ds-badge-green"><CheckCircle2 size={11} /> AVAILABLE</span>
              </div>
              <div className="ds-tile-body">
                <div className="ds-thermal-mini-preview">
                  <svg viewBox="0 0 240 100" className="ds-svg-fluid">
                    <defs>
                      <linearGradient id="ironbowMini" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0B0B2E" />
                        <stop offset="50%" stopColor="#8A1E65" />
                        <stop offset="100%" stopColor="#FDB536" />
                      </linearGradient>
                      <radialGradient id="hotMini" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="60%" stopColor="#DE4238" />
                        <stop offset="100%" stopColor="#0B0B2E" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <rect width="240" height="100" fill="#0B0B2E" rx="3" />
                    <rect x="10" y="20" width="220" height="60" fill="url(#ironbowMini)" opacity="0.7" rx="2" />
                    <ellipse cx="120" cy="50" rx="40" ry="25" fill="url(#hotMini)" />
                    <rect x="90" y="30" width="60" height="40" fill="none" stroke="#D88A19" strokeWidth="1.5" strokeDasharray="3 2" />
                  </svg>
                  <div className="ds-thermal-mini-meta">
                    <span className="ds-lbl-mono">FLIR Thermal Camera</span>
                    <span className="ds-val-mono ds-val-amber">CAPTURED THERMAL FRAME · ΔT +9.3 °C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PRESSURE EVIDENCE */}
            <div className="ds-evidence-tile">
              <div className="ds-tile-head">
                <div className="ds-tile-title-wrap">
                  <Gauge size={14} className="ds-icon-petrol" />
                  <span>PRESSURE EVIDENCE</span>
                </div>
                <span className="ds-badge-green"><CheckCircle2 size={11} /> AVAILABLE</span>
              </div>
              <div className="ds-tile-body">
                <div className="ds-sensor-compact-list">
                  <div className="ds-compact-kv">
                    <span>BMP280 #1 (Pduct):</span>
                    <strong>1015.35 hPa</strong>
                  </div>
                  <div className="ds-compact-kv">
                    <span>BMP280 #2 (Pambient):</span>
                    <strong>1013.25 hPa</strong>
                  </div>
                  <div className="ds-compact-kv ds-compact-highlight">
                    <span>Calibrated ΔP:</span>
                    <strong className="ds-val-amber">+205.8 Pa (Drop from nominal baseline)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ACOUSTIC EVIDENCE */}
            <div className="ds-evidence-tile">
              <div className="ds-tile-head">
                <div className="ds-tile-title-wrap">
                  <Mic size={14} className="ds-icon-steel" />
                  <span>ACOUSTIC ANOMALY</span>
                </div>
                <span className="ds-badge-green"><CheckCircle2 size={11} /> AVAILABLE</span>
              </div>
              <div className="ds-tile-body">
                <div className="ds-sensor-compact-list">
                  <div className="ds-compact-kv">
                    <span>Sensor Hardware:</span>
                    <strong>INMP441 Audible MEMS</strong>
                  </div>
                  <div className="ds-compact-kv">
                    <span>Acoustic Turbulence:</span>
                    <strong>0.74 (Audible Range Hiss)</strong>
                  </div>
                  <div className="ds-compact-kv">
                    <span>Modality Agreement:</span>
                    <strong className="ds-val-green">3 / 3 Modalities Supporting</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="ds-drawer-actions-bar">
            {activeAnomaly?.status === 'CONFIRMED' || activeAnomaly?.status === 'REPAIRED' || activeAnomaly?.status === 'VERIFIED' ? (
              <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#20252A', fontWeight: '600' }}>
                  {activeAnomaly?.status === 'VERIFIED' ? (
                    <span className="ds-val-green">✓ Defect sealed & verified nominal (PASS)</span>
                  ) : (
                    <span>● Leak Confirmed — Remediation Workflow Active</span>
                  )}
                </div>
                <button className="ds-btn ds-btn-amber" onClick={onOpenRepairWorkflow}>
                  <Wrench size={13} /> Open Repair & Rescan Workflow
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                <button className="ds-btn ds-btn-secondary" onClick={onDismissAnomaly}>
                  Dismiss Anomaly
                </button>
                <button className="ds-btn ds-btn-red" onClick={onConfirmLeak}>
                  <AlertTriangle size={13} /> Confirm Leak Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
