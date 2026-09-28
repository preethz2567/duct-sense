import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';
import SensorEvidencePanel from '../components/SensorEvidencePanel';
import StatusBadge from '../components/StatusBadge';

export default function LiveMonitoring({
  walkthroughs,
  selectedWalkthrough,
  operatingMode = 'SIMULATION',
  onToggleMode,
  detectionConfig,
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentWt = selectedWalkthrough || (walkthroughs.length > 0 ? walkthroughs[0] : null);
  const events = currentWt?.leak_events || [];
  const hasLeak = events.length > 0;

  const peakEvent = hasLeak
    ? events.reduce((prev, curr) => (curr.leak_confidence > prev.leak_confidence ? curr : prev), events[0])
    : null;

  const rawLeakPos = peakEvent?.position_m ?? 0.52;
  const leakPos = rawLeakPos > 1.0 ? parseFloat((rawLeakPos % 1.0).toFixed(2)) || 0.52 : rawLeakPos;

  const pductHpa = 1015.35;
  const pambientHpa = 1013.25;
  const calibrationOffsetPa = 4.2;
  const calibratedDeltaPPa = peakEvent?.pressure_differential_pa ?? (hasLeak ? 205.8 : 1.2);
  const thermalScore = peakEvent?.thermal_confidence ?? (hasLeak ? 0.86 : 0.12);
  const acousticScore = peakEvent?.audio_confidence ?? (hasLeak ? 0.78 : 0.08);
  const fusedConfidence = peakEvent?.leak_confidence ?? (hasLeak ? 0.86 : 0.05);

  const pressureThreshold = detectionConfig?.pressure_threshold_pa ?? 20.0;

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Top Header - Streamlined */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Live Monitoring</h1>
        </div>
        <div className="ds-header-actions">
          {/* Operating Mode Switcher */}
          <div className="ds-mode-pill-group">
            <button
              className={`ds-mode-pill ${operatingMode === 'LIVE_HARDWARE' ? 'ds-mode-pill--live' : ''}`}
              onClick={() => onToggleMode && onToggleMode('LIVE_HARDWARE')}
            >
              LIVE
            </button>
            <button
              className={`ds-mode-pill ${operatingMode === 'SIMULATION' ? 'ds-mode-pill--sim' : ''}`}
              onClick={() => onToggleMode && onToggleMode('SIMULATION')}
            >
              SIMULATION
            </button>
            <button
              className={`ds-mode-pill ${operatingMode === 'REPLAY_TEST' ? 'ds-mode-pill--replay' : ''}`}
              onClick={() => onToggleMode && onToggleMode('REPLAY_TEST')}
            >
              REPLAY
            </button>
          </div>

          <div className="ds-time-display">
            <Clock size={13} />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Grid */}
      <div className="ds-grid-2col">
        {/* LEFT: Large Visual Evidence (1.0 m POC Duct) */}
        <div className="ds-card ds-card-viewport">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">POC Duct (1.0 m Rig)</span>
            <span className="ds-vp-tag">{hasLeak ? `@ ${leakPos.toFixed(2)} m` : 'Scanning'}</span>
          </div>

          <div className="ds-duct-visualizer-container">
            <svg viewBox="0 0 700 280" className="ds-duct-svg">
              <defs>
                <linearGradient id="ductMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="50%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
                <radialGradient id="hotspot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF2200" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#FF9C00" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0000B3" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Duct Tube */}
              <rect x="50" y="70" width="600" height="140" rx="4" fill="url(#ductMetal)" stroke="#0F172A" strokeWidth="2" />

              {/* Joint Seams */}
              <line x1="50" y1="70" x2="50" y2="210" stroke="#0000B3" strokeWidth="3" />
              <line x1="350" y1="70" x2="350" y2="210" stroke="#FF9C00" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="650" y1="70" x2="650" y2="210" stroke="#0000B3" strokeWidth="3" />

              {/* Airflow Arrow */}
              <path d="M 70 140 L 100 140 M 90 132 L 102 140 L 90 148" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
              <text x="112" y="144" fill="#FFFFFF" fontSize="11" fontWeight="700">FLOW</text>

              {/* Sensor Tap @ 0.15 m */}
              <circle cx="140" cy="70" r="5" fill="#FF9C00" />
              <text x="140" y="58" fill="#0000B3" fontSize="10" fontWeight="bold" textAnchor="middle">Pduct Tap</text>

              {/* Leak Hotspot & Marker at ~0.50 m */}
              {hasLeak ? (
                <g transform="translate(350, 140)">
                  <circle cx="0" cy="0" r="42" fill="url(#hotspot)" />
                  <rect x="-30" y="-30" width="60" height="60" fill="none" stroke="#FF2200" strokeWidth="2" strokeDasharray="5 3" />
                  <rect x="-45" y="-52" width="90" height="18" fill="#FF2200" rx="3" />
                  <text x="0" y="-40" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
                    LEAK @ {leakPos.toFixed(2)} m
                  </text>
                </g>
              ) : (
                <g transform="translate(350, 140)">
                  <rect x="-40" y="-12" width="80" height="24" fill="#12C6B3" rx="3" />
                  <text x="0" y="4" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">NOMINAL</text>
                </g>
              )}

              {/* Scale */}
              <g transform="translate(50, 230)">
                <line x1="0" y1="0" x2="600" y2="0" stroke="#94A3B8" strokeWidth="1" />
                <text x="0" y="15" fill="#64748B" fontSize="10">0.0 m</text>
                <text x="300" y="15" fill="#FF9C00" fontSize="10" fontWeight="bold" textAnchor="middle">0.50 m (Port)</text>
                <text x="600" y="15" fill="#64748B" fontSize="10" textAnchor="end">1.0 m</text>
              </g>
            </svg>
          </div>
        </div>

        {/* RIGHT: Instrument Readout Panel (3-Second Decision Hierarchy) */}
        <div className="ds-col-right">
          {/* 1. STATUS + LOCATION + CONFIDENCE (Primary Verdict) */}
          <div className={`ds-card ds-primary-verdict-card ${hasLeak ? 'ds-card--alarm' : 'ds-card--clean'}`}>
            <div className="ds-verdict-main-row">
              <div>
                <span className="ds-verdict-kicker">STATUS</span>
                <div className="ds-verdict-title">{hasLeak ? 'LEAK DETECTED' : 'SYSTEM NORMAL'}</div>
              </div>
              <StatusBadge status={hasLeak ? 'LEAK_DETECTED' : 'NORMAL'} size="large" />
            </div>

            {hasLeak && (
              <div className="ds-primary-telemetry-row">
                <div className="ds-primary-readout">
                  <span className="ds-readout-lbl">LOCATION</span>
                  <span className="ds-readout-val ds-val-navy">{leakPos.toFixed(2)} <span className="ds-val-unit">m</span></span>
                </div>
                <div className="ds-primary-readout">
                  <span className="ds-readout-lbl">CONFIDENCE</span>
                  <span className="ds-readout-val ds-val-orange">{(fusedConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. THREE SENSOR EVIDENCE VALUES */}
          <SensorEvidencePanel
            pressureDifferentialPa={calibratedDeltaPPa}
            normalizedPressure={peakEvent?.normalized_pressure ?? (hasLeak ? 0.76 : 0.08)}
            thermalScore={thermalScore}
            acousticScore={acousticScore}
            fusedConfidence={fusedConfidence}
            pressureThresholdPa={pressureThreshold}
          />

          {/* 3. THREE CRITICAL MEASUREMENTS */}
          <div className="ds-metric-cards-3">
            <div className="ds-metric-box">
              <span className="ds-box-label">Pduct</span>
              <span className="ds-box-value">{pductHpa.toFixed(1)} <span className="ds-unit">hPa</span></span>
            </div>

            <div className="ds-metric-box">
              <span className="ds-box-label">Pambient</span>
              <span className="ds-box-value">{pambientHpa.toFixed(1)} <span className="ds-unit">hPa</span></span>
            </div>

            <div className="ds-metric-box ds-box-highlight">
              <span className="ds-box-label">Calibrated ΔP</span>
              <span className="ds-box-value">+{calibratedDeltaPPa.toFixed(1)} <span className="ds-unit">Pa</span></span>
            </div>
          </div>

          {/* Progressive Disclosure Toggle */}
          <div className="ds-disclosure-wrap">
            <button
              className="ds-btn-disclosure"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Sliders size={13} />
              <span>Technical Calibration & Bus Details</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <div className="ds-disclosure-content">
                <div className="ds-detail-line">
                  <span>Zero Calibration Offset:</span>
                  <strong>+{calibrationOffsetPa.toFixed(1)} Pa</strong>
                </div>
                <div className="ds-detail-line">
                  <span>Pressure Trigger Cutoff:</span>
                  <strong>{pressureThreshold.toFixed(1)} Pa</strong>
                </div>
                <div className="ds-detail-line">
                  <span>Hardware Nodes:</span>
                  <strong>BMP280 (I2C) · FLIR (SPI) · INMP441 (I2S)</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
