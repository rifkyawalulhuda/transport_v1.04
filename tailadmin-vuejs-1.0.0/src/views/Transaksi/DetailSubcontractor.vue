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

        <div v-else class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Warehouse
              </label>
              <input
                type="text"
                :value="formatWarehouse(detail)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Customer
              </label>
              <input
                type="text"
                :value="detail.nama_customer"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                SubCont
              </label>
              <input
                type="text"
                :value="detail.nama_subcont"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No Police
              </label>
              <input
                type="text"
                :value="detail.truck"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jenis Kendaraan
              </label>
              <input
                type="text"
                :value="detail.jenis_kendaraan"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tonase
              </label>
              <input
                type="text"
                :value="detail.tonase"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tujuan Pengiriman
              </label>
              <input
                type="text"
                :value="detail.tujuan_pengiriman"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Driver
              </label>
              <input
                type="text"
                :value="detail.driver"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. Surat Jalan
              </label>
              <input
                type="text"
                :value="detail.no_surat_jalan"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Delivery Date
              </label>
              <input
                type="text"
                :value="formatDate(detail.delivery_date)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Arrival
              </label>
              <input
                type="text"
                :value="formatDate(detail.arrival_date)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Cost
              </label>
              <input
                type="text"
                :value="formatNumber(detail.cost)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. Invoice
              </label>
              <input
                type="text"
                :value="detail.no_invoice"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Billing Customer
              </label>
              <input
                type="text"
                :value="detail.billing_customer"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Sales
              </label>
              <input
                type="text"
                :value="formatNumber(detail.sales)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Trip
              </label>
              <input
                type="text"
                :value="detail.trip"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Gross Profit
            </label>
            <input
              type="text"
              :value="formatNumber(detail.gross_profit)"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              readonly
            />
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const formatWarehouse = (data: DetailData) => `${data.kode_warehouse} - ${data.nm_warehouse}`

const formatNumber = (value: number) => {
  const number = Number(value) || 0
  return number.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
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
