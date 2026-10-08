// src/pages/InspectionsPage.jsx
import React from 'react';
import {
  ClipboardList,
  Calendar,
  Building,
  User,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  FileText,
} from 'lucide-react';
import { recentInspectionsList } from '../services/inspectionService';

export default function InspectionsPage({ session, onSelectInspection, onOpenActiveInspection }) {
  const completedSections = session.sections.filter((s) => s.status === 'VERIFIED_PASS' || s.status === 'COMPLETED').length;
  const activeSection = session.sections.find((s) => s.id === session.activeSectionId) || session.sections[2];

  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">COMMISSIONING SYSTEM</div>
          <h1 className="ds-page-title">INSPECTIONS</h1>
        </div>

        <div className="ds-header-actions">
          <span className={`ds-pill-tag ${session.systemStatus === 'LEAK DETECTED' ? 'ds-pill-red' : 'ds-pill-green'}`}>
            SYSTEM STATUS — {session.systemStatus || 'NORMAL'}
          </span>
        </div>
      </header>

      {/* 1. ACTIVE INSPECTION (Hero Card) */}
      <div className="ds-card ds-active-inspection-hero-card">
        <div className="ds-hero-card-head">
          <div className="ds-hero-badge-row">
            <span className="ds-pill-tag ds-pill-amber">ACTIVE INSPECTION</span>
            <span className="ds-mono-id">#{session.id}</span>
          </div>
          <span className="ds-pill-tag"><Clock size={12} /> {session.date}</span>
        </div>

        <div className="ds-hero-details-grid">
          <div>
            <div className="ds-meta-lbl">FACILITY & LOCATION</div>
            <div className="ds-hero-site-title">{session.site}</div>
            <div className="ds-hero-site-sub">{session.building} · {session.level}</div>
          </div>

          <div>
            <div className="ds-meta-lbl">HVAC AIR SYSTEM</div>
            <div className="ds-hero-hvac-val">{session.system}</div>
            <div className="ds-hero-tech-val">Lead Inspector: {session.technician}</div>
          </div>

          <div>
            <div className="ds-meta-lbl">ROUTE PROGRESS</div>
            <div className="ds-hero-progress-num">
              <strong>{completedSections}</strong> / {session.sections.length} sections inspected
            </div>
            <div className="ds-mini-progress-bar">
              <div
                className="ds-mini-progress-fill"
                style={{ width: `${(completedSections / session.sections.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="ds-hero-card-footer">
          <div className="ds-hero-current-task">
            <span className="ds-sec-badge">CURRENT FOCUS</span>
            <span>Section {activeSection.id}: <strong>{activeSection.name}</strong> (1.0 m POC Rig)</span>
          </div>

          <button className="ds-btn ds-btn-amber ds-btn-lg" onClick={onOpenActiveInspection}>
            <Play size={15} /> Enter Active Inspection <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 2. RECENT INSPECTIONS LIST */}
      <div className="ds-section-block">
        <div className="ds-block-header">
          <h2 className="ds-block-title">RECENT INSPECTION RECORDS</h2>
          <span className="ds-block-sub">{recentInspectionsList.length} past records on device</span>
        </div>

        <div className="ds-inspections-grid">
          {recentInspectionsList.map((item) => {
            const isCurrent = item.id === session.id;
            return (
              <div
                key={item.id}
                className={`ds-card ds-inspection-card ${isCurrent ? 'ds-card-highlight' : ''}`}
                onClick={() => {
                  if (isCurrent) {
                    onOpenActiveInspection();
                  } else {
                    onSelectInspection(item);
                  }
                }}
              >
                <div className="ds-insp-card-top">
                  <div>
                    <span className="ds-insp-id">{item.id}</span>
                    <span className="ds-insp-date"><Calendar size={11} /> {item.date}</span>
                  </div>
                  <span
                    className={`ds-pill-tag ${
                      item.status === 'IN_PROGRESS'
                        ? 'ds-pill-amber'
                        : item.status.includes('VERIFIED')
                        ? 'ds-pill-green'
                        : 'ds-pill-teal'
                    }`}
                  >
                    {item.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'COMPLETED'}
                  </span>
                </div>

                <div className="ds-insp-site">{item.site}</div>
                <div className="ds-insp-system">{item.system}</div>

                <div className="ds-insp-progress-row">
                  <span>Progress:</span>
                  <strong>{item.inspectedSections} / {item.totalSections} sections</strong>
                </div>

                <div className="ds-insp-card-bottom">
                  {item.leakCount > 0 ? (
                    <span className="ds-leak-tag-amber">
                      <AlertTriangle size={12} /> {item.leakCount} leak{item.leakCount > 1 ? 's' : ''} remediated & verified
                    </span>
                  ) : (
                    <span className="ds-leak-tag-green">
                      <CheckCircle2 size={12} /> Nominal (Zero defects)
                    </span>
                  )}
                  <span className="ds-link-arrow">Open <ArrowRight size={12} /></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
