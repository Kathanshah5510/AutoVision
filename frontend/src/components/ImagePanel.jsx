import { useEffect, useRef, useState, useCallback } from 'react';
import { drawBoxes } from '../utils/imageHelpers';
import { downloadReport } from '../utils/reportGenerator';

export default function ImagePanel({
  steps,            // array of { label, state: 'idle'|'active'|'done' }
  isLoading,
  showResults,
  detections,
  apiData,
  userData,
  onFilePicked,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef  = useRef(null);
  const canvasRef     = useRef(null);
  const imgRef        = useRef(null);

  // Expose canvas ref so Dashboard can draw boxes
  useEffect(() => {
    if (showResults && detections.length > 0 && canvasRef.current && imgRef.current) {
      const canvas = canvasRef.current;
      const img    = imgRef.current;
      const ctx    = canvas.getContext('2d');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawBoxes(ctx, canvas, detections, img);
    }
  }, [showResults, detections]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { onFilePicked(null, 'Please upload an image file (PNG, JPG, WEBP).'); return; }
    if (file.size > 10 * 1024 * 1024)   { onFilePicked(null, 'File too large. Max 10 MB.'); return; }

    const url = URL.createObjectURL(file);
    const img = imgRef.current;
    img.src = url;
    img.onload = () => onFilePicked(file, null, canvasRef.current, imgRef.current);
  }, [onFilePicked]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleShare = () => {
    // Demo share
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="panel image-panel" style={{ position: 'relative' }}>
      <div className="panel-header">
        <span className="panel-title">Annotated Image</span>
        <span id="img-status" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
          {showResults ? `${detections.length} detection${detections.length !== 1 ? 's' : ''} found` : '— awaiting upload'}
        </span>
      </div>

      {/* ── Drop zone ── */}
      {!showResults && (
        <div
          className={`drop-zone${isDragOver ? ' drag-over' : ''}`}
          id="drop-zone"
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            id="file-input"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files[0])}
            onClick={(e) => e.stopPropagation()}
          />
          <svg className="drop-icon" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="10" width="40" height="30" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 32l10-8 8 6 8-10 14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="drop-title">Drop car image here</div>
          <div className="drop-sub">PNG, JPG, WEBP — max 10MB</div>
          <label
            className="drop-btn"
            htmlFor="file-input"
            onClick={(e) => e.stopPropagation()}
          >
            Browse Files
          </label>
        </div>
      )}

      {/* ── Image result ── */}
      <div
        className="img-result"
        id="img-result"
        style={{ display: showResults ? 'block' : 'none' }}
      >
        <img id="uploaded-img" ref={imgRef} alt="uploaded" style={{ display: 'none' }} />
        <canvas id="annotation-canvas" ref={canvasRef} />
        <div className={`scan-line${showResults ? ' active' : ''}`} id="scan-line" />
        <div className={`bracket tl${showResults ? ' show' : ''}`} id="br-tl" />
        <div className={`bracket tr${showResults ? ' show' : ''}`} id="br-tr" />
        <div className={`bracket bl${showResults ? ' show' : ''}`} id="br-bl" />
        <div className={`bracket br${showResults ? ' show' : ''}`} id="br-br" />
      </div>

      {/* ── Action buttons ── */}
      {showResults && (
        <div className="action-row" id="action-row">
          <button
            className="action-btn"
            id="btn-download"
            onClick={() => downloadReport(detections, canvasRef.current, userData, apiData)}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2v8M5 7l3 3 3-3M2 12v2h12v-2" />
            </svg>
            Download Report
          </button>
          <button className="action-btn" id="btn-share" onClick={handleShare}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="4"  r="1.5" />
              <circle cx="4"  cy="8"  r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <path d="M5.5 7L10.5 5M5.5 9L10.5 11" />
            </svg>
            Share
          </button>
        </div>
      )}

      {/* ── Loading overlay ── */}
      <div className={`loading-overlay${isLoading ? ' active' : ''}`} id="loading-overlay">
        <div className="loading-label">ANALYSING</div>
        <div className="loading-steps">
          {steps.map((step, i) => (
            <div key={i} className={`loading-step${step.state === 'done' ? ' done' : step.state === 'active' ? ' active' : ''}`} id={`step-${i}`}>
              <div className={`step-dot${step.state === 'active' ? ' spin' : ''}`} />
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
