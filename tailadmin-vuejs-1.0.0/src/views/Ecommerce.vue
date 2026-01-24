<template>
  <admin-layout>
    <div class="space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6"
        >
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Ringkasan Dashboard
          </h3>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="collapseAll"
            >
              Collapse all
            </button>
            <button
              type="button"
              class="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="expandAll"
            >
              Expand all
            </button>
            <button
              type="button"
              class="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              :aria-expanded="sections.group1"
              @click="toggleSection('group1')"
            >
              <svg
                class="h-4 w-4 transition-transform duration-200"
                :class="sections.group1 ? 'rotate-180' : ''"
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
        <div v-show="sections.group1" class="px-5 pb-5 pt-4 sm:px-6">
          <div class="grid grid-cols-12 gap-4 md:gap-6">
            <div class="col-span-12 space-y-6 xl:col-span-7">
              <ecommerce-metrics />
              <monthly-target />
            </div>
            <div class="col-span-12 xl:col-span-5">
              <monthly-sale />
            </div>

            <div class="col-span-12 xl:col-span-5">
              <customer-demographic />
            </div>

            <div class="col-span-12 xl:col-span-7">
              <recent-orders />
            </div>

          </div>
        </div>
      </div>

      <expiry-alerts />

      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6"
        >
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Statistics Sales Cost
          </h3>
          <button
            type="button"
            class="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-expanded="sections.group2"
            @click="toggleSection('group2')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="sections.group2 ? 'rotate-180' : ''"
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
        <div v-show="sections.group2" class="px-5 pb-5 pt-4 sm:px-6">
          <div
            class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
          >
            <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
              <div class="w-full">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Statistics Sales Cost
                </h3>
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
        </div>
      </div>

      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6"
        >
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Statistics Subcontractor Cost
          </h3>
          <button
            type="button"
            class="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-expanded="sections.group3"
            @click="toggleSection('group3')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="sections.group3 ? 'rotate-180' : ''"
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
        <div v-show="sections.group3" class="px-5 pb-5 pt-4 sm:px-6">
          <div
            class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
          >
            <div class="mb-6 flex flex-col gap-5 sm:flex-row sm:justify-between">
              <div class="w-full">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Statistics Subcontractor Cost
                </h3>
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
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminLayout from '../components/layout/AdminLayout.vue'
import EcommerceMetrics from '../components/ecommerce/EcommerceMetrics.vue'
import MonthlyTarget from '../components/ecommerce/MonthlySale.vue'
import MonthlySale from '../components/ecommerce/MonthlyTarget.vue'
import CustomerDemographic from '../components/ecommerce/CustomerDemographic.vue'
import RecentOrders from '../components/ecommerce/RecentOrders.vue'
import ExpiryAlerts from '../components/ecommerce/ExpiryAlerts.vue'
import VueApexCharts from 'vue3-apexcharts'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const STORAGE_KEY = 'ecommerce_dashboard_sections'

const sections = reactive({
  group1: true,
  group2: true,
  group3: true
})

const normalizeSectionState = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

const loadSectionState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return
    }
    sections.group1 = normalizeSectionState(parsed.group1, sections.group1)
    sections.group2 = normalizeSectionState(parsed.group2, sections.group2)
    sections.group3 = normalizeSectionState(parsed.group3, sections.group3)
  } catch {
    // Ignore invalid storage state.
  }
}

const persistSectionState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
}

const toggleSection = (key: 'group1' | 'group2' | 'group3') => {
  sections[key] = !sections[key]
}

const collapseAll = () => {
  sections.group1 = false
  sections.group2 = false
  sections.group3 = false
}

const expandAll = () => {
  sections.group1 = true
  sections.group2 = true
  sections.group3 = true
}

watch(sections, persistSectionState, { deep: true })

onMounted(() => {
  loadSectionState()
})

const options = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
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
  'Dec'
])
const series = ref([
  { name: 'Sales', data: Array(12).fill(0) },
  { name: 'Total Cost', data: Array(12).fill(0) },
  { name: 'Gross Profit', data: Array(12).fill(0) }
])

const showYearDropdown = computed(() => activeRange.value !== 'annually')

const formatValue = (value: number) => numberFormatter.format(Number(value) || 0)

const chartOptions = computed(() => ({
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left'
  },
  colors: ['#465FFF', '#F79009', '#12B76A'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'area',
    toolbar: {
      show: false
    }
  },
  fill: {
    gradient: {
      enabled: true,
      opacityFrom: 0.45,
      opacityTo: 0
    }
  },
  stroke: {
    curve: 'straight',
    width: [2, 2, 2]
  },
  markers: {
    size: 0
  },
  labels: {
    show: false,
    position: 'top'
  },
  grid: {
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number) => formatValue(val)
    }
  },
  xaxis: {
    type: 'category',
    categories: categories.value,
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    },
    tooltip: {
      enabled: false
    }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatValue(val)
    },
    title: {
      style: {
        fontSize: '0px'
      }
    }
  }
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
    { name: 'Gross Profit', data: Array(length).fill(0) }
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
      { name: 'Gross Profit', data: normalizeSeries(data?.series?.grossProfit, length) }
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

const subcontractorMonthLabels = [
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
  'Dec'
]
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
  'Dec'
])
const subcontractorSeries = ref([
  { name: 'Sales', data: Array(12).fill(0) },
  { name: 'Total Cost', data: Array(12).fill(0) },
  { name: 'Gross Profit', data: Array(12).fill(0) }
])

const subcontractorShowYearDropdown = computed(() => subcontractorActiveRange.value !== 'annually')

const subcontractorFormatValue = (value: number) => numberFormatter.format(Number(value) || 0)

const subcontractorChartOptions = computed(() => ({
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left'
  },
  colors: ['#465FFF', '#F79009', '#12B76A'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'area',
    toolbar: {
      show: false
    }
  },
  fill: {
    gradient: {
      enabled: true,
      opacityFrom: 0.45,
      opacityTo: 0
    }
  },
  stroke: {
    curve: 'straight',
    width: [2, 2, 2]
  },
  markers: {
    size: 0
  },
  labels: {
    show: false,
    position: 'top'
  },
  grid: {
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number) => subcontractorFormatValue(val)
    }
  },
  xaxis: {
    type: 'category',
    categories: subcontractorCategories.value,
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    },
    tooltip: {
      enabled: false
    }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => subcontractorFormatValue(val)
    },
    title: {
      style: {
        fontSize: '0px'
      }
    }
  }
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
    { name: 'Gross Profit', data: Array(length).fill(0) }
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
        { name: 'Gross Profit', data: normalizeSubcontractorSeries(annualGrossProfit, nextCategories.length) }
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
        { name: 'Gross Profit', data: normalizeSubcontractorSeries(quarterlyGrossProfit, nextCategories.length) }
      ]
      return
    }

    const nextCategories = getSubcontractorDefaultCategories(range)
    const monthlyGrossProfit = monthlySales.map((value, index) => value - monthlyCost[index])

    subcontractorCategories.value = nextCategories
    subcontractorSeries.value = [
      { name: 'Sales', data: normalizeSubcontractorSeries(monthlySales, nextCategories.length) },
      { name: 'Total Cost', data: normalizeSubcontractorSeries(monthlyCost, nextCategories.length) },
      { name: 'Gross Profit', data: normalizeSubcontractorSeries(monthlyGrossProfit, nextCategories.length) }
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
