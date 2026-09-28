// src/services/mockDataService.js

export const initialCalibrationData = {
  pduct_sensor_id: 'BMP280-0x76 (Duct Tap)',
  pambient_sensor_id: 'BMP280-0x77 (Ambient)',
  current_offset_pa: 4.2,
  baseline_mean_pa: 101324.5,
  baseline_std_pa: 0.8,
  calibrated_at: '2026-09-28 10:15:00 UTC',
  status: 'CALIBRATED',
};

export const initialDetectionConfig = {
  pressure_threshold_pa: 20.0,
  thermal_threshold: 0.60,
  acoustic_threshold: 0.50,
  fusion_threshold: 0.65,
  persistence_duration_s: 1.5,
  moving_average_window: 5,
};

export const initialHardwareStatus = [
  { id: 'bmp-1', name: 'BMP280 #1', role: 'Pduct (Duct Static Tap)', bus: 'I2C-1 (0x76)', status: 'CONNECTED', health: 99 },
  { id: 'bmp-2', name: 'BMP280 #2', role: 'Pambient (Room Reference)', bus: 'I2C-1 (0x77)', status: 'CONNECTED', health: 99 },
  { id: 'inmp-1', name: 'INMP441 #1', role: 'Left Acoustic Channel', bus: 'I2S-0 (Audible range)', status: 'CONNECTED', health: 97 },
  { id: 'inmp-2', name: 'INMP441 #2', role: 'Right Acoustic Channel', bus: 'I2S-0 (Audible range)', status: 'CONNECTED', health: 96 },
  { id: 'flir-1', name: 'FLIR Thermal Camera', role: 'Thermal Camera', bus: 'SPI-0 / I2C-0', status: 'CAPTURED_FRAME_MODE', health: 100 },
  { id: 'rpi-1', name: 'Raspberry Pi 4B', role: 'Edge Processor & Fusion', bus: 'ARMv8 1.5GHz / 4GB', status: 'CONNECTED', health: 100 },
  { id: 'oled-1', name: 'SSD1306 OLED', role: 'Local Status Display', bus: 'I2C-1 (0x3C)', status: 'CONNECTED', health: 100 },
];

export const sampleEventLog = [
  { id: 1, timestamp: '14:20:01', event: 'System Start', pduct: 1013.25, pambient: 1013.21, deltaP: 0.0, audio: 0.08, thermal: 0.12, confidence: 0.05, status: 'Normal', isSimulated: true },
  { id: 2, timestamp: '14:20:15', event: 'Calibration Baseline', pduct: 1013.28, pambient: 1013.24, deltaP: 0.1, audio: 0.09, thermal: 0.11, confidence: 0.06, status: 'Normal', isSimulated: true },
  { id: 3, timestamp: '14:21:00', event: 'Fan ON (Pressurized)', pduct: 1015.80, pambient: 1013.22, deltaP: 253.8, audio: 0.22, thermal: 0.15, confidence: 0.12, status: 'Normal', isSimulated: true },
  { id: 4, timestamp: '14:22:30', event: 'Scan Started (0–1m POC Duct)', pduct: 1015.75, pambient: 1013.23, deltaP: 247.8, audio: 0.25, thermal: 0.18, confidence: 0.15, status: 'Normal', isSimulated: true },
  { id: 5, timestamp: '14:23:45', event: 'Controlled Leak Port Opened', pduct: 1015.42, pambient: 1013.25, deltaP: 212.8, audio: 0.62, thermal: 0.55, confidence: 0.58, status: 'Warning', isSimulated: true },
  { id: 6, timestamp: '14:24:12', event: 'Leak Detected (@0.50m)', pduct: 1015.38, pambient: 1013.24, deltaP: 209.8, audio: 0.74, thermal: 0.82, confidence: 0.83, status: 'Leak Detected', isSimulated: true },
  { id: 7, timestamp: '14:25:05', event: 'Leak Confirmed (Pos 0.52m)', pduct: 1015.35, pambient: 1013.25, deltaP: 205.8, audio: 0.78, thermal: 0.86, confidence: 0.86, status: 'Leak Detected', isSimulated: true },
  { id: 8, timestamp: '14:26:30', event: 'Leak Closed / Sealed', pduct: 1015.78, pambient: 1013.22, deltaP: 251.8, audio: 0.24, thermal: 0.35, confidence: 0.22, status: 'Resolved', isSimulated: true },
  { id: 9, timestamp: '14:28:00', event: 'Inspection Complete', pduct: 1015.82, pambient: 1013.23, deltaP: 254.8, audio: 0.20, thermal: 0.14, confidence: 0.08, status: 'Normal', isSimulated: true },
];

export const pocPrototypeDuct = {
  lengthM: 1.0,
  diameterMm: 150,
  tapPositionM: 0.15,
  controlledLeakPosM: 0.50,
  scanRangeM: [0.0, 1.0],
};

export const floorPlanDucts = [
  { id: 'D-01', name: 'AHU Main Supply Trunk', start: [80, 180], end: [320, 180], section: 'Trunk', flow: 'East', diameterMm: 450 },
  { id: 'D-02', name: 'North Branch (Office A)', start: [220, 180], end: [220, 80], section: 'Branch A', flow: 'North', diameterMm: 300 },
  { id: 'D-03', name: 'South Branch (Server Room)', start: [320, 180], end: [320, 310], section: 'Branch B', flow: 'South', diameterMm: 350 },
  { id: 'D-04', name: 'East Trunk Extension', start: [320, 180], end: [560, 180], section: 'Trunk Ext', flow: 'East', diameterMm: 400 },
  { id: 'D-05', name: 'Conference Branch', start: [460, 180], end: [460, 80], section: 'Branch C', flow: 'North', diameterMm: 250 },
  { id: 'D-06', name: 'Open Office Supply', start: [560, 180], end: [560, 310], section: 'Branch D', flow: 'South', diameterMm: 300 },
];

export const floorPlanRooms = [
  { id: 'R-AHU', name: 'AHU Mechanical Room', x: 40, y: 120, width: 90, height: 120, type: 'mech' },
  { id: 'R-101', name: 'Office 101 (Zone A)', x: 160, y: 40, width: 140, height: 110, type: 'office' },
  { id: 'R-102', name: 'Conference Room Alpha', x: 380, y: 40, width: 160, height: 110, type: 'conf' },
  { id: 'R-SRV', name: 'Server & Comms Hub', x: 250, y: 230, width: 150, height: 120, type: 'server' },
  { id: 'R-103', name: 'Open Workspace (Zone B)', x: 440, y: 220, width: 180, height: 130, type: 'office' },
  { id: 'R-COR', name: 'Main Corridor', x: 130, y: 150, width: 500, height: 60, type: 'corridor' },
];

export const defaultLeakTarget = {
  ductId: 'POC-1M',
  ductName: '1-Metre POC Prototype Duct',
  positionM: 0.52,
  refDistanceM: 0.52,
  confidence: 0.86,
  severity: 'HIGH',
  status: 'LEAK_DETECTED',
  timestamp: '14:25:05',
  pductHpa: 1015.35,
  pambientHpa: 1013.25,
  deltaPPa: 205.8,
  thermalScore: 0.86,
  audioScore: 0.78,
  maxTempC: 31.4,
  refTempC: 22.1,
  deltaTC: 9.3,
  floorPlanCoords: [350, 200],
  isSimulated: true,
};
