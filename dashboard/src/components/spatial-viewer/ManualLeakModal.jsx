import React, { useState, useMemo } from 'react';
import {
  INITIAL_ROOM_OPTIONS,
  computeFusedConfidence,
  determineSeverity,
  SEVERITY_CONFIG,
} from '../../data/leaksData';

const PRESET_THERMAL_IMAGES = [
  { label: 'Critical Flange Plume (Room 1851)', path: '/assets/thermal/room_1851.jpg' },
  { label: 'High Seam Bloom (Room 1731)', path: '/assets/thermal/room_1731.jpg' },
  { label: 'Medium Vent Hotspot (Room 1541)', path: '/assets/thermal/room_1541.jpg' },
  { label: 'Low Variance Scan (Room 1453)', path: '/assets/thermal/room_1453.jpg' },
  { label: 'Uniform Clear Cold Duct (Room 1371 / Library)', path: '/assets/thermal/room_1371.jpg' },
];

export default function ManualLeakModal({ isOpen, onClose, onSubmitPendingLeak }) {
  const [roomMode, setRoomMode] = useState('select'); // 'select' | 'custom'
  const [selectedRoom, setSelectedRoom] = useState(INITIAL_ROOM_OPTIONS[0]);
  const [customRoom, setCustomRoom] = useState('');

  const [thermalConfidence, setThermalConfidence] = useState(85);
  const [thermalImagePath, setThermalImagePath] = useState(PRESET_THERMAL_IMAGES[0].path);

  const [pressureConfidence, setPressureConfidence] = useState(80);
  const [pressureValuePa, setPressureValuePa] = useState(72.5);

  const [audioConfidence, setAudioConfidence] = useState(75);
  const [audioValueDb, setAudioValueDb] = useState(68.0);

  const [notes, setNotes] = useState('');
  const [inspector, setInspector] = useState('Manual QA Technician');

  // Live computed fused confidence and severity
  const fusedConfidence = useMemo(() => {
    return computeFusedConfidence(thermalConfidence, pressureConfidence, audioConfidence);
  }, [thermalConfidence, pressureConfidence, audioConfidence]);

  const severity = useMemo(() => {
    return determineSeverity(fusedConfidence);
  }, [fusedConfidence]);

  const severityConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG['No Leak'];

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRoom = roomMode === 'select' ? selectedRoom : (customRoom.trim() || 'Custom Room');

    const pendingData = {
      roomNumber: finalRoom,
      thermalConfidence: Number(thermalConfidence),
      thermalImagePath: thermalImagePath.trim() || '/assets/thermal/room_1851.jpg',
      pressureConfidence: Number(pressureConfidence),
      pressureValuePa: Number(pressureValuePa),
      audioConfidence: Number(audioConfidence),
      audioValueDb: Number(audioValueDb),
      fusedConfidence,
      severity,
      notes: notes.trim() || `Manual inspection for ${finalRoom}`,
      inspector: inspector.trim() || 'QA Inspector',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    onSubmitPendingLeak(pendingData);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">➕</span>
            <div>
              <h2 id="modal-title">Add Manual Leak Annotation</h2>
              <p className="modal-subtitle">Enter sensor telemetry measurements to compute fused severity & place pin</p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} title="Close modal">
            ✕
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="modal-preview-banner" style={{ borderColor: severityConfig.borderColor }}>
          <div className="preview-item">
            <span className="preview-label">Fused Confidence</span>
            <span className="preview-value" style={{ color: severityConfig.textColor }}>
              {fusedConfidence.toFixed(1)}%
            </span>
          </div>
          <div className="preview-divider"></div>
          <div className="preview-item">
            <span className="preview-label">Calculated Severity</span>
            <span
              className={`severity-badge ${severityConfig.badgeClass}`}
              style={{
                backgroundColor: severityConfig.bgColor,
                color: severityConfig.textColor,
                borderColor: severityConfig.borderColor,
              }}
            >
              {severityConfig.label}
            </span>
          </div>
          <div className="preview-divider"></div>
          <div className="preview-item">
            <span className="preview-label">Fusion Weights</span>
            <span className="preview-subtext">Thermal: 40% · Pressure: 30% · Audio: 30%</span>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* 1. Room Number */}
          <div className="form-section">
            <div className="section-title">
              <span className="sec-icon">🚪</span>
              <span>1. Target Room / Location</span>
            </div>
            <div className="room-mode-toggle">
              <button
                type="button"
                className={`toggle-tab ${roomMode === 'select' ? 'active' : ''}`}
                onClick={() => setRoomMode('select')}
              >
                Select from List
              </button>
              <button
                type="button"
                className={`toggle-tab ${roomMode === 'custom' ? 'active' : ''}`}
                onClick={() => setRoomMode('custom')}
              >
                Custom Room Input
              </button>
            </div>

            {roomMode === 'select' ? (
              <div className="form-group">
                <label htmlFor="room-select">Select Room</label>
                <select
                  id="room-select"
                  className="form-control"
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  required
                >
                  {INITIAL_ROOM_OPTIONS.map((rm) => (
                    <option key={rm} value={rm}>
                      {rm}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="custom-room-input">Room Identifier / Label</label>
                <input
                  id="custom-room-input"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Room 1622, AHU-4 Duct Zone"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* 2. Thermal Sensor Field */}
          <div className="form-section">
            <div className="section-title">
              <span className="sec-icon">🌡️</span>
              <span>2. Thermal Sensor Confidence & Image</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <div className="slider-header">
                  <label htmlFor="thermal-conf-slider">Thermal Confidence (%)</label>
                  <span className="slider-val">{thermalConfidence}%</span>
                </div>
                <input
                  id="thermal-conf-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={thermalConfidence}
                  onChange={(e) => setThermalConfidence(Number(e.target.value))}
                  className="form-slider slider-thermal"
                />
              </div>

              <div className="form-group">
                <label htmlFor="thermal-img-select">Thermal Image Snapshot</label>
                <select
                  id="thermal-img-select"
                  className="form-control"
                  value={thermalImagePath}
                  onChange={(e) => setThermalImagePath(e.target.value)}
                >
                  {PRESET_THERMAL_IMAGES.map((img) => (
                    <option key={img.path} value={img.path}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thermal thumbnail preview */}
            {thermalImagePath && (
              <div className="thermal-preview-row">
                <img
                  src={thermalImagePath}
                  alt="Thermal Preview"
                  className="thermal-thumb"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="preview-caption">Selected Thermal Scan Asset: {thermalImagePath}</span>
              </div>
            )}
          </div>

          {/* 3. Differential Pressure Field */}
          <div className="form-section">
            <div className="section-title">
              <span className="sec-icon">💨</span>
              <span>3. Differential Pressure Sensor</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <div className="slider-header">
                  <label htmlFor="pressure-conf-slider">Pressure Confidence (%)</label>
                  <span className="slider-val">{pressureConfidence}%</span>
                </div>
                <input
                  id="pressure-conf-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={pressureConfidence}
                  onChange={(e) => setPressureConfidence(Number(e.target.value))}
                  className="form-slider slider-pressure"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pressure-value-input">Differential Pressure Value (Pa)</label>
                <div className="input-with-unit">
                  <input
                    id="pressure-value-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    className="form-control"
                    value={pressureValuePa}
                    onChange={(e) => setPressureValuePa(Number(e.target.value))}
                    required
                  />
                  <span className="unit-tag">Pa</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Audio / Acoustic Sensor Field */}
          <div className="form-section">
            <div className="section-title">
              <span className="sec-icon">🔊</span>
              <span>4. Audio / Acoustic Sensor</span>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <div className="slider-header">
                  <label htmlFor="audio-conf-slider">Acoustic Confidence (%)</label>
                  <span className="slider-val">{audioConfidence}%</span>
                </div>
                <input
                  id="audio-conf-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={audioConfidence}
                  onChange={(e) => setAudioConfidence(Number(e.target.value))}
                  className="form-slider slider-audio"
                />
              </div>

              <div className="form-group">
                <label htmlFor="audio-value-input">Acoustic Level Value (dB)</label>
                <div className="input-with-unit">
                  <input
                    id="audio-value-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="150"
                    className="form-control"
                    value={audioValueDb}
                    onChange={(e) => setAudioValueDb(Number(e.target.value))}
                    required
                  />
                  <span className="unit-tag">dB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional notes & inspector */}
          <div className="form-group">
            <label htmlFor="leak-notes">Observation Notes (Optional)</label>
            <input
              id="leak-notes"
              type="text"
              className="form-control"
              placeholder="e.g., Noticeable vibration and hissing at return vent seam"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" id="btn-submit-manual-leak">
              <span>Next: Pin on Map</span>
              <span className="arrow">📍 →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
