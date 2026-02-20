<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
    <div
      class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800"
          >
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0084ff" class="icon icon-tabler icons-tabler-filled icon-tabler-truck"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 4a1 1 0 0 1 1 1h4a1 1 0 0 1 .783 .378l.074 .108l3 5l.055 .103l.04 .107l.029 .109l.016 .11l.003 .085v6a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-11a2 2 0 0 1 2 -2zm-6 12a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m.434 -9h-3.434v3h5.234z" /></svg>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Sales Cost</span>
            <h4 class="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
              <span
                v-if="salesLoading"
                class="text-xs font-medium text-gray-500 dark:text-gray-400"
                >Loading...</span
              >
              <span v-else>{{ formattedSalesCount }}</span>
            </h4>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model.number="salesMonth"
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
            v-model.number="salesYear"
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
      <div class="mt-4 flex justify-end">
        <span :class="salesBadgeClass">{{ salesBadgeText }}</span>
      </div>
    </div>

    <div
      class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800"
          >
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0084ff" class="icon icon-tabler icons-tabler-filled icon-tabler-steering-wheel"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336m-13 8.66a8 8 0 0 0 7 7.937v-5.107a3 3 0 0 1 -1.898 -2.05l-5.07 -1.504q -.031 .36 -.032 .725m15.967 -.725l-5.069 1.503a3 3 0 0 1 -1.897 2.051v5.108a8 8 0 0 0 6.985 -8.422zm-11.967 -6.204a8 8 0 0 0 -3.536 4.244l4.812 1.426a3 3 0 0 1 5.448 0l4.812 -1.426a8 8 0 0 0 -11.536 -4.244" /></svg>
          </div>
          <div>
            <span class="text-sm text-gray-500 dark:text-gray-400">Subcontractor</span>
            <h4 class="mt-1 font-bold text-gray-800 text-title-sm dark:text-white/90">
              <span
                v-if="subcontractorLoading"
                class="text-xs font-medium text-gray-500 dark:text-gray-400"
                >Loading...</span
              >
              <span v-else>{{ formattedSubcontractorCount }}</span>
            </h4>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model.number="subcontractorMonth"
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
            v-model.number="subcontractorYear"
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
      <div class="mt-4 flex justify-end">
        <span :class="subcontractorBadgeClass">{{ subcontractorBadgeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  externalMonth: {
    type: Number,
    default: null
  },
  externalYear: {
    type: Number,
    default: null
  }
})

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

const salesMonth = ref(currentMonth)
const salesYear = ref(currentYear)
const salesCount = ref(0)
const salesPrevCount = ref(0)
const salesPercent = ref(null)
const salesLoading = ref(false)

const subcontractorMonth = ref(currentMonth)
const subcontractorYear = ref(currentYear)
const subcontractorCount = ref(0)
const subcontractorPrevCount = ref(0)
const subcontractorPercent = ref(null)
const subcontractorLoading = ref(false)

const numberFormatter = new Intl.NumberFormat('id-ID')

const formattedSalesCount = computed(() => numberFormatter.format(salesCount.value || 0))
const formattedSubcontractorCount = computed(() =>
  numberFormatter.format(subcontractorCount.value || 0)
)

const baseBadgeClass =
  'rounded-full px-2 py-0.5 text-xs font-medium dark:border dark:border-transparent'
const badgeClasses = {
  success: `${baseBadgeClass} bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500`,
  danger: `${baseBadgeClass} bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500`,
  neutral: `${baseBadgeClass} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`
}

const formatPercentValue = (percent, count, prevCount) => {
  if (percent === null || Number.isNaN(percent)) {
    if (prevCount === 0) {
      return count > 0 ? 'N/A' : '0%'
    }
    return '0%'
  }
  let rounded = Math.round(Number(percent) * 100) / 100
  if (Object.is(rounded, -0)) {
    rounded = 0
  }
  const formatted = rounded.toFixed(2).replace(/\.?0+$/, '')
  return rounded > 0 ? `+${formatted}%` : `${formatted}%`
}

const resolveBadgeVariant = (percent) => {
  if (percent === null || Number.isNaN(percent)) {
    return 'neutral'
  }
  if (Object.is(percent, -0)) {
    return 'neutral'
  }
  if (percent > 0) {
    return 'success'
  }
  if (percent < 0) {
    return 'danger'
  }
  return 'neutral'
}

const salesBadgeText = computed(() =>
  formatPercentValue(salesPercent.value, salesCount.value, salesPrevCount.value)
)
const subcontractorBadgeText = computed(() =>
  formatPercentValue(
    subcontractorPercent.value,
    subcontractorCount.value,
    subcontractorPrevCount.value
  )
)
const salesBadgeClass = computed(() => badgeClasses[resolveBadgeVariant(salesPercent.value)])
const subcontractorBadgeClass = computed(() =>
  badgeClasses[resolveBadgeVariant(subcontractorPercent.value)]
)

const fetchSalesCount = async () => {
  salesLoading.value = true
  try {
    const res = await authFetch(
      `${apiBase}/dashboard/metrics/sales-cost?month=${salesMonth.value}&year=${salesYear.value}`
    )
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat data Sales Cost.')
    }
    const data = await res.json()
    salesCount.value = Number(data?.count ?? 0)
    salesPrevCount.value = Number(data?.prevCount ?? 0)
    salesPercent.value = data?.percent ?? null
  } catch (error) {
    toast.error(error?.message || 'Gagal memuat data Sales Cost.')
  } finally {
    salesLoading.value = false
  }
}

const fetchSubcontractorCount = async () => {
  subcontractorLoading.value = true
  try {
    const res = await authFetch(
      `${apiBase}/dashboard/metrics/subcontractor?month=${subcontractorMonth.value}&year=${subcontractorYear.value}`
    )
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat data Subcontractor.')
    }
    const data = await res.json()
    subcontractorCount.value = Number(data?.count ?? 0)
    subcontractorPrevCount.value = Number(data?.prevCount ?? 0)
    subcontractorPercent.value = data?.percent ?? null
  } catch (error) {
    toast.error(error?.message || 'Gagal memuat data Subcontractor.')
  } finally {
    subcontractorLoading.value = false
  }
}

watch([salesMonth, salesYear], () => {
  void fetchSalesCount()
}, { immediate: true })

watch([subcontractorMonth, subcontractorYear], () => {
  void fetchSubcontractorCount()
}, { immediate: true })

watch(
  () => props.externalMonth,
  (value) => {
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue) || nextValue < 1 || nextValue > 12) {
      return
    }
    if (salesMonth.value !== nextValue) {
      salesMonth.value = nextValue
    }
    if (subcontractorMonth.value !== nextValue) {
      subcontractorMonth.value = nextValue
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
    if (salesYear.value !== nextValue) {
      salesYear.value = nextValue
    }
    if (subcontractorYear.value !== nextValue) {
      subcontractorYear.value = nextValue
    }
  },
  { immediate: true }
)
</script>
