import React, { createContext, useContext, useState, useEffect } from 'react';

// CENTRALIZED DEMO DATA CONFIGURATION
// These temporary demonstration values will be replaced by actual sensor telemetry
// once the real IoT hardware integration is complete.
const DEMO_DATA_CONFIG = {
  normal: {
    systemStatus: 'NORMAL',
    telemetry: {
      pductHpa: 1015.35,
      pambientHpa: 1013.25,
      calibratedDeltaPPa: 35.5, // Stable baseline
      thermalScore: 0.12,       // Normal thermal
      acousticScore: 0.15,      // Normal acoustic
      fusedConfidence: 0.10,
      tempMaxC: 22.4,
      tempRefC: 22.1,
      deltaTC: 0.3,
    },
    activeAnomaly: null, // No active leak
  },
  leak: {
    systemStatus: 'LEAK DETECTED',
    telemetry: {
      pductHpa: 1015.35,
      pambientHpa: 1013.25,
      calibratedDeltaPPa: 34.4, // Drop indicating leak
      thermalScore: 0.86,       // High contrast
      acousticScore: 0.74,      // Audible turbulence
      fusedConfidence: 0.86,
      tempMaxC: 31.4,
      tempRefC: 22.1,
      deltaTC: 9.3,
    },
    activeAnomaly: {
      id: 'LEAK-1042-01',
      sectionId: 'D-03',
      jointName: 'Joint 03',
      positionM: 0.50,
      planLocation: '0.50 m from inlet flange',
      status: 'CONFIRMED',
      evidence: {
        pressureAvailable: true,
        calibratedDeltaPPa: 34.4,
        thermalAvailable: true,
        thermalScore: 0.86,
        acousticAvailable: true,
        acousticScore: 0.74,
      },
      repair: null, // No repair yet
      fieldPhotos: []
    }
  }
};

const SensorDataContext = createContext(null);

/**
 * DemoDataProvider
 * 
 * NOTE FOR FUTURE INTEGRATION:
 * This provider handles the temporary POC internal state (Normal vs Leak).
 * Eventually, RealSensorDataProvider will replace this component, reading from
 * WebSockets or REST endpoints instead of keyboard events.
 * 
 * Replace usage in App.jsx when the hardware is ready.
 */
export function DemoDataProvider({ children }) {
  const [demoState, setDemoState] = useState('normal'); // 'normal' | 'leak'

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events when typing into inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        setDemoState('normal');
      } else if (e.key === 'l' || e.key === 'L') {
        setDemoState('leak');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentData = DEMO_DATA_CONFIG[demoState];

  return (
    <SensorDataContext.Provider value={{ demoState, currentData }}>
      {children}
    </SensorDataContext.Provider>
  );
}

export function useSensorData() {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within DemoDataProvider or RealSensorDataProvider');
  }
  return context;
}
