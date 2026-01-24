<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Data Supir">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Detail Data Supir
          </div>
          <RouterLink
            to="/data-transport/data-supir"
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
          Memuat detail data supir...
        </p>

        <div v-else class="space-y-6">
          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Identitas Supir
            </h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No. Police
                </label>
                <input
                  type="text"
                  :value="formatText(detail.no_polisi)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  NIK
                </label>
                <input
                  type="text"
                  :value="formatText(detail.nik)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nama Driver
                </label>
                <input
                  type="text"
                  :value="formatText(detail.nama_driver)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No. Telp
                </label>
                <input
                  type="text"
                  :value="formatText(detail.no_telp)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No. KTP
                </label>
                <input
                  type="text"
                  :value="formatText(detail.no_ktp)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Alamat
                </label>
                <textarea
                  rows="3"
                  :value="formatText(detail.alamat)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                ></textarea>
              </div>
            </div>
          </div>

          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Lisensi/Sertifikat
            </h4>
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Jenis Lisensi/Sertifikat</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Nomor</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Masa Berlaku</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Keterangan</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Dokumen</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr v-if="!detail.lisensi || detail.lisensi.length === 0">
                      <td colspan="4" class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6">Tidak ada data lisensi</td>
                    </tr>
                    <tr v-else v-for="(row, index) in detail.lisensi" :key="index">
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        {{ formatText(row.jenis_lisensi) }}
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        {{ formatText(row.nomor) }}
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        <span
                          class="inline-flex w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          :class="getDateStatusClass(row.masa_berlaku)"
                        >
                          {{ formatDate(row.masa_berlaku) }}
                        </span>
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        {{ formatText(row.keterangan) }}
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        <a v-if="row.dok_file" :href="docUrl(row.dok_file)" target="_blank" class="text-xs text-brand-600 hover:underline dark:text-brand-400">
                          {{ row.dok_original || row.dok_file }}
                        </a>
                        <span v-else>-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { API_BASE, API_ORIGIN } from '@/config/api'

const currentPageTitle = ref('Detail Data Supir')
const route = useRoute()
const loading = ref(true)
const formError = ref('')
const detail = ref({})

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const formatText = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

const formatDate = (value) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const docUrl = (filename) => `${API_ORIGIN}/doc-supir/${filename}`

const parseDateValue = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return new Date(value)
  }
  const raw = String(value).trim()
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2]) - 1
    const day = Number(isoMatch[3])
    return new Date(year, month, day)
  }
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const day = Number(slashMatch[1])
    const month = Number(slashMatch[2]) - 1
    const year = Number(slashMatch[3])
    return new Date(year, month, day)
  }
  const idMatch = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (idMatch) {
    const monthMap = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11,
    }
    const day = Number(idMatch[1])
    const monthName = idMatch[2].toLowerCase()
    const year = Number(idMatch[3])
    if (Object.prototype.hasOwnProperty.call(monthMap, monthName)) {
      return new Date(year, monthMap[monthName], day)
    }
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

const getDateStatusClass = (dateValue) => {
  const target = parseDateValue(dateValue)
  if (!target) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) {
    return 'bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20'
  }
  if (diffDays <= 30) {
    return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20'
  }
  return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20'
}

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID data supir tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  formError.value = ''
  try {
    const response = await fetch(`${API_BASE}/data-supir/by-no-polisi/${idParam}`)
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal memuat detail data supir.')
    }
    detail.value = await response.json()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal memuat detail data supir.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>
