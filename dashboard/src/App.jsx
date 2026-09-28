<<<<<<< HEAD
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
=======
import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Label,
  BarChart,
  Bar,
} from 'recharts';
import { mockWalkthroughs } from './mockData';
import { SpatialViewer } from './components/spatial-viewer';
import './App.css';

/* ── Brand tokens ────────────────────────────────────────────────────────── */
const NAVY      = '#0000B3';
const TEAL      = '#12C6B3';
const ORANGE    = '#FF9C00';
const THRESHOLD = 0.65;

/* ── Leak-count bar chart (List View) ───────────────────────────────────── */
function LeakCountChart() {
  const data = mockWalkthroughs.map((wt) => ({
    date:  wt.date,
    leaks: wt.leak_events.length,
  }));

  return (
    <div className="chart-card">
      <p className="chart-title">Leak Count per Walkthrough</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #EEEEEE',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
            formatter={(v) => [v, 'Leak Events']}
          />
          <Bar dataKey="leaks" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Confidence line chart (Detail View) ────────────────────────────────── */
function ConfidenceChart({ events }) {
  if (events.length === 0) return null;

  const data = events.map((e) => ({
    position:   parseFloat(e.position_m.toFixed(3)),
    confidence: e.leak_confidence,
  }));

  return (
    <div className="chart-card">
      <p className="chart-title">Leak Confidence vs. Position</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis
            dataKey="position"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={false}
            tickCount={6}
          >
            <Label
              value="Position (m)"
              position="insideBottom"
              offset={-12}
              style={{ fontSize: 11, fill: '#888888', fontFamily: 'Arial, Helvetica, sans-serif' }}
            />
          </XAxis>
          <YAxis
            domain={[0.5, 1.0]}
            tick={{ fontSize: 11, fill: '#666666', fontFamily: 'Arial, Helvetica, sans-serif' }}
            axisLine={false}
            tickLine={false}
            width={36}
          >
            <Label
              value="Confidence"
              angle={-90}
              position="insideLeft"
              offset={10}
              style={{ fontSize: 11, fill: '#888888', fontFamily: 'Arial, Helvetica, sans-serif' }}
            />
          </YAxis>
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #EEEEEE',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
            formatter={(v) => [v.toFixed(2), 'Confidence']}
            labelFormatter={(l) => `Position: ${l} m`}
          />
          <ReferenceLine
            y={THRESHOLD}
            stroke={ORANGE}
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: 'Detection Threshold',
              position: 'insideTopRight',
              style: {
                fontSize: 10,
                fill: ORANGE,
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 700,
              },
            }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke={NAVY}
            strokeWidth={2}
            dot={{ r: 4, fill: NAVY, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: NAVY }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── List View ──────────────────────────────────────────────────────────── */
function WalkthroughCard({ walkthrough, onView }) {
  const { date, walkthrough_id, leak_events } = walkthrough;
  const count = leak_events.length;

  return (
    <div className="card">
      <div className="card-date">📅 {date}</div>
      <div className="card-id">{walkthrough_id}</div>
      <div className="card-leak-count">
        <span className={`badge ${count > 0 ? 'badge-danger' : 'badge-safe'}`}>
          {count > 0 ? `⚠ ${count} leak${count !== 1 ? 's' : ''}` : '✓ Clean'}
        </span>
        <span className="card-leak-label">
          {count > 0 ? 'events detected' : 'no leaks found'}
        </span>
      </div>
      <button className="btn btn-primary" onClick={() => onView(walkthrough)}>
        View Details →
      </button>
    </div>
  );
}

function ListView({ onView }) {
  return (
    <div className="dashboard-content-container">
      <LeakCountChart />
      <p className="section-title">Walkthrough Sessions</p>
      <div className="card-grid">
        {mockWalkthroughs.map((wt) => (
          <WalkthroughCard key={wt.walkthrough_id} walkthrough={wt} onView={onView} />
        ))}
      </div>
    </div>
  );
}

/* ── Detail View ────────────────────────────────────────────────────────── */
function DetailView({ walkthrough, onBack }) {
  const { date, walkthrough_id, leak_events } = walkthrough;
  const count = leak_events.length;

  const maxConf  = count > 0 ? Math.max(...leak_events.map(e => e.leak_confidence)) : 0;
  const firstPos = count > 0 ? leak_events[0].position_m.toFixed(3) : '—';

  return (
    <div className="dashboard-content-container">
      <div className="detail-header">
        <div className="detail-title">
          <h2>Walkthrough Report</h2>
          <div className="detail-meta">{date} &nbsp;·&nbsp; {walkthrough_id}</div>
        </div>
        <button className="btn btn-back" onClick={onBack}>← Back</button>
      </div>

      {/* Stats strip */}
      <div className="detail-stats">
        <div className="stat-box">
          <div className="stat-value">{count}</div>
          <div className="stat-label">Leak Events</div>
        </div>
        {count > 0 && (
          <>
            <div className="stat-box">
              <div className="stat-value">{maxConf.toFixed(2)}</div>
              <div className="stat-label">Peak Confidence</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{firstPos} m</div>
              <div className="stat-label">First Detection</div>
            </div>
          </>
        )}
      </div>

      {count === 0 ? (
        <div className="empty-state">
          <div className="check">✅</div>
          No leaks detected during this walkthrough.
        </div>
      ) : (
        <>
          <ConfidenceChart events={leak_events} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Position (m)</th>
                  <th>Confidence</th>
                  <th>Timestamp (s)</th>
                </tr>
              </thead>
              <tbody>
                {leak_events.map((event, idx) => (
                  <tr
                    key={idx}
                    className={event.leak_confidence >= 0.75 ? 'high-confidence' : ''}
                  >
                    <td>{idx + 1}</td>
                    <td>{event.position_m.toFixed(3)}</td>
                    <td>{event.leak_confidence.toFixed(2)}</td>
                    <td>{event.timestamp.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ── App root ───────────────────────────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab] = useState('spatial'); // 'spatial' | 'walkthroughs'
  const [selectedWalkthrough, setSelectedWalkthrough] = useState(null);

  return (
    <div className="app-layout">
      {/* Universal DuctSense Navbar */}
      <header className="app-navbar">
        <div className="navbar-brand">
          <div className="brand-logo">🌡️</div>
          <div>
            <h1 className="brand-title">DuctSense</h1>
            <p className="brand-tagline">AI HVAC Multi-Sensor Leak Detection</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          <button
            type="button"
            className={`nav-tab ${activeTab === 'spatial' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('spatial');
              setSelectedWalkthrough(null);
            }}
          >
            <span className="nav-icon">🗺️</span>
            <span>Spatial Duct Map</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'walkthroughs' ? 'active' : ''}`}
            onClick={() => setActiveTab('walkthroughs')}
          >
            <span className="nav-icon">📊</span>
            <span>Walkthrough Reports</span>
          </button>
        </nav>

        <div className="navbar-meta">
          <span className="live-pill">
            <span className="live-dot"></span>
            Live Sensors Connected
          </span>
        </div>
      </header>

      {/* Main Feature View */}
      <main className="app-main-content">
        {activeTab === 'spatial' ? (
          <SpatialViewer />
        ) : selectedWalkthrough === null ? (
          <ListView onView={(wt) => setSelectedWalkthrough(wt)} />
        ) : (
          <DetailView
            walkthrough={selectedWalkthrough}
            onBack={() => setSelectedWalkthrough(null)}
          />
        )}
      </main>
>>>>>>> 254092c (feat(spatial-viewer): Created spatial viewer in 2D + Fix pin hover jitter + Polish UI)
    </div>
  );
}
