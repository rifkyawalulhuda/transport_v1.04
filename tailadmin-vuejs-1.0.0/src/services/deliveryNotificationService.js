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
    if (value === undefined || value === null || value === '') return
    searchParams.append(key, String(value))
  })
  return searchParams
}

export const deliveryNotificationService = {
  async fetchList(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/delivery-notifications/list${searchParams.toString() ? `?${searchParams}` : ''}`
    const res = await authFetch(url)
    return handleJson(res)
  },

  async markRead(id) {
    const res = await authFetch(`${API_BASE}/delivery-notifications/${id}/read`, { method: 'PUT' })
    return handleJson(res)
  },

  async markAllRead() {
    const res = await authFetch(`${API_BASE}/delivery-notifications/read-all`, { method: 'PUT' })
    return handleJson(res)
  },

  async dismiss(id) {
    const res = await authFetch(`${API_BASE}/delivery-notifications/${id}`, { method: 'DELETE' })
    return handleJson(res)
  }
}
