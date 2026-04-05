import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

export interface TruckMileageRow {
  id_truck: number
  no_police: string | null
  vehicle_name: string | null
  jenis_kendaraan: string | null
  merk_mobil: string | null
  model: string | null
  type_truck: string | null
  wialon_unit_id: string | null
  total_distance_m: number
  total_distance_km: number
  trips_count: number
  first_trip_at: string | null
  last_trip_at: string | null
  status: 'has_trip' | 'no_trip' | 'unlinked' | 'missing_unit' | 'error'
  error: string | null
}

export interface TruckMileageSummary {
  total_trucks: number
  mapped_trucks: number
  unlinked_trucks: number
  active_trucks: number
  error_trucks: number
  total_distance_m: number
  total_distance_km: number
  total_trips: number
}

export interface TruckMileagePeriod {
  year: number
  month: number
  month_key: string
  start_at: string
  end_at: string
}

export interface TruckMileageMeta {
  fetched_at: string
  cached: boolean
  cache_ttl_ms: number
  source: string
  worker_count?: number
  search?: string
}

export interface TruckMileagePagination {
  page: number
  limit: number
  total_rows: number
  total_pages: number
}

export interface TruckMileageResponse {
  summary: TruckMileageSummary
  rows: TruckMileageRow[]
  period: TruckMileagePeriod
  pagination: TruckMileagePagination
  meta: TruckMileageMeta
}

const handleJson = async (response: Response): Promise<TruckMileageResponse> => {
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const error = new Error(message || 'Request gagal') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return response.json()
}

export const truckMileageService = {
  async fetchMonthlyDistance(params?: {
    month?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<TruckMileageResponse> {
    const searchParams = new URLSearchParams()
    if (params?.month) {
      searchParams.set('month', params.month)
    }
    if (params?.search) {
      searchParams.set('search', params.search)
    }
    if (params?.page) {
      searchParams.set('page', String(params.page))
    }
    if (params?.limit) {
      searchParams.set('limit', String(params.limit))
    }

    const url = `${API_BASE}/wialon/trucks/monthly-distance${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`
    const res = await authFetch(url)
    return handleJson(res)
  },

  async exportMonthlyDistance(params?: {
    month?: string
    search?: string
  }): Promise<Response> {
    const searchParams = new URLSearchParams()
    if (params?.month) {
      searchParams.set('month', params.month)
    }
    if (params?.search) {
      searchParams.set('search', params.search)
    }

    const url = `${API_BASE}/wialon/trucks/monthly-distance/export${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`
    return authFetch(url)
  }
}
