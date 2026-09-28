import React from 'react';
import { Thermometer, Crosshair } from 'lucide-react';

export default function ThermalEvidence({ session }) {
  const { telemetry } = session;

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">EVIDENCE LAYER</div>
          <h1 className="ds-page-title">THERMAL EVIDENCE</h1>
        </div>

        <div className="ds-header-actions">
          <span className="ds-pill-tag">FLIR Thermal Camera</span>
          <span className="ds-pill-tag ds-pill-amber">CAPTURED THERMAL FRAME</span>
        </div>
      </header>

      {/* Main Grid: Large Thermal Frame + Minimal Essential Telemetry */}
      <div className="ds-grid-2col">
        {/* Large Frame */}
        <div className="ds-card ds-thermal-large-card">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">Captured Thermal Frame · Section D-03</span>
            <span className="ds-vp-tag">Position: 0.50 m</span>
          </div>

          <div className="ds-thermal-canvas-wrap">
            <svg viewBox="0 0 640 380" className="ds-thermal-svg">
              <defs>
                <linearGradient id="ironbowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0B0B2E" />
                  <stop offset="30%" stopColor="#35165E" />
                  <stop offset="60%" stopColor="#8A1E65" />
                  <stop offset="85%" stopColor="#DE4238" />
                  <stop offset="100%" stopColor="#FDB536" />
                </linearGradient>
                <radialGradient id="leakHotspot2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="30%" stopColor="#FDB536" stopOpacity="0.9" />
                  <stop offset="65%" stopColor="#DE4238" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0B0B2E" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="640" height="380" fill="#0B0B2E" />
              <rect x="30" y="80" width="580" height="220" rx="3" fill="url(#ironbowGrad2)" opacity="0.7" />

              {/* Hotspot Plume */}
              <ellipse cx="320" cy="190" rx="90" ry="60" fill="url(#leakHotspot2)" />

              {/* Bounding Box */}
              <g transform="translate(320, 190)">
                <line x1="-20" y1="0" x2="20" y2="0" stroke="#FFFFFF" strokeWidth="1.5" />
                <line x1="0" y1="-20" x2="0" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
                <rect x="-70" y="-45" width="140" height="90" fill="none" stroke="#D88A19" strokeWidth="2" strokeDasharray="5 3" />
                <rect x="-65" y="-68" width="130" height="18" fill="#D88A19" rx="2" />
                <text x="0" y="-55" fill="#20252A" fontSize="9" fontWeight="bold" textAnchor="middle">
                  MAX 31.4°C (ΔT +9.3°C)
                </text>
              </g>

              {/* Color Bar Scale */}
              <g transform="translate(610, 60)">
                <rect x="0" y="0" width="10" height="260" rx="2" fill="url(#ironbowGrad2)" />
                <text x="-6" y="10" fill="#FFFFFF" fontSize="9" textAnchor="end">32°C</text>
                <text x="-6" y="260" fill="#FFFFFF" fontSize="9" textAnchor="end">20°C</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Minimal Information Column */}
        <div className="ds-col-right">
          <div className="ds-card ds-thermal-telemetry-card">
            <div className="ds-card-header ds-card-header-clean">
              <span className="ds-card-title">THERMAL PARAMETERS</span>
            </div>

            <div className="ds-inspector-metrics-stack">
              <div className="ds-metric-kv">
                <span className="ds-kv-key">LOCATION</span>
                <span className="ds-kv-val ds-val-navy">0.50 m</span>
              </div>
              <div className="ds-metric-kv ds-kv-highlight">
                <span className="ds-kv-key">TEMPERATURE DIFFERENCE (ΔT)</span>
                <span className="ds-kv-val ds-val-amber">+{telemetry.deltaTC.toFixed(1)} °C</span>
              </div>
              <div className="ds-metric-kv">
                <span className="ds-kv-key">THERMAL ANOMALY SCORE</span>
                <span className="ds-kv-val">{telemetry.thermalScore.toFixed(2)}</span>
              </div>
              <div className="ds-metric-kv">
                <span className="ds-kv-key">SURFACE REFERENCE (Tref)</span>
                <span className="ds-kv-val">{telemetry.tempRefC.toFixed(1)} °C</span>
              </div>
              <div className="ds-metric-kv">
                <span className="ds-kv-key">MAXIMUM TEMPERATURE (Tmax)</span>
                <span className="ds-kv-val">{telemetry.tempMaxC.toFixed(1)} °C</span>
              </div>
            </div>

            <div className="ds-thermal-note-card">
              Thermal anomaly indicates escaping air creating surface temperature contrast across test joint aperture.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
