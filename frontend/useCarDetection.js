import { useState, useCallback } from 'react'
import { detectDamage } from '../utils/api'

export const useCarDetection = () => {
  const [status, setStatus] = useState('idle') // idle | uploading | analyzing | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const analyze = useCallback(async (file) => {
    setStatus('uploading')
    setError(null)
    setResult(null)
    setUploadProgress(0)

    try {
      const data = await detectDamage(file, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(pct)
        if (pct === 100) setStatus('analyzing')
      })
      setResult(data)
      setStatus('done')
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to connect to backend. Make sure the API is running on http://localhost:8000'
      setError(msg)
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    setUploadProgress(0)
  }, [])

  return { status, result, error, uploadProgress, analyze, reset }
}
