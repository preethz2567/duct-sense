import React, { useState } from 'react';
import {
  Thermometer,
  Crosshair,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function ThermalImaging({ selectedWalkthrough }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const events = selectedWalkthrough?.leak_events || [];
  const peakEvent = events.length > 0
    ? events.reduce((prev, curr) => (curr.leak_confidence > prev.leak_confidence ? curr : prev), events[0])
    : null;

  const rawPos = peakEvent?.position_m ?? 0.52;
  const leakLocationM = rawPos > 1.0 ? parseFloat((rawPos % 1.0).toFixed(2)) || 0.52 : rawPos;
  const anomalyScore = peakEvent?.thermal_confidence ?? 0.86;
  const maxTempC = 31.4;
  const refTempC = 22.1;
  const deltaTC = maxTempC - refTempC; // 9.3 °C

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Thermal Imaging</h1>
        </div>
        <div className="ds-header-actions">
          <span className="ds-pill-tag ds-pill-navy">FLIR Thermal Camera</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="ds-grid-2col">
        {/* LEFT: Central Thermal Frame */}
        <div className="ds-col-left">
          <div className="ds-card ds-thermal-card">
            <div className="ds-viewport-top-bar">
              <span className="ds-vp-title">Captured Thermal Frame</span>
              <button
                className={`ds-btn-small ${showOverlay ? 'ds-btn-active' : ''}`}
                onClick={() => setShowOverlay(!showOverlay)}
              >
                <Crosshair size={12} /> Target Box
              </button>
            </div>

            {/* Canvas */}
            <div className="ds-thermal-canvas-wrap">
              <svg viewBox="0 0 640 360" className="ds-thermal-svg">
                <defs>
                  <linearGradient id="ironbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0B0B2E" />
                    <stop offset="35%" stopColor="#35165E" />
                    <stop offset="60%" stopColor="#8A1E65" />
                    <stop offset="80%" stopColor="#DE4238" />
                    <stop offset="95%" stopColor="#FDB536" />
                    <stop offset="100%" stopColor="#FCFDBF" />
                  </linearGradient>
                  <radialGradient id="leakHotspot" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="30%" stopColor="#FDB536" stopOpacity="0.95" />
                    <stop offset="65%" stopColor="#DE4238" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0B0B2E" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width="640" height="360" fill="#0B0B2E" />
                <rect x="40" y="80" width="560" height="190" rx="4" fill="url(#ironbowGrad)" opacity="0.7" />

                {/* Hotspot at 0.50 m */}
                <ellipse cx="320" cy="175" rx="80" ry="50" fill="url(#leakHotspot)" />

                {/* Target Overlay */}
                {showOverlay && (
                  <g transform="translate(320, 175)">
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
                    <rect x="-70" y="-45" width="140" height="90" fill="none" stroke="#FF9C00" strokeWidth="2" strokeDasharray="6 3" />
                    <rect x="-65" y="-68" width="130" height="18" fill="#FF9C00" rx="2" />
                    <text x="0" y="-55" fill="#000000" fontSize="10" fontWeight="bold" textAnchor="middle">
                      ANOMALY: {anomalyScore.toFixed(2)}
                    </text>
                  </g>
                )}

                {/* Temp Scale */}
                <g transform="translate(610, 50)">
                  <rect x="0" y="0" width="10" height="250" rx="2" fill="url(#ironbowGrad)" />
                  <text x="-6" y="10" fill="#FFFFFF" fontSize="9" textAnchor="end">32°C</text>
                  <text x="-6" y="250" fill="#FFFFFF" fontSize="9" textAnchor="end">20°C</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT: High-Impact Telemetry */}
        <div className="ds-col-right">
          <div className="ds-card ds-telemetry-summary-card">
            <div className="ds-card-header ds-card-header-clean">
              <h3 className="ds-card-title">Thermal Analysis</h3>
              <StatusBadge status="LEAK_DETECTED" size="small" />
            </div>

            <div className="ds-key-metrics-stack">
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Leak Location</span>
                <span className="ds-metric-val ds-val-navy">{leakLocationM.toFixed(2)} m</span>
              </div>
              <div className="ds-key-metric-row ds-row-highlight">
                <span className="ds-metric-key">Anomaly Score</span>
                <span className="ds-metric-val ds-val-orange">{anomalyScore.toFixed(2)}</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Max Temperature (Tmax)</span>
                <span className="ds-metric-val">{maxTempC.toFixed(1)} °C</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Surface Baseline (Tref)</span>
                <span className="ds-metric-val">{refTempC.toFixed(1)} °C</span>
              </div>
              <div className="ds-key-metric-row ds-row-highlight">
                <span className="ds-metric-key">Temperature Difference (ΔT)</span>
                <span className="ds-metric-val ds-val-orange">+{deltaTC.toFixed(1)} °C</span>
              </div>
            </div>

            <div className="ds-disclosure-wrap">
              <button
                className="ds-btn-disclosure"
                onClick={() => setShowTechDetails(!showTechDetails)}
              >
                <span>Inspection Context</span>
                {showTechDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showTechDetails && (
                <div className="ds-disclosure-content">
                  <div className="ds-detail-line">
                    <span>Target Port:</span>
                    <strong>POC Port @ 0.50 m</strong>
                  </div>
                  <div className="ds-detail-line">
                    <span>Emissivity:</span>
                    <strong>ε = 0.95</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
