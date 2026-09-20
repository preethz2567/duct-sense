import { useState } from 'react';
import { mockWalkthroughs } from './mockData';
import './App.css';

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
