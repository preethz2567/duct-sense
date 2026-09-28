import React, { useState } from 'react';
import {
  Gauge,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';

export default function CalibrationPage({ session }) {
  const [calState, setCalState] = useState('IDLE');
  const [progress, setProgress] = useState(0);
  const [offsetPa, setOffsetPa] = useState(4.2);
  const [stdPa, setStdPa] = useState(0.8);
  const [isSaved, setIsSaved] = useState(false);

  const startCalibration = () => {
    setCalState('RUNNING');
    setProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setProgress(p);

      if (p >= 100) {
        clearInterval(interval);
        setCalState('COMPLETE');
        setOffsetPa(4.18);
        setStdPa(0.65);
      }
    }, 450);
  };

  const saveCalibration = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">DEVICE & INSTRUMENT CONFIGURATION</div>
          <h1 className="ds-page-title">PRESSURE SENSOR CALIBRATION</h1>
        </div>
      </header>

      {/* Main Calibration Instrument Card */}
      <div className="ds-card ds-panel-card">
        <div className="ds-card-header ds-card-header-clean">
          <span className="ds-card-title">BMP280 STATIC TAP ZERO-OFFSET CALIBRATION</span>
          <span className="ds-pill-tag ds-pill-teal">Active Sensor Bus</span>
        </div>

        <div className="ds-cal-body">
          <div className="ds-inspector-metrics-stack">
            <div className="ds-metric-kv">
              <span className="ds-kv-key">Pduct Sensor (Static Duct Tap)</span>
              <span className="ds-kv-val ds-val-navy">BMP280-0x76 (Connected)</span>
            </div>
            <div className="ds-metric-kv">
              <span className="ds-kv-key">Pambient Sensor (Room Reference)</span>
              <span className="ds-kv-val ds-val-navy">BMP280-0x77 (Connected)</span>
            </div>
            <div className="ds-metric-kv ds-kv-highlight">
              <span className="ds-kv-key">Calibrated Baseline Zero-Offset</span>
              <span className="ds-kv-val ds-val-amber">+{offsetPa.toFixed(2)} Pa</span>
            </div>
            <div className="ds-metric-kv">
              <span className="ds-kv-key">Baseline Standard Deviation (σ)</span>
              <span className="ds-kv-val">±{stdPa.toFixed(2)} Pa</span>
            </div>
          </div>

          <div className="ds-workflow-box">
            <div className="ds-workflow-title">PHYSICAL CALIBRATION WORKFLOW:</div>
            <ul className="ds-workflow-steps">
              <li>1. Ensure Blower Fan is <strong>OFF</strong> (Static air equilibrium).</li>
              <li>2. Ensure all controlled leak ports are <strong>CLOSED</strong>.</li>
              <li>3. Collect 50 ambient baseline samples across the BMP280 pair.</li>
              <li>4. Compute mean zero-offset ΔP = Pduct - Pambient and variance.</li>
            </ul>

            {calState === 'RUNNING' && (
              <div className="ds-cal-progress-wrap">
                <div className="ds-cal-progress-bar">
                  <div className="ds-cal-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="ds-cal-progress-text">Zeroing baseline ({progress}%)...</span>
              </div>
            )}

            {calState === 'COMPLETE' && (
              <div className="ds-cal-success-banner">
                <CheckCircle2 size={15} />
                <span>Zero-offset calibration complete: +{offsetPa.toFixed(2)} Pa (σ = ±{stdPa.toFixed(2)} Pa).</span>
              </div>
            )}
          </div>

          <div className="ds-cal-actions-bar">
            {calState !== 'RUNNING' ? (
              <button className="ds-btn ds-btn-amber" onClick={startCalibration}>
                <Play size={13} /> Start Baseline Calibration
              </button>
            ) : (
              <button className="ds-btn ds-btn-disabled" disabled>
                Calibrating...
              </button>
            )}

            {calState === 'COMPLETE' && (
              <button className="ds-btn ds-btn-green" onClick={saveCalibration}>
                <Save size={13} /> Save Calibration Offset
              </button>
            )}

            {isSaved && <span className="ds-saved-indicator"><CheckCircle2 size={13} /> Saved to Local Storage</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
