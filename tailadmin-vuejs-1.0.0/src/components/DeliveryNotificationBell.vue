<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      @click="toggleDropdown"
      title="Notifikasi Pengiriman"
    >
      <!-- Unread badge -->
      <span
        :class="{ hidden: unreadCount === 0, flex: unreadCount > 0 }"
        class="absolute -right-0.5 -top-0.5 z-10 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>

      <!-- Truck/delivery bell icon (inline SVG matching project style) -->
      <svg
        class="fill-current"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M3 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1h2.382a1 1 0 0 1 .894.553l1.618 3.235A1 1 0 0 1 20 9.236V15a1 1 0 0 1-1 1h-1.17a3 3 0 0 1-5.66 0H9.83a3 3 0 0 1-5.66 0H4a1 1 0 0 1-1-1V4Zm2 10.17V5h9v9.17a3.001 3.001 0 0 0-4.83 1.83H9.83A3.001 3.001 0 0 0 5 14.17ZM16 9h2.382l-1-2H15v2h1Zm0 2h2v3h-.17a3.001 3.001 0 0 0-4.83 1.83V11h3ZM7 15a1 1 0 1 0 2 0 1 1 0 0 0-2 0Zm9 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z"
          fill=""
        />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="dropdownOpen"
      class="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
        <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Notifikasi Pengiriman
        </h5>
        <div class="flex items-center gap-2">
          <button
            v-if="notifications.length"
            class="text-xs font-medium text-brand-500 hover:text-brand-600"
            @click="handleMarkAllRead"
          >
            Tandai Semua Dibaca
          </button>
          <button @click="closeDropdown" class="text-gray-500 dark:text-gray-400">
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Notification list -->
      <ul class="flex flex-col h-auto overflow-y-auto custom-scrollbar">
        <li
          v-for="item in notifications"
          :key="item.id"
        >
          <button
            class="flex w-full gap-3 rounded-lg border-b border-gray-100 px-3 py-3 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20': !item.is_read }"
            @click="handleItemClick(item)"
          >
            <!-- Unread indicator dot -->
            <span class="mt-1.5 flex-shrink-0">
              <span
                class="block h-2 w-2 rounded-full"
                :class="item.is_read ? 'bg-transparent' : 'bg-brand-500'"
              ></span>
            </span>

            <span class="block min-w-0">
              <!-- Truck plate + route -->
              <span class="mb-1 block text-theme-sm">
                <span class="font-medium text-gray-800 dark:text-white/90">
                  {{ item.truck_plate }}
                </span>
                <span class="ml-1 text-gray-500 dark:text-gray-400">
                  — {{ item.route_name }}
                </span>
              </span>

              <!-- Step / arrival type label -->
              <div class="flex items-center gap-1.5 mb-1">
                <span
                  v-if="item.step_name"
                  class="inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-medium text-warning-700 dark:bg-warning-500/20 dark:text-warning-300"
                >
                  Stop: {{ item.step_name }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                >
                  Final Arrival
                </span>
              </div>

              <!-- Message (truncated) -->
              <span class="block text-theme-xs text-gray-600 dark:text-gray-300 truncate max-w-[260px]">
                {{ item.message }}
              </span>

              <!-- Arrival time + time ago -->
              <span class="mt-1 flex items-center gap-2 text-gray-400 text-theme-xs dark:text-gray-500">
                <span>Tiba: {{ formatArrival(item.scheduled_arrival) }}</span>
                <span class="h-1 w-1 rounded-full bg-gray-400"></span>
                <span>{{ formatTimeAgo(item.created_at) }}</span>
              </span>
            </span>
          </button>
        </li>

        <!-- Empty state -->
        <li
          v-if="!loading && !notifications.length"
          class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Belum ada notifikasi pengiriman
        </li>

        <!-- Loading state -->
        <li
          v-if="loading && !notifications.length"
          class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500"
        >
          Memuat...
        </li>
      </ul>

      <!-- Footer: close button -->
      <button
        class="mt-3 flex justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        @click="closeDropdown"
      >
        Tutup
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

const router = useRouter()
const dropdownRef = ref(null)
const dropdownOpen = ref(false)
const loading = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const pollerId = ref(null)

// ─── API helpers ──────────────────────────────────────────────────────────────

const fetchNotifications = async () => {
  try {
    const res = await authFetch(`${API_BASE}/delivery-notifications?unread=true`)
    if (!res.ok) {
      return
    }
    const data = await res.json()
    notifications.value = Array.isArray(data?.notifications)
      ? data.notifications.slice(0, 10)
      : []
    unreadCount.value = Number(data?.unread_count || 0)
  } catch {
    // fail silently — no error crashes per requirement
  }
}

const markOneRead = async (id) => {
  try {
    const res = await authFetch(`${API_BASE}/delivery-notifications/${id}/read`, {
      method: 'PUT'
    })
    if (!res.ok) {
      return
    }
    // update local state immediately
    const item = notifications.value.find((n) => n.id === id)
    if (item && !item.is_read) {
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch {
    // fail silently
  }
}

const markAllRead = async () => {
  try {
    const res = await authFetch(`${API_BASE}/delivery-notifications/read-all`, {
      method: 'PUT'
    })
    if (!res.ok) {
      return
    }
    // refresh list after marking all read
    await fetchNotifications()
  } catch {
    // fail silently
  }
}

// ─── Dropdown logic ───────────────────────────────────────────────────────────

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

// ─── Item click: mark read + navigate ────────────────────────────────────────

const handleItemClick = async (item) => {
  if (!item.is_read) {
    await markOneRead(item.id)
  }
  closeDropdown()
  router.push('/sales-cost')
}

const handleMarkAllRead = async () => {
  await markAllRead()
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatArrival = (dateValue) => {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}d lalu`
  const minutes = Math.floor(diff / 60)
  if (minutes < 60) return `${minutes} mnt lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'kemarin'
  return `${days} hari lalu`
}

// ─── Refresh on open ──────────────────────────────────────────────────────────

watch(dropdownOpen, (open) => {
  if (open) {
    fetchNotifications()
  }
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchNotifications()
  pollerId.value = window.setInterval(fetchNotifications, 30000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (pollerId.value) {
    clearInterval(pollerId.value)
  }
})
</script>
