import { authFetch } from './auth'
import { API_BASE } from '@/config/api'

const API_MASTER = `${API_BASE}/master`

const MASTER_IMPORT_CONFIG = {
  truck: {
    label: 'Truck',
    templateUrl: `${API_MASTER}/truck/template`,
    exportUrl: `${API_MASTER}/truck/export`,
    importUrl: `${API_MASTER}/truck/import`,
    fileField: 'file',
    accept: ['.xlsx'],
    maxSizeMB: 2
  },
  driver: {
    label: 'Driver',
    templateUrl: `${API_MASTER}/driver/template`,
    exportUrl: `${API_MASTER}/driver/export`,
    importUrl: `${API_MASTER}/driver/import`,
    fileField: 'file',
    accept: ['.xlsx'],
    maxSizeMB: 2
  },
  customer: {
    label: 'Customer',
    templateUrl: `${API_MASTER}/customer/template`,
    exportUrl: `${API_MASTER}/customer/export`,
    importUrl: `${API_MASTER}/customer/import`,
    fileField: 'file',
    accept: ['.xlsx'],
    maxSizeMB: 2
  },
  area: {
    label: 'Rute',
    templateUrl: `${API_MASTER}/area/template`,
    exportUrl: `${API_MASTER}/area/export`,
    importUrl: `${API_MASTER}/area/import`,
    fileField: 'file',
    accept: ['.xlsx'],
    maxSizeMB: 2
  },
  warehouse: {
    label: 'Warehouse',
    templateUrl: `${API_MASTER}/warehouse/template`,
    exportUrl: `${API_MASTER}/warehouse/export`,
    importUrl: `${API_MASTER}/warehouse/import`,
    fileField: 'file',
    accept: ['.xlsx'],
    maxSizeMB: 2
  },
  subcont: {
    label: 'Subcont',
    templateUrl: `${API_MASTER}/subcont/template`,
    exportUrl: `${API_MASTER}/subcont/export`,
    importUrl: `${API_MASTER}/subcont/import`,
    fileField: 'file',
    accept: ['.xlsx'],
    maxSizeMB: 2
  },
  admin: {
    label: 'Admin',
    enabled: false
  }
}

const getConfig = (masterType) => MASTER_IMPORT_CONFIG[masterType]

const stripHtml = (input) =>
  input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const normalizeMessage = (input) => {
  if (!input) {
    return ''
  }
  const raw = typeof input === 'string' ? input : JSON.stringify(input)
  const cleaned = stripHtml(raw)
  return cleaned.slice(0, 300)
}

const readResponsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const rawText = await response.text()

  if (contentType.includes('application/json')) {
    try {
      return { data: JSON.parse(rawText), rawText, contentType }
    } catch {
      return { data: rawText, rawText, contentType }
    }
  }

  if (rawText) {
    try {
      return { data: JSON.parse(rawText), rawText, contentType }
    } catch {
      return { data: rawText, rawText, contentType }
    }
  }

  return { data: null, rawText: '', contentType }
}

const getHeadersSnapshot = (headers) => {
  const snapshot = {}
  headers.forEach((value, key) => {
    snapshot[key] = value
  })
  return snapshot
}

const logResponseDetails = ({ url, method, status, headers, body }) => {
  const snippet = body ? body.slice(0, 300) : ''
  console.error('[import] Response detail', {
    url,
    method,
    status,
    headers,
    bodySnippet: snippet
  })
}

const buildImportUrl = (baseUrl) => {
  if (!baseUrl) {
    return ''
  }
  return baseUrl.includes('?') ? `${baseUrl}&format=json` : `${baseUrl}?format=json`
}

export const masterImportService = {
  getConfig,
  downloadTemplate(masterType) {
    const config = getConfig(masterType)
    if (!config || !config.templateUrl) {
      throw new Error('Template tidak tersedia.')
    }
    window.open(config.templateUrl, '_blank', 'noopener')
  },
  downloadExport(masterType) {
    const config = getConfig(masterType)
    if (!config || !config.exportUrl) {
      throw new Error('Export tidak tersedia.')
    }
    window.open(config.exportUrl, '_blank', 'noopener')
  },
  async importData(masterType, file) {
    const config = getConfig(masterType)
    if (!config || !config.importUrl || !config.fileField) {
      throw new Error('Import tidak tersedia.')
    }

    const formData = new FormData()
    formData.append(config.fileField, file)

    const url = buildImportUrl(config.importUrl)
    const method = 'POST'
    let res
    try {
      res = await authFetch(url, {
        method,
        body: formData
      })
    } catch (error) {
      console.error('[import] Fetch gagal', {
        url,
        method,
        error
      })
      throw error
    }

    const payload = await readResponsePayload(res)
    const isJsonResponse =
      payload.contentType && payload.contentType.includes('application/json')

    if (!res.ok) {
      logResponseDetails({
        url,
        method,
        status: res.status,
        headers: getHeadersSnapshot(res.headers),
        body: payload.rawText
      })
      const data = payload.data
      let message =
        data && typeof data === 'object' && data.message
          ? data.message
          : normalizeMessage(data || payload.rawText)
      if (!message) {
        message = `HTTP ${res.status}`
      }
      const error = new Error(message)
      error.status = res.status
      error.data = data
      error.raw = payload.rawText
      throw error
    }

    if (payload.data && typeof payload.data === 'object') {
      return payload.data
    }

    if (isJsonResponse && payload.rawText) {
      logResponseDetails({
        url,
        method,
        status: res.status,
        headers: getHeadersSnapshot(res.headers),
        body: payload.rawText
      })
    }

    const message = normalizeMessage(payload.data || payload.rawText)
    return {
      success: true,
      inserted: null,
      updated: null,
      failed: null,
      errors: [],
      message: message || 'Import berhasil.'
    }
  }
}
