// src/services/apiService.js
import {
  initialCalibrationData,
  initialDetectionConfig,
  initialHardwareStatus,
  sampleEventLog,
} from './mockDataService';

export const API_BASE = 'http://localhost:8000';

export async function fetchFindings() {
  const res = await fetch(`${API_BASE}/findings`);
  if (!res.ok) {
    throw new Error(`Server responded with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchInspections() {
  const res = await fetch(`${API_BASE}/inspections`);
  if (!res.ok) {
    throw new Error(`Server responded with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchCalibrationData() {
  // If backend endpoint is added in the future, fetch here. Otherwise return engineering POC baseline.
  return { ...initialCalibrationData };
}

export async function fetchDetectionConfig() {
  return { ...initialDetectionConfig };
}

export async function fetchHardwareStatus() {
  return [...initialHardwareStatus];
}

export async function fetchEventLogs() {
  return [...sampleEventLog];
}
