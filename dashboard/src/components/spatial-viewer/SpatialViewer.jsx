import React, { useState, useMemo, useCallback } from 'react';
import DuctMapCanvas from './DuctMapCanvas';
import ViewerToolbar from './ViewerToolbar';
import ScaleIndicator from './ScaleIndicator';
import ManualLeakModal from './ManualLeakModal';
import InspectionDrawer from './InspectionDrawer';
import { INITIAL_LEAKS } from '../../data/leaksData';
import './SpatialViewer.css';

export default function SpatialViewer({ initialLeaks = INITIAL_LEAKS }) {
  // Leaks dataset state
  const [leaks, setLeaks] = useState(initialLeaks);
  const [selectedLeakId, setSelectedLeakId] = useState(null);

  // Viewer viewport state
  const [baseOpacity, setBaseOpacity] = useState(0.6); // 60% default opacity
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [ductGlow, setDuctGlow] = useState(true);

  // Manual Annotation Modal and Interactive Pinning Mode state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [pendingLeakData, setPendingLeakData] = useState(null);

  // Filter / Stats calculations
  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, 'No Leak': 0 };
    leaks.forEach((l) => {
      if (counts[l.severity] !== undefined) {
        counts[l.severity]++;
      }
    });
    return counts;
  }, [leaks]);

  const selectedLeak = useMemo(() => {
    return leaks.find((l) => l.id === selectedLeakId) || null;
  }, [leaks, selectedLeakId]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(4.0, Math.round((z + 0.25) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.4, Math.round((z - 0.25) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Rotation controls (90 degree steps)
  const handleRotateCW = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleRotateCCW = useCallback(() => {
    setRotation((r) => (r - 90 + 360) % 360);
  }, []);

  const handleResetRotation = useCallback(() => {
    setRotation(0);
  }, []);

  // Manual Pinning flow
  const handleOpenManualModal = () => {
    setIsManualModalOpen(true);
  };

  const handleCloseManualModal = () => {
    setIsManualModalOpen(false);
  };

  const handleSubmitPendingLeak = (formData) => {
    setPendingLeakData(formData);
    setIsManualModalOpen(false);
    setIsSelectingLocation(true); // Transition viewer into "Select Location Mode"
  };

  const handleCancelSelectLocation = () => {
    setIsSelectingLocation(false);
    setPendingLeakData(null);
  };

  const handlePlacePin = ({ xPercent, yPercent }) => {
    if (!pendingLeakData) return;

    const newLeak = {
      ...pendingLeakData,
      id: `leak-${Date.now()}`,
      xPercent,
      yPercent,
    };

    setLeaks((prev) => [newLeak, ...prev]);
    setSelectedLeakId(newLeak.id);
    setIsSelectingLocation(false);
    setPendingLeakData(null);
  };

  // Pin selection & Drawer
  const handleSelectLeak = (leak) => {
    setSelectedLeakId((prev) => (prev === leak.id ? null : leak.id));
  };

  const handleCloseDrawer = () => {
    setSelectedLeakId(null);
  };

  const handleDeleteLeak = (id) => {
    setLeaks((prev) => prev.filter((l) => l.id !== id));
    if (selectedLeakId === id) {
      setSelectedLeakId(null);
    }
  };

  const handleAcknowledgeLeak = (id) => {
    setLeaks((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, acknowledged: true, notes: `${l.notes || ''} [Acknowledged by QA]` } : l
      )
    );
  };

  return (
    <div className="spatial-viewer-container">
      {/* Top Floating Glassmorphism Toolbar */}
      <ViewerToolbar
        baseOpacity={baseOpacity}
        onOpacityChange={setBaseOpacity}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        rotation={rotation}
        onRotateCW={handleRotateCW}
        onRotateCCW={handleRotateCCW}
        onResetRotation={handleResetRotation}
        onOpenManualModal={handleOpenManualModal}
        isSelectingLocation={isSelectingLocation}
        onCancelSelectLocation={handleCancelSelectLocation}
        ductGlow={ductGlow}
        onToggleDuctGlow={() => setDuctGlow(!ductGlow)}
        leakCount={leaks.length}
        severityCounts={severityCounts}
      />

      {/* Main Dual-Layer Canvas Stage */}
      <div className="canvas-wrapper">
        <DuctMapCanvas
          leaks={leaks}
          selectedLeakId={selectedLeakId}
          onSelectLeak={handleSelectLeak}
          baseOpacity={baseOpacity}
          zoom={zoom}
          pan={pan}
          rotation={rotation}
          onPanChange={setPan}
          onZoomChange={setZoom}
          isSelectingLocation={isSelectingLocation}
          pendingLeakData={pendingLeakData}
          onPlacePin={handlePlacePin}
          onCancelSelectLocation={handleCancelSelectLocation}
          ductGlow={ductGlow}
        />

        {/* Dynamic Scale Indicator in Bottom-Left Corner */}
        <ScaleIndicator zoom={zoom} />
      </div>

      {/* QA Inspection Side Drawer */}
      <InspectionDrawer
        selectedLeak={selectedLeak}
        onClose={handleCloseDrawer}
        onDeleteLeak={handleDeleteLeak}
        onAcknowledgeLeak={handleAcknowledgeLeak}
      />

      {/* Manual Leak Modal Form */}
      <ManualLeakModal
        isOpen={isManualModalOpen}
        onClose={handleCloseManualModal}
        onSubmitPendingLeak={handleSubmitPendingLeak}
      />
    </div>
  );
}
