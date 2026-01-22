import { computed, ref } from 'vue'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

const notifications = ref([])
const isFetching = ref(false)
const apiBase = API_BASE

const unreadCount = computed(
  () => notifications.value.filter((item) => !item.read && !item.readAt).length
)

const fetchNotifications = async ({ limit = 10 } = {}) => {
  isFetching.value = true
  try {
    const res = await authFetch(`${apiBase}/notifications?limit=${limit}`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat notifikasi.')
    }
    const data = await res.json()
    notifications.value = Array.isArray(data?.data) ? data.data : []
    return notifications.value
  } finally {
    isFetching.value = false
  }
}

const markRead = async (id) => {
  const index = notifications.value.findIndex((item) => item._id === id)
  if (index < 0) {
    return
  }
  const original = notifications.value[index]
  notifications.value[index] = { ...original, read: true, readAt: original.readAt || new Date() }
  try {
    const res = await authFetch(`${apiBase}/notifications/${id}/read`, { method: 'POST' })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal menandai notifikasi.')
    }
  } catch (error) {
    notifications.value[index] = original
    throw error
  }
}

const markAllRead = async () => {
  const snapshot = notifications.value.slice()
  notifications.value = notifications.value.map((item) => ({
    ...item,
    read: true,
    readAt: item.readAt || new Date()
  }))
  try {
    const res = await authFetch(`${apiBase}/notifications/read-all`, { method: 'POST' })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal menandai semua notifikasi.')
    }
  } catch (error) {
    notifications.value = snapshot
    throw error
  }
}

const deleteMany = async (ids) => {
  const validIds = Array.isArray(ids) ? ids : []
  if (!validIds.length) {
    return
  }
  const snapshot = notifications.value.slice()
  notifications.value = notifications.value.filter((item) => !validIds.includes(item._id))
  try {
    const res = await authFetch(`${apiBase}/notifications/delete-many`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: validIds })
    })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal menghapus notifikasi.')
    }
  } catch (error) {
    notifications.value = snapshot
    throw error
  }
}

const deleteAll = async () => {
  const snapshot = notifications.value.slice()
  notifications.value = []
  try {
    const res = await authFetch(`${apiBase}/notifications/delete-all`, {
      method: 'POST'
    })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal menghapus notifikasi.')
    }
  } catch (error) {
    notifications.value = snapshot
    throw error
  }
}

export const useNotifications = () => ({
  notifications,
  unreadCount,
  isFetching,
  fetchNotifications,
  markRead,
  markAllRead,
  deleteMany,
  deleteAll
})
