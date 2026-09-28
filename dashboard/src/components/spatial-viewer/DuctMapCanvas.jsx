import React, { useRef, useState, useCallback, useEffect } from 'react';
import { DUCT_PATH_DATA, SEVERITY_CONFIG } from '../../data/leaksData';

const SVG_WIDTH = 1817;
const SVG_HEIGHT = 2255;

export default function DuctMapCanvas({
  leaks,
  selectedLeakId,
  onSelectLeak,
  baseOpacity,
  zoom,
  pan,
  rotation,
  onPanChange,
  onZoomChange,
  isSelectingLocation,
  pendingLeakData,
  onPlacePin,
  onCancelSelectLocation,
  ductGlow = true,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLeakId, setHoveredLeakId] = useState(null);
  const [ghostCoords, setGhostCoords] = useState(null);

  // Helper to convert screen mouse event to SVG coordinate space
  const getSvgCoordinates = useCallback(
    (clientX, clientY) => {
      if (!svgRef.current) return null;
      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const transformedPoint = point.matrixTransform(ctm.inverse());
      return {
        x: transformedPoint.x,
        y: transformedPoint.y,
        xPercent: Math.max(0, Math.min(100, (transformedPoint.x / SVG_WIDTH) * 100)),
        yPercent: Math.max(0, Math.min(100, (transformedPoint.y / SVG_HEIGHT) * 100)),
      };
    },
    []
  );

  // Pan interaction handlers
  const handleMouseDown = (e) => {
    // Only pan if left-clicking and not interacting with a pin or in selection mode
    if (e.button !== 0) return;
    if (isSelectingLocation) return;

    // Check if clicked directly on a pin element
    if (e.target.closest('.map-pin-group')) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isSelectingLocation) {
      const coords = getSvgCoordinates(e.clientX, e.clientY);
      if (coords) {
        setGhostCoords(coords);
      }
      return;
    }

    if (!isDragging) return;
    onPanChange({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.4, Math.min(4.0, zoom * zoomFactor));
    onZoomChange(Math.round(newZoom * 100) / 100);
  };

  // Canvas click for placing pins in Select Location Mode
  const handleCanvasClick = (e) => {
    if (!isSelectingLocation) return;
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (coords) {
      onPlacePin({
        xPercent: Math.round(coords.xPercent * 100) / 100,
        yPercent: Math.round(coords.yPercent * 100) / 100,
      });
      setGhostCoords(null);
    }
  };

  // Attach non-passive wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheelWrapper = (e) => handleWheel(e);
    container.addEventListener('wheel', onWheelWrapper, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelWrapper);
    };
  }, [zoom, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className={`duct-map-viewport ${isSelectingLocation ? 'mode-pinning' : isDragging ? 'is-dragging' : 'mode-nav'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Location Selection Mode Banner */}
      {isSelectingLocation && (
        <div className="pinning-mode-banner animate-slide-down">
          <div className="banner-content">
            <span className="banner-pin-icon">📍</span>
            <div>
              <strong>Target Location Mode Active</strong>
              <p>Click anywhere on the floor plan or duct line to place leak pin for {pendingLeakData?.roomNumber || 'Room'}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-cancel-pinning"
            onClick={(e) => {
              e.stopPropagation();
              onCancelSelectLocation();
            }}
          >
            Cancel Placement
          </button>
        </div>
      )}

      {/* Transformed Stage */}
      <div
        className="duct-map-stage"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        <svg
          ref={svgRef}
          className="duct-spatial-svg"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
        >
          <defs>
            {/* Duct Glow Neon Filter */}
            <filter id="duct-electric-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur1" />
              <feGaussianBlur stdDeviation="14" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Pin Drop Shadow */}
            <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
            </filter>
          </defs>

          {/* ═══════════════════════════════════════════════════════════════════
              LAYER 1: Base Floorplan Layer
              ═══════════════════════════════════════════════════════════════════ */}
          <g className="layer-base-floorplan" style={{ opacity: baseOpacity, transition: 'opacity 0.2s ease' }}>
            <image
              href="/floorplan.svg"
              width={SVG_WIDTH}
              height={SVG_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          {/* ═══════════════════════════════════════════════════════════════════
              LAYER 2: Duct Network Layer (Bright Electric Blue: #00E5FF, 4px)
              ═══════════════════════════════════════════════════════════════════ */}
          <g
            className="layer-ducts"
            filter={ductGlow ? 'url(#duct-electric-glow)' : undefined}
          >
            {/* Background casing / ambient duct stroke */}
            <path
              d={DUCT_PATH_DATA.mainLoop}
              fill="none"
              stroke="#005B66"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />
            {DUCT_PATH_DATA.corridorSpines.map((dStr, idx) => (
              <path
                key={`casing-${idx}`}
                d={dStr}
                fill="none"
                stroke="#005B66"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />
            ))}

            {/* Primary Electric Blue High-Visibility Core Path (#00E5FF, 4px) */}
            <path
              d={DUCT_PATH_DATA.mainLoop}
              fill="none"
              stroke="#00E5FF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="duct-path-core"
            />
            {DUCT_PATH_DATA.corridorSpines.map((dStr, idx) => (
              <path
                key={`duct-spine-${idx}`}
                d={dStr}
                fill="none"
                stroke="#00E5FF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="duct-path-core"
              />
            ))}

            {/* Duct Airflow Arrow / Junction Markers */}
            <circle cx="472" cy="444" r="6" fill="#00E5FF" />
            <circle cx="1372" cy="444" r="6" fill="#00E5FF" />
            <circle cx="1372" cy="1730" r="6" fill="#00E5FF" />
            <circle cx="472" cy="1730" r="6" fill="#00E5FF" />
            <circle cx="682" cy="1344" r="5" fill="#00E5FF" />
            <circle cx="922" cy="1344" r="5" fill="#00E5FF" />
            <circle cx="1162" cy="1344" r="5" fill="#00E5FF" />
          </g>

          {/* ═══════════════════════════════════════════════════════════════════
              LAYER 3: Annotation Layer (Dynamic Leak Pins)
              ═══════════════════════════════════════════════════════════════════ */}
          <g className="layer-annotations">
            {leaks.map((leak) => {
              const cx = (leak.xPercent / 100) * SVG_WIDTH;
              const cy = (leak.yPercent / 100) * SVG_HEIGHT;
              const isSelected = selectedLeakId === leak.id;
              const isHovered = hoveredLeakId === leak.id;
              const config = SEVERITY_CONFIG[leak.severity] || SEVERITY_CONFIG['No Leak'];

              return (
                <g
                  key={leak.id}
                  id={`pin-${leak.id}`}
                  className={`map-pin-group ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
                  transform={`translate(${cx}, ${cy})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLeak(leak);
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredLeakId(leak.id);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    setHoveredLeakId(null);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  filter="url(#pin-shadow)"
                  cursor="pointer"
                >
                  {/* Selected / Active glowing halo */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="36"
                      fill="none"
                      stroke="#00E5FF"
                      strokeWidth="3.5"
                      strokeDasharray="6 4"
                      className="animate-spin-slow"
                      pointerEvents="none"
                    />
                  )}

                  {/* Pulsing Alert Wave for Critical & High severity */}
                  {config.pulse && (
                    <circle
                      cx="0"
                      cy="0"
                      r="28"
                      fill={config.color}
                      className="pin-pulse-wave"
                      opacity="0.35"
                      pointerEvents="none"
                    />
                  )}

                  {/* Outer Severity Disc - Fixed 18px radius to keep pin stationary on hover & selection */}
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill={config.color}
                    stroke={isSelected ? '#00E5FF' : (leak.severity === 'No Leak' ? '#00E5FF' : '#FFFFFF')}
                    strokeWidth={isSelected ? '3' : (leak.severity === 'No Leak' ? '3' : '2.5')}
                    className="pin-disc"
                  />

                  {/* Inner Icon / Glyph */}
                  {leak.severity === 'Critical' || leak.severity === 'High' ? (
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="14"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                      pointerEvents="none"
                    >
                      !
                    </text>
                  ) : leak.severity === 'Medium' ? (
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                      pointerEvents="none"
                    >
                      ▲
                    </text>
                  ) : leak.severity === 'Low' ? (
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                      pointerEvents="none"
                    >
                      ●
                    </text>
                  ) : (
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0000B3"
                      fontSize="13"
                      fontWeight="bold"
                      fontFamily="Arial, sans-serif"
                      pointerEvents="none"
                    >
                      ✓
                    </text>
                  )}

                  {/* Pin Floating Tag (Room Number + Fused Confidence) - Fixed offset translate(0, -28) */}
                  <g transform="translate(0, -28)" className="pin-tag-group">
                    <rect
                      x="-55"
                      y="-16"
                      width="110"
                      height="24"
                      rx="12"
                      fill="#0D1629"
                      stroke={isSelected ? '#00E5FF' : config.borderColor}
                      strokeWidth={isSelected ? '2' : '1.5'}
                    />
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="Arial, sans-serif"
                      pointerEvents="none"
                    >
                      {leak.roomNumber.replace('Room ', '')} · {Math.round(leak.fusedConfidence)}%
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Ghost Preview Pin when hovering during Select Location Mode */}
            {isSelectingLocation && ghostCoords && (
              <g
                transform={`translate(${ghostCoords.x}, ${ghostCoords.y})`}
                className="ghost-pin animate-bounce"
                opacity="0.9"
                pointerEvents="none"
              >
                <circle cx="0" cy="0" r="32" fill="none" stroke="#00E5FF" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="0" cy="0" r="18" fill="#00E5FF" opacity="0.85" />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#0000B3"
                  fontSize="12"
                  fontWeight="bold"
                >
                  📍
                </text>
                <g transform="translate(0, -28)">
                  <rect x="-65" y="-14" width="130" height="22" rx="11" fill="#0000B3" stroke="#00E5FF" strokeWidth="1.5" />
                  <text x="0" y="-1" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">
                    Click to Pin: {pendingLeakData?.roomNumber || 'Room'}
                  </text>
                </g>
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
