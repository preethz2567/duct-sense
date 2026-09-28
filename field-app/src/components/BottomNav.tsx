import React from 'react';
import { ClipboardList, Map as MapIcon, MapPin, RefreshCw } from 'lucide-react';
import { useApp, Screen } from '../store/useAppStore';

const TABS: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: 'INSPECTIONS', label: 'Inspections', icon: <ClipboardList size={22} /> },
  { id: 'MAP',         label: 'Map',         icon: <MapIcon size={22} /> },
  { id: 'FINDINGS',    label: 'Findings',    icon: <MapPin size={22} /> },
  { id: 'SYNC',        label: 'Sync',        icon: <RefreshCw size={22} /> },
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
