import React, { useState } from 'react';
import { Upload, Activity, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import './ThermalMLTest.css';

export default function ThermalMLTest() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8001/thermal/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to analyze image');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="thermal-ml-page">
      <div className="thermal-header">
        <h1>DuctSense Thermal AI</h1>
        <p>Standalone ML Inference Test (Requires FLIR Radiometric JPG)</p>
      </div>

      <div className="thermal-content">
        <div className="upload-section">
          <div className="upload-card">
            <input
              type="file"
              accept=".jpg,.jpeg"
              onChange={handleFileSelect}
              id="file-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="upload-label">
              <Upload size={32} className="upload-icon" />
              <span>Select FLIR JPG Image</span>
            </label>
          </div>

          {previewUrl && (
            <div className="preview-card">
              <img src={previewUrl} alt="Thermal preview" className="image-preview" />
              <div className="file-info">
                <ImageIcon size={16} />
                <span>{selectedFile.name}</span>
              </div>
              
              <button 
                className="analyze-btn" 
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? 'Analyzing thermal image...' : 'Analyze Thermal Image'}
              </button>
            </div>
          )}
        </div>

        <div className="result-section">
          {error && (
            <div className="error-card">
              <AlertTriangle className="error-icon" />
              <div>
                <h3>Analysis Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="success-card">
              <div className="success-header">
                <CheckCircle className="success-icon" />
                <h3>Analysis Complete</h3>
              </div>
              
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">Thermal Confidence</span>
                  <span className="result-value">
                    {result.thermal_confidence !== null ? 
                      `${(result.thermal_confidence * 100).toFixed(1)}%` : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="result-item">
                  <span className="result-label">Anomaly ΔT</span>
                  <span className="result-value">
                    {result.anomaly_delta_c !== null ? 
                      `${result.anomaly_delta_c > 0 ? '+' : ''}${result.anomaly_delta_c.toFixed(1)}°C` : 
                      'N/A'}
                  </span>
                </div>
                
                <div className="result-item">
                  <span className="result-label">Quality Flag</span>
                  <span className={`result-value flag-${result.quality_flag}`}>
                    {result.quality_flag}
                  </span>
                </div>

                <div className="result-item">
                  <span className="result-label">Background Temp</span>
                  <span className="result-value">
                    {result.background_c !== null ? `${result.background_c.toFixed(1)}°C` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
