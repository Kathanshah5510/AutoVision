import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CLASS_COLORS, BASE_COST } from '../utils/constants';

export default function CostBreakdownChart({ detections }) {
  const { chartData, total } = useMemo(() => {
    const classes = [...new Set(detections.map(d => d.class))];
    const data = classes.map(c => {
      const matching = detections.filter(d => d.class === c);
      const cost = matching.reduce((sum, d) => sum + (d.cost_min || BASE_COST[c] || 5000), 0);
      return {
        name: c,
        value: cost,
        color: (CLASS_COLORS[c] || {}).stroke || '#aaa',
      };
    });
    const total = data.reduce((a, b) => a + b.value, 0);
    return { chartData: data, total };
  }, [detections]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(0,0,0,0.85)',
          padding: '6px 12px',
          borderRadius: '6px',
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          color: '#fff',
        }}>
          {payload[0].name}: ₹{payload[0].value.toLocaleString()}
        </div>
      );
    }
    return null;
  };

  if (detections.length === 0) {
    return (
      <div className="panel chart-panel">
        <div className="panel-header">
          <span className="panel-title">Cost Breakdown</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>per damage type</span>
        </div>
        <div className="chart-inner">
          <div className="chart-canvas-wrap" />
          <div className="chart-legend-list">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)' }}>
              — run a scan to populate
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <span className="panel-title">Cost Breakdown</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>per damage type</span>
      </div>
      <div className="chart-inner">
        <div className="chart-canvas-wrap">
          <PieChart width={110} height={110}>
            <Pie
              data={chartData}
              cx={55}
              cy={55}
              innerRadius={32}
              outerRadius={52}
              paddingAngle={2}
              dataKey="value"
              animationDuration={800}
              stroke="var(--panel)"
              strokeWidth={3}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </div>
        <div className="chart-legend-list" id="chart-legend">
          {chartData.map((entry, i) => {
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={i} className="chart-leg-row">
                <div className="chart-leg-left">
                  <div className="chart-leg-dot" style={{ background: entry.color }} />
                  <span className="chart-leg-name">{entry.name}</span>
                </div>
                <span className="chart-leg-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
