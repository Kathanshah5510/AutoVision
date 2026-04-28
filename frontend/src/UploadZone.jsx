import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image, X, Scan, AlertCircle } from 'lucide-react'

export default function UploadZone({ onAnalyze, isLoading }) {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [dragError, setDragError] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setDragError(true)
      setTimeout(() => setDragError(false), 2000)
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSubmit = () => {
    if (file && !isLoading) onAnalyze(file)
  }

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !preview && inputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${dragError ? 'border-red-500 bg-red-500/5' : ''}
          ${dragging ? 'border-cyan-400 bg-cyan-400/5 glow-cyan scale-[1.01]' : ''}
          ${preview ? 'border-cyan-500/30 cursor-default' : 'cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/3'}
          ${!dragging && !preview && !dragError ? 'border-slate-700' : ''}
        `}
        style={{ minHeight: preview ? 'auto' : '240px' }}
      >
        {/* Animated corner accents */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <div key={pos} className={`absolute w-4 h-4 ${
            pos.includes('top') ? 'top-2' : 'bottom-2'
          } ${pos.includes('left') ? 'left-2' : 'right-2'}`}>
            <div className={`absolute ${pos.includes('top') ? 'top-0' : 'bottom-0'} ${pos.includes('left') ? 'left-0' : 'right-0'} w-full h-0.5 bg-cyan-500/40`} />
            <div className={`absolute ${pos.includes('top') ? 'top-0' : 'bottom-0'} ${pos.includes('left') ? 'left-0' : 'right-0'} w-0.5 h-full bg-cyan-500/40`} />
          </div>
        ))}

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full py-16 px-6 text-center"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-200 ${
                dragError ? 'bg-red-500/20' : dragging ? 'bg-cyan-500/20' : 'bg-slate-800'
              }`}>
                {dragError
                  ? <AlertCircle className="w-7 h-7 text-red-400" />
                  : <Upload className={`w-7 h-7 transition-colors ${dragging ? 'text-cyan-400' : 'text-slate-400'}`} />
                }
              </div>
              <p className={`font-body font-medium text-base mb-1 transition-colors ${dragging ? 'text-cyan-300' : dragError ? 'text-red-400' : 'text-slate-300'}`}>
                {dragError ? 'Invalid file type' : dragging ? 'Release to analyze' : 'Drop vehicle image here'}
              </p>
              <p className="text-sm text-slate-500">or click to browse — JPG, PNG, WEBP</p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-[420px] object-contain rounded-xl"
              />
              {/* Scan overlay effect */}
              {isLoading && (
                <div className="absolute inset-0 scan-line rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-cyan-500/5" />
                </div>
              )}
              {/* Clear button */}
              {!isLoading && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile() }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* File info */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm">
                <Image className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono text-slate-300">{file?.name}</span>
                <span className="text-xs text-slate-500">({(file?.size / 1024).toFixed(0)} KB)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Analyze button */}
      <AnimatePresence>
        {file && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleSubmit}
            disabled={isLoading}
            className={`
              w-full h-14 rounded-xl font-display font-semibold text-sm tracking-widest uppercase
              transition-all duration-300 flex items-center justify-center gap-3
              ${isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-500 hover:to-cyan-400 glow-cyan hover:glow-cyan-strong cursor-pointer'
              }
            `}
          >
            <Scan className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Run Damage Scan'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
