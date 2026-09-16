<template>
  <div class="space-y-5">
    <!-- Import Section -->
    <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t.speedTitle }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t.speedSub }}</p>
        </div>
        <label
          class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          :class="{ 'pointer-events-none opacity-60': uploading }"
        >
          <input ref="fileInput" type="file" accept=".csv,.xlsx" class="hidden" @change="onFileChange" />
          {{ uploading ? t.speedUploading : t.speedChooseFile }}
        </label>
      </div>
      <div
        class="mt-4 rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        @click="fileInput?.click()"
      >
        {{ selectedFile ? selectedFile.name : t.speedDropHint }}
      </div>
      <div v-if="importResult" class="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <div class="rounded-lg bg-green-50 p-3 dark:bg-green-500/10">
          <div class="text-xs text-green-700 dark:text-green-300">{{ t.speedInserted }}</div>
          <div class="mt-1 text-xl font-semibold text-green-800 dark:text-green-200">{{ importResult.inserted }}</div>
        </div>
        <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
          <div class="text-xs text-blue-700 dark:text-blue-300">{{ t.speedBurst }}</div>
          <div class="mt-1 text-xl font-semibold text-blue-800 dark:text-blue-200">{{ importResult.dedup_burst }}</div>
        </div>
        <div class="rounded-lg bg-teal-50 p-3 dark:bg-teal-500/10">
          <div class="text-xs text-teal-700 dark:text-teal-300">{{ t.speedStorageInfo }}</div>
          <div class="mt-1 text-xl font-semibold text-teal-800 dark:text-teal-200">
            {{ importResult.stored_reduction_percent != null ? importResult.stored_reduction_percent + '%' : '-' }}
          </div>
        </div>
        <div class="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-500/10">
          <div class="text-xs text-yellow-700 dark:text-yellow-300">{{ t.speedDuplicates }}</div>
          <div class="mt-1 text-xl font-semibold text-yellow-800 dark:text-yellow-200">{{ importResult.duplicates }}</div>
        </div>
        <div class="rounded-lg bg-orange-50 p-3 dark:bg-orange-500/10">
          <div class="text-xs text-orange-700 dark:text-orange-300">{{ t.speedNoDriver }}</div>
          <div class="mt-1 text-xl font-semibold text-orange-800 dark:text-orange-200">{{ importResult.unmatched_driver }}</div>
        </div>
        <div class="rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
          <div class="text-xs text-red-700 dark:text-red-300">{{ t.speedFailed }}</div>
          <div class="mt-1 text-xl font-semibold text-red-800 dark:text-red-200">{{ importResult.failed }}</div>
        </div>
      </div>
      <div v-if="importResult?.errors?.length" class="mt-4 max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
        <div v-for="err in importResult.errors" :key="`${err.row}-${err.field}-${err.message}`">
          {{ err.row ? `Baris ${err.row}: ` : '' }}{{ err.message }}
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.speedSummaryTitle }}</h3>
        <input
          v-model="selectedMonth"
          type="month"
          :title="t.speedMonthFilter"
          class="h-9 rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          @change="onMonthChange"
        />
      </div>
      <div v-if="loadingSummary" class="py-6 text-center text-sm text-gray-500">{{ t.loading }}</div>
      <div v-else-if="summary" class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div class="rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
          <div class="text-xs text-red-700 dark:text-red-300">{{ t.speedTotalEvents }}</div>
          <div class="mt-1 text-xl font-semibold text-red-800 dark:text-red-200">{{ summary.total_events }}</div>
        </div>
        <div class="rounded-lg bg-orange-50 p-3 dark:bg-orange-500/10">
          <div class="text-xs text-orange-700 dark:text-orange-300">{{ t.speedVehiclesAffected }}</div>
          <div class="mt-1 text-xl font-semibold text-orange-800 dark:text-orange-200">{{ summary.vehicles_affected }}</div>
        </div>
        <div class="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-500/10">
          <div class="text-xs text-yellow-700 dark:text-yellow-300">{{ t.speedAvgExcess }}</div>
          <div class="mt-1 text-xl font-semibold text-yellow-800 dark:text-yellow-200">
            {{ summary.avg_excess_kmh != null ? summary.avg_excess_kmh.toFixed(1) : '-' }}
          </div>
        </div>
        <div class="rounded-lg bg-purple-50 p-3 dark:bg-purple-500/10">
          <div class="text-xs text-purple-700 dark:text-purple-300">{{ t.speedMaxExcess }}</div>
          <div class="mt-1 text-xl font-semibold text-purple-800 dark:text-purple-200">
            {{ summary.max_excess_kmh != null ? summary.max_excess_kmh : '-' }}
          </div>
        </div>
        <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
          <div class="text-xs text-blue-700 dark:text-blue-300">{{ t.speedTopOffender }}</div>
          <div class="mt-1 text-base font-semibold text-blue-800 dark:text-blue-200 truncate">
            {{ summary.top_offender_plate || '-' }}
            <span v-if="summary.top_offender_count" class="ml-1 text-xs font-normal text-blue-600 dark:text-blue-300">({{ summary.top_offender_count }}x)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        class="flex w-full items-center justify-between px-5 py-4 text-left"
        @click="trendOpen = !trendOpen"
      >
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.speedTrendTitle }}</h3>
        <span class="text-gray-400 transition-transform" :class="trendOpen ? 'rotate-180' : ''">▼</span>
      </button>
      <div v-show="trendOpen" class="px-5 pb-5">
        <!-- Filter kendaraan (multi-pilih) — mengendalikan kedua chart & daftar -->
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <div class="relative">
            <button
              type="button"
              class="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @click="plateDropdownOpen = !plateDropdownOpen"
            >
              {{ t.alarmVehicleFilter }}:
              <span class="font-medium">
                {{ selectedPlates.length ? selectedPlates.length + ' ' + t.alarmVehiclesSelected : t.alarmAllVehicles }}
              </span>
              <span class="ml-1 text-gray-400">▾</span>
            </button>
            <div
              v-if="plateDropdownOpen"
              class="absolute z-30 mt-1 max-h-64 w-64 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                type="button"
                class="mb-1 w-full rounded px-2 py-1 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                @click="clearPlates()"
              >
                {{ t.alarmAllVehicles }}
              </button>
              <label
                v-for="p in platesList"
                :key="p.plate_number"
                class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  class="h-3.5 w-3.5"
                  :checked="selectedPlates.includes(p.plate_number)"
                  @change="togglePlate(p.plate_number)"
                />
                <span class="flex-1 truncate text-gray-700 dark:text-gray-200">{{ p.plate_number }}</span>
                <span class="text-gray-400">{{ p.total }}</span>
              </label>
              <p v-if="!platesList.length" class="px-2 py-1 text-xs text-gray-400">{{ t.alarmVehicleEmpty }}</p>
            </div>
          </div>
          <button
            v-if="selectedPlates.length"
            type="button"
            class="text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400"
            @click="clearPlates()"
          >
            {{ t.alarmClearFilter }}
          </button>
        </div>
        <p v-if="plateWarning" class="mb-2 text-xs text-orange-600 dark:text-orange-400">{{ plateWarning }}</p>
        <p v-else-if="selectedPlates.length" class="mb-2 text-xs text-gray-500 dark:text-gray-400">
          {{ selectedPlates.join(' · ') }}
        </p>

        <div v-if="loadingTrend" class="py-8 text-center text-sm text-gray-500">{{ t.loading }}</div>
        <div v-else-if="!trend || !trend.labels.length" class="py-8 text-center text-sm text-gray-400">{{ t.speedNoData }}</div>
        <div v-else class="relative h-64">
          <canvas ref="trendCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Chart: Pelanggaran per Kendaraan -->
    <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <h3 class="mb-4 font-semibold text-gray-800 dark:text-white/90">{{ t.speedByVehicleTitle }}</h3>
      <div v-if="loadingByVehicle" class="py-8 text-center text-sm text-gray-500">{{ t.loading }}</div>
      <div v-else-if="!byVehicle || !byVehicle.rows.length" class="py-8 text-center text-sm text-gray-400">{{ t.speedNoData }}</div>
      <div v-else class="relative h-64">
        <canvas ref="byVehicleCanvas"></canvas>
      </div>
    </div>

    <!-- Events List -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.speedListTitle }}</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
            <tr>
              <th class="px-4 py-3">{{ t.speedTime }}</th>
              <th class="px-4 py-3">{{ t.speedPlate }}</th>
              <th class="px-4 py-3">{{ t.speedDriver }}</th>
              <th class="px-4 py-3">{{ t.speedKmh }}</th>
              <th class="px-4 py-3">{{ t.speedLimit }}</th>
              <th class="px-4 py-3">{{ t.speedExcess }}</th>
              <th class="px-4 py-3">{{ t.speedLocation }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="row in rows" :key="row.id">
              <td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatTime(row.begin_time) }}</td>
              <td class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{{ row.plate_number }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.nama_driver || row.driver_id }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.speed_kmh ?? '-' }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.speed_limit ?? '-' }}</td>
              <td class="px-4 py-3">
                <span
                  v-if="row.excess_kmh != null"
                  class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="row.excess_kmh > 20 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'"
                >+{{ row.excess_kmh }}</span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-300">{{ row.location || '-' }}</td>
            </tr>
            <tr v-if="!loadingEvents && !rows.length">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">{{ t.speedNoData }}</td>
            </tr>
            <tr v-if="loadingEvents">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">{{ t.loading }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
        <span class="text-gray-500">{{ pagination.total }} {{ t.speedRecords }}</span>
        <div class="flex gap-2">
          <button class="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700" :disabled="page <= 1" @click="page--; loadEvents()">‹</button>
          <span class="px-2 py-1 text-gray-600 dark:text-gray-300">{{ page }}</span>
          <button class="rounded border px-3 py-1 disabled:opacity-40 dark:border-gray-700" :disabled="page * pagination.limit >= pagination.total" @click="page++; loadEvents()">›</button>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        class="flex w-full items-center justify-between px-5 py-4 text-left"
        @click="settingsOpen = !settingsOpen"
      >
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.speedSettingsTitle }}</h3>
        <span class="flex items-center gap-2">
          <span
            v-if="settingsHasChanges"
            class="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
          >
            {{ t.unsavedChanges }}
          </span>
          <span class="text-gray-400 transition-transform" :class="settingsOpen ? 'rotate-180' : ''">▼</span>
        </span>
      </button>
      <div v-show="settingsOpen" class="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[180px]">
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t.speedDefaultLimit }}</label>
            <input
              v-model.number="settingsForm.default_speed_limit"
              type="number"
              min="1"
              class="h-9 w-full rounded-lg border px-3 text-sm dark:bg-gray-900 dark:text-white/90"
              :class="settingsError
                ? 'border-red-400 dark:border-red-500/60'
                : 'border-gray-200 dark:border-gray-700'"
            />
          </div>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="savingSettings"
            @click="saveSettings"
          >
            {{ savingSettings ? t.btnSaving : t.speedSaveSettings }}
          </button>
        </div>
        <p v-if="settingsError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ settingsError }}</p>
        <p v-else-if="settingsSavedMsg" class="mt-2 text-xs text-green-600 dark:text-green-400">{{ t.speedSettingsSaved }}</p>
      </div>
    </div>

    <!-- Retention Data (ADAS & Speed) — admin only -->
    <div v-if="isAdminRetention" class="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        class="flex w-full items-center justify-between px-5 py-4 text-left"
        @click="retentionOpen = !retentionOpen"
      >
        <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ t.retentionTitle }}</h3>
        <span class="flex items-center gap-2">
          <span
            v-if="retentionHasChanges"
            class="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
          >
            {{ t.unsavedChanges }}
          </span>
          <span class="text-gray-400 transition-transform" :class="retentionOpen ? 'rotate-180' : ''">▼</span>
        </span>
      </button>
      <div v-show="retentionOpen" class="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">{{ t.retentionSub }}</p>

        <!-- ADAS -->
        <div class="mb-5">
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[160px]">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t.retentionAdas }}</label>
              <input
                v-model.number="retentionForm.adas"
                type="number"
                min="0"
                max="3650"
                class="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <button
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:text-white/90"
              :disabled="retentionLoading"
              @click="previewRetentionModule('adas')"
            >
              {{ t.retentionPreviewBtn }}
            </button>
            <button
              class="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              :disabled="retentionLoading"
              @click="runPurge('adas')"
            >
              {{ t.retentionPurgeBtn }}
            </button>
          </div>
          <p v-if="retentionZeroHint('adas')" class="mt-2 text-xs text-blue-600 dark:text-blue-400">
            {{ retentionZeroHint('adas') }}
          </p>
          <p v-if="retentionPreview.adas" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {{ retentionPreviewText('adas', retentionPreview.adas) }}
          </p>
          <p v-if="retentionResult.adas" class="mt-1 text-xs text-green-600 dark:text-green-400">
            {{ retentionResultText('adas', retentionResult.adas) }}
          </p>
        </div>

        <!-- Speed -->
        <div class="mb-5">
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[160px]">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{{ t.retentionSpeed }}</label>
              <input
                v-model.number="retentionForm.speed"
                type="number"
                min="0"
                max="3650"
                class="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <button
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:text-white/90"
              :disabled="retentionLoading"
              @click="previewRetentionModule('speed')"
            >
              {{ t.retentionPreviewBtn }}
            </button>
            <button
              class="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              :disabled="retentionLoading"
              @click="runPurge('speed')"
            >
              {{ t.retentionPurgeBtn }}
            </button>
          </div>
          <p v-if="retentionZeroHint('speed')" class="mt-2 text-xs text-blue-600 dark:text-blue-400">
            {{ retentionZeroHint('speed') }}
          </p>
          <p v-if="retentionPreview.speed" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {{ retentionPreviewText('speed', retentionPreview.speed) }}
          </p>
          <p v-if="retentionResult.speed" class="mt-1 text-xs text-green-600 dark:text-green-400">
            {{ retentionResultText('speed', retentionResult.speed) }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="retentionSaving"
            @click="saveRetention"
          >
            {{ retentionSaving ? t.btnSaving : t.retentionSave }}
          </button>
          <p
            v-if="retentionMsg"
            class="text-xs"
            :class="retentionMsgVariant === 'error'
              ? 'text-red-600 dark:text-red-400'
              : retentionMsgVariant === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-300'"
          >
            {{ retentionMsg }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import {
  bbsService,
  type BbsRetentionModule,
  type BbsRetentionModuleState,
  type BbsSpeedByVehicle,
  type BbsSpeedImportResult,
  type BbsSpeedPlate,
  type BbsSpeedRow,
  type BbsSpeedSummary,
  type BbsSpeedTrend,
} from '@/services/bbsService'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { useBbsLang } from '@/composables/useBbsLang'

Chart.register(...registerables)

const { t } = useBbsLang()
const { confirm } = useDialog()
const toast = useToast()

// Level admin dioper dari BbsTransportasi.vue (satu sumber kebenaran user level,
// sekaligus menghindari duplikasi pembacaan auth di tiap tab).
const props = defineProps<{ isAdmin?: boolean }>()

// ── helpers ────────────────────────────────────────────────────────────────
function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function formatTime(value: string) {
  return value ? new Date(value).toLocaleString('id-ID') : '-'
}

// ── import ─────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const importResult = ref<BbsSpeedImportResult | null>(null)

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  selectedFile.value = file
  uploading.value = true
  try {
    importResult.value = await bbsService.importSpeed(file)
    page.value = 1
    // Import bisa menambah kendaraan baru -> segarkan daftar plat lebih dulu.
    await loadPlates()
    await reloadData()
  } finally {
    uploading.value = false
    input.value = ''
  }
}

// ── summary ────────────────────────────────────────────────────────────────
// selectedMonth = SATU filter bulan untuk seluruh tab (ringkasan, tren, daftar).
const selectedMonth = ref(currentMonth())
const summary = ref<BbsSpeedSummary | null>(null)
const loadingSummary = ref(false)

async function loadSummary() {
  loadingSummary.value = true
  try {
    summary.value = await bbsService.fetchSpeedSummary(selectedMonth.value)
  } catch {
    summary.value = null
  } finally {
    loadingSummary.value = false
  }
}

// ── trend chart ────────────────────────────────────────────────────────────
const trendOpen = ref(false)
const trendLoadedMonth = ref('')
const trendCanvas = ref<HTMLCanvasElement | null>(null)
const trend = ref<BbsSpeedTrend | null>(null)
const loadingTrend = ref(false)
let trendChart: Chart | null = null

async function loadTrend() {
  loadingTrend.value = true
  try {
    trend.value = await bbsService.fetchSpeedTrend(selectedMonth.value, selectedPlates.value)
    trendLoadedMonth.value = selectedMonth.value
  } catch {
    trend.value = null
  } finally {
    loadingTrend.value = false
  }
  await nextTick()
  renderTrendChart()
}

function renderTrendChart() {
  if (!trend.value?.labels.length || !trendCanvas.value) return
  if (trendChart) { trendChart.destroy(); trendChart = null }

  const colors = [
    '#378ADD', '#E24B4A', '#EF9F27', '#4CAF50', '#9C27B0',
    '#FF5722', '#00BCD4', '#795548', '#607D8B', '#F06292'
  ]
  const series = trend.value.series || []
  const multi = series.length > 0

  // Satu dataset per kendaraan (grouped bar); tanpa filter -> satu batang agregat.
  const datasets = multi
    ? series.map((s, index) => ({
        label: s.plate,
        data: s.data,
        backgroundColor: colors[index % colors.length],
        borderRadius: 4,
        borderWidth: 0,
      }))
    : [{
        label: 'Pelanggaran',
        data: trend.value.data,
        backgroundColor: '#E24B4A',
        borderRadius: 4,
        borderWidth: 0,
      }]

  trendChart = new Chart(trendCanvas.value, {
    type: 'bar',
    data: { labels: trend.value.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: multi, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} pelanggaran`,
          },
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false }, ticks: { maxRotation: 30, font: { size: 11 } } },
      },
    },
  })
}

watch(trendOpen, (open) => {
  // Muat ulang bila bulan yang tampil belum sesuai filter aktif.
  if (open && trendLoadedMonth.value !== selectedMonth.value) loadTrend()
})

// ── events list ────────────────────────────────────────────────────────────
const rows = ref<BbsSpeedRow[]>([])
const page = ref(1)
const pagination = reactive({ limit: 25, total: 0 })
const loadingEvents = ref(false)

async function loadEvents() {
  loadingEvents.value = true
  try {
    const data = await bbsService.fetchSpeed({
      page: page.value,
      limit: pagination.limit,
      month: selectedMonth.value,
      plates: selectedPlates.value.join(','),
    })
    rows.value = data.rows
    pagination.total = data.pagination.total
  } finally {
    loadingEvents.value = false
  }
}

// ── filter kendaraan (multi-pilih) — mengendalikan kedua chart & daftar ────
const MAX_SELECTABLE = 6
const platesList = ref<BbsSpeedPlate[]>([])
const selectedPlates = ref<string[]>([])
const plateDropdownOpen = ref(false)
const plateWarning = ref('')
let userTouchedPlates = false

/** Muat daftar kendaraan; default terpilih = pelanggar terbanyak (sekali saja). */
async function loadPlates() {
  try {
    const data = await bbsService.fetchSpeedPlates()
    platesList.value = data.plates || []
    if (!userTouchedPlates && platesList.value.length) {
      selectedPlates.value = [platesList.value[0].plate_number]
    }
  } catch {
    platesList.value = []
  }
}

function togglePlate(plate: string) {
  plateWarning.value = ''
  userTouchedPlates = true
  const current = selectedPlates.value
  if (current.includes(plate)) {
    selectedPlates.value = current.filter((p) => p !== plate)
  } else {
    if (current.length >= MAX_SELECTABLE) {
      plateWarning.value = t.value.alarmMaxVehicles.replace('{n}', String(MAX_SELECTABLE))
      return
    }
    selectedPlates.value = [...current, plate]
  }
  void reloadVehicles()
}

function clearPlates() {
  userTouchedPlates = true
  selectedPlates.value = []
  plateWarning.value = ''
  void reloadVehicles()
}

/** Muat ulang tren + chart per-kendaraan + daftar dengan pilihan yang sama. */
async function reloadVehicles() {
  page.value = 1
  const jobs = [loadByVehicle(), loadEvents()]
  if (trendOpen.value) jobs.push(loadTrend())
  await Promise.all(jobs)
}

// ── chart: pelanggaran per kendaraan ───────────────────────────────────────
const byVehicleCanvas = ref<HTMLCanvasElement | null>(null)
const byVehicle = ref<BbsSpeedByVehicle | null>(null)
const loadingByVehicle = ref(false)
let byVehicleChart: Chart | null = null

async function loadByVehicle() {
  loadingByVehicle.value = true
  try {
    byVehicle.value = await bbsService.fetchSpeedByVehicle(selectedMonth.value, selectedPlates.value)
  } catch {
    byVehicle.value = null
  } finally {
    loadingByVehicle.value = false
  }
  await nextTick()
  renderByVehicleChart()
}

function renderByVehicleChart() {
  if (!byVehicle.value?.rows.length || !byVehicleCanvas.value) return
  if (byVehicleChart) { byVehicleChart.destroy(); byVehicleChart = null }
  const rows = byVehicle.value.rows
  byVehicleChart = new Chart(byVehicleCanvas.value, {
    type: 'bar',
    data: {
      labels: rows.map((r) => r.plate_number),
      datasets: [{
        label: t.value.speedTotalEvents,
        data: rows.map((r) => r.total),
        backgroundColor: '#E24B4A',
        borderRadius: 4,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const row = rows[ctx.dataIndex]
              return ` ${row.total} pelanggaran · ${row.days} hari`
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false }, ticks: { maxRotation: 30, font: { size: 11 } } },
      },
    },
  })
}

// ── master filter bulan ────────────────────────────────────────────────────
/** Muat ulang seluruh bagian tab memakai selectedMonth yang aktif. */
async function reloadData() {
  await Promise.all([loadSummary(), loadEvents(), loadByVehicle()])
  if (trendOpen.value) await loadTrend()
}

function onMonthChange() {
  page.value = 1
  reloadData()
}

// ── settings ───────────────────────────────────────────────────────────────
const settingsOpen = ref(false)
const settingsForm = reactive({ default_speed_limit: 60 })
const savingSettings = ref(false)
const settingsSavedMsg = ref(false)
const settingsError = ref('')
const settingsBounds = ref<{ min: number; max: number } | null>(null)
const savedThreshold = ref<number | null>(null)

const settingsHasChanges = computed(
  () => savedThreshold.value != null && settingsForm.default_speed_limit !== savedThreshold.value,
)

/** Validasi klien: cegah nilai di luar batas sebelum dikirim ke server. */
function settingsErrorText(): string {
  const value = Number(settingsForm.default_speed_limit)
  const bounds = settingsBounds.value
  if (!Number.isFinite(value)) return t.value.fieldNumberRequired
  if (bounds && (value < bounds.min || value > bounds.max)) {
    return t.value.fieldOutOfRange.replace('{min}', String(bounds.min)).replace('{max}', String(bounds.max))
  }
  return ''
}

async function loadSettings() {
  try {
    const s = await bbsService.fetchSpeedSettings()
    settingsForm.default_speed_limit = s.default_speed_limit
    savedThreshold.value = s.default_speed_limit
    settingsBounds.value = s.bounds ? { min: s.bounds.min, max: s.bounds.max } : null
  } catch {
    // use default
  }
}

async function saveSettings() {
  const errorText = settingsErrorText()
  if (errorText) {
    settingsError.value = errorText
    return
  }
  settingsError.value = ''
  savingSettings.value = true
  settingsSavedMsg.value = false
  try {
    await bbsService.saveSpeedSettings({ default_speed_limit: settingsForm.default_speed_limit })
    savedThreshold.value = settingsForm.default_speed_limit
    settingsSavedMsg.value = true
    toast.success(t.value.speedSettingsSaved)
    setTimeout(() => { settingsSavedMsg.value = false }, 3000)
  } catch {
    settingsError.value = t.value.settingsSaveError
  } finally {
    savingSettings.value = false
  }
}

watch(settingsOpen, (open) => {
  if (open) loadSettings()
})

// ── retensi data (ADAS & Speed) ────────────────────────────────────────────
const isAdminRetention = computed(() => props.isAdmin === true)
const retentionOpen = ref(false)
const retentionLoading = ref(false)
const retentionSaving = ref(false)
const retentionForm = reactive({ adas: 90, speed: 90 })
const retentionMsg = ref('')
const retentionMsgVariant = ref<'info' | 'error' | 'success'>('info')
const retentionBounds = ref<Record<string, { min: number; max: number }> | null>(null)
const retentionSaved = reactive<{ adas: number | null; speed: number | null }>({ adas: null, speed: null })
const retentionPreview = reactive<Record<BbsRetentionModule, BbsRetentionModuleState | null>>({
  adas: null,
  speed: null,
})
const retentionResult = reactive<Record<BbsRetentionModule, BbsRetentionModuleState | null>>({
  adas: null,
  speed: null,
})

/** Tampilkan pesan di kartu Retensi dengan warna sesuai jenisnya. */
function setRetentionMsg(message: string, variant: 'info' | 'error' | 'success' = 'info') {
  retentionMsg.value = message
  retentionMsgVariant.value = variant
}

/** Ada perubahan yang belum disimpan? (dipakai badge peringatan) */
const retentionHasChanges = computed(
  () =>
    (retentionSaved.adas != null && retentionForm.adas !== retentionSaved.adas) ||
    (retentionSaved.speed != null && retentionForm.speed !== retentionSaved.speed),
)

/** Validasi klien per modul (0 = nonaktif, dibiarkan valid). */
function retentionErrorText(module: BbsRetentionModule): string {
  const value = Number(retentionForm[module])
  if (!Number.isFinite(value)) return t.value.fieldNumberRequired
  const bounds = retentionBounds.value?.[module === 'adas' ? 'adas.retention_days' : 'speed.retention_days']
  if (bounds && (value < bounds.min || value > bounds.max)) {
    return t.value.fieldOutOfRange.replace('{min}', String(bounds.min)).replace('{max}', String(bounds.max))
  }
  return ''
}

/** Peringatan informatif saat nilai 0 (nonaktif) — bukan error. */
function retentionZeroHint(module: BbsRetentionModule): string {
  return Number(retentionForm[module]) === 0 ? t.value.retentionZeroHint : ''
}

async function loadRetention() {
  retentionLoading.value = true
  retentionMsg.value = ''
  try {
    const data = await bbsService.fetchRetentionSettings()
    retentionForm.adas = data.settings.adas?.days ?? data.defaults['adas.retention_days'] ?? 90
    retentionForm.speed = data.settings.speed?.days ?? data.defaults['speed.retention_days'] ?? 90
    retentionSaved.adas = retentionForm.adas
    retentionSaved.speed = retentionForm.speed
    retentionBounds.value = data.bounds
      ? {
          'adas.retention_days': data.bounds['adas.retention_days'],
          'speed.retention_days': data.bounds['speed.retention_days'],
        }
      : null
  } catch {
    setRetentionMsg(t.value.retentionLoadError, 'error')
  } finally {
    retentionLoading.value = false
  }
}

watch(retentionOpen, (open) => {
  if (open && isAdminRetention.value) loadRetention()
})

async function saveRetention() {
  const errorText = retentionErrorText('adas') || retentionErrorText('speed')
  if (errorText) {
    setRetentionMsg(errorText, 'error')
    return
  }
  retentionSaving.value = true
  retentionMsg.value = ''
  try {
    await bbsService.saveRetentionSettings({
      adas_days: retentionForm.adas,
      speed_days: retentionForm.speed,
    })
    retentionSaved.adas = retentionForm.adas
    retentionSaved.speed = retentionForm.speed
    setRetentionMsg(t.value.retentionSaved, 'success')
    toast.success(t.value.retentionSaved)
  } catch {
    setRetentionMsg(t.value.retentionSaveError, 'error')
  } finally {
    retentionSaving.value = false
  }
}

/** Ringkas angka pratinjau/hasil: hasil eksekusi memakai `deleted`, pratinjau `would_delete`. */
function retentionCountText(state: BbsRetentionModuleState | null): string {
  if (!state) return '-'
  if (!state.enabled) return t.value.retentionDisabled
  const target = state.deleted ?? state.would_delete
  if (typeof target === 'number') return `${target} ${t.value.speedRecords}`
  if (target) return `${t.value.retentionTelemetry} ${target.telemetry} · ${t.value.retentionEvent} ${target.events} · ${t.value.retentionDaily} ${target.daily}`
  return '0'
}

/** Apakah hasil pratinjau/purge menghapus 0 baris? */
function retentionIsEmpty(state: BbsRetentionModuleState | null): boolean {
  if (!state) return true
  const target = state.would_delete ?? state.deleted
  if (typeof target === 'number') return target === 0
  if (target) return target.telemetry === 0 && target.events === 0 && target.daily === 0
  return true
}

/** Pesan hasil eksekusi yang jujur: bila 0, jelaskan alasannya. */
function retentionResultText(module: BbsRetentionModule, state: BbsRetentionModuleState | null): string {
  if (!state) return ''
  if (!state.enabled) return t.value.retentionDisabled
  if (retentionIsEmpty(state)) {
    const days = state.days
    return `${t.value.retentionDeletedMsg}: 0 — ${t.value.retentionNothingOldEnough} ${days} ${t.value.retentionDaysUnit}`
  }
  return `${t.value.retentionDeletedMsg}: ${retentionCountText(state)}`
}

/**
 * Pesan pratinjau yang menjelaskan KENAPA hasilnya 0.
 * Retensi menghapus data yang LEBIH TUA dari N hari — data yang lebih muda
 * tidak tersentuh, sehingga pratinjau bisa 0 meski datanya banyak.
 */
function retentionPreviewText(module: BbsRetentionModule, state: BbsRetentionModuleState | null): string {
  const days = state?.days ?? retentionForm[module]
  const total = state?.total_rows ?? 0
  const oldest = state?.oldest_days ?? 0

  if (!state?.enabled) return t.value.retentionDisabled
  if (total === 0) return t.value.retentionNoData

  if (retentionIsEmpty(state)) {
    return `${t.value.retentionNothingOldEnough} ${days} ${t.value.retentionDaysUnit} — ` +
      `${t.value.retentionTotalData}: ${total} ${t.value.speedRecords}, ${t.value.retentionOldest} ${oldest} ${t.value.retentionDaysUnit}`
  }
  return `${t.value.retentionWillDelete}: ${retentionCountText(state)}`
}

async function previewRetentionModule(module: BbsRetentionModule) {
  const errorText = retentionErrorText(module)
  if (errorText) {
    setRetentionMsg(errorText, 'error')
    return
  }
  retentionLoading.value = true
  retentionMsg.value = ''
  try {
    const data = await bbsService.previewRetention([module], retentionForm[module])
    retentionPreview[module] = data.preview[module] ?? null
    setRetentionMsg(retentionPreviewText(module, retentionPreview[module]), 'info')
  } catch {
    setRetentionMsg(t.value.retentionPreviewError, 'error')
    retentionPreview[module] = null
  } finally {
    retentionLoading.value = false
  }
}

/**
 * Hapus data kedaluwarsa satu modul.
 * Konfirmasi memakai modal aplikasi (useDialog) — konsisten dengan seluruh
 * halaman lain, dan menyediakan tombol Batal yang jelas.
 */
async function runPurge(module: BbsRetentionModule) {
  const errorText = retentionErrorText(module)
  if (errorText) {
    setRetentionMsg(errorText, 'error')
    return
  }
  retentionLoading.value = true
  try {
    // 1) Pratinjau dulu supaya isi konfirmasi menampilkan angka nyata.
    const data = await bbsService.previewRetention([module], retentionForm[module])
    retentionPreview[module] = data.preview[module] ?? null
    const empty = retentionIsEmpty(retentionPreview[module])
    const summary = retentionPreviewText(module, retentionPreview[module])

    if (empty) {
      // Aman: tidak ada yang memenuhi syarat — jangan tawarkan penghapusan.
      retentionResult[module] = null
      setRetentionMsg(summary, 'info')
      return
    }

    const label = module === 'adas' ? t.value.retentionAdas : t.value.retentionSpeed
    const ok = await confirm({
      title: t.value.retentionConfirmTitle,
      message:
        `${label} — ${retentionForm[module]} ${t.value.retentionDaysUnit}. ${summary}. ` +
        `${t.value.retentionConfirmWarning}`,
      confirmText: t.value.retentionConfirmBtn,
      cancelText: t.value.dialogCancel,
      variant: 'danger',
    })
    if (!ok) {
      setRetentionMsg(summary, 'info')
      return
    }

    // 2) Eksekusi (nilai kandidat ikut disimpan di server).
    const res = await bbsService.runRetentionPurge([module], true, retentionForm[module])
    retentionResult[module] = res.results?.[module] ?? null
    retentionSaved[module] = retentionForm[module]
    retentionPreview[module] = null
    setRetentionMsg(retentionResultText(module, retentionResult[module]), 'success')
    toast.success(t.value.retentionDone)
    if (module === 'speed') {
      await loadPlates()
      await Promise.all([loadSummary(), loadEvents(), loadByVehicle()])
      if (trendOpen.value) await loadTrend()
    }
  } catch {
    setRetentionMsg(t.value.retentionPurgeError, 'error')
  } finally {
    retentionLoading.value = false
  }
}

// ── init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadPlates()
  await Promise.all([loadEvents(), loadSummary(), loadByVehicle()])
})
</script>
