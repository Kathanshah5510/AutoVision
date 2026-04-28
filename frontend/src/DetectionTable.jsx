import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, formatConfidence, getSeverityColor, formatClassName } from '../utils/formatters'

const SeverityBadge = ({ severity }) => {
  const c = getSeverityColor(severity)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${c.text} ${c.bg} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {severity?.toUpperCase()}
    </span>
  )
}

const ConfBar = ({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-full rounded-full ${
          value > 0.8 ? 'bg-green-400' : value > 0.6 ? 'bg-cyan-400' : 'bg-orange-400'
        }`}
      />
    </div>
    <span className="text-xs font-mono text-slate-400 w-12 text-right">
      {formatConfidence(value)}
    </span>
  </div>
)

export default function DetectionTable({ detections, confidenceThreshold }) {
  const [sortKey, setSortKey] = useState('confidence')
  const [sortDir, setSortDir] = useState('desc')
  const [expanded, setExpanded] = useState(null)

  const filtered = detections.filter(d => d.confidence >= confidenceThreshold)

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey]
    const severityOrder = { high: 3, medium: 2, low: 1 }
    if (sortKey === 'severity') {
      return sortDir === 'asc'
        ? severityOrder[va] - severityOrder[vb]
        : severityOrder[vb] - severityOrder[va]
    }
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
  })

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 opacity-20" />

  if (filtered.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-slate-400 text-sm">No detections above the confidence threshold.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <span className="font-display text-xs text-slate-300 tracking-wider uppercase">Detection Log</span>
        <span className="text-xs font-mono text-slate-500">{sorted.length} records</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/60">
              {[
                { key: 'class_name', label: 'Damage Type' },
                { key: 'confidence', label: 'Confidence' },
                { key: 'severity', label: 'Severity' },
                { key: 'cost_min', label: 'Cost Range' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-2.5 text-[11px] font-mono text-slate-500 tracking-wider uppercase cursor-pointer hover:text-cyan-400 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon k={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((det, i) => (
              <>
                <motion.tr
                  key={`row-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="border-b border-slate-800/40 hover:bg-slate-800/30 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-8 rounded-full ${getSeverityColor(det.severity).dot}`} />
                      <span className="font-body font-medium text-slate-200">
                        {formatClassName(det.class_name)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    <ConfBar value={det.confidence} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={det.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-300">
                      {formatCurrency(det.cost_min)} – {formatCurrency(det.cost_max)}
                    </span>
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.tr
                      key={`expand-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={4} className="px-4 py-3 bg-slate-900/50 border-b border-slate-800/40">
                        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 block mb-0.5">CLASS ID</span>
                            <span className="text-slate-300">{det.class_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">AREA (NORM)</span>
                            <span className="text-slate-300">{(det.area_norm * 100).toFixed(2)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">BBOX (px)</span>
                            <span className="text-slate-300">[{det.bbox_pixels?.join(', ')}]</span>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
