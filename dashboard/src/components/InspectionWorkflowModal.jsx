// src/components/InspectionWorkflowModal.jsx
import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Wrench,
  RotateCcw,
  ShieldCheck,
  X,
  ArrowRight,
  Gauge,
  Thermometer,
  Mic,
  Camera,
  MapPin,
} from 'lucide-react';

export default function InspectionWorkflowModal({
  isOpen,
  onClose,
  session,
  onUpdateAnomaly,
  onSectionComplete,
  onOpenPhotoCapture,
}) {
  const [step, setStep] = useState('ATTENTION'); // 'ATTENTION', 'REPAIR', 'RESCAN_VERIFY'
  const [repairAction, setRepairAction] = useState('Joint resealed with mastic and clamp tightened');
  const [selectedRepairOption, setSelectedRepairOption] = useState('Joint resealed');

  if (!isOpen || !session || !session.activeAnomaly) return null;

  const activeAnomaly = session.activeAnomaly;
  const currentSection = session.sections?.find((s) => s.id === session.activeSectionId) || session.sections?.[2] || { id: 'D-03', name: 'Server Room Supply' };

  const positionM = activeAnomaly.positionM || 0.50;
  const repair = activeAnomaly.repair || {};
  const hasFieldPhoto = activeAnomaly.fieldPhotos && activeAnomaly.fieldPhotos.length > 0;
  const hasRepairPhoto = repair?.repairPhotos && repair.repairPhotos.length > 0;

  const handleConfirmLeak = () => {
    onUpdateAnomaly({
      ...activeAnomaly,
      status: 'CONFIRMED',
    });
    setStep('REPAIR');
  };

  const handleDismiss = () => {
    onUpdateAnomaly({
      ...activeAnomaly,
      status: 'DISMISSED',
    });
    onClose();
  };

  const handleExecuteRescan = () => {
    onUpdateAnomaly({
      ...activeAnomaly,
      status: 'REPAIRED',
      repair: {
        ...activeAnomaly.repair,
        action: `${selectedRepairOption}: ${repairAction}`,
        repairedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        rescanCompleted: true,
      },
    });
    setStep('RESCAN_VERIFY');
  };

  const handleCompleteVerification = () => {
    onUpdateAnomaly({
      ...activeAnomaly,
      status: 'VERIFIED',
      repair: {
        ...activeAnomaly.repair,
        verified: true,
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        verificationResult: 'PASS',
      },
    });
    if (onSectionComplete) onSectionComplete(currentSection.id);
    onClose();
  };

  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div className="ds-modal-instrument" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ds-modal-instrument-header">
          <div className="ds-modal-header-tag">
            <span className={step === 'RESCAN_VERIFY' ? 'ds-tag-green' : 'ds-tag-amber'}>
              WORKFLOW STEP: {step}
            </span>
            <span className="ds-tag-mono">{currentSection.id} @ {positionM.toFixed(2)} m</span>
          </div>
          <button className="ds-btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* STEP 1: ATTENTION / DEFECT REVIEW & CONFIRMATION */}
        {step === 'ATTENTION' && (
          <div className="ds-modal-instrument-body">
            <div className="ds-attention-banner">
              <AlertTriangle size={20} className="ds-icon-amber" />
              <div>
                <div className="ds-attention-title">POSSIBLE LEAK DETECTED</div>
                <div className="ds-attention-sub">
                  Section {currentSection.id} · Joint 03 · Plan Location: {positionM.toFixed(2)} m from inlet flange
                </div>
              </div>
            </div>

            {/* Multimodal Agreement Strip */}
            <div className="ds-agreement-strip">
              <div className="ds-agreement-metric">
                <span className="ds-ag-label">Pressure (BMP280)</span>
                <span className="ds-ag-val ds-val-amber">Drop (+205.8 Pa)</span>
              </div>
              <div className="ds-agreement-metric">
                <span className="ds-ag-label">Thermal (FLIR)</span>
                <span className="ds-ag-val ds-val-amber">Hotspot (ΔT +9.3 °C)</span>
              </div>
              <div className="ds-agreement-metric">
                <span className="ds-ag-label">Acoustic (INMP441)</span>
                <span className="ds-ag-val ds-val-amber">Turbulence (0.74)</span>
              </div>
            </div>

            {/* Field Photo Attachment Row */}
            <div className="ds-photo-attach-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} className="ds-icon-petrol" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#20252A' }}>
                  {hasFieldPhoto ? 'Field Photo Attached' : 'Field Inspection Photo Required'}
                </span>
              </div>
              <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={onOpenPhotoCapture}>
                <Camera size={12} /> {hasFieldPhoto ? 'Change Photo' : 'Attach Photo'}
              </button>
            </div>

            <div className="ds-modal-actions-bar">
              <button className="ds-btn ds-btn-secondary" onClick={handleDismiss}>
                Dismiss Anomaly
              </button>
              <button className="ds-btn ds-btn-red" onClick={handleConfirmLeak}>
                <AlertTriangle size={13} /> Confirm Leak Event & Proceed to Repair
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REPAIR REQUIRED */}
        {step === 'REPAIR' && (
          <div className="ds-modal-instrument-body">
            <div className="ds-kicker-label">REMEDIATION WORKFLOW</div>
            <h2 className="ds-modal-title">Record Corrective Repair Action</h2>
            <p className="ds-modal-desc" style={{ fontSize: '12px', color: '#667078', marginBottom: '12px' }}>
              Select remediation applied at {currentSection.id} (Plan Pos: {positionM.toFixed(2)} m).
            </p>

            {/* Repair Option Selectors */}
            <div className="ds-repair-options-grid">
              {[
                'Joint resealed',
                'Clamp adjusted',
                'Seal replaced',
                'Flange tightened',
              ].map((opt) => (
                <button
                  key={opt}
                  className={`ds-repair-opt-btn ${selectedRepairOption === opt ? 'ds-repair-opt--active' : ''}`}
                  onClick={() => setSelectedRepairOption(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="ds-input-group">
              <label className="ds-input-label">Remediation Details / Notes:</label>
              <input
                type="text"
                className="ds-input-text"
                value={repairAction}
                onChange={(e) => setRepairAction(e.target.value)}
                placeholder="e.g. Applied silicone sealant and torqued band clamp"
              />
            </div>

            {/* Repair Photo Attachment */}
            <div className="ds-photo-attach-row" style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} className="ds-icon-petrol" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#20252A' }}>
                  {hasRepairPhoto ? 'Repair Photo Attached' : 'Attach Post-Repair Photo'}
                </span>
              </div>
              <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={onOpenPhotoCapture}>
                <Camera size={12} /> {hasRepairPhoto ? 'Change Photo' : 'Attach Photo'}
              </button>
            </div>

            <div className="ds-modal-actions-bar">
              <button className="ds-btn ds-btn-secondary" onClick={() => setStep('ATTENTION')}>
                Back
              </button>
              <button className="ds-btn ds-btn-amber" onClick={handleExecuteRescan}>
                <Wrench size={13} /> Save Repair & Trigger Rescan
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RESCAN & BEFORE/AFTER VERIFICATION */}
        {step === 'RESCAN_VERIFY' && (
          <div className="ds-modal-instrument-body">
            <div className="ds-verification-pass-banner">
              <CheckCircle2 size={22} className="ds-icon-green" />
              <div>
                <div className="ds-pass-title">RESCAN COMPLETE · VERIFIED NOMINAL</div>
                <div className="ds-pass-sub">
                  Post-repair baseline restored. All sensor modalities confirm joint integrity.
                </div>
              </div>
            </div>

            {/* Before vs After Comparison */}
            <div className="ds-before-after-grid" style={{ margin: '16px 0' }}>
              <div className="ds-ba-box ds-ba-before">
                <span className="ds-ba-label">1. INITIAL LEAK READINGS</span>
                <div>ΔP Differential: <strong>+205.8 Pa (Below nominal)</strong></div>
                <div>Thermal Hotspot: <strong>Score 0.86 (ΔT +9.3 °C)</strong></div>
                <div>Acoustic Hiss: <strong>Score 0.74 (Audible)</strong></div>
              </div>
              <div className="ds-ba-box ds-ba-after">
                <span className="ds-ba-label">2. POST-REPAIR RESCAN</span>
                <div>ΔP Differential: <strong className="ds-val-green">+254.2 Pa (Nominal)</strong></div>
                <div>Thermal Hotspot: <strong className="ds-val-green">Score 0.18 (Neutral)</strong></div>
                <div>Acoustic Hiss: <strong className="ds-val-green">Score 0.15 (Nominal)</strong></div>
              </div>
            </div>

            <div className="ds-modal-actions-bar">
              <button className="ds-btn ds-btn-green ds-btn-full" onClick={handleCompleteVerification}>
                <CheckCircle2 size={14} /> Certify Joint Remediation (Pass & Complete Section)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
