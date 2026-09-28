import React, { useState } from 'react';
import {
  Camera,
  MapPin,
  Pause,
  Play,
  Crosshair,
  AlertTriangle,
  ArrowRight,
  Gauge,
  Thermometer,
  Mic,
  Sliders,
} from 'lucide-react';

export default function WalkthroughWorkspace({
  session,
  onOpenWorkflow,
  onExitWalkthrough,
}) {
  const [isScanning, setIsScanning] = useState(true);
  const [currentPos, setCurrentPos] = useState(0.50);
  const [capturedFramesCount, setCapturedFramesCount] = useState(3);

  const handleCapture = () => {
    setCapturedFramesCount((c) => c + 1);
  };

  return (
    <div className="ds-page-container ds-instrument-view ds-walkthrough-screen">
      {/* Walkthrough Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">INSPECTION WORKSPACE</div>
          <h1 className="ds-page-title">SECTION D-03 · INSPECTION ACTIVE</h1>
        </div>

        <div className="ds-header-actions">
          <button className="ds-btn ds-btn-secondary" onClick={() => setIsScanning(!isScanning)}>
            {isScanning ? <Pause size={13} /> : <Play size={13} />} {isScanning ? 'Pause Scan' : 'Resume Scan'}
          </button>
          <button className="ds-btn ds-btn-secondary" onClick={onExitWalkthrough}>
            Exit Walkthrough
          </button>
        </div>
      </header>

      {/* Main Split: Left 60% Visual, Right 40% Mini Map */}
      <div className="ds-walkthrough-split-grid">
        {/* Left 60%: Thermal & Inspection Frame */}
        <div className="ds-card ds-card-walkthrough-visual">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">Captured Thermal Frame · Scan Pos: {currentPos.toFixed(2)} m</span>
            <div className="ds-header-actions">
              <span className="ds-pill-tag ds-pill-red">ANOMALY OBSERVED</span>
            </div>
          </div>

          <div className="ds-thermal-canvas-wrap">
            <svg viewBox="0 0 640 320" className="ds-thermal-svg">
              <defs>
                <linearGradient id="ironbow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0B0B2E" />
                  <stop offset="30%" stopColor="#35165E" />
                  <stop offset="60%" stopColor="#8A1E65" />
                  <stop offset="85%" stopColor="#DE4238" />
                  <stop offset="100%" stopColor="#FDB536" />
                </linearGradient>
                <radialGradient id="anomalyHotspot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="30%" stopColor="#FDB536" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#DE4238" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0B0B2E" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="640" height="320" fill="#0B0B2E" />
              <rect x="40" y="60" width="560" height="200" rx="2" fill="url(#ironbow)" opacity="0.65" />

              {/* Anomaly Plume */}
              <ellipse cx="330" cy="160" rx="80" ry="50" fill="url(#anomalyHotspot)" />

              {/* Crosshair Overlay */}
              <g transform="translate(330, 160)">
                <line x1="-20" y1="0" x2="20" y2="0" stroke="#FFFFFF" strokeWidth="1.5" />
                <line x1="0" y1="-20" x2="0" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
                <rect x="-60" y="-40" width="120" height="80" fill="none" stroke="#D88A19" strokeWidth="2" strokeDasharray="5 3" />
                <rect x="-55" y="-62" width="110" height="18" fill="#D88A19" rx="2" />
                <text x="0" y="-49" fill="#20252A" fontSize="9" fontWeight="bold" textAnchor="middle">
                  HOTSPOT: 31.4°C
                </text>
              </g>

              {/* HUD Readout */}
              <g transform="translate(50, 45)">
                <text x="0" y="0" fill="#CDD0CE" fontSize="10" fontFamily="Inter, sans-serif">
                  FLIR THERMAL CAMERA · CAPTURED TARGET
                </text>
              </g>
            </svg>
          </div>

          <div className="ds-walkthrough-actions-strip">
            <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={handleCapture}>
              <Camera size={13} /> Capture Frame ({capturedFramesCount})
            </button>
            <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={() => setCurrentPos(0.50)}>
              <Crosshair size={13} /> Mark Location (0.50 m)
            </button>
            <button className="ds-btn ds-btn-amber ds-btn-compact" onClick={onOpenWorkflow}>
              <AlertTriangle size={13} /> Verify Defect Workflow
            </button>
          </div>
        </div>

        {/* Right 40%: Mini Spatial Orientation Map */}
        <div className="ds-card ds-card-walkthrough-minimap">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">Mini Inspection Map</span>
            <span className="ds-vp-tag">D-03 Track</span>
          </div>

          <div className="ds-minimap-canvas-wrap">
            <svg viewBox="0 0 400 240" className="ds-minimap-svg">
              <rect width="100%" height="100%" fill="#F8FAFC" />
              <rect x="20" y="20" width="360" height="200" fill="none" stroke="#CDD0CE" strokeWidth="1" strokeDasharray="4 2" />

              {/* Blower Unit */}
              <rect x="35" y="80" width="40" height="80" fill="#20252A" rx="2" />
              <text x="55" y="125" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">FAN</text>

              {/* Duct Track */}
              <rect x="75" y="95" width="280" height="50" fill="#E9E8E2" stroke="#344B5E" strokeWidth="2" />

              {/* Leak Spot @ 0.50 m */}
              <circle cx="215" cy="120" r="7" fill="#B83A32" />
              <rect x="180" y="70" width="70" height="16" fill="#B83A32" rx="2" />
              <text x="215" y="81" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">LEAK @ 0.50m</text>

              {/* Technician Marker */}
              <g transform="translate(215, 155)">
                <circle cx="0" cy="0" r="5" fill="#D88A19" />
                <text x="0" y="14" fill="#D88A19" fontSize="8" fontWeight="bold" textAnchor="middle">
                  YOU ARE HERE
                </text>
              </g>

              {/* Scale */}
              <g transform="translate(75, 190)">
                <line x1="0" y1="0" x2="280" y2="0" stroke="#667078" strokeWidth="1" />
                <text x="0" y="10" fill="#667078" fontSize="8">0.0m</text>
                <text x="140" y="10" fill="#667078" fontSize="8" textAnchor="middle">0.5m</text>
                <text x="280" y="10" fill="#667078" fontSize="8" textAnchor="end">1.0m</text>
              </g>
            </svg>
          </div>

          <div className="ds-minimap-hint">
            <strong>Spatial Context:</strong> Technician scan head is synchronized at test port coordinate 0.50 m from inlet blower.
          </div>
        </div>
      </div>

      {/* Bottom: Sensor Evidence Strip */}
      <div className="ds-card ds-bottom-evidence-strip">
        <div className="ds-strip-grid-4">
          <div className="ds-strip-item ds-item-alert">
            <div className="ds-strip-head">
              <Gauge size={13} />
              <span>PRESSURE DIFFERENTIAL</span>
            </div>
            <div className="ds-strip-val">+{session.telemetry.calibratedDeltaPPa.toFixed(1)} Pa</div>
            <span className="ds-strip-tag">ANOMALY</span>
          </div>

          <div className="ds-strip-item ds-item-alert">
            <div className="ds-strip-head">
              <Thermometer size={13} />
              <span>THERMAL CONTRAST</span>
            </div>
            <div className="ds-strip-val">0.86</div>
            <span className="ds-strip-tag">ANOMALY</span>
          </div>

          <div className="ds-strip-item">
            <div className="ds-strip-head">
              <Mic size={13} />
              <span>AUDIBLE ACOUSTIC</span>
            </div>
            <div className="ds-strip-val">0.74</div>
            <span className="ds-strip-tag ds-tag-mod">MODERATE</span>
          </div>

          <div className="ds-strip-item ds-strip-summary">
            <div className="ds-strip-head">
              <span>STATUS</span>
            </div>
            <div className="ds-strip-val ds-val-amber">DEFECT SUSPECTED</div>
            <button className="ds-btn ds-btn-amber ds-btn-compact" onClick={onOpenWorkflow}>
              Verify Evidence <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
