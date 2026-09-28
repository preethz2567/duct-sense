// src/components/PhotoCaptureModal.jsx
import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, RotateCcw, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';

export default function PhotoCaptureModal({
  isOpen,
  onClose,
  session,
  photoType = 'DEFECT_INITIAL', // 'DEFECT_INITIAL' or 'REPAIR_SEAL'
  onSavePhoto,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoMeta, setPhotoMeta] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const currentSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];
  const isRepairPhoto = photoType === 'REPAIR_SEAL';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setPreviewUrl(url);
      setPhotoMeta({
        id: `photo-${Date.now()}`,
        type: photoType,
        label: isRepairPhoto ? 'Repair Verification Photo' : 'Field Defect Photo',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        inspectionId: session.id,
        sectionId: currentSection.id,
        planLocation: `${session.activeAnomaly?.positionM?.toFixed(2) || '0.50'} m from inlet flange`,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setPhotoMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!previewUrl || !photoMeta) return;
    onSavePhoto({
      ...photoMeta,
      url: previewUrl,
    });
    handleClear();
    onClose();
  };

  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div className="ds-modal-instrument" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="ds-modal-instrument-header">
          <div className="ds-modal-header-tag">
            <span className={isRepairPhoto ? 'ds-tag-green' : 'ds-tag-amber'}>
              {isRepairPhoto ? 'REPAIR PHOTO' : 'FIELD DEFECT PHOTO'}
            </span>
            <span className="ds-tag-mono">{currentSection.id} @ {session.activeAnomaly?.positionM?.toFixed(2) || '0.50'} m</span>
          </div>
          <button className="ds-btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ds-modal-instrument-body">
          <h2 style={{ fontSize: '16px', color: '#20252A', marginBottom: '8px' }}>
            {isRepairPhoto ? 'Attach Post-Repair Remediation Photo' : 'Attach Field Inspection Photo'}
          </h2>
          <p style={{ fontSize: '12px', color: '#667078', marginBottom: '16px' }}>
            Associate physical camera evidence with {session.id} · Section {currentSection.id} at plan location {session.activeAnomaly?.positionM?.toFixed(2) || '0.50'} m.
          </p>

          {/* Photo Preview or Capture Area */}
          {!previewUrl ? (
            <div className="ds-photo-capture-box">
              <ImageIcon size={36} color="#667078" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#20252A', marginBottom: '4px' }}>
                No photo attached yet
              </div>
              <div style={{ fontSize: '11px', color: '#667078', marginBottom: '16px' }}>
                Use device camera or upload image from local storage
              </div>

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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                <button
                  className="ds-btn ds-btn-primary"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={14} /> Take Photo
                </button>
                <button
                  className="ds-btn ds-btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Upload Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="ds-photo-preview-card">
              <div className="ds-photo-img-wrap">
                <img src={previewUrl} alt="Field Capture" className="ds-photo-preview-img" />
                <span className="ds-photo-badge-attached">PHOTO ATTACHED</span>
              </div>

              {/* Photo Metadata Box */}
              <div className="ds-photo-meta-grid">
                <div>
                  <span className="ds-photo-meta-k">INSPECTION:</span>
                  <span className="ds-photo-meta-v">{session.id}</span>
                </div>
                <div>
                  <span className="ds-photo-meta-k">SECTION:</span>
                  <span className="ds-photo-meta-v">{currentSection.id} ({currentSection.name})</span>
                </div>
                <div>
                  <span className="ds-photo-meta-k">PLAN LOCATION:</span>
                  <span className="ds-photo-meta-v">{photoMeta.planLocation}</span>
                </div>
                <div>
                  <span className="ds-photo-meta-k">TIMESTAMP:</span>
                  <span className="ds-photo-meta-v">{photoMeta.timestamp}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={handleClear}>
                  <RotateCcw size={12} /> Retake / Clear
                </button>
                <button className="ds-btn ds-btn-green ds-btn-compact" onClick={handleSave}>
                  <CheckCircle2 size={12} /> Save & Attach Photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
