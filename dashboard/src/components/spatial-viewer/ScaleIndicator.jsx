import React from 'react';

export default function ScaleIndicator({ zoom = 1 }) {
  // Base scale: 1 meter = 20 pixels at zoom level 1.0
  const basePixelsPerMeter = 20;
  const currentPixelsPerMeter = basePixelsPerMeter * zoom;

  // Adapt bar length to be visually pleasing (~80px to 160px wide)
  let targetMeters = 5;
  if (currentPixelsPerMeter * 5 < 60) {
    targetMeters = 10;
  } else if (currentPixelsPerMeter * 5 > 180) {
    targetMeters = 2;
  }
  if (currentPixelsPerMeter * targetMeters > 200) {
    targetMeters = 1;
  }

  const barWidthPx = targetMeters * currentPixelsPerMeter;

  return (
    <div className="spatial-scale-indicator" title={`Dynamic Scale: 1m = ${Math.round(currentPixelsPerMeter * 10) / 10}px`}>
      <div className="scale-header">
        <span className="scale-icon">📐</span>
        <span className="scale-title">Scale: 1m = {(Math.round(currentPixelsPerMeter * 10) / 10).toFixed(1)}px</span>
      </div>
      <div className="scale-bar-wrapper">
        <div className="scale-ticks">
          <span>0</span>
          <span>{(targetMeters / 2).toFixed(targetMeters === 1 ? 1 : 0)}m</span>
          <span>{targetMeters}m</span>
        </div>
        <div className="scale-bar" style={{ width: `${barWidthPx}px` }}>
          <div className="scale-bar-segment segment-left"></div>
          <div className="scale-bar-segment segment-right"></div>
        </div>
      </div>
      <div className="scale-footer">Zoom: {(zoom * 100).toFixed(0)}%</div>
    </div>
  );
}
