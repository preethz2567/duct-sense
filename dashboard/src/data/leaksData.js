/**
 * leaksData.js
 * Default test dataset and helper utilities for DuctSense Spatial Viewer.
 */

export const SEVERITY_CONFIG = {
  Critical: {
    label: 'Critical',
    minConfidence: 85,
    maxConfidence: 100,
    color: '#D32F2F',
    bgColor: 'rgba(211, 47, 47, 0.15)',
    borderColor: '#D32F2F',
    textColor: '#FF5252',
    badgeClass: 'severity-critical',
    pulse: true,
  },
  High: {
    label: 'High',
    minConfidence: 70,
    maxConfidence: 84.99,
    color: '#E53935',
    bgColor: 'rgba(229, 57, 53, 0.15)',
    borderColor: '#E53935',
    textColor: '#FF6E6A',
    badgeClass: 'severity-high',
    pulse: true,
  },
  Medium: {
    label: 'Medium',
    minConfidence: 50,
    maxConfidence: 69.99,
    color: '#FB8C00',
    bgColor: 'rgba(251, 140, 0, 0.15)',
    borderColor: '#FB8C00',
    textColor: '#FFB74D',
    badgeClass: 'severity-medium',
    pulse: false,
  },
  Low: {
    label: 'Low',
    minConfidence: 30,
    maxConfidence: 49.99,
    color: '#4CAF50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: '#4CAF50',
    textColor: '#81C784',
    badgeClass: 'severity-low',
    pulse: false,
  },
  'No Leak': {
    label: 'No Leak',
    minConfidence: 0,
    maxConfidence: 29.99,
    color: '#FFFFFF',
    bgColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#00E5FF',
    textColor: '#0000B3',
    badgeClass: 'severity-none',
    pulse: false,
  },
};

/**
 * Computes fused confidence score using weighted average:
 * Thermal Weight: 0.4 (40%)
 * Pressure Weight: 0.3 (30%)
 * Audio Weight: 0.3 (30%)
 */
export function computeFusedConfidence(thermalConf = 0, pressureConf = 0, audioConf = 0) {
  const t = Math.max(0, Math.min(100, Number(thermalConf) || 0));
  const p = Math.max(0, Math.min(100, Number(pressureConf) || 0));
  const a = Math.max(0, Math.min(100, Number(audioConf) || 0));

  const fused = (t * 0.4) + (p * 0.3) + (a * 0.3);
  return Math.round(fused * 10) / 10;
}

/**
 * Automatically determine severity category based on fused confidence percentage:
 * - Critical: >= 85%
 * - High: 70% - 84%
 * - Medium: 50% - 69%
 * - Low: 30% - 49%
 * - No Leak: < 30%
 */
export function determineSeverity(fusedConfidence) {
  const score = Number(fusedConfidence) || 0;
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 30) return 'Low';
  return 'No Leak';
}

export const INITIAL_ROOM_OPTIONS = [
  'Room 1851',
  'Room 1852',
  'Room 1731',
  'Room 1732',
  'Room 1541',
  'Room 1542',
  'Room 1453',
  'Room 1454',
  'Room 1371',
  'Room 1372',
  'LIBRARY',
  'Main Conference Room',
  'Server Room A',
  'West Corridor Vent',
  'East Corridor Return',
];

export const INITIAL_LEAKS = [
  {
    id: 'leak-1851',
    roomNumber: 'Room 1851',
    xPercent: 19.92,
    yPercent: 47.41,
    thermalConfidence: 95,
    thermalImagePath: '/assets/thermal/room_1851.jpg',
    pressureConfidence: 90,
    pressureValuePa: 86.4,
    audioConfidence: 90,
    audioValueDb: 78.2,
    fusedConfidence: 92.0,
    severity: 'Critical',
    timestamp: '2026-09-28 14:32:01',
    inspector: 'Sensor Node T-04',
    notes: 'Severe acoustic hissing and high-temperature thermal plume detected at duct joint seam.',
  },
  {
    id: 'leak-1731',
    roomNumber: 'Room 1731',
    xPercent: 19.92,
    yPercent: 54.94,
    thermalConfidence: 82,
    thermalImagePath: '/assets/thermal/room_1731.jpg',
    pressureConfidence: 76,
    pressureValuePa: 68.0,
    audioConfidence: 74,
    audioValueDb: 64.5,
    fusedConfidence: 77.8,
    severity: 'High',
    timestamp: '2026-09-28 14:18:32',
    inspector: 'Sensor Node T-09',
    notes: 'Significant pressure drop and localized thermal bloom near connector flange.',
  },
  {
    id: 'leak-1541',
    roomNumber: 'Room 1541',
    xPercent: 41.94,
    yPercent: 65.59,
    thermalConfidence: 65,
    thermalImagePath: '/assets/thermal/room_1541.jpg',
    pressureConfidence: 60,
    pressureValuePa: 42.5,
    audioConfidence: 60,
    audioValueDb: 52.0,
    fusedConfidence: 62.0,
    severity: 'Medium',
    timestamp: '2026-09-28 11:43:10',
    inspector: 'Sensor Node M-12',
    notes: 'Moderate warm thermal signature around square damper enclosure.',
  },
  {
    id: 'leak-1453',
    roomNumber: 'Room 1453',
    xPercent: 54.05,
    yPercent: 65.59,
    thermalConfidence: 45,
    thermalImagePath: '/assets/thermal/room_1453.jpg',
    pressureConfidence: 40,
    pressureValuePa: 22.0,
    audioConfidence: 36,
    audioValueDb: 34.0,
    fusedConfidence: 40.8,
    severity: 'Low',
    timestamp: '2026-09-28 11:34:00',
    inspector: 'Sensor Node M-15',
    notes: 'Minor temperature variation detected. Within acceptable maintenance limits.',
  },
  {
    id: 'leak-1371',
    roomNumber: 'Room 1371',
    xPercent: 32.86,
    yPercent: 79.99,
    thermalConfidence: 15,
    thermalImagePath: '/assets/thermal/room_1371.jpg',
    pressureConfidence: 20,
    pressureValuePa: 6.5,
    audioConfidence: 20,
    audioValueDb: 18.0,
    fusedConfidence: 18.0,
    severity: 'No Leak',
    timestamp: '2026-09-28 10:45:00',
    inspector: 'Routine Scan',
    notes: 'Uniform temperature distribution and nominal pressure reading.',
  },
  {
    id: 'leak-library',
    roomNumber: 'LIBRARY',
    xPercent: 51.02,
    yPercent: 78.91,
    thermalConfidence: 5,
    thermalImagePath: '/assets/thermal/library.jpg',
    pressureConfidence: 10,
    pressureValuePa: 2.1,
    audioConfidence: 10,
    audioValueDb: 15.0,
    fusedConfidence: 8.0,
    severity: 'No Leak',
    timestamp: '2026-09-28 10:45:00',
    inspector: 'Routine Scan',
    notes: 'Air handling unit nominal. No anomalies detected.',
  },
];

/**
 * Continuous main duct paths along corridors (SVG coordinates in viewBox 0 0 1817 2255)
 */
export const DUCT_PATH_DATA = {
  // Main continuous corridor network
  mainLoop: `
    M 472 444
    L 1372 444
    L 1372 1730
    L 472 1730
    Z
  `,
  // Cross corridor spines and distribution branches
  corridorSpines: [
    // North wing branches
    'M 472 280 L 472 444',
    'M 922 280 L 922 444',
    'M 1372 280 L 1372 444',

    // Mid-North cross corridor
    'M 472 804 L 1372 804',

    // Mid-South cross corridor
    'M 472 1344 L 1372 1344',

    // Central vertical spines
    'M 682 444 L 682 1730',
    'M 922 804 L 922 1730',
    'M 1162 444 L 1162 1730',

    // Room feeder drop branches
    'M 472 1069 L 362 1069', // Room 1851 branch
    'M 472 1239 L 362 1239', // Room 1731 branch
    'M 682 1344 L 762 1479', // Room 1541 branch
    'M 922 1344 L 982 1479', // Room 1453 branch
    'M 472 1730 L 597 1804', // Room 1371 branch
    'M 922 1730 L 927 1779', // Library branch
    'M 1372 1069 L 1485 1069', // East wing room branch
    'M 1372 1239 L 1485 1239', // East wing room branch
    'M 1372 1444 L 1485 1444', // East wing lower branch
  ],
};
