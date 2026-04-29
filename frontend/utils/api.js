import axios from 'axios'

const API_BASE = 'http://localhost:8000'

export const detectDamage = async (file, vehicleData, onUploadProgress) => {
  const currentYear = new Date().getFullYear()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('car_model', vehicleData.car_model)
  formData.append('car_age', String(currentYear - vehicleData.purchase_year))
  formData.append('km_driven', String(vehicleData.km_driven))

  const response = await axios.post(`${API_BASE}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })

  return response.data
}

export const base64ToImageUrl = (base64String) => {
  return `data:image/jpeg;base64,${base64String}`
}
