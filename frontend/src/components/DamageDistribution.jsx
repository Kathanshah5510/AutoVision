import { useEffect, useRef } from 'react';
import { CLASS_COLORS } from '../utils/constants';

export default function DamageDistribution({ detections }) {
  const barRef    = useRef(null);
  const legendRef = useRef(null);

  useEffect(() => {
    const bar    = barRef.current;
    const legend = legendRef.current;
    if (!bar || !legend) return;

    // Count per class
    const counts = {};
    detections.forEach(d => { counts[d.class] = (counts[d.class] || 0) + 1; });

    bar.innerHTML    = '';
    legend.innerHTML = '';

    if (detections.length === 0) {
      bar.innerHTML    = '<div class="dist-seg" style="flex:1;background:rgba(255,255,255,0.05)"></div>';
      legend.innerHTML = '<div class="dist-leg-item"><div class="dist-leg-dot" style="background:var(--muted)"></div><span>—</span></div>';
      return;
    }

    Object.entries(counts).forEach(([cls, cnt]) => {
      const color = (CLASS_COLORS[cls] || {}).stroke || '#aaa';

      const seg = document.createElement('div');
      seg.className  = 'dist-seg';
      seg.style.flex = '0';
      seg.style.background = color;
      seg.style.minWidth   = '4px';
      bar.appendChild(seg);
      setTimeout(() => { seg.style.flex = cnt; }, 50);

      const li = document.createElement('div');
      li.className = 'dist-leg-item';
      li.innerHTML = `<div class="dist-leg-dot" style="background:${color}"></div><span>${cls} (${cnt})</span>`;
      legend.appendChild(li);
    });
  }, [detections]);

  return (
    <div className="panel dist-panel">
      <div className="panel-header">
        <span className="panel-title">Damage Distribution</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
          `damage_summary`
        </span>
      </div>
      <div className="dist-bar-wrap">
        <div className="dist-seg-row" id="dist-bar" ref={barRef}>
          <div className="dist-seg" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="dist-legend" id="dist-legend" ref={legendRef}>
          <div className="dist-leg-item">
            <div className="dist-leg-dot" style={{ background: 'var(--muted)' }} />
            <span>—</span>
          </div>
        </div>
      </div>
    </div>
  );
}
