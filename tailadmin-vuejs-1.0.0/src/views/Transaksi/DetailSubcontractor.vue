<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Transaksi Sub Contractor">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi</div>
          <RouterLink
            to="/subcontractor"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
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
            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-3">
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
}

const currentPageTitle = ref('Detail Sub Contractor')
const route = useRoute()
const loading = ref(true)
const formError = ref('')
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

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const formatWarehouse = (data: DetailData) => {
  if (!data.kode_warehouse && !data.nm_warehouse) return '-'
  return `${data.kode_warehouse} - ${data.nm_warehouse}`
}

const formatText = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
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

onMounted(() => {
  loadDetail()
})
</script>
