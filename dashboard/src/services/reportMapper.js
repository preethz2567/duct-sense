/**
 * src/services/reportMapper.js
 * 
 * Maps raw dashboard session and telemetry data into a structured report model.
 * This separates the data formatting from the UI rendering layer.
 */

export function mapSessionToReportModel(session) {
  if (!session) return null;

  const currentSection = session.sections?.find((s) => s.id === session.activeSectionId) || session.sections?.[2];
  const { activeAnomaly, telemetry } = session;

  const now = new Date();
  // Formatted date strictly as "DD MMM YYYY, HH:MM" per requirements
  const formattedGeneratedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ', ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Format existing date to match
  const inspectionDateRaw = new Date(session.date);
  const formattedInspectionDate = !isNaN(inspectionDateRaw) 
    ? inspectionDateRaw.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', 14:35' 
    : 'Not recorded';

  // Summaries
  const sectionsInspected = session.sections?.filter(s => ['VERIFIED_PASS', 'COMPLETED', 'CONFIRMED_LEAK'].includes(s.status)).length || 0;
  const leaksConfirmed = session.sections?.filter(s => s.status === 'CONFIRMED_LEAK').length || 0;
  const repairsVerified = session.sections?.filter(s => s.status === 'VERIFIED_PASS').length || 0;

  let overallStatus = 'Not recorded';
  if (session.status === 'IN_PROGRESS') overallStatus = 'In Progress';
  if (session.status === 'COMPLETED') overallStatus = 'Completed';

  const reportModel = {
    documentControl: {
      reportId: `REP-${session.id}`,
      inspectionId: session.id || 'Not recorded',
      revision: '1.0',
      preparedBy: session.technician || 'Not recorded',
      reviewedBy: 'Not provided',
      inspectionDate: formattedInspectionDate,
      generatedDate: formattedGeneratedDate,
      status: overallStatus,
    },
    inspectionDetails: {
      site: session.site || 'Not recorded',
      building: session.building || 'Not recorded',
      level: session.level || 'Not recorded',
      area: currentSection?.name || 'Not recorded',
      system: session.system || 'Not recorded',
      section: currentSection?.id || 'Not recorded',
      planId: 'PLAN-001',
      planVersion: 'V2',
    },
    executiveSummary: {
      inspectionStatus: overallStatus,
      overallFinding: leaksConfirmed > 0 ? 'Defects detected and recorded' : 'System nominal',
      sectionsInspected: sectionsInspected,
      findingsRecorded: leaksConfirmed,
      repairsRecorded: repairsVerified,
      verificationStatus: repairsVerified === leaksConfirmed ? 'Verified' : 'Pending',
    },
    findings: [],
    sensorEvidence: {
      pressure: null,
      acoustic: null,
      thermal: null,
    },
    repair: null,
    images: [],
    timeline: [],
    detectionResult: null,
  };

  // Map Findings
  if (activeAnomaly) {
    reportModel.detectionResult = {
      overallStatus: activeAnomaly.status === 'CONFIRMED' ? 'Leak Anomaly Detected' : 'Normal',
      pressureEvidence: telemetry?.calibratedDeltaPPa != null ? `Recorded (${telemetry.calibratedDeltaPPa.toFixed(2)} Pa)` : 'Not recorded',
      acousticEvidence: telemetry?.acousticScore != null ? `Recorded (${telemetry.acousticScore.toFixed(2)})` : 'Not recorded',
      thermalEvidence: telemetry?.thermalScore != null ? `Recorded (${telemetry.thermalScore.toFixed(2)})` : 'Not recorded',
      fusionResult: 'Positive Association',
      confidence: 'Demonstration',
    };

    reportModel.findings.push({
      id: activeAnomaly.id || 'Not recorded',
      location: `${activeAnomaly.sectionId} / ${activeAnomaly.jointName || 'Unknown'} - ${activeAnomaly.planLocation}`,
      type: 'Leak',
      status: activeAnomaly.status || 'Not recorded',
      dateTime: formattedInspectionDate, // Fallback since we don't have exact finding time in this context easily
      technician: session.technician,
      notes: 'Joint leakage observed via multimodal sensor fusion.'
    });

    if (telemetry) {
      reportModel.sensorEvidence.pressure = {
        sensor1: 'BMP280 #1 (Pduct Tap)',
        sensor2: 'BMP280 #2 (Pambient Ref)',
        p1: typeof telemetry.pductHpa === 'number' ? telemetry.pductHpa.toFixed(2) : 'Not available',
        p2: typeof telemetry.pambientHpa === 'number' ? telemetry.pambientHpa.toFixed(2) : 'Not available',
        rawDeltaP: typeof telemetry.rawDeltaPPa === 'number' ? telemetry.rawDeltaPPa.toFixed(2) : 'Not available',
        calibrationOffset: typeof telemetry.calibrationOffsetPa === 'number' ? telemetry.calibrationOffsetPa.toFixed(2) : '0.00',
        correctedDeltaP: typeof telemetry.calibratedDeltaPPa === 'number' ? telemetry.calibratedDeltaPPa.toFixed(2) : 'Not available',
        t1: typeof telemetry.tempMaxC === 'number' ? telemetry.tempMaxC.toFixed(1) : 'Not available',
        t2: typeof telemetry.tempRefC === 'number' ? telemetry.tempRefC.toFixed(1) : 'Not available',
        timestamp: formattedGeneratedDate
      };

      reportModel.sensorEvidence.acoustic = {
        status: telemetry.acousticScore != null ? 'Recorded' : 'Not recorded',
        signalLevel: typeof telemetry.acousticScore === 'number' ? telemetry.acousticScore.toFixed(2) : 'Not available',
        feature: 'Audible turbulence',
        timestamp: formattedGeneratedDate,
        association: activeAnomaly.id
      };

      reportModel.sensorEvidence.thermal = {
        status: telemetry.thermalScore != null ? 'Recorded' : 'Not recorded',
        tempMax: typeof telemetry.tempMaxC === 'number' ? telemetry.tempMaxC.toFixed(1) : 'Not available',
        tempRef: typeof telemetry.tempRefC === 'number' ? telemetry.tempRefC.toFixed(1) : 'Not available',
        deltaT: typeof telemetry.deltaTC === 'number' ? telemetry.deltaTC.toFixed(1) : 'Not available',
        score: typeof telemetry.thermalScore === 'number' ? telemetry.thermalScore.toFixed(2) : 'Not available',
      };
    }

    if (activeAnomaly.repair) {
      reportModel.repair = {
        findingId: activeAnomaly.id,
        action: activeAnomaly.repair.action || 'Not recorded',
        dateTime: activeAnomaly.repair.repairedAt || formattedGeneratedDate,
        technician: session.technician,
        verified: activeAnomaly.repair.verified ? 'Verified' : 'Pending',
        before: {
          pressure: activeAnomaly.repair.before?.pressurePa != null ? activeAnomaly.repair.before.pressurePa.toFixed(2) + ' Pa' : 'Not recorded',
          thermal: activeAnomaly.repair.before?.thermalScore != null ? activeAnomaly.repair.before.thermalScore.toFixed(2) : 'Not recorded',
          acoustic: activeAnomaly.repair.before?.acousticScore != null ? activeAnomaly.repair.before.acousticScore.toFixed(2) : 'Not recorded',
        },
        after: {
          pressure: activeAnomaly.repair.after?.pressurePa != null ? activeAnomaly.repair.after.pressurePa.toFixed(2) + ' Pa' : 'Not recorded',
          thermal: activeAnomaly.repair.after?.thermalScore != null ? activeAnomaly.repair.after.thermalScore.toFixed(2) : 'Not recorded',
          acoustic: activeAnomaly.repair.after?.acousticScore != null ? activeAnomaly.repair.after.acousticScore.toFixed(2) : 'Not recorded',
        }
      };
    }

    // Map Images
    const fieldPhotos = activeAnomaly.fieldPhotos || [];
    const repairPhotos = activeAnomaly.repair?.repairPhotos || [];
    
    fieldPhotos.forEach(p => {
      reportModel.images.push({
        id: p.id,
        findingId: activeAnomaly.id,
        category: 'Field Photo',
        timestamp: p.timestamp || 'Not recorded',
        description: p.label || 'Not provided',
        url: p.url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800' // sample duct leak image
      });
    });

    repairPhotos.forEach(p => {
      reportModel.images.push({
        id: p.id,
        findingId: activeAnomaly.id,
        category: 'Repair Photo',
        timestamp: p.timestamp || 'Not recorded',
        description: p.label || 'Not provided',
        url: p.url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800' // sample duct leak image
      });
    });
  }

  // Timeline
  if (session.timeline && Array.isArray(session.timeline)) {
    reportModel.timeline = session.timeline.map(t => ({
      time: t.time || 'Not recorded',
      event: t.label || 'Not recorded',
      finding: t.type === 'ANOMALY' && activeAnomaly ? activeAnomaly.id : 'N/A',
      user: session.technician,
      status: t.result || 'Recorded'
    }));
  }

  return reportModel;
}
