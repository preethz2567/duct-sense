// field-app/src/components/StatusBar.tsx
import React from 'react';
import { useApp } from '../store/useAppStore';

export default function StatusBar() {
  const { online, pendingCount, activeInspection } = useApp();

  return (
    <div className="status-bar">
      <span className="status-bar-brand">DuctSense Field</span>
      <div className="status-bar-right">
        {activeInspection && (
          <span className="status-insp-id">{activeInspection.id}</span>
        )}
        <div className={`status-pill ${online ? 'pill-online' : 'pill-offline'}`}>
          {online ? (
            pendingCount > 0
              ? `⏳ ${pendingCount} pending`
              : '● ONLINE'
          ) : (
            pendingCount > 0
              ? `✈ OFFLINE · ${pendingCount} saved`
              : '✈ OFFLINE'
          )}
        </div>
      </div>
    </div>
  );
}
