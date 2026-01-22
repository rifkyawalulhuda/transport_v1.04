<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Data Transport: Data Truck">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Tambah Data Truck
          </div>
          <RouterLink
            to="/data-transport/data-truck"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <div v-if="formError" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-300">
          {{ formError }}
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Section 1: Identitas Kendaraan -->
          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">Identitas Kendaraan</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Truck No <span class="text-red-500">*</span></label>
                <SearchableSelect
                  v-model="form.truck_no"
                  :options="truckOptions"
                  value-key="no_police"
                  :label-formatter="formatTruckLabel"
                  :search-keys="['no_police', 'jenis_kendaraan']"
                  placeholder="-Pilih-"
                  search-placeholder="Cari no polisi atau jenis kendaraan"
                  :async-search="asyncSearchTrucks"
                />
                <p v-if="errors.truck_no" class="mt-1 text-xs text-error-600">
                  {{ errors.truck_no }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No Asset</label>
                <input v-model="form.no_asset" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Merk</label>
                <input v-model="form.merk" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <input v-model="form.type" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                <input v-model="form.model" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun Pembuatan</label>
                <input v-model="form.tahun_pembuatan" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Isi Silinder (cc)</label>
                <input v-model="form.isi_silinder" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Rangka</label>
                <input v-model="form.nomor_rangka" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nomor Mesin</label>
                <input v-model="form.nomor_mesin" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          </div>

          <!-- Section 2: Dokumen Legalitas -->
          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">Dokumen Legalitas</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No STNK</label>
                <input v-model="form.no_stnk" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Berlaku STNK</label>
                <VueDatePicker v-model="form.masa_berlaku_stnk" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" input-class-name="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" :dark="isDarkMode" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Berlaku Pajak STNK</label>
                <VueDatePicker v-model="form.masa_berlaku_pajak_stnk" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" input-class-name="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" :dark="isDarkMode" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No BPKB</label>
                <input v-model="form.no_bpkb" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Iuran Aptrindo</label>
                <VueDatePicker v-model="form.iuran_aptrindo" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" input-class-name="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" :dark="isDarkMode" />
              </div>
            </div>
          </div>

          <!-- Section 3: KIR & Uji Emisi -->
          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">KIR & Uji Emisi</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No Keur Head Truck</label>
                <input v-model="form.no_keur_head_truck" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Berlaku Keur</label>
                <VueDatePicker v-model="form.masa_berlaku_keur_head_truck" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" input-class-name="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" :dark="isDarkMode" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Berlaku Uji Emisi</label>
                <VueDatePicker v-model="form.masa_berlaku_uji_emisi" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" input-class-name="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" :dark="isDarkMode" />
              </div>
            </div>
          </div>

          <!-- Section 4: Lainnya -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
            <textarea v-model="form.keterangan" rows="3" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
    <ToastHost />
  </AdminLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useToast } from '@/composables/useToast'
import { API_BASE } from '@/config/api'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import SearchableSelect from '@/components/SearchableSelect.vue'
import { useTheme } from '@/components/layout/ThemeProvider.vue'

const currentPageTitle = 'Input Data Truck'
const router = useRouter()
const toast = useToast()
const { isDarkMode } = useTheme()
const isSubmitting = ref(false)
const formError = ref('')

const errors = reactive({
  truck_no: ''
})

const truckOptions = ref([])

const formatTruckLabel = (truck) => {
  if (!truck) return ''
  return truck.jenis_kendaraan ? `${truck.no_police} - ${truck.jenis_kendaraan}` : truck.no_police
}

const asyncSearchTrucks = async (query) => {
  const trimmed = String(query || '').trim()
  const url = trimmed
    ? `${API_BASE}/data-trucks/search-mysql-trucks?q=${encodeURIComponent(trimmed)}`
    : `${API_BASE}/data-trucks/search-mysql-trucks`

  const response = await fetch(url)
  if (!response.ok) {
    truckOptions.value = []
    return []
  }
  const result = await response.json()
  truckOptions.value = Array.isArray(result) ? result : []
  return truckOptions.value
}

const form = reactive({
  truck_no: '',
  no_asset: '',
  no_stnk: '',
  no_bpkb: '',
  merk: '',
  type: '',
  model: '',
  tahun_pembuatan: '',
  isi_silinder: '',
  nomor_rangka: '',
  nomor_mesin: '',
  iuran_aptrindo: '',
  masa_berlaku_stnk: '',
  masa_berlaku_pajak_stnk: '',
  no_keur_head_truck: '',
  masa_berlaku_keur_head_truck: '',
  masa_berlaku_uji_emisi: '',
  keterangan: '',
})

const handleSubmit = async () => {
  errors.truck_no = ''
  if (!form.truck_no) {
    errors.truck_no = 'Truck No wajib dipilih.'
    toast.warning('Periksa input Anda')
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  formError.value = ''

  try {
    const response = await fetch(`${API_BASE}/data-trucks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    if (!response.ok) {
      const json = await response.json()
      throw new Error(json.message || 'Failed to save')
    }

    toast.success('Data berhasil disimpan')
    router.push('/data-transport/data-truck')
  } catch (error) {
    formError.value = error.message
    toast.error(error.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>
