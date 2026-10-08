import React, { useState } from 'react';
import { Gauge, Activity, AlertTriangle } from 'lucide-react';
import SensorEvidencePanel from '../components/SensorEvidencePanel';
import '../App.css'; // Use existing dashboard CSS

export default function PressureTest() {
  const [scenario, setScenario] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:8000/pressure/mock?scenario=${scenario}`);
      if (!res.ok) {
        throw new Error(`Error: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ds-page">
      <header className="ds-page-header">
        <h1 className="ds-page-title">
          <Gauge size={20} style={{ marginRight: '10px' }} />
          DuctSense Pressure Evidence Test
        </h1>
        <p className="ds-page-subtitle">
          Test Phase 3: Hardware-independent pressure transport. LIVE BMP280 HARDWARE NOT CONNECTED.
        </p>
      </header>

      <div className="ds-page-content" style={{ maxWidth: '800px' }}>
        <div className="ds-evidence-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-main)' }}>Select Software Test Fixture</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['normal', 'leak', 'repair'].map(s => (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: scenario === s ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                    border: `1px solid ${scenario === s ? 'var(--neon-teal)' : 'var(--border-color)'}`,
                    color: scenario === s ? 'var(--neon-teal)' : 'var(--text-muted)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleTest}
              disabled={loading}
              className="ds-btn ds-btn-primary"
              style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Activity size={16} />
              {loading ? 'Fetching...' : 'Fetch Pressure Evidence'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--neon-orange)', color: 'var(--neon-orange)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-main)' }}>Received Evidence Payload</h3>
                <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: 'var(--surface-3)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  Source: <strong style={{ color: 'var(--neon-teal)' }}>{result.source.toUpperCase()}</strong>
                </span>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <SensorEvidencePanel 
                  pressureDifferentialPa={result.pressure_differential_pa} 
                  normalizedPressure={result.normalized_pressure}
                />
              </div>

              <div style={{ backgroundColor: 'var(--surface-1)', padding: '16px', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
