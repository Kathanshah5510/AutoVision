import { useEffect, useRef } from 'react';
import { BASE_COST } from '../utils/constants';

export default function StatsRow({ detections, apiData }) {
  const countRef = useRef(null);

  // Animate count number
  useEffect(() => {
    const el = countRef.current;
    if (!el) return;
    const total = detections.length;
    const dur = 600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = String(Math.round(total * p)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [detections]);

  const totalMin = apiData
    ? apiData.total_cost_min
    : detections.reduce((s, d) => s + (d.cost_min || BASE_COST[d.class] || 5000), 0);
  const totalMax = apiData
    ? apiData.total_cost_max
    : Math.round(totalMin * 1.35);

  const sev   = detections.length === 0 ? 0 : Math.min(1, totalMin / 50000);
  const label = detections.length === 0 ? '—' : sev < 0.3 ? 'Low' : sev < 0.65 ? 'Medium' : 'High';
  const col   = sev < 0.3 ? '#22c55e' : sev < 0.65 ? '#f59e0b' : '#ef4444';
  const dashOffset = 101 - sev * 101;

  const countLabel = detections.length === 0
    ? 'awaiting scan'
    : `damage region${detections.length !== 1 ? 's' : ''} identified`;

  return (
    <div className="stats-row">
      {/* Total damages */}
      <div className="stat-card">
        <div className="stat-label">Total damages</div>
        <div className="stat-val" id="stat-count" ref={countRef}>—</div>
        <div className="stat-sub" id="stat-count-sub">{countLabel}</div>
      </div>

      {/* Cost range */}
      <div className="stat-card cost">
        <div className="stat-label">Cost range</div>
        <div className="stat-icon">₹</div>
        <div className="stat-val" id="stat-cost" style={{ fontSize: '16px', marginTop: '4px' }}>
          {detections.length > 0 ? `₹${totalMin.toLocaleString()}` : '—'}
        </div>
        <div className="stat-sub" id="stat-cost-sub">
          {detections.length > 0 ? `— ₹${totalMax.toLocaleString()}` : 'estimated repair'}
        </div>
      </div>

      {/* Severity gauge */}
      <div className="stat-card sev">
        <div className="stat-label">Severity</div>
        <div className="stat-icon">⚠</div>
        <div className="gauge-wrap" id="gauge-wrap">
          <svg viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 40 A32 32 0 0 1 72 40"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              id="gauge-arc"
              d="M8 40 A32 32 0 0 1 72 40"
              stroke={col}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="101"
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s' }}
            />
            <text
              id="gauge-text"
              x="40"
              y="42"
              textAnchor="middle"
              fontFamily="'Syne',sans-serif"
              fontSize="11"
              fontWeight="700"
              fill={col}
            >
              {label}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
