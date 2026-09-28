import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Label,
} from 'recharts';

const NAVY = '#0000B3';
const TEAL = '#12C6B3';
const ORANGE = '#FF9C00';
const RED = '#E53E3E';

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

export default function SensorTrends({ detectionConfig }) {
  const [timeRange, setTimeRange] = useState('5m');
  const pressureThreshold = detectionConfig?.pressure_threshold_pa ?? 20.0;
  const thermalThreshold = detectionConfig?.thermal_threshold ?? 0.60;
  const acousticThreshold = detectionConfig?.acoustic_threshold ?? 0.50;

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Sensor Trends</h1>
        </div>

        <div className="ds-time-filter-group">
          {['Live', '1m', '5m', '30m'].map((range) => {
            const key = range.toLowerCase();
            const isActive = timeRange === key;
            return (
              <button
                key={range}
                className={`ds-filter-btn ${isActive ? 'ds-filter-btn--active' : ''}`}
                onClick={() => setTimeRange(key)}
              >
                {range}
              </button>
            );
          })}
        </div>
      </header>

      {/* 4 Clean Charts */}
      <div className="ds-charts-2x2-grid">
        {/* CHART 1: Pressure */}
        <div className="ds-card ds-chart-card">
          <div className="ds-chart-card-header">
            <span className="ds-chart-title">Pressure: Pduct vs Pambient</span>
            <div className="ds-chart-legend-inline">
              <span className="ds-legend-item"><span className="ds-line-indicator ds-line-navy" /> Pduct</span>
              <span className="ds-legend-item"><span className="ds-line-indicator ds-line-teal" /> Pambient</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#666' }} width={48} />
              <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #DDD', borderRadius: 4, fontSize: 11 }} />
              <Line type="monotone" dataKey="pduct" stroke={NAVY} strokeWidth={2} dot={false} name="Pduct (hPa)" />
              <Line type="monotone" dataKey="pambient" stroke={TEAL} strokeWidth={2} dot={false} name="Pambient (hPa)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 2: Calibrated ΔP */}
        <div className="ds-card ds-chart-card">
          <div className="ds-chart-card-header">
            <span className="ds-chart-title">Calibrated ΔP (Pa)</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#666' }} width={42} />
              <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #DDD', borderRadius: 4, fontSize: 11 }} />
              <ReferenceLine
                y={pressureThreshold}
                stroke={ORANGE}
                strokeDasharray="4 3"
                label={{ value: `${pressureThreshold} Pa`, position: 'insideTopRight', fill: ORANGE, fontSize: 9 }}
              />
              <ReferenceLine
                x="24s"
                stroke={RED}
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{ value: 'LEAK', position: 'insideTopLeft', fill: RED, fontSize: 9, fontWeight: 700 }}
              />
              <Line type="monotone" dataKey="deltaP" stroke={ORANGE} strokeWidth={2} dot={{ r: 2.5, fill: ORANGE }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 3: Acoustic */}
        <div className="ds-card ds-chart-card">
          <div className="ds-chart-card-header">
            <span className="ds-chart-title">Acoustic Anomaly Score</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis domain={[0, 1.0]} tick={{ fontSize: 10, fill: '#666' }} width={35} />
              <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #DDD', borderRadius: 4, fontSize: 11 }} />
              <ReferenceLine
                y={acousticThreshold}
                stroke={TEAL}
                strokeDasharray="4 3"
                label={{ value: `${acousticThreshold}`, position: 'insideTopRight', fill: TEAL, fontSize: 9 }}
              />
              <Line type="monotone" dataKey="audio" stroke={TEAL} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 4: Thermal */}
        <div className="ds-card ds-chart-card">
          <div className="ds-chart-card-header">
            <span className="ds-chart-title">Thermal Anomaly Score</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#666' }} />
              <YAxis domain={[0, 1.0]} tick={{ fontSize: 10, fill: '#666' }} width={35} />
              <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #DDD', borderRadius: 4, fontSize: 11 }} />
              <ReferenceLine
                y={thermalThreshold}
                stroke={NAVY}
                strokeDasharray="4 3"
                label={{ value: `${thermalThreshold}`, position: 'insideTopRight', fill: NAVY, fontSize: 9 }}
              />
              <Line type="monotone" dataKey="thermal" stroke={NAVY} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
