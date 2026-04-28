import { motion } from 'framer-motion'
import { Sun, Moon, Shield, Activity } from 'lucide-react'

export default function Navbar({ darkMode, onToggleDark }) {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-cyan-500/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-cyan-500/20 border border-cyan-500/40" />
            <Shield className="w-5 h-5 text-cyan-400 relative z-10" />
            <div className="absolute inset-0 rounded-lg animate-pulse-slow bg-cyan-500/10" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-gradient tracking-wider">
              AUTO<span className="text-white">VISION</span>
            </span>
            <div className="flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-cyan-400" />
              <span className="text-[9px] font-mono text-cyan-400/70 tracking-widest uppercase">
                AI Damage Detection
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-mono text-green-400">SYSTEM ONLINE</span>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg glass border border-slate-700/50 hover:border-cyan-500/40 transition-all duration-200 hover:glow-cyan"
        >
          {darkMode
            ? <Sun className="w-4 h-4 text-cyan-400" />
            : <Moon className="w-4 h-4 text-slate-400" />
          }
        </button>
      </div>
    </motion.nav>
  )
}
