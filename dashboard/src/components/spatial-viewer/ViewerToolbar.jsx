import React from 'react';

export default function ViewerToolbar({
  baseOpacity,
  onOpacityChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  rotation,
  onRotateCW,
  onRotateCCW,
  onResetRotation,
  onOpenManualModal,
  isSelectingLocation,
  onCancelSelectLocation,
  ductGlow,
  onToggleDuctGlow,
  leakCount,
  severityCounts,
}) {
  return (
    <div className="spatial-toolbar">
      {/* Left section: Opacity slider & Layers */}
      <div className="toolbar-group">
        <div className="toolbar-item opacity-control">
          <label htmlFor="base-opacity-slider" className="toolbar-label">
            <span className="icon">🗺️</span>
            <span className="label-text">Floorplan Opacity:</span>
            <span className="opacity-val">{Math.round(baseOpacity * 100)}%</span>
          </label>
          <input
            id="base-opacity-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={baseOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="opacity-slider"
            title="Adjust base floorplan opacity"
          />
        </div>

        <button
          type="button"
          className={`btn-toolbar-toggle ${ductGlow ? 'active' : ''}`}
          onClick={onToggleDuctGlow}
          title="Toggle electric neon duct glow effect"
        >
          <span className="toggle-indicator"></span>
          <span className="icon">⚡</span>
          <span>Duct Glow</span>
        </button>
      </div>

      {/* Middle section: Canvas Navigation Controls (Zoom, Pan, Rotate) */}
      <div className="toolbar-group navigation-controls">
        {/* Zoom Controls */}
        <div className="btn-segmented">
          <button
            type="button"
            className="btn-toolbar"
            onClick={onZoomOut}
            title="Zoom Out (-)"
            disabled={zoom <= 0.4}
          >
            <span className="btn-icon">🔍−</span>
          </button>
          <span className="zoom-readout" title="Current Zoom Level">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="btn-toolbar"
            onClick={onZoomIn}
            title="Zoom In (+)"
            disabled={zoom >= 4.0}
          >
            <span className="btn-icon">🔍+</span>
          </button>
          <button
            type="button"
            className="btn-toolbar btn-reset"
            onClick={onResetZoom}
            title="Reset Zoom & Pan to default"
          >
            Fit
          </button>
        </div>

        {/* Rotation Controls */}
        <div className="btn-segmented">
          <button
            type="button"
            className="btn-toolbar"
            onClick={onRotateCCW}
            title="Rotate 90° Counter-Clockwise"
          >
            <span className="btn-icon">↺ 90°</span>
          </button>
          <button
            type="button"
            className="btn-toolbar"
            onClick={onRotateCW}
            title="Rotate 90° Clockwise"
          >
            <span className="btn-icon">↻ 90°</span>
          </button>
          {rotation !== 0 && (
            <button
              type="button"
              className="btn-toolbar btn-rotation-reset"
              onClick={onResetRotation}
              title="Reset rotation to 0°"
            >
              {rotation}° (Reset)
            </button>
          )}
        </div>
      </div>

      {/* Right section: Severity Summary & "+ Add Manual Leak" button */}
      <div className="toolbar-group right-controls">
        <div className="severity-pills" title="Total active annotations on map">
          <span className="pill pill-total">
            Pins: <strong>{leakCount}</strong>
          </span>
          {severityCounts.Critical > 0 && (
            <span className="pill pill-critical" title="Critical Severity Leaks">
              🔴 {severityCounts.Critical}
            </span>
          )}
          {severityCounts.High > 0 && (
            <span className="pill pill-high" title="High Severity Leaks">
              🔴 {severityCounts.High}
            </span>
          )}
          {severityCounts.Medium > 0 && (
            <span className="pill pill-medium" title="Medium Severity Leaks">
              🟠 {severityCounts.Medium}
            </span>
          )}
          {severityCounts.Low > 0 && (
            <span className="pill pill-low" title="Low Severity Leaks">
              🟢 {severityCounts.Low}
            </span>
          )}
        </div>

        {isSelectingLocation ? (
          <button
            type="button"
            className="btn-action btn-cancel-selection animate-pulse"
            onClick={onCancelSelectLocation}
            title="Cancel location selection mode"
          >
            <span className="icon">✕</span>
            <span>Cancel Placement</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-action btn-add-leak"
            onClick={onOpenManualModal}
            id="btn-add-manual-leak"
            title="Add a new manual leak measurement and pin it on the spatial map"
          >
            <span className="icon">+</span>
            <span>Add Manual Leak</span>
          </button>
        )}
      </div>
    </div>
  );
}
