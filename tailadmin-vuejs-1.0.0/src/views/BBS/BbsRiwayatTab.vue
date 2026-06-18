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
          @input="onSearchInput"
        />
      </div>
      <div>
        <input
          ref="monthInput"
          v-model="filter.month"
          type="month"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 cursor-pointer"
          @change="applyFilters"
          @click="monthInput?.showPicker?.()"
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
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          @click="showExportModal = true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </div>
    </div>

    <!-- Export Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showExportModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showExportModal = false"></div>
          <div class="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Export Riwayat BBS</h3>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors"
                @click="showExportModal = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Pilih rentang data yang akan di-export ke Excel</p>

            <div class="space-y-3 mb-5">
              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'month' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="month" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Per Bulan</span>
                  <p class="text-xs text-gray-400 mt-0.5">Export data satu bulan tertentu</p>
                </div>
              </label>

              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'year' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="year" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Per Tahun</span>
                  <p class="text-xs text-gray-400 mt-0.5">Export data satu tahun penuh</p>
                </div>
              </label>

              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'all' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="all" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Semua Data</span>
                  <p class="text-xs text-gray-400 mt-0.5">Export seluruh riwayat BBS</p>
                </div>
              </label>
            </div>

            <div v-if="exportRange === 'month'" class="mb-5">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Pilih Bulan</label>
              <input
                ref="exportMonthInput"
                v-model="exportMonth"
                type="month"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                @click="exportMonthInput?.showPicker?.()"
              />
            </div>

            <div v-if="exportRange === 'year'" class="mb-5">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Pilih Tahun</label>
              <select
                v-model="exportYear"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                @click="showExportModal = false"
              >
                Batal
              </button>
              <button
                type="button"
                :disabled="exporting"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="doExport"
              >
                <svg v-if="exporting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ exporting ? 'Mengunduh...' : 'Download Excel' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Memuat riwayat...</div>
    <div v-else-if="rows.length === 0" class="py-8 text-center text-sm text-gray-500">Belum ada data</div>
    <template v-else>
      <div class="space-y-0 divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-800">
        <div
          v-for="row in paginatedRows"
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

      <!-- Pagination -->
      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Tampilkan</span>
          <select
            v-model.number="perPage"
            class="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            @change="currentPage = 1"
          >
            <option :value="15">15</option>
            <option :value="30">30</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span>dari {{ rows.length }} data</span>
        </div>

        <nav v-if="totalPages > 1" class="flex items-center gap-1">
          <button
            type="button"
            :disabled="currentPage <= 1"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            @click="currentPage--"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>

          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              type="button"
              :class="[
                'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-brand-500 text-white'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5'
              ]"
              @click="currentPage = page as number"
            >{{ page }}</button>
            <span v-else class="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
          </template>

          <button
            type="button"
            :disabled="currentPage >= totalPages"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            @click="currentPage++"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </nav>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onMounted } from 'vue'
import EyeIcon from '@/icons/EyeIcon.vue'
import ChecklistIcon from '@/icons/ChecklistIcon.vue'
import AlertTriangleIcon from '@/icons/AlertTriangleIcon.vue'
import { bbsService, type BbsHistoryRow } from '@/services/bbsService'
import { API_BASE } from '@/config/api'
import { authFetch } from '@/services/auth'

const props = defineProps<{ refreshTrigger: number }>()
const emit = defineEmits<{ (e: 'select', row: BbsHistoryRow): void }>()

function currentMonth() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const filter = reactive({
  search: '',
  month: currentMonth(),
  status: '',
})

const loading = ref(false)
const rows = ref<BbsHistoryRow[]>([])
const activeFilter = ref('semua')
const monthInput = ref<HTMLInputElement | null>(null)

// Pagination
const perPage = ref(15)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / perPage.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return rows.value.slice(start, start + perPage.value)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

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
  currentPage.value = 1
  try {
    const type = activeFilter.value === 'semua' ? 'all' : activeFilter.value === 'observasi' ? 'observation' : activeFilter.value
    const params: Record<string, string> = { type, limit: '200' }
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

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchHistory()
  }, 300)
}

function clearFilters() {
  filter.search = ''
  filter.month = currentMonth()
  filter.status = ''
  fetchHistory()
}

// Export
const showExportModal = ref(false)
const exportRange = ref<'month' | 'year' | 'all'>('month')
const exportMonth = ref(currentMonth())
const exportMonthInput = ref<HTMLInputElement | null>(null)
const exportYear = ref(String(new Date().getFullYear()))
const exporting = ref(false)

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  const years: string[] = []
  for (let y = current; y >= current - 5; y--) {
    years.push(String(y))
  }
  return years
})

async function doExport() {
  exporting.value = true
  try {
    const params = new URLSearchParams()
    params.set('range', exportRange.value)
    if (exportRange.value === 'month') params.set('month', exportMonth.value)
    if (exportRange.value === 'year') params.set('year', exportYear.value)

    const res = await authFetch(`${API_BASE}/bbs/export?${params.toString()}`)
    if (!res.ok) throw new Error('Export gagal')

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const disposition = res.headers.get('content-disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    a.download = match?.[1] || 'BBS_Riwayat.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showExportModal.value = false
  } catch {
    // silently fail or could add toast
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchHistory()
})

watch(() => filter.status, () => {
  fetchHistory()
})

watch(() => props.refreshTrigger, () => {
  fetchHistory()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
