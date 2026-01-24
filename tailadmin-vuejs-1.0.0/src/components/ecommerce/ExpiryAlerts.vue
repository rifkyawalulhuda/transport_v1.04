<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Expiry Alerts
        </h3>
        <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          H-{{ meta.days }} atau sudah lewat
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs font-medium">
        <span
          class="rounded-full bg-error-50 px-2 py-1 text-error-600 dark:bg-error-500/15 dark:text-error-400"
        >
          Merah: {{ counts.red }}
        </span>
        <span
          class="rounded-full bg-warning-50 px-2 py-1 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
        >
          Kuning: {{ counts.yellow }}
        </span>
        <button
          type="button"
          class="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          :aria-expanded="isOpen"
          @click="toggleOpen"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200"
            :class="isOpen ? 'rotate-180' : ''"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 8l6 6 6-6" />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-show="isOpen"
      class="mt-4 grid grid-cols-2 gap-13 lg:grid-cols-[minmax(0,1fr)_500px]"
    >
      <div class="min-w-0">
        <div class="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span class="font-medium text-gray-600 dark:text-gray-300">Filter status:</span>
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-medium transition"
            :class="statusFilter === 'all'
              ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'"
            @click="setStatusFilter('all')"
          >
            Semua
          </button>
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-medium transition"
            :class="statusFilter === 'red'
              ? 'border-error-500 bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'"
            @click="setStatusFilter('red')"
          >
            Merah
          </button>
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-medium transition"
            :class="statusFilter === 'yellow'
              ? 'border-warning-400 bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'"
            @click="setStatusFilter('yellow')"
          >
            Kuning
          </button>
        </div>
        <div
          v-if="loading"
          class="flex h-[180px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          Loading...
        </div>
        <div
          v-else-if="items.length === 0"
          class="flex h-[180px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          Tidak ada data mendekati jatuh tempo.
        </div>
        <div
          v-else-if="filteredItems.length === 0"
          class="flex h-[180px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          Tidak ada data untuk filter ini.
        </div>
        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <button
            v-for="item in pagedItems"
            :key="itemKey(item)"
            type="button"
            class="flex w-full items-center justify-between gap-4 px-2 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            @click="goToDetail(item)"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {{ item.title }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ item.fieldLabel }}
              </p>
              <p
                v-if="item.subtitle"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                {{ item.subtitle }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {{ formatDueDate(item.dueDate) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDaysLeft(item) }}
                </p>
              </div>
              <span
                :class="statusClass(item.status)"
                class="rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide"
              >
                {{ statusLabel(item.status) }}
              </span>
            </div>
          </button>
        </div>

        <div
          v-if="!loading && filteredItems.length > 0 && totalPages > 1"
          class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400"
        >
          <div>
            Halaman
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{ currentPage }}
            </span>
            dari
            <span class="font-medium text-gray-700 dark:text-gray-200">
              {{ totalPages }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="currentPage === 1"
              @click="setPage(currentPage - 1)"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="currentPage === totalPages"
              @click="setPage(currentPage + 1)"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <svg
              class="h-4 w-4 text-gray-500 dark:text-gray-400"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12l4-4 3 3 4-6" />
              <path d="M3 17h14" />
            </svg>
            Insights
          </div>
          <p
            v-if="breakdownEstimated"
            class="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            Perkiraan dari daftar.
          </p>

          <div class="mt-4 space-y-4">
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Composition
                </span>
                <span class="text-gray-500 dark:text-gray-400">
                  Merah {{ redPctLabel }}% • Kuning {{ yellowPctLabel }}%
                </span>
              </div>
              <div class="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                <div class="flex h-full w-full">
                  <div
                    class="h-full bg-red-500 dark:bg-red-400"
                    :style="{ width: `${redPct}%` }"
                  ></div>
                  <div
                    class="h-full bg-amber-400 dark:bg-amber-300"
                    :style="{ width: `${yellowPct}%` }"
                  ></div>
                </div>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div class="flex items-center gap-1">
                  <span class="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400"></span>
                  Merah ({{ counts.red }})
                </div>
                <div class="flex items-center gap-1">
                  <span class="h-2 w-2 rounded-full bg-amber-400 dark:bg-amber-300"></span>
                  Kuning ({{ counts.yellow }})
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  By Category
                </span>
                <span class="text-gray-500 dark:text-gray-400">
                  Total {{ counts.total }}
                </span>
              </div>
              <div class="mt-2 space-y-2">
                <div
                  v-for="row in categoryRows"
                  :key="row.key"
                  class="flex items-center gap-2"
                >
                  <div class="w-16 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {{ row.label }}
                  </div>
                  <div class="flex flex-1 items-center">
                    <div class="h-2 w-36 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div class="flex h-full w-full">
                        <div
                          class="h-full bg-red-500 dark:bg-red-400"
                          :style="{ width: `${row.redPct}%` }"
                        ></div>
                        <div
                          class="h-full bg-amber-400 dark:bg-amber-300"
                          :style="{ width: `${row.yellowPct}%` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div class="min-w-[110px] text-right text-xs text-gray-500 dark:text-gray-400">
                    {{ row.labelText }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Filter hanya mempengaruhi daftar.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'

type ExpiryAlertItem = {
  entityType: 'truck' | 'chasis' | 'driver'
  entityId: string | number
  title: string
  subtitle?: string
  fieldKey: string
  fieldLabel: string
  dueDate: string
  status: 'red' | 'yellow'
  daysLeft: number
  routeName?: string
  routeParams?: Record<string, unknown>
  routePath?: string
}

type BreakdownCounts = {
  red: number
  yellow: number
  total: number
}

type ExpiryAlertBreakdown = {
  truck: BreakdownCounts
  chasis: BreakdownCounts
  driver: BreakdownCounts
}

type ExpiryAlertResponse = {
  meta?: {
    days: number
    limit: number
    generated_at: string
  }
  counts?: {
    red: number
    yellow: number
    total: number
  }
  breakdown?: Partial<ExpiryAlertBreakdown>
  items?: ExpiryAlertItem[]
}

const router = useRouter()
const toast = useToast()
const items = ref<ExpiryAlertItem[]>([])
const loading = ref(false)
const counts = reactive({ red: 0, yellow: 0, total: 0 })
const meta = reactive({ days: 30, limit: 10, generated_at: '' })
const pageSize = 10
const currentPage = ref(1)
const isOpen = ref(true)
const breakdown = reactive<ExpiryAlertBreakdown>({
  truck: { red: 0, yellow: 0, total: 0 },
  chasis: { red: 0, yellow: 0, total: 0 },
  driver: { red: 0, yellow: 0, total: 0 }
})
const breakdownEstimated = ref(false)
const statusFilter = ref<'all' | 'red' | 'yellow'>('all')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
})

const parseDateOnly = (value: string) => {
  if (!value) {
    return null
  }
  const parts = value.split('-')
  if (parts.length === 3) {
    const year = Number(parts[0])
    const month = Number(parts[1]) - 1
    const day = Number(parts[2])
    return new Date(year, month, day)
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDueDate = (value: string) => {
  const date = parseDateOnly(value)
  if (!date) {
    return value
  }
  return dateFormatter.format(date)
}

const formatDaysLeft = (item: ExpiryAlertItem) => {
  if (item.status === 'red') {
    return `Lewat ${Math.abs(Number(item.daysLeft) || 0)} hari`
  }
  return `H-${Number(item.daysLeft) || 0}`
}

const statusLabel = (status: ExpiryAlertItem['status']) =>
  status === 'red' ? 'Merah' : 'Kuning'

const statusClass = (status: ExpiryAlertItem['status']) => {
  if (status === 'red') {
    return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400'
  }
  return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
}

const itemKey = (item: ExpiryAlertItem) =>
  `${item.entityType}-${item.entityId}-${item.fieldKey}-${item.dueDate}`

const normalizeBreakdownCounts = (value?: Partial<BreakdownCounts>) => {
  const red = Number(value?.red) || 0
  const yellow = Number(value?.yellow) || 0
  const total = Number(value?.total) || red + yellow
  return { red, yellow, total }
}

const applyBreakdown = (source?: Partial<ExpiryAlertBreakdown>) => {
  const nextTruck = normalizeBreakdownCounts(source?.truck)
  const nextChasis = normalizeBreakdownCounts(source?.chasis)
  const nextDriver = normalizeBreakdownCounts(source?.driver)
  breakdown.truck = nextTruck
  breakdown.chasis = nextChasis
  breakdown.driver = nextDriver
}

const computeBreakdownFromItems = (list: ExpiryAlertItem[]) => {
  const result: ExpiryAlertBreakdown = {
    truck: { red: 0, yellow: 0, total: 0 },
    chasis: { red: 0, yellow: 0, total: 0 },
    driver: { red: 0, yellow: 0, total: 0 }
  }
  list.forEach((item) => {
    const bucket = result[item.entityType]
    if (!bucket) {
      return
    }
    if (item.status === 'red') {
      bucket.red += 1
    } else if (item.status === 'yellow') {
      bucket.yellow += 1
    }
    bucket.total += 1
  })
  return result
}

const goToDetail = async (item: ExpiryAlertItem) => {
  let routed = false
  if (item.routeName) {
    try {
      await router.push({
        name: item.routeName,
        params: item.routeParams || {}
      })
      routed = true
    } catch (error) {
      console.error(error)
    }
  }
  if (!routed && item.routePath) {
    try {
      await router.push(item.routePath)
      routed = true
    } catch (error) {
      console.error(error)
    }
  }
  if (!routed) {
    toast.error('Tujuan tidak ditemukan.')
  }
}

const fetchAlerts = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      days: String(meta.days),
      limit: '0'
    })
    const res = await authFetch(`${API_BASE}/dashboard/expiry-alerts?${params}`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat expiry alerts.')
    }
    const data = (await res.json()) as ExpiryAlertResponse
    const nextItems = Array.isArray(data?.items) ? data.items : []
    items.value = nextItems
    currentPage.value = 1
    counts.red = Number(data?.counts?.red) || 0
    counts.yellow = Number(data?.counts?.yellow) || 0
    counts.total = Number(data?.counts?.total) || 0
    if (data?.breakdown && typeof data.breakdown === 'object') {
      applyBreakdown(data.breakdown)
      breakdownEstimated.value = false
    } else {
      applyBreakdown(computeBreakdownFromItems(nextItems))
      breakdownEstimated.value = true
    }
    if (data?.meta) {
      meta.days = Number(data.meta.days) || meta.days
      meta.limit = Number(data.meta.limit) || meta.limit
      meta.generated_at = data.meta.generated_at || meta.generated_at
    }
  } catch (error: any) {
    items.value = []
    counts.red = 0
    counts.yellow = 0
    counts.total = 0
    applyBreakdown()
    breakdownEstimated.value = false
    toast.error(error?.message || 'Gagal memuat expiry alerts.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void fetchAlerts()
})

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const setStatusFilter = (value: 'all' | 'red' | 'yellow') => {
  statusFilter.value = value
  currentPage.value = 1
}

const totalAlerts = computed(() => counts.total)
const redPct = computed(() => (totalAlerts.value ? (counts.red / totalAlerts.value) * 100 : 0))
const yellowPct = computed(() =>
  totalAlerts.value ? (counts.yellow / totalAlerts.value) * 100 : 0
)
const redPctLabel = computed(() => Math.round(redPct.value))
const yellowPctLabel = computed(() => Math.round(yellowPct.value))

const categoryRows = computed(() => {
  const rows = [
    { key: 'truck', label: 'Truck', data: breakdown.truck },
    { key: 'chasis', label: 'Chasis', data: breakdown.chasis },
    { key: 'driver', label: 'Driver', data: breakdown.driver }
  ]

  return rows.map((row) => {
    const red = Number(row.data.red) || 0
    const yellow = Number(row.data.yellow) || 0
    const total = Number(row.data.total) || red + yellow
    const redPctValue = total ? (red / total) * 100 : 0
    const yellowPctValue = total ? (yellow / total) * 100 : 0
    return {
      key: row.key,
      label: row.label,
      redPct: redPctValue,
      yellowPct: yellowPctValue,
      labelText: total === 0 ? '0' : `Merah ${red} • Kuning ${yellow}`
    }
  })
})

const filteredItems = computed(() => {
  if (statusFilter.value === 'all') {
    return items.value
  }
  return items.value.filter((item) => item.status === statusFilter.value)
})

const totalPages = computed(() => {
  if (filteredItems.value.length === 0) {
    return 1
  }
  return Math.ceil(filteredItems.value.length / pageSize)
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

const setPage = (page: number) => {
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  currentPage.value = nextPage
}

watch([items, statusFilter], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})
</script>
