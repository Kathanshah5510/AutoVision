import { motion } from 'framer-motion'
import { AlertTriangle, DollarSign, FileText, ShieldCheck } from 'lucide-react'
import { formatCurrency, getClaimRecommendation } from '../utils/formatters'

const Card = ({ icon: Icon, label, value, subValue, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="glass rounded-xl p-4 space-y-3 hover:border-cyan-500/20 transition-colors duration-300"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono text-slate-500 tracking-wider uppercase">{label}</span>
      <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <div className="font-display font-bold text-2xl text-white leading-none">{value}</div>
      {subValue && <div className="text-xs text-slate-400 mt-1">{subValue}</div>}
    </div>
  </motion.div>
)

export default function SummaryCards({ result }) {
  const { num_detections, total_cost_min, total_cost_max, detections } = result
  const rec = getClaimRecommendation(total_cost_max)

  const highCount = detections.filter(d => d.severity === 'high').length
  const avgConf = detections.length > 0
    ? (detections.reduce((s, d) => s + d.confidence, 0) / detections.length * 100).toFixed(0)
    : 0

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card
        icon={AlertTriangle}
        label="Damages Found"
        value={num_detections}
        subValue={highCount > 0 ? `${highCount} high severity` : 'No critical damage'}
        accent="bg-orange-500/20 text-orange-400"
        delay={0}
      />
      <Card
        icon={DollarSign}
        label="Est. Repair Cost"
        value={formatCurrency(total_cost_min)}
        subValue={`Up to ${formatCurrency(total_cost_max)}`}
        accent="bg-cyan-500/20 text-cyan-400"
        delay={0.08}
      />
      <Card
        icon={ShieldCheck}
        label="AI Confidence"
        value={`${avgConf}%`}
        subValue={`${detections.length} regions scanned`}
        accent="bg-green-500/20 text-green-400"
        delay={0.16}
      />
      <Card
        icon={FileText}
        label="Recommendation"
        value={<span className={`text-base ${rec.color}`}>{rec.icon} {rec.label}</span>}
        subValue={`Cost threshold: ${formatCurrency(total_cost_max)}`}
        accent="bg-violet-500/20 text-violet-400"
        delay={0.24}
      />
    </div>
  )
}
