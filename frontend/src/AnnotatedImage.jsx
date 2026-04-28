import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, ZoomIn, Image } from 'lucide-react'
import { base64ToImageUrl } from '../utils/api'

export default function AnnotatedImage({ base64Image, numDetections }) {
  const [zoomed, setZoomed] = useState(false)
  const imgUrl = base64ToImageUrl(base64Image)

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = imgUrl
    a.download = `autovision-analysis-${Date.now()}.jpg`
    a.click()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-cyan-400" />
            <span className="font-display text-xs text-slate-300 tracking-wider uppercase">Annotated Result</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400">
              {numDetections} detection{numDetections !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setZoomed(true)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative bg-black/40 cursor-zoom-in" onClick={() => setZoomed(true)}>
          <img
            src={imgUrl}
            alt="Annotated damage detection"
            className="w-full object-contain max-h-[480px]"
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 border border-cyan-500/20 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider">ANALYZED</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Zoom modal */}
      {zoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            src={imgUrl}
            alt="Zoomed annotated result"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full glass border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </motion.div>
      )}
    </>
  )
}
