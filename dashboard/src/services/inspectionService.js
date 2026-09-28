// src/services/inspectionService.js

export const initialInspectionSession = {
  id: 'INS-1042',
  site: 'North Campus Facility',
  building: 'Building A',
  level: 'Level 2',
  system: 'AHU-02 (Supply Air)',
  technician: 'D. Preethi / Engineering Lead',
  date: '2026-09-28',
  status: 'IN_PROGRESS', // 'IN_PROGRESS', 'COMPLETED'
  operatingMode: 'SIMULATION', // 'LIVE_HARDWARE', 'SIMULATION', 'REPLAY'
  syncStatus: 'ONLINE_SYNCED', // 'ONLINE_SYNCED', 'SYNCING', 'OFFLINE_PENDING'
  lastSyncTime: 'Just now',
  pendingChangesCount: 0,

  sections: [
    { id: 'D-01', name: 'AHU Discharge Trunk', lengthM: 2.4, status: 'VERIFIED_PASS', leakCount: 0, scanTime: '10:15 AM' },
    { id: 'D-02', name: 'Corridor Main Branch', lengthM: 3.1, status: 'VERIFIED_PASS', leakCount: 0, scanTime: '10:28 AM' },
    { id: 'D-03', name: 'Server Room Supply', lengthM: 1.0, status: 'CONFIRMED_LEAK', leakCount: 1, scanTime: '10:44 AM' },
    { id: 'D-04', name: 'Office 101 Branch', lengthM: 2.2, status: 'PENDING', leakCount: 0, scanTime: null },
    { id: 'D-05', name: 'Conference Zone Supply', lengthM: 1.8, status: 'PENDING', leakCount: 0, scanTime: null },
  ],

  activeSectionId: 'D-03',

  // Active Anomaly / Leak State for Section D-03
  activeAnomaly: {
    id: 'LEAK-1042-01',
    sectionId: 'D-03',
    jointName: 'Joint 03',
    positionM: 0.50,
    planLocation: '0.50 m from inlet flange',
    timestamp: '10:44:12',
    status: 'CONFIRMED', // 'POSSIBLE_LEAK', 'CONFIRMED', 'REPAIRED', 'VERIFIED', 'DISMISSED'
    evidence: {
      pressureAvailable: true,
      pressurePa: 205.8,
      pressureRating: 'Strong',
      pductHpa: 1015.35,
      pambientHpa: 1013.25,
      calibratedDeltaPPa: 205.8,
      thermalAvailable: true,
      thermalScore: 0.86,
      thermalRating: 'Strong',
      maxTempC: 31.4,
      refTempC: 22.1,
      deltaTC: 9.3,
      acousticAvailable: true,
      acousticScore: 0.74,
      acousticRating: 'Audible Turbulence',
      agreement: '3 / 3 modalities supporting anomaly',
    },
    fieldPhotos: [
      {
        id: 'photo-01',
        type: 'INITIAL_DEFECT',
        label: 'Field Photo · Suspected Leak Seam',
        timestamp: '10:44:30',
        planLocation: '0.50 m',
        url: null, // fallback placeholder
      },
    ],
    repair: {
      required: true,
      action: 'Joint Flange Resealed with Mastic & Clamp Adjusted',
      repairedAt: '10:46:03',
      repairPhotos: [
        {
          id: 'photo-02',
          type: 'REPAIR_SEAL',
          label: 'Repair Photo · Fresh Mastic Seal & Tightened Clamp',
          timestamp: '10:46:15',
          planLocation: '0.50 m',
          url: null,
        }
      ],
      rescanCompleted: true,
      before: {
        pressurePa: 205.8,
        thermalScore: 0.86,
        acousticScore: 0.74,
        deltaTC: 9.3,
      },
      after: {
        pressurePa: 254.2,
        thermalScore: 0.18,
        acousticScore: 0.15,
        deltaTC: 0.8,
      },
      verified: true,
      verifiedAt: '10:47:22',
      verificationResult: 'PASS',
    },
  },

  // Telemetry Snapshot
  telemetry: {
    pductHpa: 1015.35,
    pambientHpa: 1013.25,
    rawDeltaPPa: 210.0,
    calibrationOffsetPa: 4.2,
    calibratedDeltaPPa: 205.8,
    thermalScore: 0.86,
    acousticScore: 0.74,
    fusedConfidence: 0.86,
    tempMaxC: 31.4,
    tempRefC: 22.1,
    deltaTC: 9.3,
  },

  timeline: [
    { time: '10:10:00', type: 'SYSTEM', label: 'Inspection session INS-1042 initialized', sectionId: 'D-01' },
    { time: '10:15:22', type: 'SECTION', label: 'Section D-01 scanned — No defects found (PASS)', sectionId: 'D-01', result: 'PASS' },
    { time: '10:28:45', type: 'SECTION', label: 'Section D-02 scanned — No defects found (PASS)', sectionId: 'D-02', result: 'PASS' },
    { time: '10:43:18', type: 'NAV', label: 'Technician selected Section D-03 (Server Room Supply)', sectionId: 'D-03' },
    { time: '10:44:07', type: 'ANOMALY', label: 'Thermal contrast detected at joint seam (0.50 m)', sectionId: 'D-03', evidence: 'Thermal: 0.86' },
    { time: '10:44:12', type: 'ANOMALY', label: 'Differential pressure drop and acoustic turbulence registered', sectionId: 'D-03', evidence: 'ΔP: +205.8 Pa · Acoustic: 0.74' },
    { time: '10:44:30', type: 'PHOTO', label: 'Field photo captured and attached to Section D-03', sectionId: 'D-03' },
    { time: '10:44:50', type: 'CONFIRM', label: 'Leak confirmed by technician at position 0.50 m', sectionId: 'D-03' },
    { time: '10:46:03', type: 'REPAIR', label: 'Remediation completed: Mastic applied & clamp tightened', sectionId: 'D-03' },
    { time: '10:46:15', type: 'PHOTO', label: 'Post-repair photo attached to Section D-03', sectionId: 'D-03' },
    { time: '10:47:14', type: 'RESCAN', label: 'Post-repair rescan sequence completed', sectionId: 'D-03' },
    { time: '10:47:22', type: 'VERIFY', label: 'Repair verified: All modalities nominal (PASS)', sectionId: 'D-03', result: 'VERIFIED' },
  ],
};

export const recentInspectionsList = [
  {
    id: 'INS-1042',
    site: 'North Campus Facility · Building A · Level 2',
    system: 'AHU-02 (Supply Air)',
    technician: 'D. Preethi',
    date: '2026-09-28',
    totalSections: 5,
    inspectedSections: 3,
    leakCount: 1,
    repairedCount: 1,
    status: 'IN_PROGRESS',
    active: true,
  },
  {
    id: 'INS-1041',
    site: 'North Campus Facility · Building B · Level 1',
    system: 'AHU-01 (Main Return)',
    technician: 'D. Preethi',
    date: '2026-09-27',
    totalSections: 6,
    inspectedSections: 6,
    leakCount: 0,
    repairedCount: 0,
    status: 'COMPLETED_PASS',
    active: false,
  },
  {
    id: 'INS-1040',
    site: 'Tech Innovation Hub · West Wing · Level 4',
    system: 'AHU-05 (Cleanroom Supply)',
    technician: 'M. Senthil',
    date: '2026-09-26',
    totalSections: 8,
    inspectedSections: 8,
    leakCount: 2,
    repairedCount: 2,
    status: 'COMPLETED_VERIFIED',
    active: false,
  },
  {
    id: 'INS-1039',
    site: 'Civic Center · Block C · Basement 1',
    system: 'AHU-03 (Exhaust Trunk)',
    technician: 'R. Kumar',
    date: '2026-09-24',
    totalSections: 4,
    inspectedSections: 4,
    leakCount: 0,
    repairedCount: 0,
    status: 'COMPLETED_PASS',
    active: false,
  },
];

export const pocPrototypeDuct = {
  id: 'D-03',
  name: 'POC 1.0 m Prototype Duct Rig',
  lengthM: 1.0,
  diameterMm: 100, // 4-inch diameter
  blowerFanPositionM: 0.0,
  staticTapPositionM: 0.15,
  controlledLeakPositionM: 0.50,
  endCapPositionM: 1.0,
};
