<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Data Truck">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Detail Data Truck
          </div>
          <RouterLink
            to="/data-transport/data-truck"
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
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masa Berlaku Pajak STNK</label>
                <input
                  type="text"
                  :value="formatDate(detail.masa_berlaku_pajak_stnk)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Masa Berlaku Uji Emisi</label>
                <input
                  type="text"
                  :value="formatDate(detail.masa_berlaku_uji_emisi)"
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
              Keterangan
            </h4>
            <textarea
              rows="3"
              :value="formatText(detail.keterangan)"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              readonly
            ></textarea>
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
import { API_BASE } from '@/config/api'

const currentPageTitle = ref('Detail Data Truck')
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

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID data truck tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  formError.value = ''
  try {
    const response = await fetch(`${API_BASE}/data-trucks/${idParam}`)
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal memuat detail data truck.')
    }
    detail.value = await response.json()
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

