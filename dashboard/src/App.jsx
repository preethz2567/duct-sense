import { useState } from 'react';
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
  BarChart,
  Bar,
} from 'recharts';
import { mockWalkthroughs } from './mockData';
import './App.css';

/* ── Brand tokens ────────────────────────────────────────────────────────── */
const NAVY      = '#0000B3';
const TEAL      = '#12C6B3';
const ORANGE    = '#FF9C00';
const THRESHOLD = 0.65;

/* ── Leak-count bar chart (List View) ───────────────────────────────────── */
function LeakCountChart() {
  const data = mockWalkthroughs.map((wt) => ({
    date:  wt.date,
    leaks: wt.leak_events.length,
  }));

  return (
    <div className="chart-card">
      <p className="chart-title">Leak Count per Walkthrough</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #EEEEEE',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
            formatter={(v) => [v, 'Leak Events']}
          />
          <Bar dataKey="leaks" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Confidence line chart (Detail View) ────────────────────────────────── */
function ConfidenceChart({ events }) {
  if (events.length === 0) return null;

  const data = events.map((e) => ({
    position:   parseFloat(e.position_m.toFixed(3)),
    confidence: e.leak_confidence,
  }));

  return (
    <div className="chart-card">
      <p className="chart-title">Leak Confidence vs. Position</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis
            dataKey="position"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={false}
            tickCount={6}
          >
            <Label
              value="Position (m)"
              position="insideBottom"
              offset={-12}
              style={{ fontSize: 11, fill: '#888888', fontFamily: 'Arial, Helvetica, sans-serif' }}
            />
          </XAxis>
          <YAxis
            domain={[0.5, 1.0]}
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={36}
          >
            <Label
              value="Confidence"
              angle={-90}
              position="insideLeft"
              offset={10}
              style={{ fontSize: 11, fill: '#888888', fontFamily: 'Arial, Helvetica, sans-serif' }}
            />
          </YAxis>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #EEEEEE',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
            formatter={(v) => [v.toFixed(2), 'Confidence']}
            labelFormatter={(l) => `Position: ${l} m`}
          />
          <ReferenceLine
            y={THRESHOLD}
            stroke={ORANGE}
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: 'Detection Threshold',
              position: 'insideTopRight',
              style: {
                fontSize: 10,
                fill: ORANGE,
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 700,
              },
            }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke={NAVY}
            strokeWidth={2}
            dot={{ r: 4, fill: NAVY, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: NAVY }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── List View ──────────────────────────────────────────────────────────── */
function WalkthroughCard({ walkthrough, onView }) {
  const { date, walkthrough_id, leak_events } = walkthrough;
  const count = leak_events.length;

  return (
    <div className="card">
      <div className="card-date">📅 {date}</div>
      <div className="card-id">{walkthrough_id}</div>
      <div className="card-leak-count">
        <span className={`badge ${count > 0 ? 'badge-danger' : 'badge-safe'}`}>
          {count > 0 ? `⚠ ${count} leak${count !== 1 ? 's' : ''}` : '✓ Clean'}
        </span>
        <span className="card-leak-label">
          {count > 0 ? 'events detected' : 'no leaks found'}
        </span>
      </div>
      <button className="btn btn-primary" onClick={() => onView(walkthrough)}>
        View Details →
      </button>
    </div>
  );
}

function ListView({ onView }) {
  return (
    <>
      <LeakCountChart />
      <p className="section-title">Walkthrough Sessions</p>
      <div className="card-grid">
        {mockWalkthroughs.map((wt) => (
          <WalkthroughCard key={wt.walkthrough_id} walkthrough={wt} onView={onView} />
        ))}
      </div>
    </>
  );
}

/* ── Detail View ────────────────────────────────────────────────────────── */
function DetailView({ walkthrough, onBack }) {
  const { date, walkthrough_id, leak_events } = walkthrough;
  const count = leak_events.length;

  const maxConf  = count > 0 ? Math.max(...leak_events.map(e => e.leak_confidence)) : 0;
  const firstPos = count > 0 ? leak_events[0].position_m.toFixed(3) : '—';

  return (
    <>
      <div className="detail-header">
        <div className="detail-title">
          <h2>Walkthrough Report</h2>
          <div className="detail-meta">{date} &nbsp;·&nbsp; {walkthrough_id}</div>
        </div>
        <button className="btn btn-back" onClick={onBack}>← Back</button>
      </div>

      {/* Stats strip */}
      <div className="detail-stats">
        <div className="stat-box">
          <div className="stat-value">{count}</div>
          <div className="stat-label">Leak Events</div>
        </div>
        {count > 0 && (
          <>
            <div className="stat-box">
              <div className="stat-value">{maxConf.toFixed(2)}</div>
              <div className="stat-label">Peak Confidence</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{firstPos} m</div>
              <div className="stat-label">First Detection</div>
            </div>
          </>
        )}
      </div>

      {count === 0 ? (
        <div className="empty-state">
          <div className="check">✅</div>
          No leaks detected during this walkthrough.
        </div>
      ) : (
        <>
          <ConfidenceChart events={leak_events} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Position (m)</th>
                  <th>Confidence</th>
                  <th>Timestamp (s)</th>
                </tr>
              </thead>
              <tbody>
                {leak_events.map((event, idx) => (
                  <tr
                    key={idx}
                    className={event.leak_confidence >= 0.75 ? 'high-confidence' : ''}
                  >
                    <td>{idx + 1}</td>
                    <td>{event.position_m.toFixed(3)}</td>
                    <td>{event.leak_confidence.toFixed(2)}</td>
                    <td>{event.timestamp.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/* ── App root ───────────────────────────────────────────────────────────── */
export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">🌡️</div>
        <div>
          <h1>DuctSense</h1>
          <p>HVAC Leak Detection Dashboard</p>
        </div>
      </header>

      {selected === null ? (
        <ListView onView={(wt) => setSelected(wt)} />
      ) : (
        <DetailView walkthrough={selected} onBack={() => setSelected(null)} />
      )}
    </div>
  );
}
