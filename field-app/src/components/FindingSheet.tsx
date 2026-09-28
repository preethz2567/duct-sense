// field-app/src/components/FindingSheet.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet for creating or editing a finding.
// Handles: finding type, photo capture/upload, notes, save, delete.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, MapPin, X, RotateCw } from 'lucide-react';
import { upsertFinding, deleteFinding } from '../services/db';
import { queueFinding } from '../services/syncService';
import type { Finding, FindingType, Inspection, FloorPlan } from '../types';

interface Props {
  mode: 'new' | 'edit';
  inspection: Inspection;
  floorPlan: FloorPlan;
  pendingXY: { x: number; y: number } | null;
  existingFinding: Finding | null;
  onClose: () => void;
}

function uuid(): string {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const TYPE_OPTIONS: { type: FindingType; label: string; color: string; desc: string }[] = [
  { type: 'SUSPECTED_LEAK', label: 'SUSPECTED LEAK',  color: '#D88A19', desc: 'Possible leak' },
  { type: 'CONFIRMED_LEAK', label: 'CONFIRMED LEAK',  color: '#B83A32', desc: 'Leak identified' },
  { type: 'OBSERVATION',    label: 'OTHER OBSERVATION', color: '#3F7655', desc: 'Note/Observation' },
];

export default function FindingSheet({
  mode, inspection, floorPlan, pendingXY, existingFinding, onClose,
}: Props) {
  const isNew = mode === 'new';
  const init = existingFinding;

  const [findingType, setFindingType] = useState<FindingType>(
    init?.finding_type ?? 'SUSPECTED_LEAK'
  );
  const [notes, setNotes] = useState<string>(init?.notes ?? '');
  const [photo, setPhoto] = useState<string | null>(init?.photo ?? null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    const xy = pendingXY ?? (init ? { x: init.x, y: init.y } : null);
    if (!xy) return;

    setSaving(true);
    const now = new Date().toISOString();
    const finding: Finding = {
      finding_id:     init?.finding_id ?? uuid(),
      inspection_id:  inspection.id,
      floor_plan_id:  floorPlan.id,
      floor_plan_page: 1,
      finding_type:   findingType,
      x: xy.x,
      y: xy.y,
      created_at:     init?.created_at ?? now,
      updated_at:     now,
      photo,
      notes,
      status:         'OPEN',
      sync_status:    'LOCAL',
    };

    await queueFinding(finding);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!init) return;
    await deleteFinding(init.finding_id);
    onClose();
  }

  if (confirmDelete) {
    return (
      <>
        <div className="sheet-backdrop" onClick={onClose} />
        <div className="bottom-sheet" style={{ padding: '24px 16px' }}>
          <h2 className="sheet-title" style={{ color: '#B83A32' }}>DELETE FINDING?</h2>
          <p style={{ fontSize: '14px', color: '#667078', marginBottom: '24px' }}>
            This finding and its attached photo will be removed from this inspection.
          </p>
          <div className="sheet-actions" style={{ flexDirection: 'column' }}>
            <button className="btn btn-danger btn-full" onClick={handleDelete} style={{ marginBottom: '12px' }}>
              DELETE FINDING
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => setConfirmDelete(false)}>
              CANCEL
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        {/* Sheet handle */}
        <div className="sheet-handle" />

        <h2 className="sheet-title">
          {isNew ? 'NEW FINDING' : 'FINDING'}
        </h2>

        {/* Location confirmed indicator */}
        <div className="location-confirmed" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="#667078" /> Location marked on plan
          {(pendingXY ?? (init && { x: init.x, y: init.y })) && (
            <span className="location-coords">
              {' '}({((pendingXY?.x ?? init!.x) * 100).toFixed(0)}%,{' '}
              {((pendingXY?.y ?? init!.y) * 100).toFixed(0)}%)
            </span>
          )}
        </div>

        {/* Finding type selection */}
        <p className="sheet-label">{isNew ? 'WHAT DID YOU FIND?' : 'TYPE'}</p>
        <div className="type-options">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.type}
              className={`type-btn ${findingType === opt.type ? 'type-btn-active' : ''}`}
              style={findingType === opt.type ? { borderColor: opt.color, color: opt.color } : {}}
              onClick={() => setFindingType(opt.type)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Photo section */}
        <p className="sheet-label">PHOTO</p>
        {photo ? (
          <div className="photo-preview-wrap">
            <img src={photo} alt="Finding" className="photo-preview" />
            <div className="photo-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setPhoto(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <X size={14} /> REMOVE
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => cameraInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCw size={14} /> RETAKE
              </button>
            </div>
          </div>
        ) : (
          <div className="photo-buttons">
            <button className="btn btn-secondary" onClick={() => cameraInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Camera size={16} /> TAKE PHOTO
            </button>
            <button className="btn btn-secondary" onClick={() => galleryInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <ImageIcon size={16} /> UPLOAD PHOTO
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Notes */}
        <p className="sheet-label">NOTE (optional)</p>
        <textarea
          className="notes-input"
          placeholder="Brief description or reference..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
        />

        {/* Actions */}
        <div className="sheet-actions">
          {!isNew && (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              DELETE
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            CANCEL
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'SAVING...' : (isNew ? 'SAVE FINDING' : 'UPDATE FINDING')}
          </button>
        </div>
      </div>
    </>
  );
}
