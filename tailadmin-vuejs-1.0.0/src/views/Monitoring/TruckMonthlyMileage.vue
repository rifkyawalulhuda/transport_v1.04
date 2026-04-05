<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                Rekap KM bulanan per truk
              </h3>
              <Badge :color="mileageData.meta.cached ? 'info' : 'success'" size="sm">
                {{ mileageData.meta.cached ? 'Cache aktif' : 'Data terbaru' }}
              </Badge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Data dihitung dari trip mileage Wialon pada bulan kalender yang dipilih.
            </p>
          </div>

          <form class="flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="applyFilters">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Bulan
              </label>
              <input
                v-model="monthInput"
                type="month"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>

            <div class="sm:min-w-64">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Pencarian
              </label>
              <input
                v-model="searchInput"
                type="text"
                placeholder="Plat / kendaraan / unit Wialon"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                :disabled="loading || isExporting"
                @click="exportExcel"
              >
                {{ isExporting ? 'Mengekspor...' : 'Export Excel' }}
              </button>
              <button
                type="submit"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                :disabled="loading"
              >
                {{ loading ? 'Memuat...' : 'Tampilkan' }}
              </button>
              <RouterLink
                to="/truck-locations"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                Lokasi Truk
              </RouterLink>
            </div>
          </form>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
          <h4 class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ card.value }}
          </h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ card.note }}
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div
          class="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Daftar KM Truk
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Periode {{ formattedPeriodLabel }}. Menampilkan {{ filteredRows.length }} dari
              {{ mileageData.pagination.total_rows }} truk hasil pencarian.
            </p>
          </div>
          <div class="flex flex-col gap-2 sm:items-end">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
              <select
                v-model.number="pageSize"
                class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                :disabled="loading"
                @change="changePageSize"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Update: {{ formatDateTime(mileageData.meta.fetched_at) }}
            </div>
          </div>
        </div>

        <div class="px-5 pb-5 pt-4 sm:px-6">
          <div v-if="loading" class="text-sm text-gray-500">Memuat data KM bulanan...</div>
          <div v-else-if="!filteredRows.length" class="text-sm text-gray-500">
            Tidak ada data truk yang cocok untuk filter saat ini.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full table-auto">
              <thead>
                <tr class="border-b border-gray-100 dark:border-gray-800">
                  <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    No Truck
                  </th>
                  <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Kendaraan
                  </th>
                  <th class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total KM
                  </th>
                  <th class="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Trip
                  </th>
                  <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Trip Pertama
                  </th>
                  <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Trip Terakhir
                  </th>
                  <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredRows"
                  :key="row.id_truck"
                  class="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td class="px-3 py-4 align-top">
                    <div class="font-medium text-gray-800 dark:text-white/90">
                      {{ row.no_police || `Truck ${row.id_truck}` }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      Unit Wialon: {{ row.wialon_unit_id || '-' }}
                    </div>
                  </td>
                  <td class="px-3 py-4 align-top">
                    <div class="text-sm text-gray-700 dark:text-gray-200">
                      {{ row.vehicle_name || '-' }}
                    </div>
                  </td>
                  <td class="px-3 py-4 text-right align-top">
                    <div class="font-semibold text-gray-800 dark:text-white/90">
                      {{ formatDistance(row.total_distance_km) }}
                    </div>
                  </td>
                  <td class="px-3 py-4 text-right align-top text-sm text-gray-700 dark:text-gray-200">
                    {{ formatInteger(row.trips_count) }}
                  </td>
                  <td class="px-3 py-4 align-top text-sm text-gray-700 dark:text-gray-200">
                    {{ formatDateTime(row.first_trip_at) }}
                  </td>
                  <td class="px-3 py-4 align-top text-sm text-gray-700 dark:text-gray-200">
                    {{ formatDateTime(row.last_trip_at) }}
                  </td>
                  <td class="px-3 py-4 align-top">
                    <div class="space-y-2">
                      <Badge :color="resolveStatusColor(row.status)" size="sm">
                        {{ resolveStatusLabel(row.status) }}
                      </Badge>
                      <p v-if="row.error" class="max-w-xs text-xs text-error-600 dark:text-error-400">
                        {{ row.error }}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            v-if="mileageData.pagination.total_pages > 1"
            class="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Halaman {{ mileageData.pagination.page }} dari {{ mileageData.pagination.total_pages }}
            </p>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                :disabled="loading || mileageData.pagination.page <= 1"
                @click="goToPage(mileageData.pagination.page - 1)"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                :disabled="loading || mileageData.pagination.page >= mileageData.pagination.total_pages"
                @click="goToPage(mileageData.pagination.page + 1)"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Badge from '@/components/ui/Badge.vue'
import { useToast } from '@/composables/useToast'
import { truckMileageService, type TruckMileageResponse, type TruckMileageRow } from '@/services/truckMileageService'

const pageTitle = 'KM Bulanan Truk'
const toast = useToast()

const numberFormatter = new Intl.NumberFormat('id-ID')
const distanceFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const createEmptyResponse = (): TruckMileageResponse => ({
  summary: {
    total_trucks: 0,
    mapped_trucks: 0,
    unlinked_trucks: 0,
    active_trucks: 0,
    error_trucks: 0,
    total_distance_m: 0,
    total_distance_km: 0,
    total_trips: 0
  },
  rows: [],
  period: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    month_key: '',
    start_at: '',
    end_at: ''
  },
  pagination: {
    page: 1,
    limit: 10,
    total_rows: 0,
    total_pages: 1
  },
  meta: {
    fetched_at: '',
    cached: false,
    cache_ttl_ms: 0,
    source: '',
    worker_count: 0,
    search: ''
  }
})

const buildCurrentMonthInput = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const monthInput = ref(buildCurrentMonthInput())
const searchInput = ref('')
const loading = ref(false)
const isExporting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 50]
const mileageData = ref<TruckMileageResponse>(createEmptyResponse())
const filteredRows = computed<TruckMileageRow[]>(() => mileageData.value.rows)

const filteredSummary = computed(() => {
  return filteredRows.value.reduce(
    (accumulator, row) => {
      accumulator.totalTrucks += 1
      accumulator.totalDistanceKm += row.total_distance_km || 0
      accumulator.totalTrips += row.trips_count || 0
      if (row.status === 'has_trip') {
        accumulator.activeTrucks += 1
      }
      if (row.status === 'error') {
        accumulator.errorTrucks += 1
      }
      return accumulator
    },
    {
      totalTrucks: 0,
      totalDistanceKm: 0,
      totalTrips: 0,
      activeTrucks: 0,
      errorTrucks: 0
    }
  )
})

const summaryCards = computed(() => [
  {
    key: 'distance',
    label: 'Total KM',
    value: formatDistance(filteredSummary.value.totalDistanceKm),
    note: 'Akumulasi kilometer trip pada periode terpilih'
  },
  {
    key: 'active',
    label: 'Truk Berjalan',
    value: formatInteger(filteredSummary.value.activeTrucks),
    note: 'Truk yang punya minimal 1 trip pada bulan ini'
  },
  {
    key: 'trips',
    label: 'Total Trip',
    value: formatInteger(filteredSummary.value.totalTrips),
    note: 'Jumlah trip Wialon yang terdeteksi'
  },
  {
    key: 'rows',
    label: 'Truk Ditampilkan',
    value: formatInteger(filteredSummary.value.totalTrucks),
    note: `Error data: ${formatInteger(filteredSummary.value.errorTrucks)}`
  }
])

const formattedPeriodLabel = computed(() => {
  const { year, month } = mileageData.value.period
  if (!year || !month) {
    return '-'
  }

  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  })
})

function formatInteger(value: number) {
  return numberFormatter.format(Number(value) || 0)
}

function formatDistance(value: number) {
  return `${distanceFormatter.format(Number(value) || 0)} km`
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function resolveStatusLabel(status: TruckMileageRow['status']) {
  switch (status) {
    case 'has_trip':
      return 'Ada Trip'
    case 'no_trip':
      return 'Tidak Ada Trip'
    case 'unlinked':
      return 'Belum Terhubung'
    case 'missing_unit':
      return 'Mapping GPS Tidak Valid'
    case 'error':
      return 'Error'
    default:
      return status
  }
}

function resolveStatusColor(status: TruckMileageRow['status']) {
  switch (status) {
    case 'has_trip':
      return 'success'
    case 'no_trip':
      return 'light'
    case 'unlinked':
      return 'warning'
    case 'missing_unit':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'light'
  }
}

function getFilenameFromHeader(contentDisposition?: string | null) {
  if (!contentDisposition) {
    return ''
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1])
  }

  const match = contentDisposition.match(/filename="?([^"]+)"?/i)
  return match ? match[1] : ''
}

async function fetchMileage() {
  loading.value = true
  try {
    mileageData.value = await truckMileageService.fetchMonthlyDistance({
      month: monthInput.value,
      search: searchInput.value.trim() || undefined,
      page: currentPage.value,
      limit: pageSize.value
    })
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat KM bulanan truk.')
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  currentPage.value = 1
  void fetchMileage()
}

function goToPage(page: number) {
  currentPage.value = page
  void fetchMileage()
}

function changePageSize() {
  currentPage.value = 1
  void fetchMileage()
}

async function exportExcel() {
  if (isExporting.value) {
    return
  }

  if (mileageData.value.pagination.total_rows === 0) {
    toast.info('Tidak ada data untuk diexport.')
    return
  }

  isExporting.value = true

  try {
    const res = await truckMileageService.exportMonthlyDistance({
      month: monthInput.value,
      search: searchInput.value.trim() || undefined
    })

    if (!res.ok) {
      const message = await res.text()
      toast.error(message || 'Gagal export data.')
      return
    }

    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      toast.info('Tidak ada data untuk diexport.')
      return
    }

    const fallbackName = `KM_Bulanan_Truk_${monthInput.value || new Date().toISOString().slice(0, 7)}.xlsx`
    const filename =
      getFilenameFromHeader(res.headers.get('content-disposition')) || fallbackName
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
    toast.success('Export berhasil.')
  } catch (error) {
    console.error(error)
    toast.error('Gagal export data.')
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  void fetchMileage()
})
</script>
