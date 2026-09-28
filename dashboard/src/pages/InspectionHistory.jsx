import React from 'react';
import { History, Calendar, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function InspectionHistory({ walkthroughs, onSelectWalkthrough }) {
  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">INSPECTION ARCHIVE</div>
          <h1 className="ds-page-title">INSPECTION HISTORY</h1>
        </div>

        <div className="ds-header-actions">
          <span className="ds-pill-tag"><strong>{walkthroughs.length}</strong> Past Runs</span>
        </div>
      </header>

      {/* History Grid */}
      <div className="ds-walkthrough-cards-grid">
        {walkthroughs.map((wt) => {
          const count = wt.leak_events.length;
          return (
            <div key={wt.walkthrough_id} className="ds-card ds-wt-card">
              <div>
                <div className="ds-wt-card-top">
                  <span className="ds-wt-date"><Calendar size={13} /> {wt.date}</span>
                  <StatusBadge status={count > 0 ? 'LEAK_DETECTED' : 'NORMAL'} size="small" />
                </div>
                <div className="ds-wt-id-code">{wt.walkthrough_id}</div>
                <div className="ds-wt-leak-count">
                  {count > 0 ? (
                    <span><strong>{count}</strong> defect point{count !== 1 ? 's' : ''} logged</span>
                  ) : (
                    <span className="ds-val-green">Zero defects found (Pass)</span>
                  )}
                </div>
              </div>
              <button className="ds-btn ds-btn-secondary ds-btn-full" onClick={() => onSelectWalkthrough(wt)}>
                <Eye size={13} /> Review Commissioning Data
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
