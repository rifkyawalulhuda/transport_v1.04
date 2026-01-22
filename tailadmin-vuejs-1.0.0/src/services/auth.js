import { ref } from 'vue'
import { API_BASE } from '@/config/api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

const parseJsonSafely = (text) => {
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

const getToken = () => localStorage.getItem(TOKEN_KEY)

const getUser = () => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const authUser = ref(getUser())

const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    authUser.value = user
  }
}

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  authUser.value = null
}

const authFetch = (input, init = {}) => {
  const headers = new Headers(init.headers || {})
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}

let refreshPromise = null
let hasInitialized = false

const refreshUser = async () => {
  if (!getToken()) {
    authUser.value = null
    return null
  }
  if (refreshPromise) {
    return refreshPromise
  }
  refreshPromise = (async () => {
    try {
      const res = await authFetch(`${API_BASE}/auth/me`)
      if (!res.ok) {
        if (res.status === 401) {
          clearAuth()
        }
        return null
      }
      const data = await res.json()
      if (data?.user) {
        setUser(data.user)
        return data.user
      }
      return null
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

const initAuth = async () => {
  if (hasInitialized) {
    return authUser.value
  }
  hasInitialized = true
  if (!getToken()) {
    authUser.value = null
    return null
  }
  await refreshUser()
  return authUser.value
}

const login = async (nik_admin, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nik_admin, password })
  })

  const rawText = await res.text()
  const data = parseJsonSafely(rawText)
  const message =
    data && typeof data === 'object' && data.message ? data.message : rawText || 'Login gagal'

  if (!res.ok) {
    throw new Error(message)
  }

  if (!data || !data.token || !data.user) {
    throw new Error('Response login tidak valid')
  }

  setToken(data.token)
  if (data.user) {
    setUser(data.user)
  }
  await refreshUser()
  hasInitialized = true
  return data
}

const logout = () => {
  clearAuth()
}

export const authService = {
  login,
  logout,
  getToken,
  getUser,
  setUser,
  refreshUser,
  initAuth
}

const useAuthUser = () => authUser

export { authFetch, authUser, useAuthUser, refreshUser, initAuth }
