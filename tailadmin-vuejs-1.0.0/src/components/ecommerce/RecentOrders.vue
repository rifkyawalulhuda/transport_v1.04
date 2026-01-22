<template>
  <div
    class="overflow-visible rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
    style="height: 430px;"
  >
    <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Calendar Event List</h3>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            @click="toggleFilter"
          >
            <svg
              class="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                stroke-width="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                stroke-width="1.5"
              />
            </svg>

            Filter
          </button>

          <div
            v-if="filterOpen"
            class="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <div class="space-y-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Start date
                </label>
                <div class="calendar-filter-datepicker">
                  <Datepicker
                    v-model="startDate"
                    :format="formatDisplayDate"
                    :max-date="endDate || undefined"
                    :enable-time-picker="false"
                    auto-apply
                    :teleport="false"
                    input-class="calendar-filter-input"
                    menu-class="calendar-filter-menu"
                  />
                </div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                  End date
                </label>
                <div class="calendar-filter-datepicker">
                  <Datepicker
                    v-model="endDate"
                    :format="formatDisplayDate"
                    :min-date="startDate || undefined"
                    :enable-time-picker="false"
                    auto-apply
                    :teleport="false"
                    input-class="calendar-filter-input"
                    menu-class="calendar-filter-menu"
                  />
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  @click="resetFilter"
                >
                  Reset
                </button>
                <button
                  class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                  @click="applyFilter"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>

        <span
          v-if="filterSummary"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          {{ filterSummary }}
        </span>

        <button
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          @click="goToCalendar"
        >
          See all
        </button>
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-t border-gray-100 dark:border-gray-800">
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Event</p>
            </th>
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Date/Time</p>
            </th>
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Created By</p>
            </th>
            <th class="py-3 text-left">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ownership</p>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="loading"
            class="border-t border-gray-100 dark:border-gray-800"
          >
            <td colspan="4" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </td>
          </tr>
          <tr
            v-else-if="displayEvents.length === 0"
            class="border-t border-gray-100 dark:border-gray-800"
          >
            <td colspan="4" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No events found for this range.
            </td>
          </tr>
          <tr
            v-else
            v-for="event in displayEvents"
            :key="event.id"
            class="border-t border-gray-100 dark:border-gray-800"
          >
            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div>
                  <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ event.title }}
                  </p>
                  <span v-if="event.description" class="text-gray-500 text-theme-xs dark:text-gray-400">
                    {{ event.description }}
                  </span>
                </div>
              </div>
            </td>
            <td class="py-3 whitespace-nowrap">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                {{ formatEventRange(event) }}
              </p>
            </td>
            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <img
                    v-if="event.createdBy.avatarUrl"
                    :src="event.createdBy.avatarUrl"
                    :alt="event.createdBy.name"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ getInitials(event.createdBy.name) }}</span>
                </div>
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ event.createdBy.name }}</p>
              </div>
            </td>
            <td class="py-3 whitespace-nowrap">
              <span
                :class="{
                  'rounded-full px-2 py-0.5 text-theme-xs font-medium': true,
                  'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500': event.isMine,
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300': !event.isMine,
                }"
              >
                {{ event.isMine ? 'Mine' : 'Other' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthUser } from '@/services/auth'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const STORAGE_KEY = 'calendar_events_shared'
const events = ref([])
const loading = ref(true)
const filterOpen = ref(false)
const startDate = ref(null)
const endDate = ref(null)
const isFiltered = ref(false)
const authUser = useAuthUser()
const router = useRouter()

const currentUserId = computed(() => authUser.value?.id_admin ?? authUser.value?.nik_admin ?? null)

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const parseDate = (value) => {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getInitials = (name) => {
  const clean = String(name || '').trim()
  if (!clean) {
    return 'U'
  }
  const parts = clean.split(/\s+/).slice(0, 2)
  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}

const normalizeEvent = (event) => {
  const extendedProps = event.extendedProps || {}
  return {
    id: String(event.id || ''),
    title: event.title || '',
    start: event.start || '',
    end: event.end || null,
    description: extendedProps.description || event.description || '',
    createdBy: {
      userId: extendedProps.created_by_user_id ?? event.created_by_user_id ?? null,
      name: extendedProps.created_by_name ?? event.created_by_name ?? 'User',
      avatarUrl: extendedProps.created_by_avatar_url ?? event.created_by_avatar_url ?? null,
    },
  }
}

const loadEvents = () => {
  loading.value = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      events.value = []
      return
    }
    const parsed = JSON.parse(raw)
    events.value = Array.isArray(parsed) ? parsed.map(normalizeEvent) : []
  } catch {
    events.value = []
  } finally {
    loading.value = false
  }
}

const toggleFilter = () => {
  if (!filterOpen.value) {
    if (!startDate.value || !endDate.value) {
      setDefaultRange()
    }
  }
  filterOpen.value = !filterOpen.value
}

const applyFilter = () => {
  isFiltered.value = Boolean(startDate.value && endDate.value)
  filterOpen.value = false
}

const resetFilter = () => {
  isFiltered.value = false
  startDate.value = null
  endDate.value = null
  filterOpen.value = false
}

const formatDisplayDate = (date) => {
  if (!date) {
    return ''
  }
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

const setDefaultRange = () => {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + 30)
  startDate.value = today
  endDate.value = end
}

const filterSummary = computed(() => {
  if (!isFiltered.value || !startDate.value || !endDate.value) {
    return ''
  }
  return `${formatDisplayDate(startDate.value)} - ${formatDisplayDate(endDate.value)}`
})

const withinRange = (event) => {
  if (!startDate.value || !endDate.value) {
    return true
  }
  const start = parseDate(event.start)
  if (!start) {
    return false
  }
  const fromDate = new Date(startDate.value)
  const toDate = new Date(endDate.value)
  fromDate.setHours(0, 0, 0, 0)
  toDate.setHours(23, 59, 59, 999)
  const startTime = start.getTime()
  return startTime >= fromDate.getTime() && startTime <= toDate.getTime()
}

const displayEvents = computed(() => {
  const normalized = events.value.map((event) => ({
    ...event,
    isMine: currentUserId.value !== null && String(event.createdBy.userId) === String(currentUserId.value),
  }))

  if (isFiltered.value) {
    return normalized
      .filter(withinRange)
      .sort((a, b) => {
        const aDate = parseDate(a.start)?.getTime() ?? 0
        const bDate = parseDate(b.start)?.getTime() ?? 0
        return aDate - bDate
      })
      .slice(0, 5)
  }

  const now = Date.now()
  const upcoming = normalized
    .filter((event) => (parseDate(event.start)?.getTime() ?? 0) >= now)
    .sort((a, b) => {
      const aDate = parseDate(a.start)?.getTime() ?? 0
      const bDate = parseDate(b.start)?.getTime() ?? 0
      return aDate - bDate
    })

  if (upcoming.length > 0) {
    return upcoming.slice(0, 5)
  }

  return normalized
    .sort((a, b) => {
      const aDate = parseDate(a.start)?.getTime() ?? 0
      const bDate = parseDate(b.start)?.getTime() ?? 0
      return bDate - aDate
    })
    .slice(0, 5)
})

const formatEventRange = (event) => {
  const start = parseDate(event.start)
  const end = parseDate(event.end)
  if (!start) {
    return '-'
  }
  const startText = dateTimeFormatter.format(start)
  if (!end) {
    return startText
  }
  const endText = dateTimeFormatter.format(end)
  return `${startText} - ${endText}`
}

const goToCalendar = () => {
  router.push('/calendar')
}

watch(startDate, (value) => {
  if (value && endDate.value && value > endDate.value) {
    endDate.value = null
  }
})

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.calendar-filter-datepicker :deep(.calendar-filter-input) {
  height: 36px;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: transparent;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: #374151;
}

.calendar-filter-datepicker :deep(.calendar-filter-input::placeholder) {
  color: #9ca3af;
}

.dark .calendar-filter-datepicker :deep(.calendar-filter-input) {
  border-color: #374151;
  background-color: #111827;
  color: #e5e7eb;
}

.dark .calendar-filter-datepicker :deep(.calendar-filter-input::placeholder) {
  color: #9ca3af;
}

.calendar-filter-datepicker :deep(.calendar-filter-menu) {
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  color: #111827;
}

.dark .calendar-filter-datepicker :deep(.calendar-filter-menu) {
  border-color: #374151;
  background-color: #111827;
  color: #e5e7eb;
}

.calendar-filter-datepicker :deep(.dp__calendar_header_item),
.calendar-filter-datepicker :deep(.dp__month_year_select),
.calendar-filter-datepicker :deep(.dp__cell_inner) {
  font-size: 0.75rem;
}

.calendar-filter-datepicker :deep(.dp__cell_inner) {
  color: #4b5563;
}

.dark .calendar-filter-datepicker :deep(.dp__cell_inner) {
  color: #e5e7eb;
}

.calendar-filter-datepicker :deep(.dp__cell_inner:hover) {
  background-color: #eef2ff;
}

.dark .calendar-filter-datepicker :deep(.dp__cell_inner:hover) {
  background-color: #1f2937;
}

.calendar-filter-datepicker :deep(.dp__active_date) {
  background-color: #465fff;
  color: #ffffff;
}

.calendar-filter-datepicker :deep(.dp__today) {
  border: 1px solid #465fff;
}
</style>
