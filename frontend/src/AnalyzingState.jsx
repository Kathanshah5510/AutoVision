import { motion } from 'framer-motion'

const steps = [
  { label: 'Uploading image', icon: '📡' },
  { label: 'Running neural inference', icon: '🧠' },
  { label: 'Mapping damage regions', icon: '🎯' },
  { label: 'Calculating cost estimates', icon: '💰' },
]

export default function AnalyzingState({ status, uploadProgress }) {
  const activeStep = status === 'uploading' ? 0 : status === 'analyzing' ? 2 : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 space-y-8"
    >
      {/* Pulsing rings */}
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyan-500/30"
            initial={{ width: 48, height: 48, opacity: 0.8 }}
            animate={{ width: 48 + i * 32, height: 48 + i * 32, opacity: 0 }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center glow-cyan">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 rounded-full border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent"
          />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="font-display text-cyan-400 text-sm tracking-widest uppercase">
          {status === 'uploading' ? `Uploading ${uploadProgress}%` : 'Deep Analysis Running'}
        </p>
        <p className="text-xs text-slate-500 font-mono">Processing vehicle damage data...</p>
      </div>

      {/* Upload progress bar */}
      {status === 'uploading' && (
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
            style={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Steps */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-all duration-500 ${
              i <= activeStep
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 bg-slate-900/50 text-slate-600'
            }`}
          >
            <span>{step.icon}</span>
            <span className="truncate">{step.label}</span>
            {i < activeStep && <span className="ml-auto text-green-400">✓</span>}
            {i === activeStep && (
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
