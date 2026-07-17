import { authFetch } from './auth'
import { API_BASE } from '@/config/api'

const LEGACY_BASE = `${window.location.origin}/transport_v1.02/admin`

const handleJson = async (response) => {
  if (!response.ok) {
    const message = await response.text()
    const error = new Error(message || 'Request gagal')
    error.status = response.status
    throw error
  }
  return response.json()
}

export const salesCostService = {
  async fetchTrucks() {
    const res = await authFetch(`${API_BASE}/trucks`)
    return handleJson(res)
  },
  async fetchTruck(id) {
    const res = await authFetch(`${API_BASE}/trucks/${id}`)
    return handleJson(res)
  },
  async fetchDrivers() {
    const res = await authFetch(`${API_BASE}/drivers`)
    return handleJson(res)
  },
  async fetchDriver(id) {
    const res = await authFetch(`${API_BASE}/drivers/${id}`)
    return handleJson(res)
  },
  async fetchCustomers() {
    const res = await authFetch(`${API_BASE}/customers`)
    return handleJson(res)
  },
  async fetchAreas() {
    const res = await authFetch(`${API_BASE}/areas`)
    return handleJson(res)
  },
  async fetchAreaRouteSteps(id) {
    const res = await authFetch(`${API_BASE}/areas/${id}/route-steps`)
    return handleJson(res)
  },
  async createSalesCost(payload) {
    const res = await authFetch(`${API_BASE}/sales-costs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return handleJson(res)
  },
  async fetchSalesCostById(id) {
    const res = await authFetch(`${API_BASE}/sales-costs/${id}`)
    return handleJson(res)
  },
  async updateSalesCost(id, payload) {
    const res = await authFetch(`${API_BASE}/sales-costs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return handleJson(res)
  },
  async fetchDNList(id) {
    const res = await authFetch(`${API_BASE}/sales-costs/${id}/dn`)
    return handleJson(res)
  },
  async saveDNList(id, items) {
    const res = await authFetch(`${API_BASE}/sales-costs/${id}/dn`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    })
    return handleJson(res)
  },
  async setPrintSession(idPrint) {
    const res = await fetch(
      `${LEGACY_BASE}/transaksi/set_session.php?id=${encodeURIComponent(idPrint)}`,
      {
        credentials: 'include',
      },
    )
    if (!res.ok) {
      throw new Error('Gagal menyiapkan sesi cetak')
    }
    return res.text()
  },
  getLegacyPrintUrl() {
    return `${LEGACY_BASE}/transaksi/cetak_sales_cost.php`
  },
}
