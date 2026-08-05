<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Transaksi Sub Contractor">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi</div>
          <div class="flex flex-wrap items-center gap-2">
            <RouterLink
              v-if="detailId"
              :to="`/subcontractor/${detailId}/print`"
              target="_blank"
              class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:focus:ring-offset-gray-900"
            >
              Print
            </RouterLink>
            <RouterLink
              to="/subcontractor"
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

        <div v-else class="space-y-6">
          <!-- Info Utama -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div class="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-200 dark:divide-gray-800">
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Warehouse</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatWarehouse(detail) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Customer</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatText(detail.nama_customer) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Subcontractor</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatText(detail.nama_subcont) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Driver</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.driver) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tujuan Pengiriman</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.tujuan_pengiriman) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. Surat Jalan</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.no_surat_jalan) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Dibuat Oleh</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatCreatedBy(detail) }}</p>
              </div>
            </div>
          </div>

          <!-- Kendaraan -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h6l3-3V9h-3"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Kendaraan</p>
            </div>
            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">No. Police</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.truck) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Jenis Kendaraan</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.jenis_kendaraan) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Tonase</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.tonase) }}</p>
              </div>
            </div>
          </div>

          <!-- Timeline Pengiriman -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Timeline Pengiriman</p>
            </div>
            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-3 mb-4">
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Delivery Date</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(detail.delivery_date) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Arrival</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatDate(detail.arrival_date) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Trip</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.trip) }}</p>
              </div>
            </div>
            <div v-if="deliveryStops.length" class="border-t border-gray-100 pt-4 dark:border-gray-800">
              <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">Jadwal Stop (Estimasi)</p>
              <ul class="space-y-2">
                <li
                  v-for="(stop, idx) in deliveryStops"
                  :key="stop.id || idx"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.03]"
                >
                  <span class="font-medium text-gray-800 dark:text-gray-100">
                    <span class="mr-2 text-xs text-gray-400">{{ stopLabel(stop) }}</span>
                    {{ stop.stop_name || '-' }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(stop.estimated_arrival) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Rincian Biaya -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Rincian Biaya</p>
            </div>

            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-3 mb-4">
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Sales</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Rp {{ formatNumber(detail.sales) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">Cost</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Rp {{ formatNumber(detail.cost) }}</p>
              </div>
              <div>
                <span class="text-xs text-gray-400 dark:text-gray-500">No. Invoice</span>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.no_invoice) }}</p>
              </div>
            </div>

            <!-- Gross Profit Summary -->
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-gray-400 dark:text-gray-500">Billing Customer</p>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-100 mt-0.5">{{ formatText(detail.billing_customer) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400 dark:text-gray-500">Gross Profit</p>
                  <p
                    class="text-lg font-bold mt-0.5"
                    :class="grossProfitNum >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'"
                  >
                    Rp {{ formatNumber(detail.gross_profit) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Daftar DN (Delivery Note) -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Daftar DN (Delivery Note)</p>
              <span class="ml-auto text-xs text-gray-400 dark:text-gray-500">{{ dnItems.length }} item</span>
            </div>

            <p v-if="dnLoading" class="text-sm text-gray-500 dark:text-gray-400">Memuat data DN...</p>
            <p v-else-if="dnError" class="text-sm text-error-600 dark:text-error-400">{{ dnError }}</p>
            <p v-else-if="dnItems.length === 0" class="text-sm text-gray-400 dark:text-gray-500 italic">Tidak ada data DN.</p>

            <div v-else class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-100 dark:border-gray-800">
                    <th class="pb-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">#</th>
                    <th class="pb-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">No. DN</th>
                    <th class="pb-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Pickup</th>
                    <th class="pb-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Drop</th>
                    <th class="pb-2 pr-4 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Qty</th>
                    <th class="pb-2 pr-4 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Pkg</th>
                    <th class="pb-2 pr-4 text-right text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">GW (kg)</th>
                    <th class="pb-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">No. Container</th>
                    <th class="pb-2 pr-4 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">No. AJU</th>
                    <th class="pb-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 dark:divide-gray-800/60">
                  <tr
                    v-for="(dn, idx) in dnItems"
                    :key="dn.id || idx"
                    class="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <td class="py-2 pr-4 text-gray-400 dark:text-gray-500">{{ idx + 1 }}</td>
                    <td class="py-2 pr-4 font-medium text-gray-800 dark:text-gray-100">{{ formatText(dn.no_dn) }}</td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" :title="dn.pickup_alamat || ''">{{ formatText(dn.pickup_alamat) }}</td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" :title="dn.drop_alamat || ''">{{ formatText(dn.drop_alamat) }}</td>
                    <td class="py-2 pr-4 text-center text-gray-700 dark:text-gray-300">{{ dn.qty ?? '-' }}</td>
                    <td class="py-2 pr-4 text-center">
                      <span v-if="dn.pkg" class="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{{ dn.pkg }}</span>
                      <span v-else class="text-gray-400">-</span>
                    </td>
                    <td class="py-2 pr-4 text-right text-gray-700 dark:text-gray-300">{{ dn.gw != null ? Number(dn.gw).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-' }}</td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-300">{{ formatText(dn.no_container) }}</td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-300">{{ formatText(dn.no_aju) }}</td>
                    <td class="py-2 text-gray-500 dark:text-gray-400">{{ formatText(dn.remarks) }}</td>
                  </tr>
                </tbody>
              </table>
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
import { subcontractorService } from '@/services/subcontractorService'

type DeliveryStopRow = {
  id?: number
  stop_order?: number
  stop_name?: string
  is_departure?: number
  is_finish?: number
  estimated_arrival?: string | null
}

type DetailData = {
  nama_customer: string
  nama_subcont: string
  kode_warehouse: string
  nm_warehouse: string
  truck: string
  jenis_kendaraan: string
  tonase: string
  tujuan_pengiriman: string
  driver: string
  no_surat_jalan: string
  delivery_date: string
  arrival_date: string
  cost: number
  no_invoice: string
  billing_customer: string
  sales: number
  trip: string
  gross_profit: number
  created_by_name?: string | null
  created_by_nik?: string | null
  delivery_stops?: DeliveryStopRow[]
}

type DNItem = {
  id?: number
  no_dn: string
  pickup_alamat: string
  drop_alamat: string
  qty: number
  pkg: string
  gw: number | null
  no_container: string
  no_aju: string
  remarks: string
}

const currentPageTitle = ref('Detail Sub Contractor')
const route = useRoute()
const loading = ref(true)
const formError = ref('')

const dnItems = ref<DNItem[]>([])
const dnLoading = ref(false)
const dnError = ref('')
const detail = ref<DetailData>({
  nama_customer: '',
  nama_subcont: '',
  kode_warehouse: '',
  nm_warehouse: '',
  truck: '',
  jenis_kendaraan: '',
  tonase: '',
  tujuan_pengiriman: '',
  driver: '',
  no_surat_jalan: '',
  delivery_date: '',
  arrival_date: '',
  cost: 0,
  no_invoice: '',
  billing_customer: '',
  sales: 0,
  trip: '',
  gross_profit: 0
})

const grossProfitNum = computed(() => Number(detail.value.gross_profit) || 0)

const deliveryStops = computed(() => {
  const list = detail.value.delivery_stops
  if (!Array.isArray(list)) return [] as DeliveryStopRow[]
  return [...list].sort((a, b) => Number(a.stop_order || 0) - Number(b.stop_order || 0))
})

const stopLabel = (stop: DeliveryStopRow) => {
  if (Number(stop.is_departure) === 1) return 'Dep'
  if (Number(stop.is_finish) === 1) return 'Fin'
  return 'Stop'
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const s = String(value).trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    const [datePart, timePart] = s.split(' ')
    const dateLabel = formatDate(datePart)
    return `${dateLabel} ${timePart.slice(0, 5)}`
  }
  return formatDate(value)
}

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const detailId = computed(() => resolveIdParam() || '')

const formatWarehouse = (data: DetailData) => {
  if (!data.kode_warehouse && !data.nm_warehouse) return '-'
  return `${data.kode_warehouse} - ${data.nm_warehouse}`
}

const formatText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const formatCreatedBy = (data: DetailData) => {
  const name = (data.created_by_name || '').trim()
  const nik = (data.created_by_nik || '').trim()
  if (name && nik) return `${name} (${nik})`
  if (name) return name
  if (nik) return nik
  return '-'
}

const formatNumber = (value: number) => {
  const number = Number(value) || 0
  return number.toLocaleString('id-ID', { minimumFractionDigits: 0 })
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

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  try {
    const data = await subcontractorService.fetchSubcontractorById(idParam)
    detail.value = data
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat detail transaksi. Silakan coba lagi.'
    formError.value = message
  } finally {
    loading.value = false
  }
}

const loadDN = async () => {
  const idParam = resolveIdParam()
  if (!idParam) return
  dnLoading.value = true
  dnError.value = ''
  try {
    const data = await subcontractorService.fetchDNList(idParam)
    dnItems.value = Array.isArray(data?.items) ? data.items : []
  } catch (error: unknown) {
    dnError.value = error instanceof Error ? error.message : 'Gagal memuat data DN.'
  } finally {
    dnLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
  loadDN()
})
</script>
