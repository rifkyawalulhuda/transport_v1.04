import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

const handleJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const error = new Error(message || 'Request gagal') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return response.json()
}

export interface BbsDashboardSummary {
  safe_behavior_rate: number
  prev_safe_rate: number | null
  observations_this_month: number
  observation_target: number
  near_miss_count: number
  prev_near_miss: number
  incident_free_days: number
}

export interface BbsDashboardTrend {
  labels: string[]
  data: number[]
  target: number
}

export interface BbsDashboardRisks {
  labels: string[]
  data: number[]
}

export interface BbsTopRisk {
  label: string
  value: number
}

export type BbsAdasScoreCategory = 'fatigue' | 'distraction' | 'collision' | 'lane' | 'speed'
export type BbsAdasScoreStatus = 'aman' | 'perlu_perhatian' | 'berisiko'

export interface BbsAdasTruckScore {
  plate_number: string
  total_alarms: number
  score: number
  status: BbsAdasScoreStatus
  category_scores: Record<BbsAdasScoreCategory, number>
}

export interface BbsDashboardResponse {
  summary: BbsDashboardSummary
  trend: BbsDashboardTrend
  risks: BbsDashboardRisks
  top_risks: BbsTopRisk[]
  adas_scores: BbsAdasTruckScore[]
}

export interface BbsObservationInput {
  driver_id: string
  date: string
  location?: string
  latitude?: number | null
  longitude?: number | null
  vehicle_type?: string
  scores: Record<string, string>
  feedback?: string
  follow_up?: string
}

export interface BbsChecklistInput {
  driver_id: string
  plate_number: string
  date: string
  items: Record<string, string>
}

export interface BbsIncidentInput {
  reporter_name: string
  date: string
  type: string
  location: string
  latitude?: number | null
  longitude?: number | null
  plate_number?: string
  chronology?: string
  factors?: string[]
  casualties?: string
  recommendations?: string
}

export interface BbsHistoryRow {
  id: number
  type: 'observation' | 'checklist' | 'incident'
  title: string
  meta: string
  status: string
  icon: string
  created_at: string
}

export interface BbsHistoryResponse {
  rows: BbsHistoryRow[]
  pagination: {
    offset: number
    limit: number
    total: number
  }
}

export interface BbsAlarmRow {
  id: number
  driver_id: string
  nama_driver?: string
  date: string
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  device_id: string
  alarm_type: string
  begin_time: string
  fleet?: string | null
  plate_number: string
  feedback?: string | null
  created_at: string
}

export interface BbsAlarmListResponse {
  rows: BbsAlarmRow[]
  pagination: { page: number; limit: number; total: number }
}

export interface BbsAlarmBreakdown {
  labels: string[]
  data: number[]
  month: string
}

export interface BbsAlarmImportResult {
  success: boolean
  total: number
  inserted: number
  duplicates: number
  skipped_no_driver: number
  unmatched_driver: number
  dedup_burst: number
  failed: number
  errors: Array<{ row: number | null; field: string; message: string }>
  message: string
}

export interface BbsDriverOption {
  id_driver: string
  nama_driver: string
}

export interface BbsTruckOption {
  id_truck: string
  no_police: string
  jenis_kendaraan: string
}

export const bbsService = {
  async fetchDrivers(): Promise<BbsDriverOption[]> {
    const res = await authFetch(`${API_BASE}/drivers?status=active`)
    const raw = await handleJson<Array<{ id_driver: number; nama_driver: string }>>(res)
    return raw.map((d) => ({ id_driver: String(d.id_driver), nama_driver: d.nama_driver }))
  },

  async fetchTrucks(): Promise<BbsTruckOption[]> {
    const res = await authFetch(`${API_BASE}/trucks?status=active`)
    const raw = await handleJson<Array<{ id_truck: number; no_police: string; jenis_kendaraan: string }>>(res)
    return raw.map((t) => ({ id_truck: String(t.id_truck), no_police: t.no_police, jenis_kendaraan: t.jenis_kendaraan }))
  },

  async fetchTodayCheckedPlates(): Promise<string[]> {
    const res = await authFetch(`${API_BASE}/bbs/checklists/today-plates`)
    const data = await handleJson<{ plates: string[] }>(res)
    return data.plates || []
  },

  async fetchDashboard(month?: string): Promise<BbsDashboardResponse> {
    const qs = month ? `?month=${month}` : ''
    const res = await authFetch(`${API_BASE}/bbs/dashboard${qs}`)
    return handleJson(res)
  },

  async importAlarms(file: File): Promise<BbsAlarmImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await authFetch(`${API_BASE}/bbs/alarms/import`, { method: 'POST', body: formData })
    return handleJson(res)
  },

  async fetchAlarms(params?: { page?: number; limit?: number; plate?: string; alarm_type?: string; date_from?: string; date_to?: string }): Promise<BbsAlarmListResponse> {
    const searchParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') searchParams.set(key, String(value))
    })
    const qs = searchParams.toString()
    const res = await authFetch(`${API_BASE}/bbs/alarms${qs ? `?${qs}` : ''}`)
    return handleJson(res)
  },

  async fetchAlarmBreakdown(month?: string): Promise<BbsAlarmBreakdown> {
    const qs = month ? `?month=${month}` : ''
    const res = await authFetch(`${API_BASE}/bbs/alarm-breakdown${qs}`)
    return handleJson(res)
  },

  async createObservation(data: BbsObservationInput) {
    const res = await authFetch(`${API_BASE}/bbs/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async createChecklist(data: BbsChecklistInput) {
    const res = await authFetch(`${API_BASE}/bbs/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async createIncident(data: BbsIncidentInput) {
    const res = await authFetch(`${API_BASE}/bbs/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async fetchHistory(params?: {
    type?: string
    limit?: number
    offset?: number
  }): Promise<BbsHistoryResponse> {
    const searchParams = new URLSearchParams()
    if (params?.type) searchParams.set('type', params.type)
    if (params?.limit != null) searchParams.set('limit', String(params.limit))
    if (params?.offset != null) searchParams.set('offset', String(params.offset))
    const qs = searchParams.toString()
    const res = await authFetch(`${API_BASE}/bbs/history${qs ? `?${qs}` : ''}`)
    return handleJson(res)
  },

  async fetchObservationDetail(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/bbs/observations/${id}`)
    return handleJson(res)
  },

  async updateObservation(id: number, data: BbsObservationInput) {
    const res = await authFetch(`${API_BASE}/bbs/observations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async fetchChecklistDetail(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/bbs/checklists/${id}`)
    return handleJson(res)
  },

  async updateChecklist(id: number, data: BbsChecklistInput) {
    const res = await authFetch(`${API_BASE}/bbs/checklists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async fetchIncidentDetail(id: number): Promise<any> {
    const res = await authFetch(`${API_BASE}/bbs/incidents/${id}`)
    return handleJson(res)
  },

  async updateIncident(id: number, data: BbsIncidentInput) {
    const res = await authFetch(`${API_BASE}/bbs/incidents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async deleteObservation(id: number) {
    const res = await authFetch(`${API_BASE}/bbs/observations/${id}`, { method: 'DELETE' })
    return handleJson(res)
  },

  async deleteChecklist(id: number) {
    const res = await authFetch(`${API_BASE}/bbs/checklists/${id}`, { method: 'DELETE' })
    return handleJson(res)
  },

  async deleteIncident(id: number) {
    const res = await authFetch(`${API_BASE}/bbs/incidents/${id}`, { method: 'DELETE' })
    return handleJson(res)
  },
}
