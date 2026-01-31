import React, { useState, useRef, useCallback, useEffect } from 'react';
import Mermaid from '@theme/Mermaid';

interface ZoomableMermaidProps {
  chart: string;
  title?: string;
}

export default function ZoomableMermaid({ chart, title = 'Diagram' }: ZoomableMermaidProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.25;

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_SCALE));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_SCALE));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setScale((prev) => Math.max(MIN_SCALE, Math.min(prev + delta, MAX_SCALE)));
  }, []);

  // Handle keyboard shortcuts in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsFullscreen(false);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleReset();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleZoomIn, handleZoomOut, handleReset]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const openFullscreen = () => {
    setIsFullscreen(true);
    setScale(1.0); // Start at 100% in fullscreen
    setPosition({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      {/* Inline preview with open button */}
      <div className="zoomable-mermaid-preview">
        <div className="zoomable-mermaid-preview-header">
          <span className="zoomable-mermaid-title">{title}</span>
          <button
            className="zoomable-mermaid-btn zoomable-mermaid-btn-primary"
            onClick={openFullscreen}
            title="Open fullscreen (click to zoom and pan)"
          >
            <ExpandIcon /> View Full Screen
          </button>
        </div>
        <div className="zoomable-mermaid-preview-content">
          <Mermaid value={chart} />
        </div>
        <div className="zoomable-mermaid-preview-hint">
          Click "View Full Screen" to zoom and pan the diagram
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="zoomable-mermaid-modal" onClick={closeFullscreen}>
          <div
            className="zoomable-mermaid-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with controls */}
            <div className="zoomable-mermaid-header">
              <span className="zoomable-mermaid-title">{title}</span>
              <div className="zoomable-mermaid-controls">
                <button
                  className="zoomable-mermaid-btn"
                  onClick={handleZoomOut}
                  disabled={scale <= MIN_SCALE}
                  title="Zoom out (-)"
                >
                  <MinusIcon />
                </button>
                <span className="zoomable-mermaid-scale">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  className="zoomable-mermaid-btn"
                  onClick={handleZoomIn}
                  disabled={scale >= MAX_SCALE}
                  title="Zoom in (+)"
                >
                  <PlusIcon />
                </button>
                <button
                  className="zoomable-mermaid-btn"
                  onClick={handleReset}
                  title="Reset view (0)"
                >
                  <ResetIcon />
                </button>
                <div className="zoomable-mermaid-divider" />
                <button
                  className="zoomable-mermaid-btn zoomable-mermaid-btn-close"
                  onClick={closeFullscreen}
                  title="Close (Esc)"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Diagram viewport */}
            <div
              ref={containerRef}
              className={`zoomable-mermaid-viewport ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <div
                className="zoomable-mermaid-content"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                }}
              >
                <Mermaid value={chart} />
              </div>
            </div>

            {/* Footer with shortcuts */}
            <div className="zoomable-mermaid-footer">
              <span>Scroll to zoom</span>
              <span>Drag to pan</span>
              <span>
                <kbd>+</kbd>/<kbd>-</kbd> Zoom
              </span>
              <span>
                <kbd>0</kbd> Reset
              </span>
              <span>
                <kbd>Esc</kbd> Close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Icons
function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
