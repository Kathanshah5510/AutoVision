import { useEffect, useRef } from 'react';
import { CLASS_COLORS, BASE_COST } from '../utils/constants';

export default function DetectionFeed({ detections, onItemClick }) {
  const itemRefs = useRef([]);

  useEffect(() => {
    // Animate confidence bars after render
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const bar = el.querySelector('.conf-bar-fill');
      if (!bar) return;
      const target = bar.dataset.target;
      setTimeout(() => { bar.style.width = target + '%'; }, 100 + i * 80);
    });
  }, [detections]);

  if (detections.length === 0) {
    return (
      <div className="panel feed-panel">
        <div className="panel-header">
          <span className="panel-title">Detection Feed</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
            scrollable list
          </span>
        </div>
        <div className="feed-list" id="feed-list">
          <div className="feed-empty">
            <div className="feed-empty-icon">📡</div>
            No detections yet.<br />Upload a car image to begin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel feed-panel">
      <div className="panel-header">
        <span className="panel-title">Detection Feed</span>
        <span id="feed-count-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
          {detections.length} item{detections.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="feed-list" id="feed-list">
        {detections.map((det, i) => {
          const cls      = det.class || 'unknown';
          const conf     = Math.round(det.confidence * 100);
          const col      = CLASS_COLORS[cls] || CLASS_COLORS['scratch'];
          const cost     = det.cost_min || BASE_COST[cls] || 5000;
          const costMax  = det.cost_max || Math.round(cost * 1.4);
          const barColor = conf >= 80 ? '#22c55e' : conf >= 60 ? '#f59e0b' : '#ef4444';

          return (
            <div
              key={i}
              className="feed-item"
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => onItemClick(i)}
              ref={el => (itemRefs.current[i] = el)}
            >
              <div className={`feed-ico ${col.badge}`}>
                <span style={{ fontSize: '14px' }}>{col.icon}</span>
              </div>
              <div className="feed-body">
                <div className="feed-top">
                  <span className="feed-name">{cls.replace(/\b\w/g, c => c.toUpperCase())}</span>
                  <span className={`sev-badge ${col.badge}`}>{col.badge}</span>
                </div>
                <div className="feed-bottom">
                  <div className="conf-bar-wrap">
                    <div className="conf-bar-label">Confidence: {conf}%</div>
                    <div className="conf-bar-track">
                      <div
                        className="conf-bar-fill"
                        style={{ width: '0%', background: barColor }}
                        data-target={conf}
                      />
                    </div>
                  </div>
                  <div className="feed-cost">
                    <span className="feed-cost-val">₹{cost.toLocaleString()}</span>
                    <span style={{ color: 'var(--muted)' }}>– ₹{costMax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
