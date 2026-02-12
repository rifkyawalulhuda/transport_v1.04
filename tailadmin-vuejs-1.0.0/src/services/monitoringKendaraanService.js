import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

const handleJson = async (response) => {
  if (!response.ok) {
    const message = await response.text()
    const error = new Error(message || 'Request gagal')
    error.status = response.status
    throw error
  }
  return response.json()
}

const buildParams = (params = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }
    searchParams.append(key, String(value))
  })
  return searchParams
}

export const monitoringKendaraanService = {
  async fetchMonitoring(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/monitoring-kendaraan${
      searchParams.toString() ? `?${searchParams}` : ''
    }`
    const res = await authFetch(url)
    return handleJson(res)
  }
}
