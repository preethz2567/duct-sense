import React, { useState } from 'react';
import { API_BASE } from '../../services/apiService';

export default function InspectionDrawer({
  selectedLeak,
  onClose,
  onAcknowledgeLeak,
}) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  if (!selectedLeak) return null;

  const severityColor = selectedLeak.severity === 'High' ? '#e53935' : (selectedLeak.severity === 'Medium' ? '#fb8c00' : '#4caf50');
  const typeLabel = selectedLeak.finding_type ? selectedLeak.finding_type.replace('_', ' ') : 'Unknown';

  return (
    <aside className="inspection-drawer open" style={{ width: '350px', backgroundColor: '#101828', borderLeft: '1px solid #1f2937', color: 'white' }}>
      {/* Drawer Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>FINDING DETAILS</div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'white' }}>{selectedLeak.finding_id}</h2>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      </div>

      {/* Type Banner */}
      <div style={{ padding: '12px 20px', backgroundColor: `${severityColor}20`, borderBottom: `1px solid ${severityColor}40`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: severityColor }}></div>
        <span style={{ fontWeight: 600, fontSize: '13px', color: severityColor }}>{typeLabel}</span>
      </div>

      {/* Drawer Body Scrollable Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
        
        {/* Room/Zone Context */}
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>ROOM / ZONE CONTEXT</div>
          <div style={{ fontSize: '14px', color: '#f3f4f6' }}>{selectedLeak.room_id || 'Unknown Zone'}</div>
        </div>

        {/* Technician Notes */}
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>TECHNICIAN NOTES</div>
          <div style={{ fontSize: '14px', color: '#f3f4f6', backgroundColor: '#1f2937', padding: '12px', borderRadius: '6px' }}>
            {selectedLeak.notes || 'No notes provided.'}
          </div>
        </div>

        {/* Status & Repair */}
        <div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>WORKFLOW STATUS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Finding Status</div>
              <div style={{ fontSize: '13px', color: '#f3f4f6', marginTop: '4px' }}>{selectedLeak.status}</div>
            </div>
            <div style={{ backgroundColor: '#1f2937', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Repair Type</div>
              <div style={{ fontSize: '13px', color: '#f3f4f6', marginTop: '4px' }}>{selectedLeak.repair_type || 'None'}</div>
            </div>
          </div>
        </div>

        {/* Evidence Thumbnail */}
        {selectedLeak.photo && (
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>EVIDENCE</div>
            <div 
              style={{ width: '100%', height: '200px', backgroundColor: '#1f2937', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #374151' }}
              onClick={() => setIsImageExpanded(true)}
            >
              <img 
                src={selectedLeak.photo.startsWith('data:') || selectedLeak.photo.startsWith('http') ? selectedLeak.photo : `${API_BASE}/photos/${selectedLeak.photo}`} 
                alt="Evidence" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af">Image Not Found</div>'; }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div style={{ padding: '20px', borderTop: '1px solid #1f2937', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => onAcknowledgeLeak && onAcknowledgeLeak(selectedLeak.finding_id || selectedLeak.id)}
          disabled={selectedLeak.status === 'VERIFIED'}
          style={{ flex: 1, padding: '12px', backgroundColor: selectedLeak.status === 'VERIFIED' ? '#374151' : '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: selectedLeak.status === 'VERIFIED' ? 'not-allowed' : 'pointer' }}
        >
          {selectedLeak.status === 'VERIFIED' ? '✓ Acknowledged' : 'Verify / Acknowledge'}
        </button>
      </div>

      {/* Image Modal (Lightroom style) */}
      {isImageExpanded && selectedLeak.photo && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onClick={() => setIsImageExpanded(false)}
        >
          <img 
            src={selectedLeak.photo.startsWith('data:') || selectedLeak.photo.startsWith('http') ? selectedLeak.photo : `${API_BASE}/photos/${selectedLeak.photo}`} 
            alt="Evidence Full" 
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }} 
          />
        </div>
      )}
    </aside>
  );
}
