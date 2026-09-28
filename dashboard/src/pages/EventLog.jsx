import React, { useState } from 'react';
import {
  Download,
  Search,
  Eye,
  X,
} from 'lucide-react';
import { sampleEventLog } from '../services/mockDataService';
import StatusBadge from '../components/StatusBadge';

export default function EventLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const logs = sampleEventLog.filter((item) =>
    item.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Event', 'Pduct (hPa)', 'Pambient (hPa)', 'DeltaP (Pa)', 'Audio', 'Thermal', 'Confidence', 'Status'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.event}"`,
      l.pduct,
      l.pambient,
      l.deltaP,
      l.audio,
      l.thermal,
      l.confidence,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ductsense_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Event Log</h1>
        </div>

        <div className="ds-header-actions">
          <div className="ds-search-wrap ds-search-compact">
            <Search size={14} className="ds-search-icon" />
            <input
              type="text"
              className="ds-search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="ds-btn ds-btn-primary ds-btn-compact" onClick={exportCSV}>
            <Download size={13} /> Export
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="ds-card ds-table-card">
        <div className="ds-table-responsive">
          <table className="ds-engineering-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Time</th>
                <th>Event</th>
                <th>Pduct (hPa)</th>
                <th>Pambient (hPa)</th>
                <th>ΔP (Pa)</th>
                <th>Audio</th>
                <th>Thermal</th>
                <th>Conf</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className={row.status === 'Leak Detected' ? 'ds-row-leak' : ''}>
                  <td className="ds-td-mono">{row.id}</td>
                  <td className="ds-td-mono">{row.timestamp}</td>
                  <td className="ds-td-bold">{row.event}</td>
                  <td className="ds-td-mono">{row.pduct.toFixed(1)}</td>
                  <td className="ds-td-mono">{row.pambient.toFixed(1)}</td>
                  <td className="ds-td-mono ds-td-highlight">+{row.deltaP.toFixed(1)}</td>
                  <td className="ds-td-mono">{row.audio.toFixed(2)}</td>
                  <td className="ds-td-mono">{row.thermal.toFixed(2)}</td>
                  <td className="ds-td-mono ds-td-bold">
                    {row.confidence > 0 ? `${(row.confidence * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td>
                    <StatusBadge status={row.status} size="small" />
                  </td>
                  <td>
                    <button className="ds-btn-action" onClick={() => setSelectedEvent(row)}>
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedEvent && (
        <div className="ds-modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="ds-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ds-modal-header">
              <h3 className="ds-modal-title">Event #{selectedEvent.id} · {selectedEvent.event}</h3>
              <button className="ds-btn-icon" onClick={() => setSelectedEvent(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="ds-modal-body">
              <div className="ds-modal-grid">
                <div className="ds-modal-item">
                  <span className="ds-modal-label">Status</span>
                  <StatusBadge status={selectedEvent.status} size="small" />
                </div>
                <div className="ds-modal-item">
                  <span className="ds-modal-label">Confidence</span>
                  <span className="ds-modal-value">{(selectedEvent.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="ds-modal-item">
                  <span className="ds-modal-label">Pduct / Pambient</span>
                  <span className="ds-modal-value">{selectedEvent.pduct.toFixed(1)} / {selectedEvent.pambient.toFixed(1)} hPa</span>
                </div>
                <div className="ds-modal-item">
                  <span className="ds-modal-label">Calibrated ΔP</span>
                  <span className="ds-modal-value ds-val-orange">+{selectedEvent.deltaP.toFixed(1)} Pa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
