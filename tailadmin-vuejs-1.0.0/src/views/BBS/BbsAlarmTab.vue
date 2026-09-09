<template>
  <div class="space-y-5">
    <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t.alarmTitle }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t.alarmSub }}</p>
        </div>
        <label class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600" :class="{ 'pointer-events-none opacity-60': uploading }">
          <input ref="fileInput" type="file" accept=".csv,.xlsx" class="hidden" @change="onFileChange" />
          {{ uploading ? t.alarmUploading : t.alarmChooseFile }}
        </label>
      </div>
      <div class="mt-4 rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400" @click="fileInput?.click()">
        {{ selectedFile ? selectedFile.name : t.alarmDropHint }}
      </div>
      <div v-if="result" class="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div class="rounded-lg bg-green-50 p-3 dark:bg-green-500/10"><div class="text-xs text-green-700 dark:text-green-300">{{ t.alarmInserted }}</div><div class="mt-1 text-xl font-semibold text-green-800 dark:text-green-200">{{ result.inserted }}</div></div>
        <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10"><div class="text-xs text-blue-700 dark:text-blue-300">{{ t.alarmBurst }}</div><div class="mt-1 text-xl font-semibold text-blue-800 dark:text-blue-200">{{ result.dedup_burst }}</div></div>
        <div class="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-500/10"><div class="text-xs text-yellow-700 dark:text-yellow-300">{{ t.alarmDuplicates }}</div><div class="mt-1 text-xl font-semibold text-yellow-800 dark:text-yellow-200">{{ result.duplicates }}</div></div>
        <div class="rounded-lg bg-orange-50 p-3 dark:bg-orange-500/10"><div class="text-xs text-orange-700 dark:text-orange-300">{{ t.alarmNoDriver }}</div><div class="mt-1 text-xl font-semibold text-orange-800 dark:text-orange-200">{{ result.unmatched_driver }}</div></div>
        <div class="rounded-lg bg-red-50 p-3 dark:bg-red-500/10"><div class="text-xs text-red-700 dark:text-red-300">{{ t.alarmFailed }}</div><div class="mt-1 text-xl font-semibold text-red-800 dark:text-red-200">{{ result.failed }}</div></div>
      </div>
      <div v-if="result?.errors?.length" class="mt-4 max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
        <div v-for="error in result.errors" :key="`${error.row}-${error.field}-${error.message}`">{{ error.row ? `Baris ${error.row}: ` : '' }}{{ error.message }}</div>
      </div>
    </div>

    <!-- Collapsible Alarm Breakdown Chart -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        class="flex w-full items-center justify-between px-5 py-4 text-left"
        @click="chartOpen = !chartOpen"
      >
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.alarmBreakdownTitle || 'Breakdown Alarm per Tipe' }}</h3>
        <span class="text-gray-400 transition-transform" :class="chartOpen ? 'rotate-180' : ''">▼</span>
      </button>
      <div v-show="chartOpen" class="px-5 pb-5">
        <div class="mb-3 flex flex-wrap gap-2">
          <input
            v-model="breakdownMonth"
            type="month"
            class="h-9 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            @change="loadBreakdown"
          />
        </div>
        <div v-if="loadingBreakdown" class="py-8 text-center text-sm text-gray-500">{{ t.loading }}</div>
        <div v-else-if="!breakdown || !breakdown.labels.length" class="py-8 text-center text-sm text-gray-400">Tidak ada data alarm untuk bulan ini.</div>
        <div v-else class="relative h-64">
          <canvas ref="breakdownCanvas"></canvas>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.alarmListTitle }}</h3>
        <div class="flex flex-wrap gap-2">
          <input v-model="filters.plate" class="h-9 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30" :placeholder="t.alarmPlate" @keyup.enter="loadAlarms" />
          <DatePickerInput v-model="filters.date_from" :placeholder="t.alarmSelectDate" @update:model-value="loadAlarms" />
          <select v-model="filters.alarm_type" class="h-9 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @change="loadAlarms">
            <option value="">{{ t.alarmAllTypes }}</option>
            <option v-for="type in alarmTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"><tr><th class="px-4 py-3">{{ t.alarmTime }}</th><th class="px-4 py-3">{{ t.alarmPlate }}</th><th class="px-4 py-3">{{ t.alarmType }}</th><th class="px-4 py-3">{{ t.alarmDriver }}</th><th class="px-4 py-3">{{ t.alarmLocation }}</th></tr></thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="row in rows" :key="row.id"><td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatTime(row.begin_time) }}</td><td class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{{ row.plate_number }}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.alarm_type }}</td><td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.nama_driver || row.driver_id }}</td><td class="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.location || '-' }}</td></tr>
            <tr v-if="!loading && !rows.length"><td colspan="5" class="px-4 py-8 text-center text-gray-500">{{ t.alarmNoData }}</td></tr>
            <tr v-if="loading"><td colspan="5" class="px-4 py-8 text-center text-gray-500">{{ t.loading }}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
        <span class="text-gray-500">{{ pagination.total }} {{ t.alarmRecords }}</span>
        <div class="flex gap-2"><button class="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700" :disabled="page <= 1" @click="page--; loadAlarms()">‹</button><span class="px-2 py-1 text-gray-600 dark:text-gray-300">{{ page }}</span><button class="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700" :disabled="page * pagination.limit >= pagination.total" @click="page++; loadAlarms()">›</button></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { bbsService, type BbsAlarmBreakdown, type BbsAlarmImportResult, type BbsAlarmRow } from '@/services/bbsService'
import { useBbsLang } from '@/composables/useBbsLang'
import DatePickerInput from '@/components/DatePickerInput.vue'

Chart.register(...registerables)

const { t } = useBbsLang()
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const loading = ref(false)
const result = ref<BbsAlarmImportResult | null>(null)
const rows = ref<BbsAlarmRow[]>([])
const page = ref(1)
const pagination = reactive({ limit: 25, total: 0 })
const filters = reactive({ plate: '', date_from: '', alarm_type: '' })
const alarmTypes = ['Eyes Closed', 'Yawning', 'Distracted Driving', 'Lane Departure Warning', 'Pedestrian Collision Warning', 'Forward Collision Warning', 'Headway Monitoring Warning']

// Breakdown chart
const chartOpen = ref(false)
const breakdownCanvas = ref<HTMLCanvasElement | null>(null)
const breakdown = ref<BbsAlarmBreakdown | null>(null)
const loadingBreakdown = ref(false)
let breakdownChart: Chart | null = null

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const breakdownMonth = ref(currentMonth())

async function loadBreakdown() {
  loadingBreakdown.value = true
  try {
    breakdown.value = await bbsService.fetchAlarmBreakdown(breakdownMonth.value)
  } catch {
    breakdown.value = null
  } finally {
    loadingBreakdown.value = false
  }
  await nextTick()
  renderBreakdownChart()
}

function renderBreakdownChart() {
  if (!breakdown.value?.labels.length || !breakdownCanvas.value) return
  if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null }

  const colors = [
    '#378ADD', '#E24B4A', '#EF9F27', '#4CAF50', '#9C27B0',
    '#FF5722', '#00BCD4', '#795548', '#607D8B', '#F06292'
  ]

  breakdownChart = new Chart(breakdownCanvas.value, {
    type: 'bar',
    data: {
      labels: breakdown.value.labels,
      datasets: [
        {
          label: 'Jumlah Alarm',
          data: breakdown.value.data,
          backgroundColor: breakdown.value.labels.map((_, i) => colors[i % colors.length]),
          borderRadius: 4,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} kejadian` } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false }, ticks: { maxRotation: 30, font: { size: 11 } } },
      },
    },
  })
}

// Load breakdown when chart section is opened
watch(chartOpen, (open) => {
  if (open && !breakdown.value) loadBreakdown()
})

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  selectedFile.value = file
  uploading.value = true
  try {
    result.value = await bbsService.importAlarms(file)
    page.value = 1
    await loadAlarms()
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function loadAlarms() {
  loading.value = true
  try {
    const data = await bbsService.fetchAlarms({ page: page.value, limit: pagination.limit, ...filters })
    rows.value = data.rows
    pagination.total = data.pagination.total
  } finally {
    loading.value = false
  }
}

function formatTime(value: string) {
  return value ? new Date(value).toLocaleString('id-ID') : '-'
}

onMounted(loadAlarms)
</script>
