// src/pages/CommissioningReport.jsx
import React from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Camera,
  Thermometer,
  Gauge,
  Mic,
  MapPin,
} from 'lucide-react';

export default function CommissioningReport({ session }) {
  const { activeAnomaly } = session;
  const currentSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];

  const exportCSV = () => {
    const content = `DUCTSENSE HVAC COMMISSIONING REPORT\nInspection ID,${session.id}\nFacility,${session.site}\nBuilding,${session.building}\nLevel,${session.level}\nAHU,${session.system}\nLead Technician,${session.technician}\nDate,${session.date}\n\nSection,Plan Location,Pressure Initial,Thermal Score,Acoustic Score,Repair Action,Verification Status\n${currentSection.id},0.50m,+205.8 Pa,0.86,0.74,"${activeAnomaly?.repair?.action || 'Joint Resealed'}","VERIFIED PASS"`;
    const uri = 'data:text/csv;charset=utf-8,' + encodeURI(content);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `ductsense_commissioning_${session.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ds-page-container ds-instrument-view ds-report-print-target">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">DOCUMENTATION LAYER</div>
          <h1 className="ds-page-title">HVAC COMMISSIONING CERTIFICATE</h1>
        </div>

        <div className="ds-header-actions">
          <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
          <button className="ds-btn ds-btn-primary ds-btn-compact" onClick={handlePrint}>
            <FileText size={13} /> Print / PDF Record
          </button>
        </div>
      </header>

      {/* Main Certificate Sheet */}
      <div className="ds-card ds-commissioning-cert-card">
        {/* Document Top */}
        <div className="ds-cert-header">
          <div className="ds-cert-brand">
            <div className="ds-brand-mark">DS</div>
            <div>
              <div className="ds-cert-brand-title">DUCTSENSE FIELD COMMISSIONING RECORD</div>
              <div className="ds-cert-brand-sub">
                Technician-Led Multimodal HVAC Leakage Diagnostic & Remediation Certificate
              </div>
            </div>
          </div>
          <div className="ds-cert-id-tag">
            <span className="ds-cert-id-label">REPORT ID</span>
            <span className="ds-cert-id-val">{session.id}</span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="ds-cert-metadata-grid">
          <div className="ds-cert-meta-item">
            <span className="ds-cert-meta-k">FACILITY / SITE</span>
            <span className="ds-cert-meta-v">{session.site}</span>
          </div>
          <div className="ds-cert-meta-item">
            <span className="ds-cert-meta-k">BUILDING & LEVEL</span>
            <span className="ds-cert-meta-v">{session.building} · {session.level}</span>
          </div>
          <div className="ds-cert-meta-item">
            <span className="ds-cert-meta-k">HVAC AIR SYSTEM</span>
            <span className="ds-cert-meta-v">{session.system}</span>
          </div>
          <div className="ds-cert-meta-item">
            <span className="ds-cert-meta-k">LEAD INSPECTOR</span>
            <span className="ds-cert-meta-v">{session.technician}</span>
          </div>
          <div className="ds-cert-meta-item">
            <span className="ds-cert-meta-k">INSPECTION DATE</span>
            <span className="ds-cert-meta-v">{session.date}</span>
          </div>
          <div className="ds-cert-meta-item">
            <span className="ds-cert-meta-k">INSTRUMENTATION</span>
            <span className="ds-cert-meta-v">BMP280 Tap Pair + FLIR + INMP441</span>
          </div>
        </div>

        {/* Inspection Route Spatial Map Representation */}
        <div className="ds-cert-map-block">
          <div className="ds-cert-block-title">INSPECTION ROUTE & POC RIG SCHEMATIC</div>
          <div className="ds-cert-map-schematic">
            <svg viewBox="0 0 600 120" className="ds-svg-fluid">
              <rect width="600" height="120" fill="#F8FAFC" rx="2" stroke="#CDD0CE" />
              {/* Duct line */}
              <line x1="50" y1="60" x2="550" y2="60" stroke="#344B5E" strokeWidth="4" />
              {/* Markers */}
              {[
                { name: 'D-01 (Pass)', x: 90, color: '#3F7655' },
                { name: 'D-02 (Pass)', x: 200, color: '#3F7655' },
                { name: 'D-03 (Leak Remedied)', x: 310, color: '#D88A19' },
                { name: 'D-04 (Pending)', x: 420, color: '#667078' },
                { name: 'D-05 (Pending)', x: 520, color: '#667078' },
              ].map((m, idx) => (
                <g key={idx} transform={`translate(${m.x}, 60)`}>
                  <circle cx="0" cy="0" r="8" fill={m.color} />
                  <text x="0" y="24" fill="#20252A" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {m.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="ds-cert-summary-strip">
          <div className="ds-cert-summary-box">
            <span className="ds-summary-k">SECTIONS INSPECTED</span>
            <span className="ds-summary-v">3 / 5</span>
          </div>
          <div className="ds-cert-summary-box">
            <span className="ds-summary-k">LEAKS DETECTED</span>
            <span className="ds-summary-v ds-val-amber">1</span>
          </div>
          <div className="ds-cert-summary-box">
            <span className="ds-summary-k">CORRECTIVE REPAIRS</span>
            <span className="ds-summary-v">1</span>
          </div>
          <div className="ds-cert-summary-box ds-box-verified">
            <span className="ds-summary-k">REPAIRS VERIFIED (PASS)</span>
            <span className="ds-summary-v ds-val-green">100%</span>
          </div>
        </div>

        {/* Detailed Defect & Remediation Log Table */}
        <div className="ds-cert-defects-block">
          <div className="ds-cert-block-title">CONFIRMED DEFECT & REMEDIATION RECORD</div>

          <div className="ds-card ds-defect-report-item">
            <div className="ds-defect-head">
              <div>
                <span className="ds-sec-badge">SECTION D-03</span>
                <span className="ds-defect-title">Server Room Supply Duct (Controlled Test Port)</span>
              </div>
              <span className="ds-badge-green"><CheckCircle2 size={13} /> VERIFIED & SEALED (PASS)</span>
            </div>

            <div className="ds-defect-details-grid">
              {/* Initial Signature */}
              <div>
                <div className="ds-defect-subhead">1. Initial Defect Signature</div>
                <div className="ds-defect-kv">
                  <span>Plan Location:</span> <strong>0.50 m from inlet flange</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Field Photo:</span> <strong>Attached (Visual Seam Gap)</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Pressure Differential:</span> <strong>+205.8 Pa (BMP280 Tap Drop)</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Thermal Hotspot (ΔT):</span> <strong>+9.3 °C (Score 0.86 · FLIR)</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Acoustic Turbulence:</span> <strong>0.74 (Audible Range · INMP441)</strong>
                </div>
              </div>

              {/* Remediation & Verification */}
              <div>
                <div className="ds-defect-subhead">2. Corrective Remediation & Rescan</div>
                <div className="ds-defect-kv">
                  <span>Remediation Action:</span> <strong>{activeAnomaly?.repair?.action || 'Joint flange resealed with mastic'}</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Repair Photo:</span> <strong>Attached (Post-Seal Inspection)</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Post-Repair Pressure:</span> <strong>+254.2 Pa (Baseline Restored)</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Post-Repair Thermal:</span> <strong>0.18 (Gradient Neutralized)</strong>
                </div>
                <div className="ds-defect-kv">
                  <span>Final Verification:</span> <strong className="ds-val-green">PASS · Certified Nominal</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Sign-off Block */}
        <div className="ds-cert-signoff-block">
          <div className="ds-signoff-item">
            <span className="ds-sign-line">
              Certified by Lead Commissioning Technician: <strong>{session.technician}</strong>
            </span>
          </div>
          <div className="ds-signoff-item">
            <span className="ds-sign-line">
              Commissioning Outcome: <strong className="ds-val-green">PASS · ALL REMEDIATED JOINTS NOMINAL</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
