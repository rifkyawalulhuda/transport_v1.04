<template>
  <div>
    <!-- Filter Bulan -->
    <div class="flex items-center gap-3 mb-5">
      <div>
        <input
          ref="dashMonthInput"
          v-model="selectedMonth"
          type="month"
          class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          @change="fetchDashboard"
          @click="dashMonthInput?.showPicker?.()"
        />
      </div>
      <p class="text-xs text-gray-400 dark:text-gray-500">Data ditampilkan berdasarkan bulan yang dipilih</p>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-5">
      <div class="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03] text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">Safe Behavior Rate</p>
        <p class="mt-1.5 text-2xl font-semibold text-success-600">{{ dashboard?.summary.safe_behavior_rate ?? '-' }}%</p>
        <p class="mt-0.5 text-xs text-gray-400">
          <template v-if="dashboard?.summary.prev_safe_rate != null">
            {{ dashboard.summary.safe_behavior_rate > dashboard.summary.prev_safe_rate ? '▲' : '▼' }}
            {{ Math.abs(dashboard.summary.safe_behavior_rate - dashboard.summary.prev_safe_rate) }}%
          </template>
          vs bulan lalu
        </p>
      </div>
      <div class="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03] text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">Observasi Bulan Ini</p>
        <p class="mt-1.5 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ dashboard?.summary.observations_this_month ?? '-' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">Target: {{ dashboard?.summary.observation_target ?? 60 }}</p>
      </div>
      <div class="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03] text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">Near-Miss Dilaporkan</p>
        <p class="mt-1.5 text-2xl font-semibold text-warning-600">{{ dashboard?.summary.near_miss_count ?? '-' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">
          {{ dashboard?.summary.near_miss_count > (dashboard?.summary.prev_near_miss ?? 0) ? '▲' : '▼' }}
          vs bulan lalu
        </p>
      </div>
      <div class="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.03] text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">Hari Tanpa Insiden</p>
        <p class="mt-1.5 text-2xl font-semibold text-blue-light-500">{{ dashboard?.summary.incident_free_days ?? '-' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">Streak aktif</p>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-500 py-8 text-center">Memuat data dashboard...</div>
    <div v-else-if="error" class="text-sm text-error-500 py-8 text-center">{{ error }}</div>
    <template v-else-if="dashboard">
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2 mb-5">
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Tren Safe Behavior (6 bulan)</h4>
          <div class="relative h-56">
            <canvas ref="trendCanvas"></canvas>
          </div>
          <div class="flex gap-4 mt-3 text-xs text-gray-500">
            <span class="flex items-center gap-1.5">
              <span class="inline-block h-0.5 w-3 rounded-sm bg-brand-500"></span>
              Safe %
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block h-0.5 w-3 rounded-sm" style="border-top:2px dashed #E24B4A"></span>
              Target 85%
            </span>
          </div>
        </div>

        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Kategori Perilaku Berisiko</h4>
          <div class="relative h-48">
            <canvas ref="riskCanvas"></canvas>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Top Risiko Perilaku</h4>
        <div class="space-y-3">
          <div
            v-for="risk in dashboard.top_risks"
            :key="risk.label"
            class="flex items-center gap-3"
          >
            <span class="flex-1 text-sm text-gray-700 dark:text-gray-200">{{ risk.label }}</span>
            <span
              :class="[
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                risk.value >= 25 ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400' : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
              ]"
            >{{ risk.value }}%</span>
            <div class="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                class="h-2 rounded-full transition-all"
                :class="risk.value >= 25 ? 'bg-error-500' : 'bg-warning-500'"
                :style="{ width: risk.value + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { bbsService, type BbsDashboardResponse } from '@/services/bbsService'

Chart.register(...registerables)

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const loading = ref(false)
const error = ref('')
const dashboard = ref<BbsDashboardResponse | null>(null)
const trendCanvas = ref<HTMLCanvasElement | null>(null)
const riskCanvas = ref<HTMLCanvasElement | null>(null)
const selectedMonth = ref(currentMonth())
const dashMonthInput = ref<HTMLInputElement | null>(null)
let trendChart: Chart | null = null
let riskChart: Chart | null = null

async function fetchDashboard() {
  loading.value = true
  error.value = ''
  try {
    dashboard.value = await bbsService.fetchDashboard(selectedMonth.value)
  } catch (err: any) {
    error.value = err?.message || 'Gagal memuat dashboard'
    return
  } finally {
    loading.value = false
  }
  // Wait DOM update after loading=false + dashboard set → canvas exist
  await nextTick()
  renderCharts()
}

function renderCharts() {
  if (!dashboard.value) return

  if (trendChart) { trendChart.destroy(); trendChart = null }
  if (riskChart) { riskChart.destroy(); riskChart = null }

  if (trendCanvas.value) {
    trendChart = new Chart(trendCanvas.value, {
      type: 'line',
      data: {
        labels: dashboard.value.trend.labels,
        datasets: [
          {
            label: 'Safe %',
            data: dashboard.value.trend.data,
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#378ADD',
          },
          {
            label: 'Target',
            data: Array(6).fill(dashboard.value.trend.target),
            borderColor: '#E24B4A',
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 60, max: 100, ticks: { callback: (v: any) => v + '%' } },
          x: { grid: { display: false } },
        },
      },
    })
  }

  if (riskCanvas.value) {
    riskChart = new Chart(riskCanvas.value, {
      type: 'bar',
      data: {
        labels: dashboard.value.risks.labels,
        datasets: [
          {
            data: dashboard.value.risks.data,
            backgroundColor: ['#F09595', '#FAC775', '#EF9F27', '#85B7EB', '#B4B2A9'],
            borderRadius: 4,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: (v: any) => v + '%' } },
          x: { grid: { display: false } },
        },
      },
    })
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>
