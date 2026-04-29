import { motion } from 'framer-motion'
import { Sun, Moon, Shield, Activity } from 'lucide-react'

export default function Navbar({ darkMode, onToggleDark }) {
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 glass border-b transition-colors duration-300 ${
        darkMode ? 'border-cyan-500/10' : 'border-cyan-500/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-lg border transition-colors duration-300 ${
              darkMode
                ? 'bg-cyan-500/20 border-cyan-500/40'
                : 'bg-cyan-500/10 border-cyan-500/30'
            }`} />
            <Shield className={`w-5 h-5 relative z-10 transition-colors duration-300 ${
              darkMode ? 'text-cyan-400' : 'text-cyan-600'
            }`} />
            <div className="absolute inset-0 rounded-lg animate-pulse-slow bg-cyan-500/10" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-gradient tracking-wider">
              AUTO<span className={`transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>VISION</span>
            </span>
            <div className="flex items-center gap-1">
              <Activity className={`w-2.5 h-2.5 transition-colors duration-300 ${
                darkMode ? 'text-cyan-400' : 'text-cyan-600'
              }`} />
              <span className={`text-[9px] font-mono tracking-widest uppercase transition-colors duration-300 ${
                darkMode ? 'text-cyan-400/70' : 'text-cyan-600/70'
              }`}>
                AI Damage Detection
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full transition-colors duration-300 ${
          darkMode
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-green-500/8 border border-green-500/25'
        }`}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className={`text-[11px] font-mono transition-colors duration-300 ${
            darkMode ? 'text-green-400' : 'text-green-600'
          }`}>SYSTEM ONLINE</span>
        </div>

        {/* Dark / Light mode toggle */}
        <button
          onClick={onToggleDark}
          className={`relative p-2.5 rounded-xl glass border transition-all duration-300 group overflow-hidden ${
            darkMode
              ? 'border-slate-700/50 hover:border-cyan-500/40 hover:glow-cyan'
              : 'border-slate-300/60 hover:border-cyan-500/40 hover:shadow-md'
          }`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <motion.div
            key={darkMode ? 'dark' : 'light'}
            initial={{ rotate: -30, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 30, opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-cyan-400 group-hover:text-yellow-400 transition-colors duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500 group-hover:text-indigo-500 transition-colors duration-200" />
            )}
          </motion.div>
        </button>
      </div>
    </motion.nav>
  )
}
