// src/components/Sidebar.jsx
import React from 'react';
import {
  ClipboardList,
  Map,
  Layers,
  FileText,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  Activity,
} from 'lucide-react';

const PRIMARY_NAV = [
  { id: 'inspections', label: 'INSPECTIONS', icon: ClipboardList },
  { id: 'map', label: 'MAP', icon: Map },
  { id: 'evidence', label: 'EVIDENCE', icon: Layers },
  { id: 'reports', label: 'REPORTS', icon: FileText },
  { id: 'sync', label: 'SYNC', icon: RefreshCw },
];

const SECONDARY_NAV = [
  { id: 'spatial', label: 'SPATIAL VIEWER', icon: Map },
  { id: 'engineering', label: 'DEVICE / ENGINEERING', icon: Cpu },
  { id: 'thermal-ml-test', label: 'THERMAL ML TEST', icon: Activity },
  { id: 'pressure-test', label: 'PRESSURE TEST', icon: Activity },
  { id: 'multimodal-evidence', label: 'MULTIMODAL EVIDENCE', icon: Layers },
];

export default function Sidebar({ activePage, onNavigate, session }) {
  const isSim = session?.operatingMode === 'SIMULATION';
  const isOnline = session?.syncStatus === 'ONLINE_SYNCED';

  return (
    <aside className="ds-sidebar">
      {/* Brand Header */}
      <div className="ds-sidebar-brand" onClick={() => onNavigate('inspections')} style={{ cursor: 'pointer' }}>
        <div className="ds-brand-logo-wrap">
          <div className="ds-brand-mark">DS</div>
          <div>
            <div className="ds-brand-title">DUCTSENSE</div>
            <div className="ds-brand-subtitle">Commissioning System</div>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="ds-sidebar-nav">
        <div className="ds-nav-group">
          <div className="ds-nav-group-title">MAIN WORKFLOW</div>
          <div className="ds-nav-group-items">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`ds-nav-item ${isActive ? 'ds-nav-item--active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={16} className="ds-nav-icon" />
                  <span className="ds-nav-label">{item.label}</span>
                  {isActive && <div className="ds-nav-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Engineering Menu */}
        <div className="ds-nav-group" style={{ marginTop: '24px' }}>
          <div className="ds-nav-group-title">SECONDARY</div>
          <div className="ds-nav-group-items">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`ds-nav-item ds-nav-item-secondary ${isActive ? 'ds-nav-item--active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={15} className="ds-nav-icon" />
                  <span className="ds-nav-label">{item.label}</span>
                  {isActive && <div className="ds-nav-indicator" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Technician Inspection Context Footer */}
      <div className="ds-sidebar-footer">
        <div className="ds-footer-inspection-info">
          <div className="ds-footer-sec-title">ACTIVE INSPECTION</div>
          <div className="ds-footer-sec-val">
            <span className="ds-sec-id">{session.id}</span>
            <span className="ds-sec-badge">IN PROGRESS</span>
          </div>
          <div style={{ fontSize: '11px', color: '#667078', marginTop: '4px' }}>
            Section {session.activeSectionId} · 1.0 m POC Rig
          </div>
        </div>

        {/* Simple Sync Status Indicator */}
        <div className="ds-footer-sync-strip" onClick={() => onNavigate('sync')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`ds-sync-dot ${isOnline ? 'ds-sync-dot-green' : 'ds-sync-dot-amber'}`} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#20252A' }}>
              {isOnline ? 'ONLINE · SYNCED' : 'CHANGES PENDING'}
            </span>
          </div>
          <Wifi size={12} color={isOnline ? '#3F7655' : '#D88A19'} />
        </div>

        <div className="ds-footer-mode-tag" style={{ 
          backgroundColor: session.systemStatus === 'LEAK DETECTED' ? 'var(--ds-state-red)' : 'var(--ds-structure-primary)',
          color: '#FFF'
        }}>
          <Radio size={12} />
          <span>SYSTEM STATUS {session.systemStatus ? `— ${session.systemStatus}` : ''}</span>
        </div>
      </div>
    </aside>
  );
}
