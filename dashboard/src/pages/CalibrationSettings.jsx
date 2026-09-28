import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Cpu,
  Gauge,
  CheckCircle2,
  Play,
  Save,
  Check,
} from 'lucide-react';
import { initialCalibrationData, initialDetectionConfig, initialHardwareStatus } from '../services/mockDataService';

export default function CalibrationSettings({
  calibrationData = initialCalibrationData,
  detectionConfig = initialDetectionConfig,
  onSaveConfig,
}) {
  const [calState, setCalState] = useState('IDLE');
  const [calProgress, setCalProgress] = useState(0);
  const [calOffset, setCalOffset] = useState(calibrationData.current_offset_pa);
  const [calStd, setCalStd] = useState(calibrationData.baseline_std_pa);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [config, setConfig] = useState({ ...detectionConfig });
  const [configSaved, setConfigSaved] = useState(false);
  const [hwList] = useState(initialHardwareStatus);

  const startCalibrationWorkflow = () => {
    setCalState('RUNNING');
    setCalProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setCalProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setCalState('COMPLETE');
        setCalOffset(4.15);
        setCalStd(0.68);
      }
    }, 400);
  };

  const handleSaveCalibration = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleConfigChange = (key, val) => {
    setConfig((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (onSaveConfig) onSaveConfig(config);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Calibration & Settings</h1>
        </div>
      </header>

      <div className="ds-calibration-grid">
        {/* PANEL 1: Zero-Offset Calibration */}
        <div className="ds-card ds-panel-card">
          <div className="ds-card-header ds-card-header-clean">
            <h3 className="ds-card-title">Pressure Zero-Calibration</h3>
            <span className="ds-pill-tag">Offset: +{calOffset.toFixed(2)} Pa</span>
          </div>

          <div className="ds-cal-body">
            <div className="ds-key-metrics-stack">
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Pduct Sensor</span>
                <span className="ds-metric-val">{calibrationData.pduct_sensor_id}</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Pambient Sensor</span>
                <span className="ds-metric-val">{calibrationData.pambient_sensor_id}</span>
              </div>
              <div className="ds-key-metric-row ds-row-highlight">
                <span className="ds-metric-key">Current Calibrated Offset</span>
                <span className="ds-metric-val ds-val-orange">+{calOffset.toFixed(2)} Pa</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Baseline Noise (σ)</span>
                <span className="ds-metric-val">±{calStd.toFixed(2)} Pa</span>
              </div>
            </div>

            {calState === 'RUNNING' && (
              <div className="ds-cal-progress-wrap">
                <div className="ds-cal-progress-bar">
                  <div className="ds-cal-progress-fill" style={{ width: `${calProgress}%` }} />
                </div>
                <span className="ds-cal-progress-text">Zeroing baseline ({calProgress}%)</span>
              </div>
            )}

            <div className="ds-cal-actions-bar">
              {calState !== 'RUNNING' ? (
                <button className="ds-btn ds-btn-primary ds-btn-compact" onClick={startCalibrationWorkflow}>
                  <Play size={13} /> Zero Sensor Pair
                </button>
              ) : (
                <button className="ds-btn ds-btn-disabled ds-btn-compact" disabled>
                  Zeroing...
                </button>
              )}

              {calState === 'COMPLETE' && (
                <button className="ds-btn ds-btn-teal ds-btn-compact" onClick={handleSaveCalibration}>
                  <Save size={13} /> Save Offset
                </button>
              )}

              {savedSuccess && <span className="ds-saved-indicator"><Check size={13} /> Saved</span>}
            </div>
          </div>
        </div>

        {/* PANEL 2: Detection Configuration */}
        <div className="ds-card ds-panel-card">
          <div className="ds-card-header ds-card-header-clean">
            <h3 className="ds-card-title">Detection Thresholds</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="ds-config-form ds-config-compact">
            <div className="ds-form-group">
              <label className="ds-form-label">Pressure Trigger Threshold (Pa)</label>
              <input
                type="number"
                step="0.5"
                className="ds-form-input"
                value={config.pressure_threshold_pa}
                onChange={(e) => handleConfigChange('pressure_threshold_pa', e.target.value)}
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Thermal Threshold (0–1.0)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                className="ds-form-input"
                value={config.thermal_threshold}
                onChange={(e) => handleConfigChange('thermal_threshold', e.target.value)}
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Acoustic Threshold (0–1.0)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                className="ds-form-input"
                value={config.acoustic_threshold}
                onChange={(e) => handleConfigChange('acoustic_threshold', e.target.value)}
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Fused Leak Confidence Cutoff (0–1.0)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                className="ds-form-input"
                value={config.fusion_threshold}
                onChange={(e) => handleConfigChange('fusion_threshold', e.target.value)}
              />
            </div>

            <div className="ds-form-actions">
              <button type="submit" className="ds-btn ds-btn-primary ds-btn-compact">
                <Save size={13} /> Apply Thresholds
              </button>
              {configSaved && <span className="ds-saved-indicator"><Check size={13} /> Applied</span>}
            </div>
          </form>
        </div>

        {/* PANEL 3: Hardware Status */}
        <div className="ds-card ds-panel-card ds-panel-fullwidth">
          <div className="ds-card-header ds-card-header-clean">
            <h3 className="ds-card-title">Hardware Bus & Status</h3>
            <span className="ds-pill-tag ds-pill-teal">All Connected</span>
          </div>

          <div className="ds-table-responsive">
            <table className="ds-engineering-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Role</th>
                  <th>Interface</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hwList.map((hw) => (
                  <tr key={hw.id}>
                    <td className="ds-td-bold">{hw.name}</td>
                    <td>{hw.role}</td>
                    <td className="ds-td-mono">{hw.bus}</td>
                    <td>
                      <span className="ds-hw-badge ds-badge-teal">
                        <CheckCircle2 size={12} /> Connected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
