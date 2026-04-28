import axios from 'axios'

const API_BASE = 'http://localhost:8000'

export const detectDamage = async (file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(`${API_BASE}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })

  return response.data
}

export const base64ToImageUrl = (base64String) => {
  return `data:image/jpeg;base64,${base64String}`
}
