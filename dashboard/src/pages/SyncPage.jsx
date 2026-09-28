// src/pages/SyncPage.jsx
import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Cloud,
  Database,
  ArrowUpRight,
  Server,
} from 'lucide-react';

export default function SyncPage({ session, onTriggerSync }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleSyncClick = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      if (onTriggerSync) onTriggerSync();
      setTimeout(() => setSyncDone(false), 3000);
    }, 1200);
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">NETWORK & SYNCHRONIZATION</div>
          <h1 className="ds-page-title">INSPECTION DATA SYNC</h1>
        </div>

        <div className="ds-header-actions">
          <button
            className={`ds-btn ${isSyncing ? 'ds-btn-disabled' : 'ds-btn-primary'}`}
            onClick={handleSyncClick}
            disabled={isSyncing}
          >
            <RefreshCw size={13} className={isSyncing ? 'ds-spin-icon' : ''} />
            {isSyncing ? 'Synchronizing...' : 'Sync Now'}
          </button>
        </div>
      </header>

      {/* Sync Status Hero Card */}
      <div className="ds-card ds-sync-hero-card">
        <div className="ds-sync-status-row">
          <div className="ds-sync-icon-wrap">
            <Wifi size={24} color="#3F7655" />
          </div>
          <div>
            <div className="ds-sync-hero-title">
              {session.syncStatus === 'ONLINE_SYNCED' ? 'ONLINE · ALL CHANGES SYNCED' : 'CHANGES PENDING'}
            </div>
            <div className="ds-sync-hero-sub">
              FastAPI Central Sync Endpoint (http://localhost:8000) · 3-second heartbeat polling active
            </div>
          </div>
          <div className="ds-sync-badge-col">
            <span className="ds-pill-tag ds-pill-green">
              <CheckCircle2 size={12} /> UP TO DATE
            </span>
          </div>
        </div>

        {syncDone && (
          <div className="ds-sync-success-alert">
            <CheckCircle2 size={15} /> All session data, field photos, and defect records successfully synchronized with backend database.
          </div>
        )}
      </div>

      {/* Sync Queue & Architecture Cards Grid */}
      <div className="ds-grid-2col">
        {/* Left: Pending Queue Details */}
        <div className="ds-card ds-panel-card">
          <div className="ds-card-header ds-card-header-clean">
            <div className="ds-modality-title-wrap">
              <Database size={15} className="ds-icon-petrol" />
              <span className="ds-card-title">LOCAL SESSION SYNC QUEUE</span>
            </div>
            <span className="ds-pill-tag">Queue: 0 Pending</span>
          </div>

          <div className="ds-sync-queue-list">
            <div className="ds-queue-item">
              <div className="ds-queue-item-left">
                <span className="ds-sec-badge">INS-1042</span>
                <div>
                  <strong>Session Header & Facility Metadata</strong>
                  <div style={{ fontSize: '11px', color: '#667078' }}>North Campus Facility · AHU-02</div>
                </div>
              </div>
              <span className="ds-badge-green"><CheckCircle2 size={12} /> SYNCED</span>
            </div>

            <div className="ds-queue-item">
              <div className="ds-queue-item-left">
                <span className="ds-sec-badge">D-03</span>
                <div>
                  <strong>Defect Record & Multimodal Evidence</strong>
                  <div style={{ fontSize: '11px', color: '#667078' }}>Plan Pos: 0.50 m · Thermal, Pressure, Acoustic</div>
                </div>
              </div>
              <span className="ds-badge-green"><CheckCircle2 size={12} /> SYNCED</span>
            </div>

            <div className="ds-queue-item">
              <div className="ds-queue-item-left">
                <span className="ds-sec-badge">PHOTO</span>
                <div>
                  <strong>Field & Post-Repair Camera Captures</strong>
                  <div style={{ fontSize: '11px', color: '#667078' }}>2 Attached photos bound to INS-1042</div>
                </div>
              </div>
              <span className="ds-badge-green"><CheckCircle2 size={12} /> SYNCED</span>
            </div>
          </div>
        </div>

        {/* Right: Architecture & Offline Readiness */}
        <div className="ds-card ds-panel-card">
          <div className="ds-card-header ds-card-header-clean">
            <div className="ds-modality-title-wrap">
              <Server size={15} className="ds-icon-steel" />
              <span className="ds-card-title">OFFLINE-FIRST SYNCHRONIZATION</span>
            </div>
          </div>

          <div className="ds-offline-info-content">
            <p style={{ fontSize: '13px', color: '#20252A', lineHeight: '1.6', marginBottom: '12px' }}>
              The DuctSense data model stores all inspection actions, manual plan coordinates, attached field photos, and remediation logs locally in the browser/device session state.
            </p>
            <ul style={{ fontSize: '12px', color: '#667078', lineHeight: '1.6', paddingLeft: '18px' }}>
              <li>Automatic background synchronization when connection to FastAPI backend is live.</li>
              <li>Preserves all sensor fusion evidence and photo attachments during network drops.</li>
              <li>Ready for seamless sync to central facility management servers once inspection completes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
