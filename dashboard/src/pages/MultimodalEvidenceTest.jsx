import React, { useState } from 'react';
import { Upload, Activity, AlertTriangle, Image as ImageIcon, Gauge, Thermometer, Layers } from 'lucide-react';
import SensorEvidencePanel from '../components/SensorEvidencePanel';
import '../App.css'; 

export default function MultimodalEvidenceTest() {
  // Thermal State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [thermalLoading, setThermalLoading] = useState(false);
  const [thermalResult, setThermalResult] = useState(null);
  const [thermalError, setThermalError] = useState(null);

  // Pressure State
  const [pressureScenario, setPressureScenario] = useState('normal');
  const [pressureLoading, setPressureLoading] = useState(false);
  const [pressureResult, setPressureResult] = useState(null);
  const [pressureError, setPressureError] = useState(null);

  // Handlers
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setThermalResult(null);
      setThermalError(null);
    }
  };

  const handleAnalyzeThermal = async () => {
    if (!selectedFile) return;
    setThermalLoading(true);
    setThermalError(null);
    setThermalResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8001/thermal/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to analyze thermal image');
      setThermalResult(data);
    } catch (err) {
      setThermalError(err.message);
    } finally {
      setThermalLoading(false);
    }
  };

  const handleFetchPressure = async () => {
    setPressureLoading(true);
    setPressureError(null);
    setPressureResult(null);

    try {
      const res = await fetch(`http://localhost:8000/pressure/mock?scenario=${pressureScenario}`);
      if (!res.ok) throw new Error(`Error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setPressureResult(data);
    } catch (err) {
      setPressureError(err.message);
    } finally {
      setPressureLoading(false);
    }
  };

  return (
    <div className="ds-page">
      <header className="ds-page-header">
        <h1 className="ds-page-title">
          <Layers size={20} style={{ marginRight: '10px' }} />
          Multimodal Evidence View (Phase 4A)
        </h1>
        <p className="ds-page-subtitle">
          Independent Thermal and Pressure Evidence. NO FUSION LOGIC APPLIED.
        </p>
      </header>

      <div className="ds-page-content" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* THERMAL COLUMN */}
        <div className="ds-evidence-card" style={{ flex: '1 1 400px', minWidth: '400px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Thermometer size={18} />
            Thermal Evidence
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <input type="file" accept=".jpg,.jpeg" onChange={handleFileSelect} id="thermal-upload" style={{ display: 'none' }} />
            <label htmlFor="thermal-upload" className="ds-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: 'var(--surface-3)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '4px', color: 'var(--text-main)' }}>
              <Upload size={16} /> Select FLIR Image
            </label>
            {previewUrl && (
              <div style={{ marginTop: '16px' }}>
                <img src={previewUrl} alt="Thermal preview" style={{ width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                <button onClick={handleAnalyzeThermal} disabled={thermalLoading} className="ds-btn ds-btn-primary" style={{ marginTop: '12px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <Activity size={16} />
                  {thermalLoading ? 'Analyzing...' : 'Analyze Thermal Evidence'}
                </button>
              </div>
            )}
          </div>

          {thermalError && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--neon-orange)', color: 'var(--neon-orange)', borderRadius: '4px', marginBottom: '16px' }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }}/> {thermalError}
            </div>
          )}

          {thermalResult && (
            <div style={{ padding: '16px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Confidence:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>{thermalResult.thermal_confidence}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Anomaly ΔT:</span>
                <span style={{ color: 'var(--text-main)', fontSize: '14px' }}>{thermalResult.anomaly_delta_c} °C</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Source:</span>
                <span style={{ color: 'var(--neon-teal)', fontSize: '13px', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>ML MODEL</span>
              </div>
            </div>
          )}
        </div>

        {/* PRESSURE COLUMN */}
        <div className="ds-evidence-card" style={{ flex: '1 1 400px', minWidth: '400px' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gauge size={18} />
            Pressure Evidence
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-muted)' }}>Select Fixture Scenario</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['normal', 'leak', 'repair'].map(s => (
                <button
                  key={s}
                  onClick={() => setPressureScenario(s)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: pressureScenario === s ? 'rgba(0, 240, 255, 0.15)' : 'var(--surface-3)',
                    border: `1px solid ${pressureScenario === s ? 'var(--neon-teal)' : 'var(--border-color)'}`,
                    color: pressureScenario === s ? 'var(--neon-teal)' : 'var(--text-muted)',
                    borderRadius: '4px', cursor: 'pointer', fontSize: '12px', textTransform: 'uppercase'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <button onClick={handleFetchPressure} disabled={pressureLoading} className="ds-btn ds-btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Activity size={16} />
              {pressureLoading ? 'Fetching...' : 'Fetch Pressure Evidence'}
            </button>
          </div>

          {pressureError && (
            <div style={{ padding: '12px', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--neon-orange)', color: 'var(--neon-orange)', borderRadius: '4px', marginBottom: '16px' }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }}/> {pressureError}
            </div>
          )}

          {pressureResult && (
            <div style={{ padding: '16px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Differential (ΔP):</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                  {pressureResult.pressure_differential_pa > 0 ? '+' : ''}{pressureResult.pressure_differential_pa} Pa
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Hardware:</span>
                <span style={{ color: 'var(--neon-orange)', fontSize: '13px' }}>NOT CONNECTED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Source:</span>
                <span style={{ color: 'var(--neon-teal)', fontSize: '13px', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px' }}>{pressureResult.source.toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
