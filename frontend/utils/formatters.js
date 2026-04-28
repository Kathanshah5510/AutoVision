export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatConfidence = (confidence) => {
  return `${(confidence * 100).toFixed(1)}%`
}

export const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'low': return { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', dot: 'bg-green-400' }
    case 'medium': return { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', dot: 'bg-orange-400' }
    case 'high': return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', dot: 'bg-red-400' }
    default: return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30', dot: 'bg-slate-400' }
  }
}

export const getClaimRecommendation = (totalCostMax) => {
  if (totalCostMax === 0) return { label: 'No Claim Needed', color: 'text-green-400', icon: '✓' }
  if (totalCostMax < 5000) return { label: 'Self-Pay Recommended', color: 'text-green-400', icon: '💡' }
  if (totalCostMax < 20000) return { label: 'Consider Filing Claim', color: 'text-orange-400', icon: '⚠️' }
  return { label: 'File Insurance Claim', color: 'text-red-400', icon: '🚨' }
}

export const formatClassName = (name) => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
