// src/pages/UnifiedEvidencePage.jsx
import React, { useState } from 'react';
import {
  Thermometer,
  Gauge,
  Mic,
  Camera,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
} from 'lucide-react';
import { sampleEventLog } from '../services/mockDataService';

export default function UnifiedEvidencePage({ session, onOpenPhotoCapture }) {
  const [activeTab, setActiveTab] = useState('ALL_EVIDENCE'); // 'ALL_EVIDENCE', 'THERMAL', 'PRESSURE', 'ACOUSTIC', 'PHOTOS', 'EVENTS'
  const { activeAnomaly, telemetry } = session;
  const currentSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];

  const fieldPhotos = activeAnomaly?.fieldPhotos || [];
  const repairPhotos = activeAnomaly?.repair?.repairPhotos || [];
  const allPhotos = [...fieldPhotos, ...repairPhotos];

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">EVIDENCE LAYER · {session.id}</div>
          <h1 className="ds-page-title">INSPECTION EVIDENCE HUB</h1>
        </div>

        <div className="ds-header-actions">
          {/* Tab Pill Selectors */}
          <div className="ds-mode-pill-group">
            {[
              { id: 'ALL_EVIDENCE', label: 'All Evidence' },
              { id: 'THERMAL', label: 'Thermal' },
              { id: 'PRESSURE', label: 'Pressure' },
              { id: 'ACOUSTIC', label: 'Acoustic' },
              { id: 'PHOTOS', label: 'Field Photos' },
              { id: 'EVENTS', label: 'Event Log' },
            ].map((t) => (
              <button
                key={t.id}
                className={`ds-mode-pill ${activeTab === t.id ? 'ds-mode-pill--sim' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Overview Metadata Bar */}
      <div className="ds-card ds-card-evidence-summary">
        <div className="ds-meta-grid-4">
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">TARGET SECTION</span>
            <span className="ds-meta-val">Section {currentSection.id} · {activeAnomaly?.jointName || 'Joint 03'}</span>
          </div>
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">PLAN LOCATION</span>
            <span className="ds-meta-val">{activeAnomaly?.positionM?.toFixed(2) || '0.50'} m from flange</span>
          </div>
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">MODALITY AGREEMENT</span>
            <span className="ds-meta-val ds-val-green">3 / 3 Modalities Supporting</span>
          </div>
          <div className="ds-meta-item">
            <span className="ds-meta-lbl">INTEGRITY STATUS</span>
            <span className="ds-meta-val ds-val-red">CONFIRMED LEAK (VERIFIED PASS)</span>
          </div>
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. ALL EVIDENCE (Unified Multimodal Grid) */}
      {activeTab === 'ALL_EVIDENCE' && (
        <div className="ds-grid-2col">
          {/* Left: Thermal & Photo */}
          <div className="ds-col-stack">
            {/* Thermal Block */}
            <div className="ds-card ds-evidence-subpanel">
              <div className="ds-card-header ds-card-header-clean">
                <div className="ds-modality-title-wrap">
                  <Thermometer size={15} className="ds-icon-amber" />
                  <span className="ds-card-title">THERMAL EVIDENCE</span>
                </div>
                <span className="ds-pill-tag ds-pill-amber">CAPTURED THERMAL FRAME</span>
              </div>

              <div className="ds-thermal-mini-preview" style={{ height: '180px' }}>
                <svg viewBox="0 0 400 180" className="ds-svg-fluid">
                  <defs>
                    <linearGradient id="ironbowEv" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0B0B2E" />
                      <stop offset="40%" stopColor="#8A1E65" />
                      <stop offset="85%" stopColor="#DE4238" />
                      <stop offset="100%" stopColor="#FDB536" />
                    </linearGradient>
                    <radialGradient id="hotEv" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="40%" stopColor="#FDB536" />
                      <stop offset="70%" stopColor="#DE4238" />
                      <stop offset="100%" stopColor="#0B0B2E" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="400" height="180" fill="#0B0B2E" rx="3" />
                  <rect x="20" y="30" width="360" height="120" fill="url(#ironbowEv)" opacity="0.7" rx="2" />
                  <ellipse cx="200" cy="90" rx="60" ry="35" fill="url(#hotEv)" />
                  <rect x="150" y="55" width="100" height="70" fill="none" stroke="#D88A19" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="200" y="45" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                    HOTSPOT 31.4°C (ΔT +9.3°C)
                  </text>
                </svg>
              </div>

              <div className="ds-subpanel-kv-row">
                <span>Camera: <strong>FLIR Thermal Camera</strong></span>
                <span>Surface Ref: <strong>22.1 °C</strong></span>
                <span>Anomaly Score: <strong>0.86</strong></span>
              </div>
            </div>

            {/* Field & Repair Photo Block */}
            <div className="ds-card ds-evidence-subpanel">
              <div className="ds-card-header ds-card-header-clean">
                <div className="ds-modality-title-wrap">
                  <Camera size={15} className="ds-icon-petrol" />
                  <span className="ds-card-title">FIELD & REPAIR PHOTOS</span>
                </div>
                <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={onOpenPhotoCapture}>
                  <Camera size={12} /> Add Photo
                </button>
              </div>

              <div className="ds-photos-gallery-strip">
                {allPhotos.length > 0 ? (
                  allPhotos.map((p, idx) => (
                    <div key={idx} className="ds-gallery-item">
                      {p.url ? (
                        <img src={p.url} alt={p.label} className="ds-gallery-img" />
                      ) : (
                        <div className="ds-gallery-placeholder">
                          <Camera size={24} color="#667078" />
                          <span>{p.label}</span>
                        </div>
                      )}
                      <div className="ds-gallery-caption">
                        <strong>{p.label}</strong> · {p.timestamp}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ds-no-photo-box">
                    <span>No inspection photos attached yet.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Pressure & Acoustic & Timeline */}
          <div className="ds-col-stack">
            {/* Pressure Evidence Block */}
            <div className="ds-card ds-evidence-subpanel">
              <div className="ds-card-header ds-card-header-clean">
                <div className="ds-modality-title-wrap">
                  <Gauge size={15} className="ds-icon-petrol" />
                  <span className="ds-card-title">PRESSURE SENSING (BMP280 PAIR)</span>
                </div>
                <span className="ds-badge-green"><CheckCircle2 size={11} /> EVIDENCE AVAILABLE</span>
              </div>

              <div className="ds-subpanel-metrics-grid">
                <div className="ds-sm-item">
                  <span className="ds-meta-lbl">BMP280 #1 (Pduct Tap)</span>
                  <span className="ds-sm-val">{telemetry.pductHpa.toFixed(2)} hPa</span>
                </div>
                <div className="ds-sm-item">
                  <span className="ds-meta-lbl">BMP280 #2 (Pambient Reference)</span>
                  <span className="ds-sm-val">{telemetry.pambientHpa.toFixed(2)} hPa</span>
                </div>
                <div className="ds-sm-item ds-sm-highlight">
                  <span className="ds-meta-lbl">Calibrated Differential (ΔP)</span>
                  <span className="ds-sm-val ds-val-amber">+{telemetry.calibratedDeltaPPa.toFixed(1)} Pa</span>
                </div>
                <div className="ds-sm-item">
                  <span className="ds-meta-lbl">Zero-Offset Calibration</span>
                  <span className="ds-sm-val">+{telemetry.calibrationOffsetPa.toFixed(1)} Pa</span>
                </div>
              </div>
            </div>

            {/* Acoustic Anomaly Block */}
            <div className="ds-card ds-evidence-subpanel">
              <div className="ds-card-header ds-card-header-clean">
                <div className="ds-modality-title-wrap">
                  <Mic size={15} className="ds-icon-steel" />
                  <span className="ds-card-title">ACOUSTIC ANOMALY (INMP441)</span>
                </div>
                <span className="ds-badge-green"><CheckCircle2 size={11} /> EVIDENCE AVAILABLE</span>
              </div>

              <div className="ds-subpanel-metrics-grid">
                <div className="ds-sm-item">
                  <span className="ds-meta-lbl">Hardware Interface</span>
                  <span className="ds-sm-val">INMP441 MEMS (Audible Range)</span>
                </div>
                <div className="ds-sm-item">
                  <span className="ds-meta-lbl">Acoustic Turbulence Score</span>
                  <span className="ds-sm-val ds-val-amber">{telemetry.acousticScore.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Verification Before / After Card */}
            {activeAnomaly?.repair?.rescanCompleted && (
              <div className="ds-card ds-evidence-subpanel ds-card-verified-border">
                <div className="ds-card-header ds-card-header-clean">
                  <span className="ds-card-title">POST-REPAIR RESCAN & VERIFICATION</span>
                  <span className="ds-badge-green"><CheckCircle2 size={11} /> VERIFIED PASS</span>
                </div>

                <div className="ds-before-after-grid">
                  <div className="ds-ba-box ds-ba-before">
                    <span className="ds-ba-label">INITIAL DEFECT</span>
                    <div>ΔP: <strong>+{activeAnomaly.repair.before.pressurePa} Pa</strong></div>
                    <div>Thermal: <strong>{activeAnomaly.repair.before.thermalScore}</strong></div>
                    <div>Acoustic: <strong>{activeAnomaly.repair.before.acousticScore}</strong></div>
                  </div>
                  <div className="ds-ba-box ds-ba-after">
                    <span className="ds-ba-label">POST-REPAIR RESCAN</span>
                    <div>ΔP: <strong className="ds-val-green">+{activeAnomaly.repair.after.pressurePa} Pa</strong></div>
                    <div>Thermal: <strong className="ds-val-green">{activeAnomaly.repair.after.thermalScore}</strong></div>
                    <div>Acoustic: <strong className="ds-val-green">{activeAnomaly.repair.after.acousticScore}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. THERMAL TAB */}
      {activeTab === 'THERMAL' && (
        <div className="ds-card ds-evidence-subpanel">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">FLIR THERMAL CAMERA · CAPTURED THERMAL FRAME</span>
            <span className="ds-vp-tag">Position: {activeAnomaly?.positionM?.toFixed(2)} m</span>
          </div>
          <div className="ds-thermal-mini-preview" style={{ height: '300px' }}>
            <svg viewBox="0 0 600 300" className="ds-svg-fluid">
              <defs>
                <linearGradient id="ironbowFull" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0B0B2E" />
                  <stop offset="35%" stopColor="#35165E" />
                  <stop offset="65%" stopColor="#8A1E65" />
                  <stop offset="85%" stopColor="#DE4238" />
                  <stop offset="100%" stopColor="#FDB536" />
                </linearGradient>
                <radialGradient id="hotFull" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="30%" stopColor="#FDB536" />
                  <stop offset="60%" stopColor="#DE4238" />
                  <stop offset="100%" stopColor="#0B0B2E" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="600" height="300" fill="#0B0B2E" rx="4" />
              <rect x="30" y="40" width="540" height="220" fill="url(#ironbowFull)" opacity="0.75" rx="3" />
              <ellipse cx="300" cy="150" rx="90" ry="55" fill="url(#hotFull)" />
              <rect x="230" y="100" width="140" height="100" fill="none" stroke="#D88A19" strokeWidth="2" strokeDasharray="5 3" />
              <text x="300" y="85" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle">
                PEAK HOTSPOT: 31.4°C (ΔT +9.3°C)
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* 3. PRESSURE TAB */}
      {activeTab === 'PRESSURE' && (
        <div className="ds-card ds-evidence-subpanel">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">BMP280 DUCT STATIC TAP & AMBIENT REFERENCE</span>
          </div>
          <div className="ds-subpanel-metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="ds-sm-item">
              <span className="ds-meta-lbl">BMP280 #1 (Pduct Static)</span>
              <span className="ds-sm-val">{telemetry.pductHpa.toFixed(2)} hPa</span>
            </div>
            <div className="ds-sm-item">
              <span className="ds-meta-lbl">BMP280 #2 (Pambient Reference)</span>
              <span className="ds-sm-val">{telemetry.pambientHpa.toFixed(2)} hPa</span>
            </div>
            <div className="ds-sm-item ds-sm-highlight">
              <span className="ds-meta-lbl">Calibrated Differential ΔP</span>
              <span className="ds-sm-val ds-val-amber">+{telemetry.calibratedDeltaPPa.toFixed(1)} Pa</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACOUSTIC TAB */}
      {activeTab === 'ACOUSTIC' && (
        <div className="ds-card ds-evidence-subpanel">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">INMP441 AUDIBLE-RANGE ACOUSTIC SENSING</span>
          </div>
          <div className="ds-subpanel-metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="ds-sm-item">
              <span className="ds-meta-lbl">Acoustic Score</span>
              <span className="ds-sm-val ds-val-amber">{telemetry.acousticScore.toFixed(2)}</span>
            </div>
            <div className="ds-sm-item">
              <span className="ds-meta-lbl">Classification</span>
              <span className="ds-sm-val">Audible Range Leak Turbulence</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. PHOTOS TAB */}
      {activeTab === 'PHOTOS' && (
        <div className="ds-card ds-evidence-subpanel">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">INSPECTION FIELD & REPAIR PHOTOS</span>
            <button className="ds-btn ds-btn-secondary" onClick={onOpenPhotoCapture}>
              <Camera size={13} /> Take / Upload Photo
            </button>
          </div>
          <div className="ds-photos-gallery-grid">
            {allPhotos.map((p, idx) => (
              <div key={idx} className="ds-photo-card-item">
                {p.url ? (
                  <img src={p.url} alt={p.label} className="ds-gallery-img" />
                ) : (
                  <div className="ds-gallery-placeholder">
                    <Camera size={28} color="#667078" />
                    <span>{p.label}</span>
                  </div>
                )}
                <div className="ds-photo-meta-card">
                  <strong>{p.label}</strong>
                  <span>Plan Location: {p.planLocation || '0.50 m'}</span>
                  <span>Timestamp: {p.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. EVENTS TAB */}
      {activeTab === 'EVENTS' && (
        <div className="ds-card ds-evidence-subpanel">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">INSPECTION AUDIT EVENT LOG</span>
          </div>
          <div className="ds-table-responsive">
            <table className="ds-engineering-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>Section</th>
                  <th>Pduct</th>
                  <th>ΔP</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sampleEventLog.map((row) => (
                  <tr key={row.id}>
                    <td className="ds-td-mono">{row.id}</td>
                    <td className="ds-td-mono">{row.timestamp}</td>
                    <td className="ds-td-bold">{row.event}</td>
                    <td className="ds-td-mono">D-03</td>
                    <td className="ds-td-mono">{row.pduct.toFixed(1)} hPa</td>
                    <td className="ds-td-mono ds-td-highlight">+{row.deltaP.toFixed(1)} Pa</td>
                    <td><span className="ds-pill-tag">{row.status}</span></td>
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
