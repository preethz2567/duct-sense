// field-app/src/components/BottomNav.tsx
import React from 'react';
import { useApp, Screen } from '../store/useAppStore';

const TABS: { id: Screen; label: string; icon: string }[] = [
  { id: 'INSPECTIONS', label: 'Inspections', icon: '📋' },
  { id: 'MAP',         label: 'Map',         icon: '🗺️' },
  { id: 'FINDINGS',    label: 'Findings',    icon: '📍' },
  { id: 'SYNC',        label: 'Sync',        icon: '🔄' },
];

export default function BottomNav() {
  const { screen, setScreen } = useApp();
  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`bottom-nav-tab ${screen === tab.id ? 'active' : ''}`}
          onClick={() => setScreen(tab.id)}
          aria-label={tab.label}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
