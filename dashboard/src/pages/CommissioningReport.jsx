import React, { useMemo } from 'react';
import { Download, FileText } from 'lucide-react';
import { mapSessionToReportModel } from '../services/reportMapper';
import './CommissioningReport.css';

export default function CommissioningReport({ session }) {
  const report = useMemo(() => mapSessionToReportModel(session), [session]);

  if (!report) return <div className="ds-report-placeholder">No data available</div>;

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    // Basic CSV export matching requirements
    const content = `DUCTSENSE HVAC COMMISSIONING REPORT
Inspection ID,${report.documentControl.inspectionId}
Facility,${report.inspectionDetails.site}
Building,${report.inspectionDetails.building}
Level,${report.inspectionDetails.level}
AHU,${report.inspectionDetails.system}
Lead Technician,${report.documentControl.preparedBy}
Date,${report.documentControl.inspectionDate}

Finding ID,Location,Type,Status,Date/Time,Technician
${report.findings.map(f => `${f.id},"${f.location}",${f.type},${f.status},"${f.dateTime}",${f.technician}`).join('\n')}
`;
    const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `ductsense_commissioning_${report.documentControl.inspectionId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ds-page-container ds-report-page-container">
      {/* Non-printable Action Header */}
      <header className="ds-page-header ds-header-compact ds-no-print">
        <div>
          <div className="ds-kicker-label" style={{ color: '#000' }}>DOCUMENTATION LAYER</div>
          <h1 className="ds-page-title" style={{ color: '#000' }}>HVAC COMMISSIONING REPORT PREVIEW</h1>
        </div>
        <div className="ds-header-actions">
          <button className="ds-btn ds-btn-secondary ds-btn-compact" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
          <button className="ds-btn ds-btn-primary ds-btn-compact" onClick={handlePrint} style={{ backgroundColor: '#000', color: '#fff' }}>
            <FileText size={13} /> Print / PDF Record
          </button>
        </div>
      </header>

      {/* Printable Report Canvas */}
      <div className="ds-print-canvas">
        
        {/* --- PAGE 1: TITLE PAGE --- */}
        <div className="ds-print-page">
          <div className="ds-report-title-header">
            <h2>DUCTSENSE</h2>
            <p>Edge-First HVAC Leak Inspection System</p>
          </div>
          <div className="ds-report-main-title">
            <h1>HVAC DUCT INSPECTION & COMMISSIONING REPORT</h1>
          </div>
          
          <div className="ds-report-section">
            <table className="ds-report-table ds-table-title-meta">
              <tbody>
                <tr><td><strong>Inspection ID</strong></td><td>{report.documentControl.inspectionId}</td></tr>
                <tr><td><strong>Site / Facility</strong></td><td>{report.inspectionDetails.site}</td></tr>
                <tr><td><strong>Building</strong></td><td>{report.inspectionDetails.building}</td></tr>
                <tr><td><strong>Floor / Level</strong></td><td>{report.inspectionDetails.level}</td></tr>
                <tr><td><strong>Area / Room</strong></td><td>{report.inspectionDetails.area}</td></tr>
                <tr><td><strong>AHU / HVAC System</strong></td><td>{report.inspectionDetails.system}</td></tr>
                <tr><td><strong>Duct / Section</strong></td><td>{report.inspectionDetails.section}</td></tr>
                <tr><td><strong>Inspection Date</strong></td><td>{report.documentControl.inspectionDate}</td></tr>
                <tr><td><strong>Technician</strong></td><td>{report.documentControl.preparedBy}</td></tr>
                <tr><td><strong>Reviewer</strong></td><td>{report.documentControl.reviewedBy}</td></tr>
                <tr><td><strong>Report Version</strong></td><td>{report.documentControl.revision}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="ds-report-purpose">
            <strong>REPORT PURPOSE</strong>
            <p>This report documents the inspection, sensor evidence, field findings, repair actions and verification results recorded during the DuctSense HVAC duct inspection.</p>
          </div>

          <div className="ds-report-section">
            <h3 className="ds-report-h3">1. DOCUMENT CONTROL</h3>
            <table className="ds-report-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Report ID</td><td>{report.documentControl.reportId}</td></tr>
                <tr><td>Inspection ID</td><td>{report.documentControl.inspectionId}</td></tr>
                <tr><td>Revision</td><td>{report.documentControl.revision}</td></tr>
                <tr><td>Prepared By</td><td>{report.documentControl.preparedBy}</td></tr>
                <tr><td>Reviewed By</td><td>{report.documentControl.reviewedBy}</td></tr>
                <tr><td>Inspection Date</td><td>{report.documentControl.inspectionDate}</td></tr>
                <tr><td>Generated Date</td><td>{report.documentControl.generatedDate}</td></tr>
                <tr><td>Status</td><td>{report.documentControl.status}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="ds-report-section">
            <h3 className="ds-report-h3">2. EXECUTIVE SUMMARY</h3>
            <table className="ds-report-table">
              <tbody>
                <tr><td><strong>Inspection Status</strong></td><td>{report.executiveSummary.inspectionStatus}</td></tr>
                <tr><td><strong>Overall Finding</strong></td><td>{report.executiveSummary.overallFinding}</td></tr>
                <tr><td><strong>Sections Inspected</strong></td><td>{report.executiveSummary.sectionsInspected}</td></tr>
                <tr><td><strong>Findings Recorded</strong></td><td>{report.executiveSummary.findingsRecorded}</td></tr>
                <tr><td><strong>Repairs Recorded</strong></td><td>{report.executiveSummary.repairsRecorded}</td></tr>
                <tr><td><strong>Verification Status</strong></td><td>{report.executiveSummary.verificationStatus}</td></tr>
              </tbody>
            </table>
          </div>
          
          <div className="ds-report-footer">
            <span>Inspection ID: {report.documentControl.inspectionId} | Report Revision: {report.documentControl.revision} | Page 1 of 4</span>
          </div>
        </div>

        {/* --- PAGE 2: FINDINGS & SENSOR EVIDENCE --- */}
        <div className="ds-print-page">
          <div className="ds-report-header-print">
            <strong>DUCTSENSE</strong> - HVAC DUCT INSPECTION & COMMISSIONING REPORT
          </div>

          <div className="ds-report-section">
            <h3 className="ds-report-h3">3. INSPECTION LOCATION / FLOOR PLAN</h3>
            <table className="ds-report-table">
              <tbody>
                <tr><td><strong>Plan ID</strong></td><td>{report.inspectionDetails.planId}</td></tr>
                <tr><td><strong>Plan Version</strong></td><td>{report.inspectionDetails.planVersion}</td></tr>
                <tr><td><strong>Room / Area</strong></td><td>{report.inspectionDetails.area}</td></tr>
                <tr><td><strong>Floor plan</strong></td><td>Not available</td></tr>
              </tbody>
            </table>
          </div>

          <div className="ds-report-section">
            <h3 className="ds-report-h3">4. FINDINGS TABLE</h3>
            {report.findings.length === 0 ? (
              <p>No findings recorded.</p>
            ) : (
              <table className="ds-report-table ds-table-full">
                <thead>
                  <tr>
                    <th>Finding ID</th>
                    <th>Location</th>
                    <th>Finding Type</th>
                    <th>Status</th>
                    <th>Date/Time</th>
                    <th>Technician</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.findings.map((f, i) => (
                    <tr key={i}>
                      <td>{f.id}</td>
                      <td>{f.location}</td>
                      <td>{f.type}</td>
                      <td>{f.status}</td>
                      <td>{f.dateTime}</td>
                      <td>{f.technician}</td>
                      <td>{f.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {report.sensorEvidence.pressure && (
            <div className="ds-report-section">
              <h3 className="ds-report-h3">5. SENSOR EVIDENCE — PRESSURE</h3>
              <table className="ds-report-table">
                <tbody>
                  <tr><td><strong>Sensor 1</strong></td><td>{report.sensorEvidence.pressure.sensor1}</td></tr>
                  <tr><td><strong>Sensor 2</strong></td><td>{report.sensorEvidence.pressure.sensor2}</td></tr>
                  <tr><td><strong>Pressure 1</strong></td><td>{report.sensorEvidence.pressure.p1} hPa</td></tr>
                  <tr><td><strong>Pressure 2</strong></td><td>{report.sensorEvidence.pressure.p2} hPa</td></tr>
                  <tr><td><strong>Raw ΔP</strong></td><td>{report.sensorEvidence.pressure.rawDeltaP} Pa</td></tr>
                  <tr><td><strong>Calibration Offset</strong></td><td>{report.sensorEvidence.pressure.calibrationOffset} Pa</td></tr>
                  <tr><td><strong>Corrected ΔP</strong></td><td>{report.sensorEvidence.pressure.correctedDeltaP} Pa</td></tr>
                  <tr><td><strong>Temperature 1</strong></td><td>{report.sensorEvidence.pressure.t1} °C</td></tr>
                  <tr><td><strong>Temperature 2</strong></td><td>{report.sensorEvidence.pressure.t2} °C</td></tr>
                  <tr><td><strong>Timestamp</strong></td><td>{report.sensorEvidence.pressure.timestamp}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {report.sensorEvidence.acoustic && (
            <div className="ds-report-section">
              <h3 className="ds-report-h3">6. SENSOR EVIDENCE — ACOUSTIC</h3>
              <table className="ds-report-table">
                <tbody>
                  <tr><td><strong>Acoustic Status</strong></td><td>{report.sensorEvidence.acoustic.status}</td></tr>
                  <tr><td><strong>Signal Level</strong></td><td>{report.sensorEvidence.acoustic.signalLevel}</td></tr>
                  <tr><td><strong>Relevant Feature</strong></td><td>{report.sensorEvidence.acoustic.feature}</td></tr>
                  <tr><td><strong>Timestamp</strong></td><td>{report.sensorEvidence.acoustic.timestamp}</td></tr>
                  <tr><td><strong>Finding Association</strong></td><td>{report.sensorEvidence.acoustic.association}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {report.sensorEvidence.thermal && (
            <div className="ds-report-section">
              <h3 className="ds-report-h3">7. SENSOR EVIDENCE — THERMAL</h3>
              <table className="ds-report-table">
                <tbody>
                  <tr><td><strong>Status</strong></td><td>{report.sensorEvidence.thermal.status}</td></tr>
                  <tr><td><strong>Max Temperature</strong></td><td>{report.sensorEvidence.thermal.tempMax} °C</td></tr>
                  <tr><td><strong>Reference Temperature</strong></td><td>{report.sensorEvidence.thermal.tempRef} °C</td></tr>
                  <tr><td><strong>ΔT</strong></td><td>{report.sensorEvidence.thermal.deltaT} °C</td></tr>
                  <tr><td><strong>Anomaly Score</strong></td><td>{report.sensorEvidence.thermal.score}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="ds-report-footer">
            <span>Inspection ID: {report.documentControl.inspectionId} | Report Revision: {report.documentControl.revision} | Page 2 of 4</span>
          </div>
        </div>

        {/* --- PAGE 3: REPAIR & VERIFICATION / TIMELINE --- */}
        <div className="ds-print-page">
          <div className="ds-report-header-print">
            <strong>DUCTSENSE</strong> - HVAC DUCT INSPECTION & COMMISSIONING REPORT
          </div>

          {report.detectionResult && (
            <div className="ds-report-section">
              <h3 className="ds-report-h3">8. DETECTION RESULT</h3>
              <table className="ds-report-table">
                <tbody>
                  <tr><td><strong>Overall Status</strong></td><td>{report.detectionResult.overallStatus}</td></tr>
                  <tr><td><strong>Pressure Evidence</strong></td><td>{report.detectionResult.pressureEvidence}</td></tr>
                  <tr><td><strong>Acoustic Evidence</strong></td><td>{report.detectionResult.acousticEvidence}</td></tr>
                  <tr><td><strong>Thermal Evidence</strong></td><td>{report.detectionResult.thermalEvidence}</td></tr>
                  <tr><td><strong>Fusion Result</strong></td><td>{report.detectionResult.fusionResult}</td></tr>
                  <tr><td><strong>Confidence</strong></td><td>{report.detectionResult.confidence}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="ds-report-section">
            <h3 className="ds-report-h3">9. REPAIR & VERIFICATION</h3>
            {report.repair ? (
              <div className="ds-report-repair-block">
                <table className="ds-report-table">
                  <tbody>
                    <tr><td><strong>Finding ID</strong></td><td>{report.repair.findingId}</td></tr>
                    <tr><td><strong>Repair Action</strong></td><td>{report.repair.action}</td></tr>
                    <tr><td><strong>Repair Date/Time</strong></td><td>{report.repair.dateTime}</td></tr>
                    <tr><td><strong>Technician</strong></td><td>{report.repair.technician}</td></tr>
                    <tr><td><strong>Verification Result</strong></td><td>{report.repair.verified}</td></tr>
                  </tbody>
                </table>
                <br/>
                <table className="ds-report-table ds-table-full">
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Pressure (ΔP)</th>
                      <th>Thermal Score</th>
                      <th>Acoustic Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>BEFORE REPAIR</strong></td>
                      <td>{report.repair.before.pressure}</td>
                      <td>{report.repair.before.thermal}</td>
                      <td>{report.repair.before.acoustic}</td>
                    </tr>
                    <tr>
                      <td><strong>AFTER REPAIR</strong></td>
                      <td>{report.repair.after.pressure}</td>
                      <td>{report.repair.after.thermal}</td>
                      <td>{report.repair.after.acoustic}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No repair actions recorded.</p>
            )}
          </div>

          <div className="ds-report-section">
            <h3 className="ds-report-h3">10. INSPECTION TIMELINE</h3>
            {report.timeline.length === 0 ? (
              <p>No events recorded.</p>
            ) : (
              <table className="ds-report-table ds-table-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Finding</th>
                    <th>User</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.timeline.map((t, idx) => (
                    <tr key={idx}>
                      <td>{t.time}</td>
                      <td>{t.event}</td>
                      <td>{t.finding}</td>
                      <td>{t.user}</td>
                      <td>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="ds-report-footer">
            <span>Inspection ID: {report.documentControl.inspectionId} | Report Revision: {report.documentControl.revision} | Page 3 of 4</span>
          </div>
        </div>

        {/* --- PAGE 4: EVIDENCE GALLERY & FINAL STATUS --- */}
        <div className="ds-print-page">
          <div className="ds-report-header-print">
            <strong>DUCTSENSE</strong> - HVAC DUCT INSPECTION & COMMISSIONING REPORT
          </div>

          <div className="ds-report-section">
            <h3 className="ds-report-h3">11. EVIDENCE GALLERY</h3>
            {report.images.length === 0 ? (
              <p>No images attached.</p>
            ) : (
              <div className="ds-report-gallery">
                {report.images.map((img, idx) => (
                  <div key={idx} className="ds-report-img-box">
                    {img.url ? (
                      <img src={img.url} alt={img.description} />
                    ) : (
                      <div className="ds-report-img-placeholder">Image Not Available</div>
                    )}
                    <div className="ds-report-img-caption">
                      <strong>{img.category}</strong> - {img.description} <br/>
                      <small>ID: {img.id} | Finding: {img.findingId} | {img.timestamp}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ds-report-section" style={{ marginTop: '40px' }}>
            <h3 className="ds-report-h3">12. FINAL STATUS</h3>
            <table className="ds-report-table">
              <tbody>
                <tr><td><strong>Inspection</strong></td><td>{report.executiveSummary.inspectionStatus}</td></tr>
                <tr><td><strong>Findings</strong></td><td>{report.executiveSummary.findingsRecorded}</td></tr>
                <tr><td><strong>Confirmed Leaks</strong></td><td>{report.executiveSummary.findingsRecorded}</td></tr>
                <tr><td><strong>Repairs</strong></td><td>{report.executiveSummary.repairsRecorded}</td></tr>
                <tr><td><strong>Verified</strong></td><td>{report.executiveSummary.repairsRecorded}</td></tr>
                <tr><td><strong>Pending</strong></td><td>{report.executiveSummary.findingsRecorded - report.executiveSummary.repairsRecorded}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="ds-report-footer">
            <span>Inspection ID: {report.documentControl.inspectionId} | Report Revision: {report.documentControl.revision} | Page 4 of 4</span>
          </div>
        </div>

      </div>
    </div>
  );
}
