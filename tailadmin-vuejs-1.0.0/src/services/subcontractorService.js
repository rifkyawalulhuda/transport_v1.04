import { authFetch } from './auth'
import { API_BASE } from '@/config/api'

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

export const subcontractorService = {
  async fetchSubcontractors(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/subcontractor${searchParams.toString() ? `?${searchParams}` : ''}`
    const res = await authFetch(url)
    return handleJson(res)
  },
  async fetchSubcontractorById(id) {
    const res = await authFetch(`${API_BASE}/subcontractor/${id}`)
    return handleJson(res)
  },
  async createSubcontractor(payload) {
    // strip internal-only fields before sending to backend
    const { _dnItems: _dn, ...body } = payload
    const res = await authFetch(`${API_BASE}/subcontractor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    return handleJson(res)
  },
  async updateSubcontractor(id, payload) {
    // strip internal-only fields before sending to backend
    const { _dnItems: _dn, ...body } = payload
    const res = await authFetch(`${API_BASE}/subcontractor/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    return handleJson(res)
  },
  async deleteSubcontractor(id) {
    const res = await authFetch(`${API_BASE}/subcontractor/${id}`, {
      method: 'DELETE'
    })
    return handleJson(res)
  },
  async exportSubcontractor(params) {
    const searchParams = buildParams(params)
    const url = `${API_BASE}/subcontractor/export${searchParams.toString() ? `?${searchParams}` : ''}`
    return authFetch(url)
  },
  async fetchSubcontractorYears() {
    const res = await authFetch(`${API_BASE}/subcontractor/years`)
    return handleJson(res)
  },
  async fetchWarehouses() {
    const res = await authFetch(`${API_BASE}/warehouses`)
    return handleJson(res)
  },
  async fetchCustomers() {
    const res = await authFetch(`${API_BASE}/customers`)
    return handleJson(res)
  },
  async fetchSubconts() {
    const res = await authFetch(`${API_BASE}/subconts`)
    return handleJson(res)
  },
  async fetchDNList(id) {
    const res = await authFetch(`${API_BASE}/subcontractor/${id}/dn`)
    return handleJson(res)
  },
  async saveDNList(id, items) {
    const res = await authFetch(`${API_BASE}/subcontractor/${id}/dn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    return handleJson(res)
  }
}
