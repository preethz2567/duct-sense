// src/pages/EngineeringPage.jsx
import React, { useState } from 'react';
import {
  Cpu,
  Sliders,
  TrendingUp,
  Gauge,
  CheckCircle2,
  Play,
  Save,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { initialHardwareStatus } from '../services/mockDataService';

const NAVY = '#344B5E';
const TEAL = '#176B73';
const AMBER = '#D88A19';
const RED = '#B83A32';

const generateTrendData = () => {
  const points = [];
  for (let i = 0; i <= 30; i++) {
    const t = i * 2;
    const isLeakActive = t >= 24 && t <= 44;
    const pambient = 1013.25 + Math.sin(i * 0.2) * 0.04;
    const pductBaseline = 1015.80;
    const pduct = isLeakActive
      ? 1015.35 + (Math.random() * 0.08 - 0.04)
      : pductBaseline + (Math.random() * 0.05 - 0.025);
    const deltaP = (pduct - pambient) * 100 - 4.2;
    const audio = isLeakActive ? 0.72 + Math.random() * 0.14 : 0.12 + Math.random() * 0.08;
    const thermal = isLeakActive ? 0.82 + Math.random() * 0.09 : 0.10 + Math.random() * 0.06;

    points.push({
      time: `${t}s`,
      pduct: parseFloat(pduct.toFixed(2)),
      pambient: parseFloat(pambient.toFixed(2)),
      deltaP: parseFloat(deltaP.toFixed(1)),
      audio: parseFloat(audio.toFixed(2)),
      thermal: parseFloat(thermal.toFixed(2)),
    });
  }
  return points;
};

const TREND_DATA = generateTrendData();

export default function EngineeringPage({ session }) {
  const [subTab, setSubTab] = useState('CALIBRATION'); // 'CALIBRATION', 'HARDWARE', 'TRENDS'
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
    }, 400);
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
          <div className="ds-kicker-label">SECONDARY ENGINEERING & DIAGNOSTICS</div>
          <h1 className="ds-page-title">DEVICE & HARDWARE STATUS</h1>
        </div>

        <div className="ds-header-actions">
          <div className="ds-mode-pill-group">
            {[
              { id: 'CALIBRATION', label: 'Zero-Offset Calibration' },
              { id: 'HARDWARE', label: 'Hardware Bus' },
              { id: 'TRENDS', label: 'Sensor Trends' },
            ].map((t) => (
              <button
                key={t.id}
                className={`ds-mode-pill ${subTab === t.id ? 'ds-mode-pill--sim' : ''}`}
                onClick={() => setSubTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 1. CALIBRATION SUB-TAB */}
      {subTab === 'CALIBRATION' && (
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
                <li>4. Compute mean zero-offset ΔP = Pduct - Pambient.</li>
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
      )}

      {/* 2. HARDWARE SUB-TAB */}
      {subTab === 'HARDWARE' && (
        <div className="ds-card ds-hardware-card">
          <div className="ds-card-header ds-card-header-clean">
            <span className="ds-card-title">EDGE HARDWARE BUS & PERIPHERALS</span>
            <span className="ds-pill-tag ds-pill-green">ALL NODES ONLINE</span>
          </div>

          <div className="ds-table-responsive">
            <table className="ds-engineering-table">
              <thead>
                <tr>
                  <th>DEVICE NODE</th>
                  <th>POC FUNCTION</th>
                  <th>PHYSICAL INTERFACE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {initialHardwareStatus.map((hw) => (
                  <tr key={hw.id}>
                    <td className="ds-td-bold">{hw.name}</td>
                    <td>{hw.role}</td>
                    <td className="ds-td-mono">{hw.bus}</td>
                    <td>
                      <span className="ds-badge-green">
                        <CheckCircle2 size={12} /> {hw.status === 'CAPTURED_FRAME_MODE' ? 'CAPTURE MODE' : 'CONNECTED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ds-hw-architecture-note">
            <Info size={14} className="ds-icon-petrol" />
            <span>
              <strong>POC Architecture Note:</strong> BMP280 barometric pressure sensor pair measures duct static tap vs room ambient reference (Pduct - Pambient). INMP441 MEMS microphone processes audible turbulence frequencies. FLIR thermal camera provides thermal gradient localization.
            </span>
          </div>
        </div>
      )}

      {/* 3. SENSOR TRENDS SUB-TAB */}
      {subTab === 'TRENDS' && (
        <div className="ds-grid-2col">
          <div className="ds-card ds-plot-card">
            <div className="ds-plot-header">
              <span className="ds-plot-title">CALIBRATED PRESSURE DIFFERENTIAL (ΔP)</span>
              <span className="ds-plot-unit">Pascals (Pa)</span>
            </div>
            <div className="ds-chart-wrap" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="time" stroke="#667078" fontSize={10} />
                  <YAxis domain={[180, 280]} stroke="#667078" fontSize={10} />
                  <Tooltip />
                  <ReferenceLine y={200} stroke={RED} strokeDasharray="4 2" label={{ value: 'Leak Thresh', fill: RED, fontSize: 10 }} />
                  <Line type="monotone" dataKey="deltaP" stroke={NAVY} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ds-card ds-plot-card">
            <div className="ds-plot-header">
              <span className="ds-plot-title">THERMAL GRADIENT CONFIDENCE</span>
              <span className="ds-plot-unit">Score (0.0 - 1.0)</span>
            </div>
            <div className="ds-chart-wrap" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="time" stroke="#667078" fontSize={10} />
                  <YAxis domain={[0, 1]} stroke="#667078" fontSize={10} />
                  <Tooltip />
                  <ReferenceLine y={0.60} stroke={AMBER} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="thermal" stroke={AMBER} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
