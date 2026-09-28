import React, { useState } from 'react';
import {
  Gauge,
  Thermometer,
  Mic,
  Activity,
  Sliders,
  TrendingUp,
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
    const audio = isLeakActive ? 0.72 + (Math.random() * 0.14) : 0.12 + (Math.random() * 0.08);
    const thermal = isLeakActive ? 0.82 + (Math.random() * 0.09) : 0.10 + (Math.random() * 0.06);

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

export default function SensorEvidence({ session }) {
  const [tab, setTab] = useState('LIVE_TELEMETRY'); // 'LIVE_TELEMETRY' or 'MEASUREMENT_PLOTS'
  const { telemetry } = session;

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">EVIDENCE LAYER</div>
          <h1 className="ds-page-title">SENSOR DATA & ENGINEERING PLOTS</h1>
        </div>

        <div className="ds-header-actions">
          <div className="ds-mode-pill-group">
            <button
              className={`ds-mode-pill ${tab === 'LIVE_TELEMETRY' ? 'ds-mode-pill--sim' : ''}`}
              onClick={() => setTab('LIVE_TELEMETRY')}
            >
              Physical Readings
            </button>
            <button
              className={`ds-mode-pill ${tab === 'MEASUREMENT_PLOTS' ? 'ds-mode-pill--live' : ''}`}
              onClick={() => setTab('MEASUREMENT_PLOTS')}
            >
              Measurement Plots
            </button>
          </div>
        </div>
      </header>

      {tab === 'LIVE_TELEMETRY' ? (
        /* 3 Dedicated Modality Panels Grid */
        <div className="ds-grid-3col">
          {/* PRESSURE PANEL */}
          <div className="ds-card ds-sensor-evidence-panel">
            <div className="ds-card-header ds-card-header-clean">
              <div className="ds-modality-title-wrap">
                <Gauge size={16} className="ds-icon-petrol" />
                <span className="ds-card-title">PRESSURE SENSING</span>
              </div>
              <span className="ds-pill-tag ds-pill-amber">BMP280 Pair</span>
            </div>

            <div className="ds-sensor-kv-list">
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Pduct (Static Tap)</span>
                <span className="ds-kv-val">{telemetry.pductHpa.toFixed(2)} hPa</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Pambient (Room Ref)</span>
                <span className="ds-kv-val">{telemetry.pambientHpa.toFixed(2)} hPa</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Raw Differential (ΔP)</span>
                <span className="ds-kv-val">{telemetry.rawDeltaPPa.toFixed(1)} Pa</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Calibration Offset</span>
                <span className="ds-kv-val">+{telemetry.calibrationOffsetPa.toFixed(1)} Pa</span>
              </div>
              <div className="ds-sensor-kv-row ds-row-highlight">
                <span className="ds-kv-lbl">Calibrated ΔP</span>
                <span className="ds-kv-val ds-val-amber">+{telemetry.calibratedDeltaPPa.toFixed(1)} Pa</span>
              </div>
            </div>

            <div className="ds-sensor-panel-footer">
              ΔP_calibrated = (Pduct - Pambient) - calibration_offset
            </div>
          </div>

          {/* THERMAL PANEL */}
          <div className="ds-card ds-sensor-evidence-panel">
            <div className="ds-card-header ds-card-header-clean">
              <div className="ds-modality-title-wrap">
                <Thermometer size={16} className="ds-icon-petrol" />
                <span className="ds-card-title">THERMAL RADIOMETRY</span>
              </div>
              <span className="ds-pill-tag">FLIR Camera</span>
            </div>

            <div className="ds-sensor-kv-list">
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Reference (Tref)</span>
                <span className="ds-kv-val">{telemetry.tempRefC.toFixed(1)} °C</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Maximum (Tmax)</span>
                <span className="ds-kv-val">{telemetry.tempMaxC.toFixed(1)} °C</span>
              </div>
              <div className="ds-sensor-kv-row ds-row-highlight">
                <span className="ds-kv-lbl">Temperature Difference (ΔT)</span>
                <span className="ds-kv-val ds-val-amber">+{telemetry.deltaTC.toFixed(1)} °C</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Thermal Anomaly Score</span>
                <span className="ds-kv-val">{telemetry.thermalScore.toFixed(2)}</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Target Aperture</span>
                <span className="ds-kv-val">Port @ 0.50 m</span>
              </div>
            </div>

            <div className="ds-sensor-panel-footer">
              Thermal gradient provides primary localization evidence.
            </div>
          </div>

          {/* ACOUSTIC PANEL */}
          <div className="ds-card ds-sensor-evidence-panel">
            <div className="ds-card-header ds-card-header-clean">
              <div className="ds-modality-title-wrap">
                <Mic size={16} className="ds-icon-petrol" />
                <span className="ds-card-title">AUDIBLE ACOUSTIC</span>
              </div>
              <span className="ds-pill-tag">INMP441</span>
            </div>

            <div className="ds-sensor-kv-list">
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Audible Signal Level</span>
                <span className="ds-kv-val">68.4 dBA</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Spectral Peak</span>
                <span className="ds-kv-val">3.8 kHz</span>
              </div>
              <div className="ds-sensor-kv-row ds-row-highlight">
                <span className="ds-kv-lbl">Acoustic Anomaly Score</span>
                <span className="ds-kv-val ds-val-amber">{telemetry.acousticScore.toFixed(2)}</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Frequency Band</span>
                <span className="ds-kv-val">Audible Range</span>
              </div>
              <div className="ds-sensor-kv-row">
                <span className="ds-kv-lbl">Channel Alignment</span>
                <span className="ds-kv-val">Dual I2S (L/R)</span>
              </div>
            </div>

            <div className="ds-sensor-panel-footer">
              INMP441 captures audible turbulence hiss at joint seams.
            </div>
          </div>
        </div>
      ) : (
        /* 4 Clean Measurement Plots (Restrained Engineering Linework) */
        <div className="ds-charts-2x2-grid">
          {/* CHART 1: Pressure */}
          <div className="ds-card ds-chart-card">
            <div className="ds-chart-card-header">
              <span className="ds-chart-title">1. Pressure (Pduct vs Pambient)</span>
              <div className="ds-chart-legend-inline">
                <span className="ds-legend-item"><span className="ds-line-indicator" style={{ background: NAVY }} /> Pduct</span>
                <span className="ds-legend-item"><span className="ds-line-indicator" style={{ background: TEAL }} /> Pambient</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E4E1" />
                <XAxis dataKey="time" tick={{ fontSize: 9.5, fill: '#667078' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9.5, fill: '#667078' }} width={45} />
                <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #CDD0CE', borderRadius: 3, fontSize: 11 }} />
                <Line type="monotone" dataKey="pduct" stroke={NAVY} strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="pambient" stroke={TEAL} strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CHART 2: Calibrated ΔP */}
          <div className="ds-card ds-chart-card">
            <div className="ds-chart-card-header">
              <span className="ds-chart-title">2. Calibrated Differential Pressure (ΔP)</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E4E1" />
                <XAxis dataKey="time" tick={{ fontSize: 9.5, fill: '#667078' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9.5, fill: '#667078' }} width={40} />
                <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #CDD0CE', borderRadius: 3, fontSize: 11 }} />
                <ReferenceLine y={20} stroke={AMBER} strokeDasharray="3 3" label={{ value: '20 Pa trigger', position: 'insideTopRight', fill: AMBER, fontSize: 9 }} />
                <ReferenceLine x="24s" stroke={RED} strokeWidth={1.5} label={{ value: 'LEAK', position: 'insideTopLeft', fill: RED, fontSize: 9, fontWeight: 700 }} />
                <Line type="monotone" dataKey="deltaP" stroke={AMBER} strokeWidth={2} dot={{ r: 2, fill: AMBER }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CHART 3: Acoustic Signal */}
          <div className="ds-card ds-chart-card">
            <div className="ds-chart-card-header">
              <span className="ds-chart-title">3. Acoustic Anomaly Energy (INMP441)</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E4E1" />
                <XAxis dataKey="time" tick={{ fontSize: 9.5, fill: '#667078' }} />
                <YAxis domain={[0, 1.0]} tick={{ fontSize: 9.5, fill: '#667078' }} width={35} />
                <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #CDD0CE', borderRadius: 3, fontSize: 11 }} />
                <Line type="monotone" dataKey="audio" stroke={TEAL} strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CHART 4: Thermal Score */}
          <div className="ds-card ds-chart-card">
            <div className="ds-chart-card-header">
              <span className="ds-chart-title">4. FLIR Thermal Anomaly Gradient</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E2E4E1" />
                <XAxis dataKey="time" tick={{ fontSize: 9.5, fill: '#667078' }} />
                <YAxis domain={[0, 1.0]} tick={{ fontSize: 9.5, fill: '#667078' }} width={35} />
                <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #CDD0CE', borderRadius: 3, fontSize: 11 }} />
                <Line type="monotone" dataKey="thermal" stroke={NAVY} strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
