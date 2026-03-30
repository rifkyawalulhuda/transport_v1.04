import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

type TruckLocationResponse = unknown
type ReverseGeocodeResponse = unknown

const handleJson = async (response: Response): Promise<TruckLocationResponse> => {
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const error = new Error(message || 'Request gagal') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return response.json()
}

export const truckLocationService = {
  async fetchTruckLocations(): Promise<TruckLocationResponse> {
    const res = await authFetch(`${API_BASE}/wialon/trucks/location`)
    return handleJson(res)
  },

  async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResponse> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon)
    })
    const res = await authFetch(`${API_BASE}/wialon/reverse-geocode?${params.toString()}`)
    return handleJson(res)
  }
}
