<template>
  <div
    class="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div
      class="rounded-2xl bg-white px-5 pb-6 pt-5 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Detail Sales Cost (Monthly)</h3>
          <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Ringkasan Sales Cost per bulan terpilih.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model.number="selectedMonth"
            class="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option
              v-for="option in monthOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
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
      <div class="relative mt-6">
        <div
          v-if="loading"
          class="flex h-[220px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          Loading...
        </div>
        <div v-else class="h-[220px]">
          <VueApexCharts type="line" height="220" :options="chartOptions" :series="chartSeries" />
        </div>
        <span v-if="!loading" :class="[badgeClass, 'absolute bottom-4 right-4']">
          {{ badgeText }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Sales
        </p>
        <p
          class="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          {{ salesText }}
        </p>
      </div>

      <div class="h-7 w-px bg-gray-200 dark:bg-gray-800"></div>

      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Total Cost
        </p>
        <p
          class="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          {{ totalCostText }}
        </p>
      </div>

      <div class="h-7 w-px bg-gray-200 dark:bg-gray-800"></div>

      <div>
        <p class="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
          Gross Profit
        </p>
        <p
          class="text-center text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
        >
          {{ grossProfitText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps<{
  externalMonth?: number | null
  externalYear?: number | null
}>()

const apiBase = API_BASE
const toast = useToast()

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

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

const yearOptions = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)

const selectedMonth = ref(currentMonth)
const selectedYear = ref(currentYear)

const sales = ref(0)
const totalCost = ref(0)
const grossProfit = ref(0)
const prevGrossProfit = ref(0)
const loading = ref(false)

const numberFormatter = new Intl.NumberFormat('id-ID')

const formatAmount = (value: number) => numberFormatter.format(value || 0)

const salesText = computed(() => (loading.value ? 'Loading...' : formatAmount(sales.value)))
const totalCostText = computed(() =>
  loading.value ? 'Loading...' : formatAmount(totalCost.value)
)
const grossProfitText = computed(() =>
  loading.value ? 'Loading...' : formatAmount(grossProfit.value)
)

const monthLabel = computed(() => {
  const match = monthOptions.find((option) => option.value === selectedMonth.value)
  const monthName = match ? match.label : String(selectedMonth.value)
  return `${monthName} ${selectedYear.value}`
})

const chartSeries = computed(() => [
  {
    name: 'Sales',
    type: 'column',
    data: [sales.value]
  },
  {
    name: 'Total Cost',
    type: 'column',
    data: [totalCost.value]
  },
  {
    name: 'Gross Profit',
    type: 'line',
    data: [grossProfit.value]
  }
])

const chartOptions = computed(() => ({
  colors: ['#465fff', '#F79009', '#12B76A'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'line',
    stacked: false,
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '45%',
      borderRadius: 5,
      borderRadiusApplication: 'end'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: [0, 0, 3],
    curve: 'smooth'
  },
  xaxis: {
    categories: [monthLabel.value],
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatAmount(val)
    }
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Outfit',
    markers: {
      radius: 99
    }
  },
  grid: {
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatAmount(val)
    }
  }
}))

const baseBadgeClass =
  'rounded-full px-2 py-0.5 text-xs font-medium dark:border dark:border-transparent'
const badgeClasses = {
  success: `${baseBadgeClass} bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500`,
  danger: `${baseBadgeClass} bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500`,
  neutral: `${baseBadgeClass} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`
}

const percent = computed(() => {
  if (prevGrossProfit.value === 0) {
    return null
  }
  return ((grossProfit.value - prevGrossProfit.value) / prevGrossProfit.value) * 100
})

const formatPercentValue = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return 'N/A'
  }
  let rounded = Math.round(Number(value) * 100) / 100
  if (Object.is(rounded, -0)) {
    rounded = 0
  }
  const formatted = rounded.toFixed(2).replace(/\.?0+$/, '')
  return rounded > 0 ? `+${formatted}%` : `${formatted}%`
}

const resolveBadgeVariant = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return 'neutral'
  }
  if (Object.is(value, -0)) {
    return 'neutral'
  }
  if (value > 0) {
    return 'success'
  }
  if (value < 0) {
    return 'danger'
  }
  return 'neutral'
}

const badgeText = computed(() => formatPercentValue(percent.value))
const badgeClass = computed(() => badgeClasses[resolveBadgeVariant(percent.value)])

const fetchMonthlyTarget = async () => {
  loading.value = true
  try {
    const res = await authFetch(
      `${apiBase}/dashboard/metrics/sales-cost/summary?month=${selectedMonth.value}&year=${selectedYear.value}`
    )
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat Monthly Target.')
    }
    const data = await res.json()
    sales.value = Number(data?.sales ?? 0)
    totalCost.value = Number(data?.totalCost ?? 0)
    grossProfit.value = Number(data?.grossProfit ?? 0)
    prevGrossProfit.value = Number(data?.prevGrossProfit ?? 0)
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat Monthly Target.')
  } finally {
    loading.value = false
  }
}

watch([selectedMonth, selectedYear], () => {
  void fetchMonthlyTarget()
}, { immediate: true })

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
