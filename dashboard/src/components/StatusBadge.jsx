import React from 'react';

export const STATUS_CONFIG = {
  NORMAL: { label: 'NORMAL', class: 'badge-status-normal', icon: '●' },
  WARNING: { label: 'WARNING', class: 'badge-status-warning', icon: '▲' },
  LEAK_SUSPECTED: { label: 'LEAK SUSPECTED', class: 'badge-status-suspected', icon: '▲' },
  LEAK_DETECTED: { label: 'LEAK DETECTED', class: 'badge-status-danger', icon: '■' },
  RESOLVED: { label: 'RESOLVED', class: 'badge-status-resolved', icon: '✓' },
  CALIBRATING: { label: 'CALIBRATING', class: 'badge-status-calibrating', icon: '◌' },
  SENSOR_ERROR: { label: 'SENSOR ERROR', class: 'badge-status-error', icon: '✕' },
  DISCONNECTED: { label: 'DISCONNECTED', class: 'badge-status-disconnected', icon: '○' },
};

export default function StatusBadge({ status = 'NORMAL', size = 'medium', showIcon = true }) {
  const normalizedKey = (status || 'NORMAL').toUpperCase().replace(/\s+/g, '_');
  const cfg = STATUS_CONFIG[normalizedKey] || {
    label: status,
    class: 'badge-status-default',
    icon: '●',
  };

  return (
    <span className={`status-badge ${cfg.class} status-badge-${size}`}>
      {showIcon && <span className="status-badge-icon">{cfg.icon}</span>}
      <span className="status-badge-label">{cfg.label}</span>
    </span>
  );
}
