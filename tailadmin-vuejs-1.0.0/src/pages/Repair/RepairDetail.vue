<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Transaksi Repair">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi</div>
          <div class="flex flex-wrap items-center gap-2">
            <div
              v-if="detail.status_repair"
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="statusBadgeClass"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass"></span>
              {{ statusBadgeLabel }}
            </div>
            <RouterLink
              to="/repair"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Kembali
            </RouterLink>
          </div>
        </div>

        <p
          v-if="formError"
          class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
        >
          {{ formError }}
        </p>
        <p v-else-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
          Memuat detail transaksi...
        </p>

        <div v-else class="space-y-6 print-area">
          <!-- Info Utama -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div class="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-200 dark:divide-gray-800">
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. Police</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatTruck(detail) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Maker</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatText(detail.merk_mobil) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Model</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatText(detail.model) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kategori Perbaikan</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.kategori_repair) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. SPK Perbaikan</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.no_spk_perbaikan) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Kilometer</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.kilometer) }}</p>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Timeline</p>
            </div>
            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Tanggal Input</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(detail.tgl_input) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Tanggal Kerusakan</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(detail.tgl_kerusakan) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Estimasi Selesai</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(detail.tgl_proses) }}</p>
              </div>
              <div v-if="detail.status_repair === 'SELESAI'">
                <span class="text-xs text-gray-400 dark:text-gray-500">Tanggal Selesai</span>
                <p class="text-sm font-medium text-success-600 dark:text-success-400">{{ formatDate(detail.tgl_selesai) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Jadwal Perawatan Berkala</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(detail.jadwal_berkala) }}</p>
              </div>
            </div>
          </div>

          <!-- Detail Kerusakan -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Detail Kerusakan</p>
            </div>
            <div class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Jenis Kerusakan</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.jenis_kerusakan) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Pergantian Spare Part</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.spare_part) }}</p>
              </div>
              <div class="sm:col-span-2">
                <span class="text-xs text-gray-400 dark:text-gray-500">Keterangan Perbaikan</span>
                <p class="text-sm text-gray-800 dark:text-gray-100 mt-0.5 leading-relaxed">{{ formatText(detail.keterangan) }}</p>
              </div>
            </div>
          </div>

          <!-- Biaya -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Biaya Perbaikan</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 dark:text-gray-400">Total Biaya</span>
                <p class="text-lg font-bold text-gray-800 dark:text-white/90">
                  Rp {{ formatNumber(detail.biaya_perbaikan) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { repairService } from '@/services/repair'

type RepairDetail = {
  id_repair: number
  kategori_repair?: string
  id_truck?: number
  tgl_input?: string
  status_repair?: 'PROSES' | 'SELESAI'
  tgl_proses?: string
  tgl_selesai?: string
  tgl_kerusakan?: string
  no_spk_perbaikan?: string
  kilometer?: string
  jenis_kerusakan?: string
  spare_part?: string
  jadwal_berkala?: string
  keterangan?: string
  biaya_perbaikan?: number
  no_police?: string
  jenis_kendaraan?: string
  merk_mobil?: string
  model?: string
}

const currentPageTitle = ref('Detail Repair')
const route = useRoute()
const loading = ref(true)
const formError = ref('')
const detail = ref<RepairDetail>({} as RepairDetail)

const statusBadgeLabel = computed(() =>
  detail.value.status_repair === 'SELESAI' ? 'Selesai' : 'Proses'
)
const statusBadgeClass = computed(() =>
  detail.value.status_repair === 'SELESAI'
    ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
    : 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400'
)
const statusDotClass = computed(() =>
  detail.value.status_repair === 'SELESAI'
    ? 'bg-success-500'
    : 'bg-warning-500'
)

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const formatTruck = (item: RepairDetail) => {
  const noPolice = item.no_police || '-'
  const jenis = item.jenis_kendaraan ? ` - ${item.jenis_kendaraan}` : ''
  return `${noPolice}${jenis}`
}

const formatText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  // Parse as local date to avoid UTC shift
  const parts = String(value).split('T')[0].split('-')
  if (parts.length !== 3) return value
  const [y, m, d] = parts.map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const formatNumber = (value?: number | string | null) => {
  const numberValue = Number(value || 0)
  return numberValue.toLocaleString('id-ID', { minimumFractionDigits: 0 })
}

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }

  loading.value = true
  try {
    const data = await repairService.fetchRepairById(idParam)
    detail.value = data
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat detail transaksi. Silakan coba lagi.'
    formError.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
@media print {
  :global(app-sidebar),
  :global(app-header),
  :global(footer),
  :global(.no-print) {
    display: none !important;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  .print-area {
    page-break-inside: avoid;
  }
}

@page {
  size: A4 landscape;
  margin: 10mm;
}
</style>
