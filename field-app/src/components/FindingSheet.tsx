// field-app/src/components/FindingSheet.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet for creating or editing a finding.
// Handles: finding type, photo capture/upload, notes, save, delete.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
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
  { type: 'SUSPECTED_LEAK', label: '⚠ SUSPECTED LEAK',  color: '#D88A19', desc: 'Possible leak — needs verification' },
  { type: 'CONFIRMED_LEAK', label: '● CONFIRMED LEAK',  color: '#B83A32', desc: 'Leak positively identified'           },
  { type: 'OBSERVATION',    label: '○ OTHER OBSERVATION', color: '#3F7655', desc: 'Note or general observation'        },
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
    if (!window.confirm('Delete this finding?')) return;
    await deleteFinding(init.finding_id);
    onClose();
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet">
        {/* Sheet handle */}
        <div className="sheet-handle" />

        <h2 className="sheet-title">
          {isNew ? 'NEW FINDING' : 'EDIT FINDING'}
        </h2>

        {/* Location confirmed indicator */}
        <div className="location-confirmed">
          📍 Location marked on plan
          {(pendingXY ?? (init && { x: init.x, y: init.y })) && (
            <span className="location-coords">
              {' '}({((pendingXY?.x ?? init!.x) * 100).toFixed(0)}%,{' '}
              {((pendingXY?.y ?? init!.y) * 100).toFixed(0)}%)
            </span>
          )}
        </div>

        {/* Finding type selection */}
        <p className="sheet-label">WHAT DID YOU FIND?</p>
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
              <button className="btn btn-secondary btn-sm" onClick={() => setPhoto(null)}>
                ✕ REMOVE
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => cameraInputRef.current?.click()}>
                ↺ RETAKE
              </button>
            </div>
          </div>
        ) : (
          <div className="photo-buttons">
            <button className="btn btn-secondary" onClick={() => cameraInputRef.current?.click()}>
              📷 TAKE PHOTO
            </button>
            <button className="btn btn-secondary" onClick={() => galleryInputRef.current?.click()}>
              🖼 UPLOAD PHOTO
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
            <button className="btn btn-danger" onClick={handleDelete}>
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
            {saving ? 'SAVING...' : 'SAVE FINDING'}
          </button>
        </div>
      </div>
    </>
  );
}
