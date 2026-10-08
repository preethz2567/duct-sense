// src/services/floorPlanService.js
import { API_BASE } from './apiService';

/**
 * Service to fetch and manage floor plans.
 * The dashboard loads plans from the centralized backend static files,
 * ensuring it sees exactly what the field app sees.
 */

export async function fetchFloorPlans() {
  const url = `${API_BASE}/floor-plans/plans.json`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch floor plans: ${res.status}`);
    }
    const data = await res.json();
    
    // Normalize relative paths to absolute backend URLs
    return data.plans.map(p => ({
      ...p,
      url: `${API_BASE}/floor-plans/${p.filename}`,
      type: p.filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
    }));
  } catch (err) {
    console.error('Error fetching floor plans:', err);
    return [];
  }
}
