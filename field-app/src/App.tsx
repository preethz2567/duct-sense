// field-app/src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AppContext, Screen } from './store/useAppStore';
import type { Inspection, FloorPlan } from './types';
import StatusBar from './components/StatusBar';
import BottomNav from './components/BottomNav';
import InspectionsScreen from './screens/InspectionsScreen';
import MapScreen from './screens/MapScreen';
import FindingsScreen from './screens/FindingsScreen';
import SyncScreen from './screens/SyncScreen';
import { loadFloorPlans } from './services/floorPlanService';
import { countLocalFindings, attemptSync } from './services/syncService';

export default function App() {
  const [screen, setScreen]                   = useState<Screen>('INSPECTIONS');
  const [activeInspection, setActiveInspection] = useState<Inspection | null>(null);
  const [activeFloorPlan, setActiveFloorPlan]   = useState<FloorPlan | null>(null);
  const [floorPlans, setFloorPlans]             = useState<FloorPlan[]>([]);
  const [online, setOnline]                     = useState(navigator.onLine);
  const [pendingCount, setPendingCount]         = useState(0);

  // Load floor plans when the app shell mounts, or when returning to inspections
  useEffect(() => {
    if (screen === 'INSPECTIONS' || screen === 'MAP') {
      loadFloorPlans().then(setFloorPlans);
    }
  }, [screen]);

  // Update pending count on mount
  useEffect(() => {
    countLocalFindings().then(setPendingCount);
  }, []);

  // Network listeners
  useEffect(() => {
    const handleOnline  = () => { setOnline(true);  attemptSync().then(() => countLocalFindings().then(setPendingCount)); };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const ctx = {
    screen, setScreen,
    activeInspection, setActiveInspection,
    activeFloorPlan, setActiveFloorPlan,
    floorPlans, setFloorPlans,
    online, setOnline,
    pendingCount, setPendingCount,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-shell">
        <StatusBar />
        <main className="app-content">
          {screen === 'INSPECTIONS' && <InspectionsScreen />}
          {screen === 'MAP'         && <MapScreen />}
          {screen === 'FINDINGS'    && <FindingsScreen />}
          {screen === 'SYNC'        && <SyncScreen />}
        </main>
        <BottomNav />
      </div>
    </AppContext.Provider>
  );
}
