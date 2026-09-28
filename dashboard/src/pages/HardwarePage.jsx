import React from 'react';
import { Cpu, CheckCircle2, Info } from 'lucide-react';
import { initialHardwareStatus } from '../services/mockDataService';

export default function HardwarePage() {
  return (
    <div className="ds-page-container ds-instrument-view">
      {/* Header */}
      <header className="ds-page-header ds-header-compact">
        <div>
          <div className="ds-kicker-label">DEVICE DIAGNOSTICS</div>
          <h1 className="ds-page-title">HARDWARE STATUS</h1>
        </div>

        <div className="ds-header-actions">
          <span className="ds-pill-tag ds-pill-green">ALL NODES ONLINE</span>
        </div>
      </header>

      {/* Hardware Nodes Table Card */}
      <div className="ds-card ds-hardware-card">
        <div className="ds-card-header ds-card-header-clean">
          <span className="ds-card-title">EDGE HARDWARE BUS & PERIPHERALS</span>
        </div>

        <div className="ds-table-responsive">
          <table className="ds-engineering-table">
            <thead>
              <tr>
                <th>DEVICE NODE</th>
                <th>POC FUNCTION</th>
                <th>PHYSICAL INTERFACE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {initialHardwareStatus.map((hw) => (
                <tr key={hw.id}>
                  <td className="ds-td-bold">{hw.name}</td>
                  <td>{hw.role}</td>
                  <td className="ds-td-mono">{hw.bus}</td>
                  <td>
                    <span className="ds-badge-green">
                      <CheckCircle2 size={12} /> {hw.status === 'CAPTURED_FRAME_MODE' ? 'CAPTURE MODE' : 'CONNECTED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ds-hw-architecture-note">
          <Info size={14} className="ds-icon-petrol" />
          <span>
            <strong>POC Architecture Note:</strong> BMP280 barometric pressure sensor pair measures duct static tap vs room ambient reference (Pduct - Pambient). INMP441 micro-electromechanical microphones process audible turbulence frequencies. FLIR thermal camera provides thermal gradient localization.
          </span>
        </div>
      </div>
    </div>
  );
}
