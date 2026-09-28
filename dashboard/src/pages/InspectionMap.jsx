import React, { useState } from 'react';
import {
  Map,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Crosshair,
} from 'lucide-react';
import { floorPlanDucts, floorPlanRooms } from '../services/mockDataService';

export default function InspectionMap({
  session,
  onStartWalkthrough,
  onOpenWorkflow,
}) {
  const [mapMode, setMapMode] = useState('POC_RIG'); // 'POC_RIG' or 'FACILITY_BLUEPRINT'
  const [zoomLevel, setZoomLevel] = useState(1);
  const activeSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(2.0, Math.max(0.7, prev + delta)));
  };

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">SPATIAL POSITIONING</div>
          <h1 className="ds-page-title">INSPECTION MAP</h1>
        </div>

        <div className="ds-header-actions">
          {/* View Mode Toggle */}
          <div className="ds-mode-pill-group">
            <button
              className={`ds-mode-pill ${mapMode === 'POC_RIG' ? 'ds-mode-pill--sim' : ''}`}
              onClick={() => setMapMode('POC_RIG')}
            >
              1.0 m POC Rig Plan
            </button>
            <button
              className={`ds-mode-pill ${mapMode === 'FACILITY_BLUEPRINT' ? 'ds-mode-pill--live' : ''}`}
              onClick={() => setMapMode('FACILITY_BLUEPRINT')}
            >
              Facility Blueprint
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Left 2D CAD Canvas (65%), Right Current Section Control (35%) */}
      <div className="ds-grid-floorplan">
        {/* Left: 2D Engineering Plan */}
        <div className="ds-card ds-floorplan-viewport-card">
          <div className="ds-viewport-top-bar">
            <span className="ds-vp-title">
              {mapMode === 'POC_RIG' ? 'POC Duct Rig Schematic · Section D-03' : 'Level 2 Ductwork Network Blueprint'}
            </span>
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
              {mapMode === 'POC_RIG' ? (
                /* 1-Metre Aluminium POC Duct Rig Drawing */
                <svg viewBox="0 0 700 340" className="ds-floorplan-svg">
                  <defs>
                    <pattern id="engGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                    </pattern>
                  </defs>

                  <rect width="100%" height="100%" fill="#F8FAFC" />
                  <rect width="100%" height="100%" fill="url(#engGrid)" opacity="0.6" />

                  {/* Outer Test Rig Frame */}
                  <rect x="30" y="30" width="640" height="280" fill="none" stroke="#CDD0CE" strokeWidth="1.5" strokeDasharray="6 3" />
                  <text x="45" y="52" fill="#667078" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif">
                    PHYSICAL RIG: 1000 mm × 100 mm (4" AL DUCT)
                  </text>

                  {/* Blower Fan Unit @ 0.0 m */}
                  <rect x="50" y="110" width="60" height="120" fill="#20252A" stroke="#344B5E" strokeWidth="2" rx="2" />
                  <text x="80" y="175" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">BLOWER</text>

                  {/* Duct Body */}
                  <rect x="110" y="125" width="500" height="90" fill="#E9E8E2" stroke="#344B5E" strokeWidth="2" />

                  {/* Flange Joints */}
                  <line x1="110" y1="115" x2="110" y2="225" stroke="#20252A" strokeWidth="3" />
                  <line x1="360" y1="115" x2="360" y2="225" stroke="#D88A19" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="610" y1="115" x2="610" y2="225" stroke="#20252A" strokeWidth="3" />

                  {/* Flow Arrow */}
                  <path d="M 130 170 L 165 170 M 155 163 L 167 170 L 155 177" stroke="#176B73" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <text x="175" y="174" fill="#176B73" fontSize="10" fontWeight="bold">AIRFLOW</text>

                  {/* Pduct Tap @ 0.15 m */}
                  <circle cx="185" cy="125" r="5" fill="#176B73" />
                  <text x="185" y="110" fill="#176B73" fontSize="9" fontWeight="bold" textAnchor="middle">Pduct Tap (0.15 m)</text>

                  {/* Confirmed / Suspected Leak Marker @ 0.50 m */}
                  <g
                    transform="translate(360, 170)"
                    style={{ cursor: 'pointer' }}
                    onClick={onOpenWorkflow}
                  >
                    <circle cx="0" cy="0" r="16" fill="#B83A32" opacity="0.25">
                      <animate attributeName="r" values="12;20;12" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="8" fill="#B83A32" stroke="#FFFFFF" strokeWidth="2" />
                    <rect x="-42" y="-36" width="84" height="20" fill="#20252A" rx="3" stroke="#B83A32" strokeWidth="1" />
                    <text x="0" y="-23" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                      LEAK @ 0.50 m
                    </text>
                  </g>

                  {/* Technician Current Location Marker */}
                  <g transform="translate(320, 240)">
                    <circle cx="0" cy="0" r="6" fill="#D88A19" />
                    <text x="12" y="4" fill="#D88A19" fontSize="9" fontWeight="bold">YOU ARE HERE (0.42 m)</text>
                  </g>

                  {/* Dimension Line (0.0 m – 1.0 m) */}
                  <g transform="translate(110, 260)">
                    <line x1="0" y1="0" x2="500" y2="0" stroke="#667078" strokeWidth="1.5" />
                    <line x1="0" y1="-4" x2="0" y2="4" stroke="#667078" strokeWidth="1.5" />
                    <text x="0" y="16" fill="#667078" fontSize="9">0.0 m</text>
                    <line x1="250" y1="-4" x2="250" y2="4" stroke="#D88A19" strokeWidth="2" />
                    <text x="250" y="16" fill="#D88A19" fontSize="9" fontWeight="bold" textAnchor="middle">0.50 m (Test Port)</text>
                    <line x1="500" y1="-4" x2="500" y2="4" stroke="#667078" strokeWidth="1.5" />
                    <text x="500" y="16" fill="#667078" fontSize="9" textAnchor="end">1.0 m</text>
                  </g>
                </svg>
              ) : (
                /* Facility Blueprint View */
                <svg viewBox="0 0 700 360" className="ds-floorplan-svg">
                  <rect width="100%" height="100%" fill="#F8FAFC" />
                  <rect x="20" y="20" width="660" height="320" fill="none" stroke="#20252A" strokeWidth="2" />

                  {floorPlanRooms.map((r) => (
                    <g key={r.id}>
                      <rect x={r.x} y={r.y} width={r.width} height={r.height} fill="#E9E8E2" stroke="#CDD0CE" strokeWidth="1" />
                      <text x={r.x + 8} y={r.y + 18} fill="#20252A" fontSize="9" fontWeight="bold">{r.id}</text>
                    </g>
                  ))}

                  {floorPlanDucts.map((d) => {
                    const isCurrent = d.id === 'D-03';
                    return (
                      <g key={d.id}>
                        <line
                          x1={d.start[0]}
                          y1={d.start[1]}
                          x2={d.end[0]}
                          y2={d.end[1]}
                          stroke={isCurrent ? '#D88A19' : '#176B73'}
                          strokeWidth={isCurrent ? 8 : 5}
                        />
                        <text
                          x={(d.start[0] + d.end[0]) / 2}
                          y={(d.start[1] + d.end[1]) / 2 - 4}
                          fill="#20252A"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {d.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Section Inspector Panel */}
        <div className="ds-col-right">
          <div className="ds-card ds-section-inspector-card">
            <div className="ds-kicker-label">CURRENT SECTION</div>
            <h2 className="ds-inspector-title">Section {activeSection.id}</h2>
            <div className="ds-inspector-sub">AHU-02 → Server Room Supply Branch</div>

            <div className="ds-inspector-metrics-stack">
              <div className="ds-metric-kv">
                <span className="ds-kv-key">Status</span>
                <span className="ds-badge-amber">IN INSPECTION</span>
              </div>
              <div className="ds-metric-kv">
                <span className="ds-kv-key">Section Length</span>
                <span className="ds-kv-val">{activeSection.lengthM.toFixed(1)} m</span>
              </div>
              <div className="ds-metric-kv">
                <span className="ds-kv-key">Known Target</span>
                <span className="ds-kv-val">Controlled Port @ 0.50 m</span>
              </div>
              <div className="ds-metric-kv ds-kv-highlight">
                <span className="ds-kv-key">Defect Status</span>
                <span className="ds-badge-red">CONFIRMED LEAK</span>
              </div>
            </div>

            <div className="ds-inspector-action-block">
              <button className="ds-btn ds-btn-amber ds-btn-full" onClick={onStartWalkthrough}>
                <Play size={14} /> Start Walkthrough Inspection
              </button>

              <button className="ds-btn ds-btn-secondary ds-btn-full" onClick={onOpenWorkflow}>
                <Sliders size={13} /> Open Defect Verification & Repair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
