// src/App.jsx
// src/App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EvidenceDrawer from './components/EvidenceDrawer';
import PhotoCaptureModal from './components/PhotoCaptureModal';
import InspectionWorkflowModal from './components/InspectionWorkflowModal';

import InspectionsPage from './pages/InspectionsPage';
import ActiveInspectionPage from './pages/ActiveInspectionPage';
import UnifiedEvidencePage from './pages/UnifiedEvidencePage';
import CommissioningReport from './pages/CommissioningReport';
import SyncPage from './pages/SyncPage';
import EngineeringPage from './pages/EngineeringPage';
import SpatialViewer from './components/spatial-viewer';
import ThermalMLTest from './pages/ThermalMLTest';
import PressureTest from './pages/PressureTest';

import { initialInspectionSession } from './services/inspectionService';
import { fetchFindings, fetchInspections } from './services/apiService';
import { fetchFloorPlans } from './services/floorPlanService';
import { useSensorData } from './services/DemoDataProvider';
import './App.css';

export default function App() {
  const { demoState, currentData } = useSensorData();
  const [activePage, setActivePage] = useState('inspections'); // 'inspections', 'map', 'evidence', 'reports', 'sync', 'engineering'
  const [session, setSession] = useState(initialInspectionSession);
  const [findings, setFindings] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals / Drawers state
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);
  const [photoType, setPhotoType] = useState('DEFECT_INITIAL');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  // Initial Fetch from FastAPI
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [plansRes, fRes, iRes] = await Promise.all([
          fetchFloorPlans(),
          fetchFindings().catch(() => []),
          fetchInspections().catch(() => [])
        ]);
        
        if (!cancelled) {
          setFloorPlans(plansRes);
          setFindings(fRes);
          setInspections(iRes);
        }
      } catch (err) {
        console.error('Error loading initial data', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // 3-Second Silent Polling
  useEffect(() => {
    if (loading) return;

    const intervalId = setInterval(async () => {
      try {
        const [fRes, iRes] = await Promise.all([
          fetchFindings(),
          fetchInspections()
        ]);
        
        setFindings((prev) => JSON.stringify(prev) === JSON.stringify(fRes) ? prev : fRes);
        setInspections((prev) => JSON.stringify(prev) === JSON.stringify(iRes) ? prev : iRes);
        setSession((s) => ({ ...s, syncStatus: 'ONLINE_SYNCED', lastSyncTime: 'Just now' }));
      } catch {
        setSession((s) => ({ ...s, syncStatus: 'OFFLINE_PENDING' }));
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loading]);

  const [liveTelemetry, setLiveTelemetry] = useState(currentData.telemetry);

  // Smoothly transition telemetry values for POC demo effect
  useEffect(() => {
    let start = Date.now();
    const duration = 1000; // 1 second transition
    const initial = { ...liveTelemetry };
    const target = currentData.telemetry;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      
      setLiveTelemetry({
        ...target,
        calibratedDeltaPPa: initial.calibratedDeltaPPa + (target.calibratedDeltaPPa - initial.calibratedDeltaPPa) * progress,
        thermalScore: initial.thermalScore + (target.thermalScore - initial.thermalScore) * progress,
        acousticScore: initial.acousticScore + (target.acousticScore - initial.acousticScore) * progress,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [currentData.telemetry]);

  // Combine real session data with demo sensor values
  const displaySession = React.useMemo(() => {
    let mergedAnomaly = session.activeAnomaly;
    
    if (demoState === 'leak' && currentData.activeAnomaly) {
      mergedAnomaly = {
        ...(session.activeAnomaly || {}),
        ...currentData.activeAnomaly,
        evidence: {
          ...(session.activeAnomaly?.evidence || {}),
          ...currentData.activeAnomaly.evidence,
        },
        fieldPhotos: session.activeAnomaly?.fieldPhotos || [],
        repair: session.activeAnomaly?.repair || null,
      };
    } else if (demoState === 'normal') {
      // In normal mode, clear the anomaly or mark as VERIFIED so no alert is shown
      mergedAnomaly = null;
    }

    return {
      ...session,
      telemetry: {
        ...session.telemetry,
        ...liveTelemetry, // Inject simulated/live telemetry
      },
      activeAnomaly: mergedAnomaly,
      systemStatus: currentData.systemStatus, // "NORMAL" or "LEAK DETECTED"
    };
  }, [session, demoState, currentData, liveTelemetry]);

  const handleSelectSection = (sectionId) => {
    setSession((prev) => ({
      ...prev,
      activeSectionId: sectionId,
    }));
  };

  const handleUpdatePlanLocation = (posM) => {
    setSession((prev) => ({
      ...prev,
      activeAnomaly: {
        ...prev.activeAnomaly,
        positionM: posM,
        planLocation: `${posM.toFixed(2)} m from inlet flange`,
      },
    }));
  };

  const handleSavePhoto = (newPhoto) => {
    setSession((prev) => {
      const isRepair = newPhoto.type === 'REPAIR_SEAL';
      if (isRepair) {
        return {
          ...prev,
          activeAnomaly: {
            ...prev.activeAnomaly,
            repair: {
              ...prev.activeAnomaly.repair,
              repairPhotos: [newPhoto, ...(prev.activeAnomaly.repair?.repairPhotos || [])],
            },
          },
        };
      } else {
        return {
          ...prev,
          activeAnomaly: {
            ...prev.activeAnomaly,
            fieldPhotos: [newPhoto, ...(prev.activeAnomaly.fieldPhotos || [])],
          },
        };
      }
    });
  };

  const handleConfirmLeak = () => {
    setSession((prev) => ({
      ...prev,
      activeAnomaly: {
        ...prev.activeAnomaly,
        status: 'CONFIRMED',
      },
      sections: prev.sections.map((s) =>
        s.id === prev.activeSectionId ? { ...s, status: 'CONFIRMED_LEAK', leakCount: 1 } : s
      ),
    }));
    setIsEvidenceDrawerOpen(false);
  };

  const handleDismissAnomaly = () => {
    setSession((prev) => ({
      ...prev,
      activeAnomaly: {
        ...prev.activeAnomaly,
        status: 'DISMISSED',
      },
      sections: prev.sections.map((s) =>
        s.id === prev.activeSectionId ? { ...s, status: 'VERIFIED_PASS', leakCount: 0 } : s
      ),
    }));
    setIsEvidenceDrawerOpen(false);
  };

  const handleUpdateAnomaly = (updated) => {
    setSession((prev) => ({
      ...prev,
      activeAnomaly: updated,
    }));
  };

  const handleSectionComplete = (sectionId) => {
    setSession((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, status: 'VERIFIED_PASS' } : s
      ),
    }));
  };

  const openPhotoCapture = (type = 'DEFECT_INITIAL') => {
    setPhotoType(type);
    setIsPhotoCaptureOpen(true);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'inspections':
        return (
          <InspectionsPage
            session={displaySession}
            onSelectInspection={() => setActivePage('map')}
            onOpenActiveInspection={() => setActivePage('map')}
          />
        );
      case 'map':
        return (
          <ActiveInspectionPage
            session={displaySession}
            floorPlans={floorPlans}
            findings={findings}
            onSelectSection={handleSelectSection}
            onOpenEvidenceDrawer={() => setIsEvidenceDrawerOpen(true)}
            onOpenPhotoCapture={() => openPhotoCapture('DEFECT_INITIAL')}
            onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
            onUpdatePlanLocation={handleUpdatePlanLocation}
          />
        );
      case 'evidence':
        return (
          <UnifiedEvidencePage
            session={displaySession}
            onOpenPhotoCapture={() => openPhotoCapture('DEFECT_INITIAL')}
          />
        );
      case 'reports':
        return <CommissioningReport session={displaySession} />;
      case 'sync':
        return (
          <SyncPage
            session={displaySession}
            onTriggerSync={() => {
              setSession((s) => ({ ...s, syncStatus: 'ONLINE_SYNCED', lastSyncTime: 'Just now' }));
            }}
          />
        );
      case 'engineering':
        return <EngineeringPage session={displaySession} />;
      case 'spatial':
        return <SpatialViewer />;
      case 'thermal-ml-test':
        return <ThermalMLTest />;
      case 'pressure-test':
        return <PressureTest />;
      default:
        return (
          <InspectionsPage
            session={displaySession}
            onSelectInspection={() => setActivePage('map')}
            onOpenActiveInspection={() => setActivePage('map')}
          />
        );
    }
  };

  return (
    <div className="ds-app-layout">
      {/* Technician Main Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(p) => setActivePage(p)}
        session={displaySession}
      />

      {/* Main Workspace Canvas */}
      <main className="ds-main-viewport">
        {renderActivePage()}
      </main>

      {/* Multimodal Evidence Review Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
        session={displaySession}
        onConfirmLeak={handleConfirmLeak}
        onDismissAnomaly={handleDismissAnomaly}
        onOpenRepairWorkflow={() => {
          setIsEvidenceDrawerOpen(false);
          setIsWorkflowModalOpen(true);
        }}
        onOpenPhotoCapture={() => openPhotoCapture('DEFECT_INITIAL')}
      />

      {/* Field Photo Attachment Modal */}
      <PhotoCaptureModal
        isOpen={isPhotoCaptureOpen}
        onClose={() => setIsPhotoCaptureOpen(false)}
        session={displaySession}
        photoType={photoType}
        onSavePhoto={handleSavePhoto}
      />

      {/* Full Remediation & Rescan Workflow Modal */}
      <InspectionWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        session={displaySession}
        onUpdateAnomaly={handleUpdateAnomaly}
        onSectionComplete={handleSectionComplete}
        onOpenPhotoCapture={() => openPhotoCapture('REPAIR_SEAL')}
      />
    </div>
  );
}
