<template>
  <div class="space-y-6">
    <div
      class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
    >
      <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div class="w-full">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics Sales Cost</h3>
          <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Ringkasan Sales Cost berdasarkan periode.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            v-if="showYearDropdown"
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
          <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              v-for="option in options"
              :key="option.value"
              @click="setRange(option.value)"
              :class="[
                activeRange === option.value
                  ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                  : 'text-gray-500 dark:text-gray-400',
                'px-3 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 hover:shadow-theme-xs dark:hover:bg-gray-800 dark:hover:text-white',
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <div id="chartThree" class="-ml-4 min-w-[1000px] xl:min-w-full pl-2">
          <div
            v-if="loading"
            class="flex h-[310px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          >
            Loading...
          </div>
          <VueApexCharts
            v-else
            type="area"
            height="310"
            :options="chartOptions"
            :series="series"
          />
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
    >
      <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div class="w-full">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics Subcontractor Cost</h3>
          <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Ringkasan Subcontractor Cost berdasarkan periode.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <select
            v-if="subcontractorShowYearDropdown"
            v-model.number="subcontractorSelectedYear"
            class="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option
              v-for="year in subcontractorYearOptions"
              :key="year"
              :value="year"
            >
              {{ year }}
            </option>
          </select>
          <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              v-for="option in options"
              :key="option.value"
              @click="setSubcontractorRange(option.value)"
              :class="[
                subcontractorActiveRange === option.value
                  ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                  : 'text-gray-500 dark:text-gray-400',
                'px-3 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 hover:shadow-theme-xs dark:hover:bg-gray-800 dark:hover:text-white',
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <div id="chartThreeSubcontractor" class="-ml-4 min-w-[1000px] xl:min-w-full pl-2">
          <div
            v-if="subcontractorLoading"
            class="flex h-[310px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          >
            Loading...
          </div>
          <VueApexCharts
            v-else
            type="area"
            height="310"
            :options="subcontractorChartOptions"
            :series="subcontractorSeries"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { API_BASE } from '@/config/api'
import VueApexCharts from 'vue3-apexcharts'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const options = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]

const apiBase = API_BASE
const toast = useToast()
const numberFormatter = new Intl.NumberFormat('id-ID')
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const yearOptions = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)

const activeRange = ref('monthly')
const loading = ref(false)
const categories = ref<string[]>([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
])
const series = ref([
  { name: 'Sales', data: Array(12).fill(0) },
  { name: 'Total Cost', data: Array(12).fill(0) },
  { name: 'Gross Profit', data: Array(12).fill(0) },
])

const showYearDropdown = computed(() => activeRange.value !== 'annually')

const formatValue = (value: number) => numberFormatter.format(Number(value) || 0)

const chartOptions = computed(() => ({
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
  },
  colors: ['#465FFF', '#F79009', '#12B76A'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'area',
    toolbar: {
      show: false,
    },
  },
  fill: {
    gradient: {
      enabled: true,
      opacityFrom: 0.45,
      opacityTo: 0,
    },
  },
  stroke: {
    curve: 'straight',
    width: [2, 2, 2],
  },
  markers: {
    size: 0,
  },
  labels: {
    show: false,
    position: 'top',
  },
  grid: {
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number) => formatValue(val),
    },
  },
  xaxis: {
    type: 'category',
    categories: categories.value,
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatValue(val),
    },
    title: {
      style: {
        fontSize: '0px',
      },
    },
  },
}))

const getDefaultCategories = (range: string) => {
  if (range === 'quarterly') {
    return ['Q1', 'Q2', 'Q3', 'Q4']
  }
  if (range === 'annually') {
    return Array.from({ length: 5 }, (_, index) => String(currentYear - 4 + index))
  }
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
}

const normalizeSeries = (values: unknown, length: number) => {
  const data = Array.isArray(values) ? values.map((val) => Number(val) || 0) : []
  if (data.length < length) {
    return [...data, ...Array(length - data.length).fill(0)]
  }
  if (data.length > length) {
    return data.slice(0, length)
  }
  return data
}

const resetSeries = (range: string) => {
  const nextCategories = getDefaultCategories(range)
  const length = nextCategories.length
  categories.value = nextCategories
  series.value = [
    { name: 'Sales', data: Array(length).fill(0) },
    { name: 'Total Cost', data: Array(length).fill(0) },
    { name: 'Gross Profit', data: Array(length).fill(0) },
  ]
}

const fetchStatistics = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ range: activeRange.value })
    if (activeRange.value !== 'annually') {
      params.set('year', String(selectedYear.value))
    }
    const res = await authFetch(`${apiBase}/dashboard/charts/sales-cost-statistics?${params}`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat statistik.')
    }
    const data = await res.json()
    const nextCategories = Array.isArray(data?.categories)
      ? data.categories
      : getDefaultCategories(activeRange.value)
    categories.value = nextCategories
    const length = nextCategories.length
    series.value = [
      { name: 'Sales', data: normalizeSeries(data?.series?.sales, length) },
      { name: 'Total Cost', data: normalizeSeries(data?.series?.totalCost, length) },
      { name: 'Gross Profit', data: normalizeSeries(data?.series?.grossProfit, length) },
    ]
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat statistik.')
    resetSeries(activeRange.value)
  } finally {
    loading.value = false
  }
}

const setRange = (range: string) => {
  if (activeRange.value === range) {
    return
  }
  activeRange.value = range
}

watch([activeRange, selectedYear], () => {
  resetSeries(activeRange.value)
  void fetchStatistics()
}, { immediate: true })

const subcontractorMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const subcontractorSelectedYear = ref(currentYear)
const subcontractorYearOptions = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)

const subcontractorActiveRange = ref('monthly')
const subcontractorLoading = ref(false)
const subcontractorCategories = ref<string[]>([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
])
const subcontractorSeries = ref([
  { name: 'Sales', data: Array(12).fill(0) },
  { name: 'Total Cost', data: Array(12).fill(0) },
  { name: 'Gross Profit', data: Array(12).fill(0) },
])

const subcontractorShowYearDropdown = computed(() => subcontractorActiveRange.value !== 'annually')

const subcontractorFormatValue = (value: number) => numberFormatter.format(Number(value) || 0)

const subcontractorChartOptions = computed(() => ({
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
  },
  colors: ['#465FFF', '#F79009', '#12B76A'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'area',
    toolbar: {
      show: false,
    },
  },
  fill: {
    gradient: {
      enabled: true,
      opacityFrom: 0.45,
      opacityTo: 0,
    },
  },
  stroke: {
    curve: 'straight',
    width: [2, 2, 2],
  },
  markers: {
    size: 0,
  },
  labels: {
    show: false,
    position: 'top',
  },
  grid: {
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number) => subcontractorFormatValue(val),
    },
  },
  xaxis: {
    type: 'category',
    categories: subcontractorCategories.value,
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    tooltip: {
      enabled: false,
    },
  },
  yaxis: {
    labels: {
      formatter: (val: number) => subcontractorFormatValue(val),
    },
    title: {
      style: {
        fontSize: '0px',
      },
    },
  },
}))

const getSubcontractorDefaultCategories = (range: string) => {
  if (range === 'quarterly') {
    return ['Q1', 'Q2', 'Q3', 'Q4']
  }
  if (range === 'annually') {
    return Array.from({ length: 5 }, (_, index) => String(currentYear - 4 + index))
  }
  return subcontractorMonthLabels
}

const normalizeSubcontractorSeries = (values: unknown, length: number) => {
  const data = Array.isArray(values) ? values.map((val) => Number(val) || 0) : []
  if (data.length < length) {
    return [...data, ...Array(length - data.length).fill(0)]
  }
  if (data.length > length) {
    return data.slice(0, length)
  }
  return data
}

const resetSubcontractorSeries = (range: string) => {
  const nextCategories = getSubcontractorDefaultCategories(range)
  const length = nextCategories.length
  subcontractorCategories.value = nextCategories
  subcontractorSeries.value = [
    { name: 'Sales', data: Array(length).fill(0) },
    { name: 'Total Cost', data: Array(length).fill(0) },
    { name: 'Gross Profit', data: Array(length).fill(0) },
  ]
}

const getSubcontractorMonthlyTotals = (data: any, year: number) => {
  const monthlySales = Array(12).fill(0)
  const monthlyCost = Array(12).fill(0)
  const yearData = data?.chartDataSubcont?.[String(year)] || {}
  const labels = Array.isArray(yearData.labels) ? yearData.labels : []
  const sales = Array.isArray(yearData.sales) ? yearData.sales : []
  const cost = Array.isArray(yearData.cost) ? yearData.cost : []

  labels.forEach((label: string, index: number) => {
    const monthIndex = subcontractorMonthLabels.indexOf(String(label))
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlySales[monthIndex] = Number(sales[index]) || 0
      monthlyCost[monthIndex] = Number(cost[index]) || 0
    }
  })

  return { monthlySales, monthlyCost }
}

const sumSubcontractorSeries = (values: number[]) =>
  values.reduce((total, value) => total + (Number(value) || 0), 0)

const fetchSubcontractorStatistics = async () => {
  subcontractorLoading.value = true
  try {
    const res = await authFetch(`${apiBase}/dashboard`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat statistik.')
    }
    const data = await res.json()
    const range = subcontractorActiveRange.value

    if (range === 'annually') {
      const nextCategories = getSubcontractorDefaultCategories(range)
      const annualSales = nextCategories.map((yearLabel) => {
        const { monthlySales } = getSubcontractorMonthlyTotals(data, Number(yearLabel))
        return sumSubcontractorSeries(monthlySales)
      })
      const annualCost = nextCategories.map((yearLabel) => {
        const { monthlyCost } = getSubcontractorMonthlyTotals(data, Number(yearLabel))
        return sumSubcontractorSeries(monthlyCost)
      })
      const annualGrossProfit = annualSales.map((value, index) => value - annualCost[index])

      subcontractorCategories.value = nextCategories
      subcontractorSeries.value = [
        { name: 'Sales', data: normalizeSubcontractorSeries(annualSales, nextCategories.length) },
        { name: 'Total Cost', data: normalizeSubcontractorSeries(annualCost, nextCategories.length) },
        { name: 'Gross Profit', data: normalizeSubcontractorSeries(annualGrossProfit, nextCategories.length) },
      ]
      return
    }

    const { monthlySales, monthlyCost } = getSubcontractorMonthlyTotals(
      data,
      subcontractorSelectedYear.value
    )

    if (range === 'quarterly') {
      const nextCategories = getSubcontractorDefaultCategories(range)
      const quarterlySales = Array(4).fill(0)
      const quarterlyCost = Array(4).fill(0)

      for (let index = 0; index < 4; index += 1) {
        const start = index * 3
        const end = start + 3
        quarterlySales[index] = sumSubcontractorSeries(monthlySales.slice(start, end))
        quarterlyCost[index] = sumSubcontractorSeries(monthlyCost.slice(start, end))
      }

      const quarterlyGrossProfit = quarterlySales.map((value, index) => value - quarterlyCost[index])

      subcontractorCategories.value = nextCategories
      subcontractorSeries.value = [
        { name: 'Sales', data: normalizeSubcontractorSeries(quarterlySales, nextCategories.length) },
        { name: 'Total Cost', data: normalizeSubcontractorSeries(quarterlyCost, nextCategories.length) },
        { name: 'Gross Profit', data: normalizeSubcontractorSeries(quarterlyGrossProfit, nextCategories.length) },
      ]
      return
    }

    const nextCategories = getSubcontractorDefaultCategories(range)
    const monthlyGrossProfit = monthlySales.map((value, index) => value - monthlyCost[index])

    subcontractorCategories.value = nextCategories
    subcontractorSeries.value = [
      { name: 'Sales', data: normalizeSubcontractorSeries(monthlySales, nextCategories.length) },
      { name: 'Total Cost', data: normalizeSubcontractorSeries(monthlyCost, nextCategories.length) },
      { name: 'Gross Profit', data: normalizeSubcontractorSeries(monthlyGrossProfit, nextCategories.length) },
    ]
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat statistik.')
    resetSubcontractorSeries(subcontractorActiveRange.value)
  } finally {
    subcontractorLoading.value = false
  }
}

const setSubcontractorRange = (range: string) => {
  if (subcontractorActiveRange.value === range) {
    return
  }
  subcontractorActiveRange.value = range
}

watch([subcontractorActiveRange, subcontractorSelectedYear], () => {
  resetSubcontractorSeries(subcontractorActiveRange.value)
  void fetchSubcontractorStatistics()
}, { immediate: true })
</script>

<style scoped>
.area-chart {
  width: 100%;
}
</style>
