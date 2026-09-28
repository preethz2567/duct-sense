import React from 'react';
import { Gauge, Thermometer, Mic, ShieldAlert } from 'lucide-react';

export default function SensorEvidencePanel({
  pressureDifferentialPa,
  normalizedPressure,
  thermalScore,
  acousticScore,
  fusedConfidence,
  pressureThresholdPa = 20.0,
}) {
  const presAnomaly = (pressureDifferentialPa != null && pressureDifferentialPa >= pressureThresholdPa) ||
                      (normalizedPressure != null && normalizedPressure >= 0.6);
  const thermAnomaly = thermalScore != null && thermalScore >= 0.60;
  const audioAnomaly = acousticScore != null && acousticScore >= 0.50;

  return (
    <div className="ds-evidence-card ds-compact-evidence">
      <div className="ds-evidence-grid-3">
        {/* Pressure Modality */}
        <div className={`ds-evidence-item ${presAnomaly ? 'ds-ev--anomaly' : ''}`}>
          <div className="ds-ev-head">
            <Gauge size={14} />
            <span>Pressure (ΔP)</span>
          </div>
          <div className="ds-ev-value">
            {pressureDifferentialPa != null ? `+${pressureDifferentialPa.toFixed(1)} Pa` : '—'}
          </div>
          <div className="ds-ev-indicator">
            <span className={`ds-ev-dot ${presAnomaly ? 'ds-dot-orange' : 'ds-dot-teal'}`} />
            <span>{presAnomaly ? 'Anomaly' : 'Normal'}</span>
          </div>
        </div>

        {/* Thermal Modality */}
        <div className={`ds-evidence-item ${thermAnomaly ? 'ds-ev--anomaly' : ''}`}>
          <div className="ds-ev-head">
            <Thermometer size={14} />
            <span>Thermal</span>
          </div>
          <div className="ds-ev-value">
            {thermalScore != null ? (thermalScore * 100).toFixed(0) + '%' : '—'}
          </div>
          <div className="ds-ev-indicator">
            <span className={`ds-ev-dot ${thermAnomaly ? 'ds-dot-orange' : 'ds-dot-teal'}`} />
            <span>{thermAnomaly ? 'Anomaly' : 'Normal'}</span>
          </div>
        </div>

        {/* Acoustic Modality */}
        <div className={`ds-evidence-item ${audioAnomaly ? 'ds-ev--anomaly' : ''}`}>
          <div className="ds-ev-head">
            <Mic size={14} />
            <span>Acoustic</span>
          </div>
          <div className="ds-ev-value">
            {acousticScore != null ? (acousticScore * 100).toFixed(0) + '%' : '—'}
          </div>
          <div className="ds-ev-indicator">
            <span className={`ds-ev-dot ${audioAnomaly ? 'ds-dot-orange' : 'ds-dot-teal'}`} />
            <span>{audioAnomaly ? 'Anomaly' : 'Normal'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
