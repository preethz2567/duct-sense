// src/services/apiService.js
import {
  initialCalibrationData,
  initialDetectionConfig,
  initialHardwareStatus,
  sampleEventLog,
} from './mockDataService';

export const API_BASE = 'http://localhost:8000';

/**
 * Normalizes FastAPI walkthroughs
 */
export function normalizeWalkthrough(raw) {
  return {
    walkthrough_id: raw.walkthrough_id,
    date: raw.date,
    leak_events: Array.isArray(raw.events) ? raw.events : [],
  };
}

export async function fetchWalkthroughs() {
  const res = await fetch(`${API_BASE}/walkthroughs`);
  if (!res.ok) {
    throw new Error(`Server responded with HTTP ${res.status}`);
  }
  const raw = await res.json();
  return raw.map(normalizeWalkthrough);
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
