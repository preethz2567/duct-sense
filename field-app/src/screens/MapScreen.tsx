// field-app/src/screens/MapScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Main field screen: shows the floor plan + annotation layer.
// Annotation layer is an SVG overlay — original image is NEVER modified.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../store/useAppStore';
import { getFindingsByInspection } from '../services/db';
import type { Finding, FindingType } from '../types';
import FindingSheet from '../components/FindingSheet';

import { MapPin, Plus, Maximize, Minus } from 'lucide-react';

const MARKER_COLOR: Record<FindingType, string> = {
  SUSPECTED_LEAK: '#D88A19',
  CONFIRMED_LEAK: '#B83A32',
  OBSERVATION:    '#3F7655',
};

export default function MapScreen() {
  const { activeInspection, activeFloorPlan, setActiveFloorPlan, floorPlans, setScreen } = useApp();

  const [findings, setFindings]       = useState<Finding[]>([]);
  const [zoom, setZoom]               = useState(1);
  const [placing, setPlacing]         = useState(false);   // tap-to-place mode
  const [pendingXY, setPendingXY]     = useState<{ x: number; y: number } | null>(null);
  const [sheetOpen, setSheetOpen]     = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [editMode, setEditMode]       = useState<'new' | 'edit'>('new');

  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadFindings = useCallback(async () => {
    if (!activeInspection) return;
    const found = await getFindingsByInspection(activeInspection.id);
    setFindings(found);
  }, [activeInspection]);

  useEffect(() => { loadFindings(); }, [loadFindings]);

  function handleImageTap(e: React.MouseEvent<HTMLDivElement>) {
    if (!placing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;
    const x = Math.max(0, Math.min(1, rawX));
    const y = Math.max(0, Math.min(1, rawY));
    setPendingXY({ x, y });
    setPlacing(false);
    setEditMode('new');
    setSelectedFinding(null);
    setSheetOpen(true);
  }

  function handleMarkerTap(finding: Finding, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedFinding(finding);
    setEditMode('edit');
    setSheetOpen(true);
  }

  function handleSheetClose() {
    setSheetOpen(false);
    setPendingXY(null);
    setSelectedFinding(null);
    loadFindings();
  }

  if (!activeInspection) {
    return (
      <div className="screen screen-centered">
        <p className="hint-text">No active inspection.</p>
        <button className="btn btn-primary" onClick={() => setScreen('INSPECTIONS')}>
          SELECT INSPECTION
        </button>
      </div>
    );
  }

  return (
    <div className="screen map-screen">
      {/* Header strip */}
      <div className="map-header">
        <div>
          <div className="map-insp-id">{activeInspection.id}</div>
          <div className="map-insp-meta">
            {activeInspection.building} · {activeInspection.level}
          </div>
        </div>

        {/* Floor plan selector */}
        {floorPlans.length > 1 && (
          <select
            className="fp-select"
            value={activeFloorPlan?.id ?? ''}
            onChange={e => {
              const fp = floorPlans.find(f => f.id === e.target.value);
              if (fp) setActiveFloorPlan(fp);
            }}
          >
            {floorPlans.map(fp => (
              <option key={fp.id} value={fp.id}>{fp.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={() => setZoom(z => Math.min(3, z + 0.25))}><Plus size={16} /></button>
        <button className="zoom-btn" onClick={() => setZoom(1)}><Maximize size={16} /></button>
        <button className="zoom-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><Minus size={16} /></button>
      </div>

      {/* Plan canvas */}
      {!activeFloorPlan ? (
        <div className="no-plan-box">
          <p>No floor plan available.</p>
          <p className="hint-text">
            Add image or PDF files to <code>/field-app/public/floor-plans/</code>
            {' '}and update <code>manifest.json</code>.
          </p>
        </div>
      ) : (
        <div
          ref={wrapRef}
          className={`plan-wrap ${placing ? 'placing' : ''}`}
          onClick={handleImageTap}
        >
          <div className="plan-inner" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {activeFloorPlan.type === 'image' ? (
              <img
                ref={imgRef}
                src={activeFloorPlan.url}
                alt="Floor plan"
                className="plan-img"
                draggable={false}
              />
            ) : (
              <div className="pdf-notice">
                <p>PDF plan: <strong>{activeFloorPlan.label}</strong></p>
                <p className="hint-text">PDF rendering requires a PDF.js integration.<br />
                  Place PNG/JPG exports for best mobile experience.</p>
              </div>
            )}

            {/* Annotation overlay — SVG on top of plan, pointer-events pass through to div */}
            {imgRef.current && (
              <svg
                className="annotation-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {findings.map(f => (
                  <g
                    key={f.finding_id}
                    transform={`translate(${f.x * 100}, ${f.y * 100})`}
                    onClick={(e) => handleMarkerTap(f, e as unknown as React.MouseEvent)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx="0" cy="0" r="3" fill={MARKER_COLOR[f.finding_type]} opacity={0.25} />
                    <circle cx="0" cy="0" r="1.5" fill={MARKER_COLOR[f.finding_type]} stroke="#FFFFFF" strokeWidth="0.2" />
                  </g>
                ))}

                {/* Pending placement preview */}
                {placing && (
                  <g transform="translate(50,50)">
                    <circle cx="0" cy="0" r="3" fill="#D88A19" opacity={0.3}
                      style={{ animation: 'pulse 1s infinite' }} />
                    <circle cx="0" cy="0" r="1.5" fill="#D88A19" opacity={0.8} />
                  </g>
                )}
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Mark Finding button */}
      {!placing && !sheetOpen && (
        <div className="fab-row">
          {findings.length > 0 && (
            <div className="finding-legend" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#D88A19', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={12} /> {findings.filter(f => f.finding_type === 'SUSPECTED_LEAK').length}</span>
              <span style={{ color: '#B83A32', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={12} fill="#B83A32" /> {findings.filter(f => f.finding_type === 'CONFIRMED_LEAK').length}</span>
              <span style={{ color: '#3F7655', display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={12} /> {findings.filter(f => f.finding_type === 'OBSERVATION').length}</span>
            </div>
          )}
          <button
            className="btn btn-primary btn-fab"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
            onClick={() => { setPlacing(true); }}
          >
            <Plus size={18} /> MARK FINDING
          </button>
        </div>
      )}

      {placing && (
        <div className="placing-hint">
          <span>Tap on the plan to place your finding marker</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPlacing(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* Finding bottom sheet */}
      {sheetOpen && (
        <FindingSheet
          mode={editMode}
          inspection={activeInspection}
          floorPlan={activeFloorPlan!}
          pendingXY={pendingXY}
          existingFinding={selectedFinding}
          onClose={handleSheetClose}
        />
      )}
    </div>
  );
}
