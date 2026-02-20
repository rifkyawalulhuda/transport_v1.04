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

export const repairService = {
  async fetchRepairs(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/repairs${searchParams.toString() ? `?${searchParams}` : ''}`
    const res = await authFetch(url)
    return handleJson(res)
  },
  async fetchRepairById(id) {
    const res = await authFetch(`${API_BASE}/repairs/${id}`)
    return handleJson(res)
  },
  async createRepair(payload) {
    const res = await authFetch(`${API_BASE}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    return handleJson(res)
  },
  async updateRepair(id, payload) {
    const res = await authFetch(`${API_BASE}/repairs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    return handleJson(res)
  },
  async deleteRepair(id) {
    const res = await authFetch(`${API_BASE}/repairs/${id}`, {
      method: 'DELETE'
    })
    return handleJson(res)
  },
  async exportRepairs(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/repairs/export/excel${
      searchParams.toString() ? `?${searchParams}` : ''
    }`
    return authFetch(url)
  },
  async fetchRepairYears(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/repairs/years${searchParams.toString() ? `?${searchParams}` : ''}`
    const res = await authFetch(url)
    return handleJson(res)
  },
  async fetchTrucks() {
    const res = await authFetch(`${API_BASE}/trucks`)
    return handleJson(res)
  }
}
