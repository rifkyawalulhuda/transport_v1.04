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

export const addressBookService = {
  async suggest(query, { limit = 10, signal } = {}) {
    const q = typeof query === 'string' ? query.trim() : ''
    const params = new URLSearchParams()
    if (q) {
      params.append('q', q)
    }
    params.append('limit', String(limit))
    const res = await authFetch(`${API_BASE}/address-book/suggest?${params.toString()}`, {
      signal
    })
    return handleJson(res)
  },
  async markUsed(id) {
    if (!id) {
      return null
    }
    const res = await authFetch(`${API_BASE}/address-book/${id}/use`, {
      method: 'POST'
    })
    return handleJson(res)
  },
  async upsert(address, label) {
    const trimmed = typeof address === 'string' ? address.trim() : ''
    if (trimmed.length < 5) {
      return null
    }
    const payload = { address: trimmed }
    if (label && typeof label === 'string') {
      payload.label = label
    }
    const res = await authFetch(`${API_BASE}/address-book/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleJson(res)
  }
}
