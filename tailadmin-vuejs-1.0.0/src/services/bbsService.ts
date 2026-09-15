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

// ── Speed Tab ────────────────────────────────────────────────────────────────

export interface BbsSpeedRow {
  id: number
  plate_number: string
  driver_id: string
  nama_driver?: string | null
  fleet?: string | null
  begin_time: string
  end_time?: string | null
  duration_seconds?: number | null
  max_speed_kmh?: number | null
  avg_speed_kmh?: number | null
  sample_count?: number | null
  distance_km?: number | null
  threshold_kmh?: number | null
  month_key?: string | null
  // computed on frontend
  speed_kmh?: number | null
  speed_limit?: number | null
  excess_kmh?: number | null
  location?: string | null
}

export interface BbsSpeedListResponse {
  rows: BbsSpeedRow[]
  pagination: { page: number; limit: number; total: number }
}

export interface BbsSpeedSummary {
  total_events: number
  vehicles_affected: number
  avg_excess_kmh: number | null
  max_excess_kmh: number | null
  top_offender_plate: string | null
  top_offender_count: number | null
}

export interface BbsSpeedTrend {
  labels: string[]
  data: number[]
  month: string
}

export interface BbsSpeedImportResult {
  success: boolean
  total: number
  inserted: number
  duplicates: number
  skipped_no_driver: number
  unmatched_driver: number
  dedup_burst: number
  // Downsampling: hanya baris > threshold + satu sampel per interval sampling
  // yang disimpan ke database.
  stored_kept?: number
  kept_overspeed?: number
  sampled_moving?: number
  dropped_idle?: number
  dropped_moving?: number
  stored_reduction_percent?: number
  failed: number
  errors: Array<{ row: number | null; field: string; message: string }>
  message: string
}

export interface BbsSpeedSettings {
  default_speed_limit: number
}

// ── Retention (ADAS + Speed) ────────────────────────────────────────────────

export type BbsRetentionModule = 'adas' | 'speed'

export interface BbsRetentionCounts {
  telemetry: number
  events: number
  daily: number
}

export interface BbsRetentionModuleState {
  days: number
  enabled: boolean
  would_delete?: number | BbsRetentionCounts
  approx_bytes?: number
  deleted?: number | BbsRetentionCounts
  skipped?: string
  /** Total baris yang tersimpan (semua umur) — konteks untuk pratinjau. */
  total_rows?: number
  /** Umur data tertua dalam hari — menjelaskan kenapa 0 baris memenuhi syarat. */
  oldest_days?: number
  optimized?: Array<{ table: string; ok: boolean; status?: string; error?: string }>
}

export interface BbsRetentionSettings {
  settings: Record<BbsRetentionModule, { days: number; enabled: boolean }>
  defaults: Record<string, number>
  bounds: Record<string, { min: number; max: number; integer: boolean }>
  labels: Record<string, string>
  can_edit: boolean
}

export interface BbsRetentionPreview {
  success: boolean
  modules: BbsRetentionModule[]
  preview: Partial<Record<BbsRetentionModule, BbsRetentionModuleState>>
}

export interface BbsRetentionPurgeResult {
  success: boolean
  requires_confirmation?: boolean
  modules: BbsRetentionModule[]
  results?: Partial<Record<BbsRetentionModule, BbsRetentionModuleState>>
  message: string
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // ── Speed ──────────────────────────────────────────────────────────────────

  async importSpeed(file: File): Promise<BbsSpeedImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await authFetch(`${API_BASE}/bbs/speed/import`, { method: 'POST', body: formData })
    return handleJson(res)
  },

  async fetchSpeed(params?: {
    page?: number
    limit?: number
    plate?: string
    month?: string
    day?: string
  }): Promise<BbsSpeedListResponse> {
    const searchParams = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') searchParams.set(key, String(value))
    })
    const qs = searchParams.toString()
    const res = await authFetch(`${API_BASE}/bbs/speed/events${qs ? `?${qs}` : ''}`)
    const raw = await handleJson<BbsSpeedListResponse>(res)
    // Normalize: map /events fields ke BbsSpeedRow yang dipakai view
    raw.rows = raw.rows.map((r) => ({
      ...r,
      speed_kmh: r.max_speed_kmh ?? null,
      speed_limit: r.threshold_kmh ?? null,
      excess_kmh:
        r.max_speed_kmh != null && r.threshold_kmh != null
          ? Math.max(0, Math.round((r.max_speed_kmh - r.threshold_kmh) * 10) / 10)
          : null,
      location: null,
    }))
    return raw
  },

  async fetchSpeedSummary(month?: string): Promise<BbsSpeedSummary> {
    const qs = month ? `?month=${month}` : ''
    const res = await authFetch(`${API_BASE}/bbs/speed/summary${qs}`)
    // Backend mengembalikan { month, threshold_kmh, penalty_factor, weight, rows[] }
    // Transform ke format flat yang dipakai view
    const raw = await handleJson<{
      month: string
      threshold_kmh: number
      rows: Array<{
        plate_number: string
        event_count: number
        max_speed_kmh: number
        avg_moving_speed_kmh: number
        moving_seconds: number
        overspeed_seconds: number
      }>
    }>(res)
    const rows = raw.rows || []
    const totalEvents = rows.reduce((sum, r) => sum + Number(r.event_count || 0), 0)
    const vehiclesAffected = rows.filter((r) => Number(r.event_count || 0) > 0).length
    const threshold = raw.threshold_kmh || 60
    const excesses = rows
      .filter((r) => Number(r.max_speed_kmh || 0) > threshold)
      .map((r) => Math.round((Number(r.max_speed_kmh) - threshold) * 10) / 10)
    const avgExcess = excesses.length
      ? Math.round((excesses.reduce((a, b) => a + b, 0) / excesses.length) * 10) / 10
      : null
    const maxExcess = excesses.length ? Math.round(Math.max(...excesses) * 10) / 10 : null
    const topOffender = rows.reduce(
      (best, r) => (Number(r.event_count || 0) > Number(best?.event_count || 0) ? r : best),
      null as (typeof rows)[0] | null,
    )
    return {
      total_events: totalEvents,
      vehicles_affected: vehiclesAffected,
      avg_excess_kmh: avgExcess,
      max_excess_kmh: maxExcess,
      top_offender_plate: topOffender?.plate_number ?? null,
      top_offender_count: topOffender ? Number(topOffender.event_count || 0) : null,
    }
  },

  async fetchSpeedTrend(month?: string): Promise<BbsSpeedTrend> {
    // Backend route: /daily-trend, bukan /trend
    const qs = month ? `?month=${month}` : ''
    const res = await authFetch(`${API_BASE}/bbs/speed/daily-trend${qs}`)
    return handleJson(res)
  },

  async fetchSpeedSettings(): Promise<BbsSpeedSettings> {
    // Settings ada di /api/bbs/settings, bukan /api/bbs/speed/settings
    const res = await authFetch(`${API_BASE}/bbs/settings`)
    const raw = await handleJson<{ effective: { threshold_kmh: number } }>(res)
    return { default_speed_limit: raw.effective?.threshold_kmh ?? 60 }
  },

  async saveSpeedSettings(data: BbsSpeedSettings): Promise<{ success: boolean }> {
    // Backend memakai PUT /api/bbs/settings dengan key speed.overspeed_threshold_kmh
    const res = await authFetch(`${API_BASE}/bbs/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'speed.overspeed_threshold_kmh': data.default_speed_limit }),
    })
    return handleJson(res)
  },

  // ── Retention (ADAS + Speed) ──────────────────────────────────────────────

  async fetchRetentionSettings(): Promise<BbsRetentionSettings> {
    const res = await authFetch(`${API_BASE}/bbs/retention`)
    return handleJson(res)
  },

  async saveRetentionSettings(data: { adas_days?: number; speed_days?: number }): Promise<{ success: boolean }> {
    // Backend: PUT /api/bbs/settings dengan key adas.retention_days / speed.retention_days
    const body: Record<string, number> = {}
    if (data.adas_days != null) body['adas.retention_days'] = data.adas_days
    if (data.speed_days != null) body['speed.retention_days'] = data.speed_days
    const res = await authFetch(`${API_BASE}/bbs/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return handleJson(res)
  },

  async previewRetention(modules: BbsRetentionModule[], days?: number): Promise<BbsRetentionPreview> {
    const qs = `?modules=${encodeURIComponent(modules.join(','))}${days != null && days !== undefined ? `&days=${days}` : ''}`
    const res = await authFetch(`${API_BASE}/bbs/retention/preview${qs}`)
    return handleJson(res)
  },

  async runRetentionPurge(
    modules: BbsRetentionModule[],
    confirm: boolean,
    days?: number,
  ): Promise<BbsRetentionPurgeResult> {
    const res = await authFetch(`${API_BASE}/bbs/retention/purge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules, confirm, days }),
    })
    return handleJson(res)
  },
}
