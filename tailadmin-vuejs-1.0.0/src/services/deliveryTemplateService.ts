import { authFetch } from './auth'
import { API_BASE } from '@/config/api'

const handleJson = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text()
    const error: any = new Error(message || 'Request gagal')
    error.status = response.status
    throw error
  }
  return response.json()
}

export type DeliveryTemplateStop = {
  id?: number
  stop_order: number
  stop_name: string
  wialon_resource_id?: number | null
  wialon_zone_id?: number | null
  wialon_zone_name?: string | null
  is_departure: number
  is_finish: number
  time_hhmm?: string | null // "07:00" format
}

export type DeliveryTemplate = {
  id: number
  template_name: string
  description?: string | null
  is_active?: number
  stops: DeliveryTemplateStop[]
}

export type DeliveryTemplatePayload = {
  template_name: string
  description?: string | null
  stops: DeliveryTemplateStop[]
}

export const deliveryTemplateService = {
  async fetchTemplates() {
    const res = await authFetch(`${API_BASE}/delivery-templates`)
    return handleJson(res)
  },

  async fetchTemplate(id: number) {
    const res = await authFetch(`${API_BASE}/delivery-templates/${id}`)
    return handleJson(res)
  },

  async createTemplate(data: DeliveryTemplatePayload) {
    const res = await authFetch(`${API_BASE}/delivery-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async updateTemplate(id: number, data: DeliveryTemplatePayload) {
    const res = await authFetch(`${API_BASE}/delivery-templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return handleJson(res)
  },

  async deleteTemplate(id: number) {
    const res = await authFetch(`${API_BASE}/delivery-templates/${id}`, {
      method: 'DELETE',
    })
    return handleJson(res)
  },
}
