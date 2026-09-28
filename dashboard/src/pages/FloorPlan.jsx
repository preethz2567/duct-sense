import React, { useState } from 'react';
import {
  Map,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { defaultLeakTarget } from '../services/mockDataService';
import StatusBadge from '../components/StatusBadge';

export default function FloorPlan({ selectedWalkthrough }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedLeak] = useState(defaultLeakTarget);

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(2.0, Math.max(0.8, prev + delta)));
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <h1 className="ds-page-title">Duct Inspection Map</h1>
        </div>
        <div className="ds-header-actions">
          <span className="ds-pill-tag ds-pill-navy">1.0 m Prototype Rig</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="ds-grid-floorplan">
        {/* Canvas */}
        <div className="ds-card ds-floorplan-viewport-card">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">Duct Plan (0.0 m – 1.0 m)</span>
            <div className="ds-zoom-btn-group">
              <button className="ds-btn-icon" onClick={() => handleZoom(0.15)} title="Zoom In"><ZoomIn size={14} /></button>
              <span className="ds-zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
              <button className="ds-btn-icon" onClick={() => handleZoom(-0.15)} title="Zoom Out"><ZoomOut size={14} /></button>
              <button className="ds-btn-icon" onClick={() => setZoomLevel(1)} title="Reset"><RotateCcw size={14} /></button>
            </div>
          </div>

          <div className="ds-floorplan-canvas-wrap">
            <div
              className="ds-floorplan-pan-container"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <svg viewBox="0 0 700 320" className="ds-floorplan-svg">
                <rect width="100%" height="100%" fill="#FBFBFD" />

                {/* Outer frame */}
                <rect x="40" y="40" width="620" height="240" rx="6" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Fan Unit */}
                <rect x="60" y="100" width="50" height="110" fill="#0000B3" rx="3" />
                <text x="85" y="160" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">FAN</text>

                {/* Duct Tube */}
                <rect x="110" y="115" width="500" height="80" fill="#E2E8F0" stroke="#0000B3" strokeWidth="2.5" />

                {/* Flanges */}
                <line x1="110" y1="105" x2="110" y2="205" stroke="#0000B3" strokeWidth="3" />
                <line x1="360" y1="105" x2="360" y2="205" stroke="#FF9C00" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="610" y1="105" x2="610" y2="205" stroke="#0000B3" strokeWidth="3" />

                {/* Pduct Tap @ 0.15 m */}
                <circle cx="185" cy="115" r="5" fill="#FF9C00" />
                <text x="185" y="100" fill="#0000B3" fontSize="9" fontWeight="bold" textAnchor="middle">Pduct Tap (0.15m)</text>

                {/* Detected Leak Pin @ 0.50 m */}
                <g transform="translate(360, 155)">
                  <circle cx="0" cy="0" r="16" fill="#FF9C00" opacity="0.35" />
                  <circle cx="0" cy="0" r="8" fill="#FF2200" stroke="#FFFFFF" strokeWidth="2" />
                  <rect x="-40" y="-34" width="80" height="18" fill="#000000" rx="3" />
                  <text x="0" y="-22" fill="#FF9C00" fontSize="9" fontWeight="bold" textAnchor="middle">
                    LEAK @ 0.50m
                  </text>
                </g>

                {/* Metric Scale */}
                <g transform="translate(110, 230)">
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#94A3B8" strokeWidth="1" />
                  <text x="0" y="14" fill="#64748B" fontSize="9">0.0 m</text>
                  <text x="250" y="14" fill="#FF9C00" fontSize="9" fontWeight="bold" textAnchor="middle">0.50 m (Port)</text>
                  <text x="500" y="14" fill="#64748B" fontSize="9" textAnchor="end">1.0 m</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT: High-Impact Target Details */}
        <div className="ds-col-right">
          <div className="ds-card ds-selected-leak-card">
            <div className="ds-card-header ds-card-header-clean">
              <h3 className="ds-card-title">Target Leak</h3>
              <StatusBadge status="LEAK_DETECTED" size="small" />
            </div>

            <div className="ds-key-metrics-stack">
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Location</span>
                <span className="ds-metric-val ds-val-navy">0.50 m (Port)</span>
              </div>
              <div className="ds-key-metric-row ds-row-highlight">
                <span className="ds-metric-key">Fusion Confidence</span>
                <span className="ds-metric-val ds-val-orange">86%</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Pressure Drop (ΔP)</span>
                <span className="ds-metric-val">+205.8 Pa</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Thermal Gradient (ΔT)</span>
                <span className="ds-metric-val">+9.3 °C</span>
              </div>
              <div className="ds-key-metric-row">
                <span className="ds-metric-key">Priority</span>
                <span className="ds-metric-val ds-badge-high">HIGH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
