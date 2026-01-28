<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Transaksi Repair">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi</div>
          <div
            v-if="detail.status_repair"
            class="rounded-full px-5 py-3 text-xs font-medium"
            :class="statusBadgeClass"
          >
            {{ statusBadgeLabel }}
          </div>
          <div class="flex flex-wrap items-center gap-2">
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

        <div v-else class="space-y-4 print-area">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Input
              </label>
              <input
                type="text"
                :value="formatDate(detail.tgl_input)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Estimasi Tanggal Selesai
              </label>
              <input
                type="text"
                :value="formatDate(detail.tgl_proses)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div v-if="detail.status_repair === 'SELESAI'" class="grid gap-4 sm:grid-cols-1">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Selesai
              </label>
              <input
                type="text"
                :value="formatDate(detail.tgl_selesai)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. Police
              </label>
              <input
                type="text"
                :value="formatTruck(detail)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Maker
              </label>
              <input
                type="text"
                :value="detail.merk_mobil || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Model
              </label>
              <input
                type="text"
                :value="detail.model || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kategori Perbaikan
              </label>
              <input
                type="text"
                :value="detail.kategori_repair || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Kerusakan
              </label>
              <input
                type="text"
                :value="formatDate(detail.tgl_kerusakan)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. SPK Perbaikan
              </label>
              <input
                type="text"
                :value="detail.no_spk_perbaikan || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kilometer Kendaraan
              </label>
              <input
                type="text"
                :value="detail.kilometer || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jenis Kerusakan
              </label>
              <input
                type="text"
                :value="detail.jenis_kerusakan || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-1">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Pergantian Spare Part
              </label>
              <input
                type="text"
                :value="detail.spare_part || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jadwal Perawatan Berkala
              </label>
              <input
                type="text"
                :value="formatDate(detail.jadwal_berkala)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Keterangan Perbaikan
              </label>
              <input
                type="text"
                :value="detail.keterangan || '-'"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-1">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Biaya Perbaikan
              </label>
              <input
                type="text"
                :value="formatNumber(detail.biaya_perbaikan)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
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
  detail.value.status_repair === 'SELESAI' ? 'Perbaikan Selesai' : 'Proses Perbaikan'
)
const statusBadgeClass = computed(() =>
  detail.value.status_repair === 'SELESAI'
    ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400'
    : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
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

const formatNumber = (value?: number | string | null) => {
  const numberValue = Number(value || 0)
  return numberValue.toLocaleString('en-US')
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
