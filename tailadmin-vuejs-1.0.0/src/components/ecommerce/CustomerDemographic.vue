<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
  >
    <div class="flex items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Truck Transaction Average
          </h3>
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ avgPercent }}%
          </span>
        </div>
        <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Based on Delivery Order per month
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model.number="selectedMonth"
          class="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option
            v-for="month in monthOptions"
            :key="month.value"
            :value="month.value"
          >
            {{ month.label }}
          </option>
        </select>
        <select
          v-model.number="selectedYear"
          class="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option
            v-for="year in yearOptions"
            :key="year"
            :value="year"
          >
            {{ year }}
          </option>
        </select>
      </div>
    </div>
    <div class="my-6 min-h-[212px]">
      <div
        v-if="loading"
        class="flex h-[212px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
      >
        Loading...
      </div>
      <div
        v-else-if="rows.length === 0"
        class="flex h-[212px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
      >
        No data for selected month.
      </div>
      <div
        v-else
        class="space-y-5"
      >
        <div
          v-for="row in displayedRows"
          :key="row.id_truck"
          class="flex items-center justify-between"
        >
          <div>
            <p class="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              {{ row.no_police }}
            </p>
            <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
              {{ formatCount(row.transaction_count) }} transaksi
            </span>
          </div>

          <div class="flex w-full max-w-[160px] items-center gap-3">
            <div class="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div
                class="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"
                :style="{ width: `${clampPercent(row.percent)}%` }"
              ></div>
            </div>
            <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {{ formatPercentLabel(row.percent) }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="!shouldShowAllRows && totalPages > 1"
      class="flex items-center justify-center gap-2"
    >
      <template v-for="item in visiblePages" :key="item">
        <button
          v-if="typeof item === 'number'"
          type="button"
          @click="setPage(item)"
          :class="[
            'h-2.5 w-2.5 rounded-full transition',
            currentPage === item
              ? 'bg-brand-500'
              : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600',
          ]"
          :aria-label="`Go to page ${item}`"
        ></button>
        <span
          v-else
          class="text-sm text-gray-400 dark:text-gray-500"
        >
          ...
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'

type TruckMonthlyRow = {
  id_truck: number
  no_police: string
  transaction_count: number
  percent: number
}

const props = defineProps<{
  externalMonth?: number | null
  externalYear?: number | null
  forceShowAllRows?: boolean
}>()

const apiBase = API_BASE
const toast = useToast()
const now = new Date()
const currentYear = now.getFullYear()

const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(currentYear)

const monthOptions = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' }
]
const yearOptions = Array.from({ length: 6 }, (_, index) => currentYear - 5 + index)

const loading = ref(false)
const rows = ref<TruckMonthlyRow[]>([])
const avgPercent = ref(0)
const pageSize = 5
const currentPage = ref(1)
const isPrintMode = ref(false)
const printMedia = typeof window !== 'undefined' ? window.matchMedia('print') : null

const numberFormatter = new Intl.NumberFormat('id-ID')
const formatCount = (value: number) => numberFormatter.format(Number(value) || 0)
const formatPercentLabel = (value: number) => `${Math.round(Number(value) || 0)}%`
const clampPercent = (value: number) => {
  const percent = Number(value) || 0
  if (percent <= 0) {
    return 0
  }
  if (percent >= 100) {
    return 100
  }
  return percent
}

const fetchMonthlyAverage = async () => {
  loading.value = true
  try {
    const res = await authFetch(
      `${apiBase}/dashboard/truck-monthly-avg?month=${selectedMonth.value}&year=${selectedYear.value}`
    )
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat data transaksi truk.')
    }
    const data = await res.json()
    if (data && Array.isArray(data.items)) {
      rows.value = data.items
      avgPercent.value = Number(data.avg_percent) || 0
    } else {
      rows.value = Array.isArray(data) ? data : []
      avgPercent.value = 0
    }
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat data transaksi truk.')
    rows.value = []
    avgPercent.value = 0
  } finally {
    loading.value = false
  }
}

watch([selectedMonth, selectedYear], () => {
  currentPage.value = 1
  void fetchMonthlyAverage()
}, { immediate: true })

const shouldShowAllRows = computed(() => Boolean(props.forceShowAllRows) || isPrintMode.value)
const totalPages = computed(() => Math.ceil(rows.value.length / pageSize))
const displayedRows = computed(() => {
  if (shouldShowAllRows.value) {
    return rows.value
  }
  if (rows.value.length === 0) {
    return []
  }
  const start = (currentPage.value - 1) * pageSize
  return rows.value.slice(start, start + pageSize)
})

const clampCurrentPage = () => {
  if (totalPages.value <= 0) {
    currentPage.value = 1
    return
  }
  if (currentPage.value < 1) {
    currentPage.value = 1
  } else if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}

const setPage = (page: number) => {
  currentPage.value = page
  clampCurrentPage()
}

const visiblePages = computed(() => {
  const pages: Array<number | string> = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let page = 1; page <= total; page += 1) {
      pages.push(page)
    }
    return pages
  }

  const last = total
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, 'ellipsis-end', last)
    return pages
  }
  if (current >= last - 3) {
    pages.push(1, 'ellipsis-start', last - 4, last - 3, last - 2, last - 1, last)
    return pages
  }
  pages.push(1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', last)
  return pages
})

const handleBeforePrint = () => {
  isPrintMode.value = true
}

const handleAfterPrint = () => {
  isPrintMode.value = false
}

const handlePrintMediaChange = (event: MediaQueryListEvent) => {
  isPrintMode.value = event.matches
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
  }
  if (printMedia) {
    isPrintMode.value = printMedia.matches
    if (typeof printMedia.addEventListener === 'function') {
      printMedia.addEventListener('change', handlePrintMediaChange)
    } else if (typeof printMedia.addListener === 'function') {
      printMedia.addListener(handlePrintMediaChange)
    }
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeprint', handleBeforePrint)
    window.removeEventListener('afterprint', handleAfterPrint)
  }
  if (printMedia) {
    if (typeof printMedia.removeEventListener === 'function') {
      printMedia.removeEventListener('change', handlePrintMediaChange)
    } else if (typeof printMedia.removeListener === 'function') {
      printMedia.removeListener(handlePrintMediaChange)
    }
  }
})

watch(rows, () => {
  clampCurrentPage()
})

watch(
  () => props.externalMonth,
  (value) => {
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue) || nextValue < 1 || nextValue > 12) {
      return
    }
    if (selectedMonth.value !== nextValue) {
      selectedMonth.value = nextValue
    }
  },
  { immediate: true }
)

watch(
  () => props.externalYear,
  (value) => {
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue) || nextValue < 1900) {
      return
    }
    if (selectedYear.value !== nextValue) {
      selectedYear.value = nextValue
    }
  },
  { immediate: true }
)
</script>
