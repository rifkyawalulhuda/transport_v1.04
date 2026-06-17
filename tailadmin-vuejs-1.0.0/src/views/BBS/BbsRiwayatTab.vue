<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">Riwayat Laporan</h4>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Semua observasi, checklist, dan insiden yang telah dicatat</p>

    <div class="flex gap-1.5 mb-4">
      <button
        v-for="tab in historyTabs"
        :key="tab.key"
        type="button"
        :class="[
          'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
          activeFilter === tab.key
            ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-white/10 dark:text-white dark:border-gray-600'
            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
        ]"
        @click="activeFilter = tab.key; fetchHistory()"
      >{{ tab.label }}</button>
    </div>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5 mb-4">
      <div>
        <input
          v-model="filter.search"
          type="text"
          placeholder="Cari teks..."
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          @keyup.enter="applyFilters"
        />
      </div>
      <div>
        <input
          v-model="filter.month"
          type="month"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          @change="applyFilters"
        />
      </div>
      <div>
        <select
          v-model="filter.status"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          @change="applyFilters"
        >
          <option value="">Semua Status</option>
          <option value="aman">Aman</option>
          <option value="perlu_perhatian">Perlu Perhatian</option>
          <option value="passed">Lulus</option>
          <option value="needs_fix">Perlu Perbaikan</option>
          <option value="Near-Miss">Near-Miss</option>
          <option value="Insiden Ringan">Insiden Ringan</option>
          <option value="Insiden Sedang">Insiden Sedang</option>
          <option value="Insiden Berat">Insiden Berat</option>
        </select>
      </div>
      <div class="sm:col-span-2 xl:col-span-2 flex items-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          @click="clearFilters"
        >
          Reset
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Memuat riwayat...</div>
    <div v-else-if="rows.length === 0" class="py-8 text-center text-sm text-gray-500">Belum ada data</div>
    <div v-else class="space-y-0 divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800">
      <div
        v-for="row in rows"
        :key="`${row.type}-${row.id}`"
        class="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
        @click="$emit('select', row)"
      >
        <div
          :class="[
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
            iconBgClass(row)
          ]"
        >
          <component :is="iconComp(row)" :class="iconColorClass(row)" class="h-4 w-4" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ row.title }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatMeta(row.meta) }}</p>
        </div>
        <span
          :class="[
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium flex-shrink-0',
            badgeClass(row)
          ]"
        >{{ row.status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { onMounted } from 'vue'
import EyeIcon from '@/icons/EyeIcon.vue'
import ChecklistIcon from '@/icons/ChecklistIcon.vue'
import AlertTriangleIcon from '@/icons/AlertTriangleIcon.vue'
import { bbsService, type BbsHistoryRow } from '@/services/bbsService'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

const props = defineProps<{ refreshTrigger: number }>()
const emit = defineEmits<{ (e: 'select', row: BbsHistoryRow): void }>()

const filter = reactive({
  search: '',
  month: '',
  status: '',
})

const loading = ref(false)
const rows = ref<BbsHistoryRow[]>([])
const activeFilter = ref('semua')

const historyTabs = [
  { key: 'semua', label: 'Semua' },
  { key: 'observasi', label: 'Observasi' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'insiden', label: 'Insiden' },
]

function iconComp(row: BbsHistoryRow) {
  if (row.type === 'observation') return EyeIcon
  if (row.type === 'checklist') return ChecklistIcon
  return AlertTriangleIcon
}

function iconBgClass(row: BbsHistoryRow) {
  if (row.type === 'observation') return 'bg-blue-light-50 dark:bg-blue-light-500/15'
  if (row.type === 'checklist') return 'bg-success-50 dark:bg-success-500/15'
  return 'bg-warning-50 dark:bg-warning-500/15'
}

function iconColorClass(row: BbsHistoryRow) {
  if (row.type === 'observation') return 'text-blue-light-500'
  if (row.type === 'checklist') return 'text-success-600'
  return 'text-warning-600'
}

function badgeClass(row: BbsHistoryRow) {
  if (row.type === 'observation') {
    if (row.status === 'Aman') return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400'
    return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
  }
  if (row.type === 'checklist') {
    if (row.status === 'Lulus') return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400'
    return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
  }
  if (row.status === 'Near-Miss') return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400'
  return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400'
}

function formatMeta(meta: string) {
  const parts = meta.split(' · ')
  if (parts.length < 2) return meta
  const dateStr = parts[0]
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return meta
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(date.getTime())) return meta
  const formattedDate = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${formattedDate} · ${parts.slice(1).join(' · ')}`
}

async function fetchHistory() {
  loading.value = true
  try {
    const type = activeFilter.value === 'semua' ? 'all' : activeFilter.value === 'observasi' ? 'observation' : activeFilter.value
    const params: Record<string, string> = { type }
    if (filter.search) params.search = filter.search
    if (filter.month) params.month = filter.month
    if (filter.status) params.status = filter.status
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => searchParams.set(k, v))
    const qs = searchParams.toString()
    const raw = await authFetch(`${API_BASE}/bbs/history${qs ? `?${qs}` : ''}`)
    if (!raw.ok) throw new Error('Gagal memuat riwayat')
    const res = await raw.json()
    rows.value = res.rows
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  fetchHistory()
}

function clearFilters() {
  filter.search = ''
  filter.month = ''
  filter.status = ''
  fetchHistory()
}

onMounted(() => {
  fetchHistory()
})

watch(() => props.refreshTrigger, () => {
  fetchHistory()
})
</script>
