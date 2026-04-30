// ── Colour palette per damage class ──────────────────────
export const CLASS_COLORS = {
  dent:          { stroke: '#ef4444', fill: 'rgba(239,68,68,0.15)',   badge: 'high',   icon: '⚠' },
  scratch:       { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)', badge: 'medium', icon: 'ℹ' },
  crack:         { stroke: '#a78bfa', fill: 'rgba(167,139,250,0.15)',badge: 'high',   icon: '⚠' },
  'glass shatter':{ stroke: '#0ea5e9', fill: 'rgba(14,165,233,0.15)', badge: 'high',   icon: '⚠' },
  'tire flat':   { stroke: '#22c55e', fill: 'rgba(34,197,94,0.15)',  badge: 'low',    icon: 'ℹ' },
  'lamp broken': { stroke: '#f97316', fill: 'rgba(249,115,22,0.15)', badge: 'medium', icon: 'ℹ' },
};

export const CHART_COLORS = ['#00d4aa', '#0ea5e9', '#a78bfa', '#f59e0b', '#ef4444', '#22c55e'];

export const BASE_COST = {
  dent:           6500,
  scratch:        3500,
  crack:          9000,
  'glass shatter':16000,
  'tire flat':    4500,
  'lamp broken':  7000,
};

// Fixed confidence threshold (hardcoded per original)
export const CONF_THRESHOLD = 35;
