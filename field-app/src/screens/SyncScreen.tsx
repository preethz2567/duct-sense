// field-app/src/screens/SyncScreen.tsx
import React, { useEffect, useState } from 'react';
import { useApp } from '../store/useAppStore';
import { getLocalFindings } from '../services/db';
import { attemptSync, countLocalFindings } from '../services/syncService';
import type { Finding } from '../types';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SyncScreen() {
  const { online, setPendingCount } = useApp();
  const [findings, setFindings]       = useState<Finding[]>([]);
  const [syncing, setSyncing]         = useState(false);
  const [syncResult, setSyncResult]   = useState<null | { synced: number; failed: number; mode: 'DEMO' | 'LIVE' }>(null);

  useEffect(() => {
    (async () => {
      const all = await getLocalFindings();
      setFindings(all);
      const pending = await countLocalFindings();
      setPendingCount(pending);
    })();
  }, [setPendingCount]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    const result = await attemptSync();
    setSyncResult(result);
    const pending = await countLocalFindings();
    setPendingCount(pending);
    const all = await getLocalFindings();
    setFindings(all);
    setSyncing(false);
  }

  const localCount   = findings.filter(f => f.sync_status === 'LOCAL').length;
  const queuedCount  = findings.filter(f => f.sync_status === 'QUEUED').length;
  const syncedCount  = findings.filter(f => f.sync_status === 'SYNCED').length;
  const failedCount  = findings.filter(f => f.sync_status === 'FAILED').length;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">SYNC</h1>
      </div>

      {/* Connection status card */}
      <div className={`sync-status-card ${online ? 'sync-online' : 'sync-offline'}`}>
        <div className="sync-status-icon">{online ? <Wifi size={24} /> : <WifiOff size={24} />}</div>
        <div>
          <div className="sync-status-title">
            {online ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="sync-status-sub">
            {online
              ? 'Network available — findings can be queued for sync'
              : 'No network — findings saved locally on device'}
          </div>
        </div>
      </div>



      {/* Counts */}
      <div className="sync-counts-grid">
        <div className="sync-count-box">
          <span className="count-num">{localCount}</span>
          <span className="count-lbl" style={{ color: '#667078' }}>LOCAL</span>
        </div>
        <div className="sync-count-box">
          <span className="count-num">{queuedCount}</span>
          <span className="count-lbl" style={{ color: '#D88A19' }}>QUEUED</span>
        </div>
        <div className="sync-count-box">
          <span className="count-num">{syncedCount}</span>
          <span className="count-lbl" style={{ color: '#3F7655' }}>SYNCED</span>
        </div>
        <div className="sync-count-box">
          <span className="count-num">{failedCount}</span>
          <span className="count-lbl" style={{ color: '#B83A32' }}>FAILED</span>
        </div>
      </div>

      {/* Sync action */}
      <button
        className="btn btn-primary btn-full"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={handleSync}
        disabled={syncing || !online}
      >
        {syncing ? <><RefreshCw size={16} className="spin" /> SYNCING...</> : online ? <><RefreshCw size={16} /> ATTEMPT SYNC</> : 'OFFLINE — SYNC UNAVAILABLE'}
      </button>

      {/* Sync result feedback */}
      {syncResult && (
        <div className={`sync-result ${syncResult.mode === 'DEMO' ? 'result-demo' : 'result-live'}`}>
          {syncResult.mode === 'DEMO' ? (
            <>
              <strong>SERVER UNREACHABLE</strong>
              <p>Could not connect to the backend server (http://{window.location.hostname}:8000).<br />
              Please ensure the server is running on the same network.</p>
            </>
          ) : (
            <>
              <strong><CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> SYNC COMPLETE</strong>
              <p>{syncResult.synced} synced · {syncResult.failed} failed</p>
            </>
          )}
        </div>
      )}

      {/* Findings list */}
      {findings.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 className="section-heading">ALL LOCAL FINDINGS</h2>
          {findings.map(f => (
            <div key={f.finding_id} className="sync-finding-row">
              <div>
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {f.finding_type.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 11, color: '#667078', marginLeft: 8 }}>
                  {f.inspection_id}
                </span>
              </div>
              <span className="sync-badge" style={{
                color: f.sync_status === 'SYNCED' ? '#3F7655'
                     : f.sync_status === 'FAILED'  ? '#B83A32'
                     : f.sync_status === 'QUEUED'  ? '#D88A19'
                     : '#667078'
              }}>
                {f.sync_status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
