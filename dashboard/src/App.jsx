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

import { initialInspectionSession } from './services/inspectionService';
import { API_BASE, normalizeWalkthrough } from './services/apiService';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('inspections'); // 'inspections', 'map', 'evidence', 'reports', 'sync', 'engineering'
  const [session, setSession] = useState(initialInspectionSession);
  const [walkthroughs, setWalkthroughs] = useState([]);
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
        const res = await fetch(`${API_BASE}/walkthroughs`);
        if (res.ok) {
          const raw = await res.json();
          if (!cancelled) {
            const normalized = raw.map(normalizeWalkthrough);
            setWalkthroughs(normalized);
          }
        }
      } catch (err) {
        // standalone / local session mode fallback
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
        const res = await fetch(`${API_BASE}/walkthroughs`);
        if (res.ok) {
          const raw = await res.json();
          const normalized = raw.map(normalizeWalkthrough);
          setWalkthroughs((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(normalized)) return prev;
            return normalized;
          });
          setSession((s) => ({ ...s, syncStatus: 'ONLINE_SYNCED', lastSyncTime: 'Just now' }));
        }
      } catch {
        setSession((s) => ({ ...s, syncStatus: 'OFFLINE_PENDING' }));
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loading]);

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
            session={session}
            onSelectInspection={() => setActivePage('map')}
            onOpenActiveInspection={() => setActivePage('map')}
          />
        );
      case 'map':
        return (
          <ActiveInspectionPage
            session={session}
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
            session={session}
            onOpenPhotoCapture={() => openPhotoCapture('DEFECT_INITIAL')}
          />
        );
      case 'reports':
        return <CommissioningReport session={session} />;
      case 'sync':
        return (
          <SyncPage
            session={session}
            onTriggerSync={() => {
              setSession((s) => ({ ...s, syncStatus: 'ONLINE_SYNCED', lastSyncTime: 'Just now' }));
            }}
          />
        );
      case 'engineering':
        return <EngineeringPage session={session} />;
      default:
        return (
          <InspectionsPage
            session={session}
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
        session={session}
      />

      {/* Main Workspace Canvas */}
      <main className="ds-main-viewport">
        {renderActivePage()}
      </main>

      {/* Multimodal Evidence Review Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
        session={session}
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
        session={session}
        photoType={photoType}
        onSavePhoto={handleSavePhoto}
      />

      {/* Full Remediation & Rescan Workflow Modal */}
      <InspectionWorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        session={session}
        onUpdateAnomaly={handleUpdateAnomaly}
        onSectionComplete={handleSectionComplete}
        onOpenPhotoCapture={() => openPhotoCapture('REPAIR_SEAL')}
      />
    </div>
  );
}
