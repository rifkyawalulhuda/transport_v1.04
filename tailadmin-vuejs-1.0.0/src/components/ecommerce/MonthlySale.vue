<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Monthly Sales Transaction</h3>

      <div class="flex items-center gap-2">
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

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" class="-ml-5 min-w-[650px] xl:min-w-full pl-2">
        <div
          v-if="loading"
          class="flex h-[180px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
        >
          Loading...
        </div>
        <VueApexCharts
          v-else
          type="bar"
          height="180"
          :options="chartOptions"
          :series="series"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { API_BASE } from '@/config/api'
import VueApexCharts from 'vue3-apexcharts'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  externalYear: {
    type: Number,
    default: null
  }
})

const apiBase = API_BASE
const toast = useToast()

const monthLabels = [
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

const now = new Date()
const currentYear = now.getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, index) => currentYear - 5 + index)
const selectedYear = ref(currentYear)

const loading = ref(false)
const salesCostData = ref(Array(12).fill(0))
const subcontractorData = ref(Array(12).fill(0))

const numberFormatter = new Intl.NumberFormat('id-ID')
const formatCount = (value) => numberFormatter.format(Number(value) || 0)

const series = computed(() => [
  {
    name: 'Sales Cost',
    data: salesCostData.value
  },
  {
    name: 'Subcontractor',
    data: subcontractorData.value
  }
])

const chartOptions = computed(() => ({
  colors: ['#465fff', '#12B76A'],
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'bar',
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '39%',
      borderRadius: 5,
      borderRadiusApplication: 'end',
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: false,
  },
  xaxis: {
    categories: monthLabels,
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Outfit',
    markers: {
      radius: 99,
    },
  },
  yaxis: {
    title: false,
    labels: {
      formatter: (val) => formatCount(val)
    }
  },
  grid: {
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    y: {
      formatter: (val) => formatCount(val),
    },
  },
}))

const fetchMonthlyTransactions = async () => {
  loading.value = true
  try {
    const res = await authFetch(
      `${apiBase}/dashboard/charts/monthly-transactions?year=${selectedYear.value}`
    )
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat data Monthly Sales.')
    }
    const data = await res.json()
    salesCostData.value = Array.isArray(data?.salesCost) ? data.salesCost : Array(12).fill(0)
    subcontractorData.value = Array.isArray(data?.subcontractor)
      ? data.subcontractor
      : Array(12).fill(0)
  } catch (error) {
    toast.error(error?.message || 'Gagal memuat data Monthly Sales.')
    salesCostData.value = Array(12).fill(0)
    subcontractorData.value = Array(12).fill(0)
  } finally {
    loading.value = false
  }
}

watch(selectedYear, () => {
  void fetchMonthlyTransactions()
}, { immediate: true })

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
