import React, { useState } from 'react';
import { SEVERITY_CONFIG } from '../../data/leaksData';

export default function InspectionDrawer({
  selectedLeak,
  onClose,
  onDeleteLeak,
  onAcknowledgeLeak,
}) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  if (!selectedLeak) return null;

  const severityConfig = SEVERITY_CONFIG[selectedLeak.severity] || SEVERITY_CONFIG['No Leak'];

  return (
    <aside className="inspection-drawer open" aria-label="QA Inspection Panel">
      {/* Drawer Header */}
      <div className="drawer-header" style={{ borderLeftColor: severityConfig.borderColor }}>
        <div className="drawer-title-block">
          <div className="drawer-pre-title">QA INSPECTION PANEL</div>
          <h2 className="drawer-room-title">{selectedLeak.roomNumber}</h2>
        </div>
        <button
          type="button"
          className="btn-drawer-close"
          onClick={onClose}
          title="Close inspection panel"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Severity & Status Banner */}
      <div
        className="drawer-severity-strip"
        style={{
          backgroundColor: severityConfig.bgColor,
          borderColor: severityConfig.borderColor,
        }}
      >
        <div className="severity-badge-large" style={{ color: severityConfig.textColor }}>
          <span className="dot" style={{ backgroundColor: severityConfig.color }}></span>
          <span className="badge-text">{severityConfig.label} Severity</span>
        </div>
        <div className="fused-score-pill" style={{ color: severityConfig.textColor }}>
          <span>Fused:</span>
          <strong>{selectedLeak.fusedConfidence.toFixed(1)}%</strong>
        </div>
      </div>

      {/* Drawer Body Scrollable Content */}
      <div className="drawer-body">
        {/* Overall Fused Confidence Card */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Fused Overall Leak Confidence</span>
            <span className="metric-score" style={{ color: severityConfig.textColor }}>
              {selectedLeak.fusedConfidence.toFixed(1)}%
            </span>
          </div>
          <div className="confidence-track">
            <div
              className="confidence-fill"
              style={{
                width: `${Math.min(100, Math.max(0, selectedLeak.fusedConfidence))}%`,
                backgroundColor: severityConfig.color,
              }}
            ></div>
          </div>
          <div className="confidence-scale-labels">
            <span>0% (Safe)</span>
            <span>30%</span>
            <span>50%</span>
            <span>70%</span>
            <span>85%+ (Critical)</span>
          </div>
        </div>

        {/* Individual Sensor Breakdown (Thermal %, Pressure %, Audio %) */}
        <div className="section-block">
          <h3 className="section-heading">
            <span>📡</span> Individual Sensor Breakdown
          </h3>
          <div className="sensor-grid">
            {/* Thermal Sensor */}
            <div className="sensor-card sensor-thermal">
              <div className="sensor-top">
                <span className="sensor-icon">🌡️</span>
                <span className="sensor-name">Thermal Sensor</span>
                <span className="sensor-weight">40% wt</span>
              </div>
              <div className="sensor-val-row">
                <span className="sensor-percent">{selectedLeak.thermalConfidence}%</span>
                <span className="sensor-status-tag">
                  {selectedLeak.thermalConfidence >= 70 ? 'Hot Anomaly' : 'Nominal'}
                </span>
              </div>
              <div className="sensor-bar-track">
                <div
                  className="sensor-bar-fill thermal-fill"
                  style={{ width: `${selectedLeak.thermalConfidence}%` }}
                ></div>
              </div>
            </div>

            {/* Differential Pressure Sensor */}
            <div className="sensor-card sensor-pressure">
              <div className="sensor-top">
                <span className="sensor-icon">💨</span>
                <span className="sensor-name">Diff. Pressure</span>
                <span className="sensor-weight">30% wt</span>
              </div>
              <div className="sensor-val-row">
                <span className="sensor-percent">{selectedLeak.pressureConfidence}%</span>
                <span className="sensor-raw-val">{selectedLeak.pressureValuePa.toFixed(1)} Pa</span>
              </div>
              <div className="sensor-bar-track">
                <div
                  className="sensor-bar-fill pressure-fill"
                  style={{ width: `${selectedLeak.pressureConfidence}%` }}
                ></div>
              </div>
            </div>

            {/* Audio/Acoustic Sensor */}
            <div className="sensor-card sensor-audio">
              <div className="sensor-top">
                <span className="sensor-icon">🔊</span>
                <span className="sensor-name">Acoustic Sensor</span>
                <span className="sensor-weight">30% wt</span>
              </div>
              <div className="sensor-val-row">
                <span className="sensor-percent">{selectedLeak.audioConfidence}%</span>
                <span className="sensor-raw-val">{selectedLeak.audioValueDb.toFixed(1)} dB</span>
              </div>
              <div className="sensor-bar-track">
                <div
                  className="sensor-bar-fill audio-fill"
                  style={{ width: `${selectedLeak.audioConfidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Rendered Thermal Image Snapshot */}
        <div className="section-block">
          <div className="thermal-section-header">
            <h3 className="section-heading">
              <span>📷</span> Rendered Thermal Image Snapshot
            </h3>
            <button
              type="button"
              className="btn-expand-image"
              onClick={() => setIsImageExpanded(!isImageExpanded)}
              title="Toggle full thermal image view"
            >
              {isImageExpanded ? 'Collapse' : 'Expand ↗'}
            </button>
          </div>

          <div className={`thermal-snapshot-container ${isImageExpanded ? 'expanded' : ''}`}>
            {selectedLeak.thermalImagePath ? (
              <img
                src={selectedLeak.thermalImagePath}
                alt={`Thermal Scan for ${selectedLeak.roomNumber}`}
                className="thermal-snapshot-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/thermal/room_1851.jpg';
                }}
              />
            ) : (
              <div className="thermal-placeholder">
                <span>🌡️ Thermal Infrared Heatmap Generated</span>
              </div>
            )}
            <div className="thermal-overlay-badge">
              <span>FLIR IR · Ironbow Palette</span>
            </div>
          </div>
          <p className="thermal-caption">
            Captured infrared heat pattern displaying temperature plume at duct interface.
          </p>
        </div>

        {/* Precise Spatial Coordinates & Timestamp */}
        <div className="section-block">
          <h3 className="section-heading">
            <span>📍</span> Precise Spatial Coordinates & Metadata
          </h3>
          <div className="meta-list">
            <div className="meta-row">
              <span className="meta-label">Map Coordinates (%):</span>
              <span className="meta-value coordinate-pill">
                X: {selectedLeak.xPercent.toFixed(2)}% · Y: {selectedLeak.yPercent.toFixed(2)}%
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">SVG Anchor:</span>
              <span className="meta-value">
                ({Math.round((selectedLeak.xPercent / 100) * 1817)} px,{' '}
                {Math.round((selectedLeak.yPercent / 100) * 2255)} px)
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Timestamp:</span>
              <span className="meta-value">{selectedLeak.timestamp || '2026-09-28 14:32:00'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Assigned Node / Inspector:</span>
              <span className="meta-value">{selectedLeak.inspector || 'DuctSense Automated Rover'}</span>
            </div>
            {selectedLeak.notes && (
              <div className="meta-row notes-row">
                <span className="meta-label">Field Notes:</span>
                <span className="meta-value notes-text">{selectedLeak.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="drawer-footer">
        <button
          type="button"
          className="btn-drawer-action btn-ack"
          onClick={() => onAcknowledgeLeak && onAcknowledgeLeak(selectedLeak.id)}
          title="Mark inspection as reviewed / acknowledged"
        >
          <span>✓ Acknowledge QA</span>
        </button>
        {onDeleteLeak && (
          <button
            type="button"
            className="btn-drawer-action btn-delete"
            onClick={() => onDeleteLeak(selectedLeak.id)}
            title="Delete this pin annotation"
          >
            <span>🗑 Delete Pin</span>
          </button>
        )}
      </div>
    </aside>
  );
}
