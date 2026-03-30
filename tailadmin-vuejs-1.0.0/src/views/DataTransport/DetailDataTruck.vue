<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Data Truck">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Detail Data Truck
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              to="/truck-locations"
              class="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 shadow-theme-xs hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Lihat Lokasi
            </RouterLink>
            <RouterLink
              to="/data-transport/data-truck"
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
          Memuat detail data truck...
        </p>

        <div v-else class="space-y-6">
          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Identitas Kendaraan
            </h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Truck No
                </label>
                <input
                  type="text"
                  :value="formatText(detail.truck_no)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No Asset
                </label>
                <input
                  type="text"
                  :value="formatText(detail.no_asset)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tahun Pembuatan
                </label>
                <input
                  type="text"
                  :value="formatText(detail.tahun_pembuatan)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Merk
                </label>
                <input
                  type="text"
                  :value="formatText(detail.merk)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Type
                </label>
                <input
                  type="text"
                  :value="formatText(detail.type)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Model
                </label>
                <input
                  type="text"
                  :value="formatText(detail.model)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Isi Silinder (cc)
                </label>
                <input
                  type="text"
                  :value="formatText(detail.isi_silinder)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nomor Rangka
                </label>
                <input
                  type="text"
                  :value="formatText(detail.nomor_rangka)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nomor Mesin
                </label>
                <input
                  type="text"
                  :value="formatText(detail.nomor_mesin)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Wialon Unit ID
                </label>
                <input
                  type="text"
                  :value="formatText(detail.wialon_unit_id)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
            </div>
          </div>

          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Dokumen Legalitas
            </h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">No STNK</label>
                <input
                  type="text"
                  :value="formatText(detail.no_stnk)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masa Berlaku STNK</label>
                <input
                  type="text"
                  :value="formatDate(detail.masa_berlaku_stnk)"
                  :class="[
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                    getDateStatusClass(detail.masa_berlaku_stnk),
                  ]"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masa Berlaku Pajak STNK</label>
                <input
                  type="text"
                  :value="formatDate(detail.masa_berlaku_pajak_stnk)"
                  :class="[
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                    getDateStatusClass(detail.masa_berlaku_pajak_stnk),
                  ]"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">No BPKB</label>
                <input
                  type="text"
                  :value="formatText(detail.no_bpkb)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Iuran Aptrindo</label>
                <input
                  type="text"
                  :value="formatDate(detail.iuran_aptrindo)"
                  :class="[
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                    getDateStatusClass(detail.iuran_aptrindo),
                  ]"
                  readonly
                />
              </div>
            </div>
          </div>

          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              KIR & Uji Emisi
            </h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">No Keur Head Truck</label>
                <input
                  type="text"
                  :value="formatText(detail.no_keur_head_truck)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masa Berlaku Keur</label>
                <input
                  type="text"
                  :value="formatDate(detail.masa_berlaku_keur_head_truck)"
                  :class="[
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                    getDateStatusClass(detail.masa_berlaku_keur_head_truck),
                  ]"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masa Berlaku Uji Emisi</label>
                <input
                  type="text"
                  :value="formatDate(detail.masa_berlaku_uji_emisi)"
                  :class="[
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200',
                    getDateStatusClass(detail.masa_berlaku_uji_emisi),
                  ]"
                  readonly
                />
              </div>
            </div>
          </div>

          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Keterangan
            </h4>
            <textarea
              rows="3"
              :value="formatText(detail.keterangan)"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              readonly
            ></textarea>
          </div>

          <div>
            <h4
              class="mb-4 border-b pb-2 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Dokumen
            </h4>
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Jenis</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Nama File</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr v-if="docs.length === 0">
                      <td colspan="3" class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6">Tidak ada dokumen</td>
                    </tr>
                    <tr v-else v-for="doc in docs" :key="doc.filename">
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        {{ docLabel(doc.doc_type) }}
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                        {{ docName(doc) }}
                      </td>
                      <td class="px-5 py-3 text-sm sm:px-6">
                        <a :href="docUrl(doc.filename)" target="_blank" class="text-xs text-brand-600 hover:underline dark:text-brand-400">
                          Lihat
                        </a>
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

const currentPageTitle = ref('Detail Data Truck')
const route = useRoute()
const loading = ref(true)
const formError = ref('')
const detail = ref({})
const docs = ref([])

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

const docUrl = (filename) => `${API_ORIGIN}/doc-data-truck/${filename}`

const docName = (doc) => doc?.original_name || doc?.filename || '-'

const docLabel = (type) => {
  switch (type) {
    case 'dok_stnk':
      return 'STNK'
    case 'dok_bpkb':
      return 'BPKB'
    case 'dok_keur':
      return 'Keur'
    case 'dok_uji_emisi':
      return 'Uji Emisi'
    case 'dok_lain':
      return 'Dok Lain-lain'
    default:
      return '-'
  }
}

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
    formError.value = 'ID data truck tidak ditemukan.'
    loading.value = false
    return
  }
  const encodedId = encodeURIComponent(String(idParam))
  loading.value = true
  formError.value = ''
  try {
    const response = await fetch(`${API_BASE}/data-trucks/by-truck-no/${encodedId}`)
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal memuat detail data truck.')
    }
    detail.value = await response.json()
    try {
      const docsResponse = await fetch(`${API_BASE}/data-trucks/by-truck-no/${encodedId}/documents`)
      if (docsResponse.ok) {
        const payload = await docsResponse.json()
        if (Array.isArray(payload?.documents)) {
          docs.value = payload.documents
          return
        }
      }
    } catch (error) {
      console.error(error)
    }

    if (Array.isArray(detail.value?.dokumen)) {
      docs.value = detail.value.dokumen
    } else {
      const legacyDocs = []
      if (detail.value?.dok_stnk) legacyDocs.push({ doc_type: 'dok_stnk', filename: detail.value.dok_stnk, original_name: detail.value.dok_stnk })
      if (detail.value?.dok_bpkb) legacyDocs.push({ doc_type: 'dok_bpkb', filename: detail.value.dok_bpkb, original_name: detail.value.dok_bpkb })
      if (detail.value?.dok_keur) legacyDocs.push({ doc_type: 'dok_keur', filename: detail.value.dok_keur, original_name: detail.value.dok_keur })
      if (detail.value?.dok_uji_emisi) legacyDocs.push({ doc_type: 'dok_uji_emisi', filename: detail.value.dok_uji_emisi, original_name: detail.value.dok_uji_emisi })
      if (detail.value?.dok_lain) legacyDocs.push({ doc_type: 'dok_lain', filename: detail.value.dok_lain, original_name: detail.value.dok_lain })
      docs.value = legacyDocs
    }
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Gagal memuat detail data truck.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>
