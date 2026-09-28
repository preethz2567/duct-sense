import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../store/useAppStore';

export default function StatusBar() {
  const { online, pendingCount, activeInspection } = useApp();

  return (
    <div className="status-bar">
      <div className="status-bar-brand">
        DuctSense
        <span className="brand-sub">FIELD</span>
      </div>
      <div className="status-bar-right">
        {activeInspection && (
          <span className="status-insp-id">{activeInspection.id}</span>
        )}
        <div className={`status-pill ${online ? 'pill-online' : 'pill-offline'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          {online ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
}
