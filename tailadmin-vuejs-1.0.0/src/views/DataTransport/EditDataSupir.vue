<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Data Transport: Data Supir">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Edit Data Supir
          </div>
          <RouterLink
            to="/data-transport/data-supir"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <div v-if="loading" class="text-center py-4 text-gray-500">Loading...</div>
        <div v-else-if="formError" class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-300">
          {{ formError }}
        </div>

        <form v-else @submit.prevent="handleSubmit">
          <!-- Section 1: Identitas Supir -->
          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">Identitas Supir</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Police <span class="text-red-500">*</span></label>
                <input
                  v-model="form.no_polisi"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                  readonly
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIK</label>
                <input v-model="form.nik" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Driver</label>
                <input v-model="display.nama_driver" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" readonly />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Telp</label>
                <input v-model="display.no_telp" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" readonly />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. KTP</label>
                <input v-model="display.no_ktp" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" readonly />
              </div>
              <div class="md:col-span-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat</label>
                <textarea v-model="display.alamat" rows="3" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed" readonly></textarea>
              </div>
            </div>
          </div>

          <!-- Section 2: Lisensi/Sertifikat -->
          <div class="mb-6">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Lisensi/Sertifikat</h4>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @click="addLicenseRow"
              >
                Tambah Lisensi
              </button>
            </div>
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
                      <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr v-for="(row, index) in form.lisensi" :key="index">
                      <td class="px-5 py-3 sm:px-6">
                        <select v-model="row.jenis_lisensi" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                          <option value="">-Pilih-</option>
                          <option v-for="option in lisensiOptions" :key="option" :value="option">
                            {{ option }}
                          </option>
                        </select>
                      </td>
                      <td class="px-5 py-3 sm:px-6">
                        <input v-model="row.nomor" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </td>
                      <td class="px-5 py-3 sm:px-6">
                        <VueDatePicker v-model="row.masa_berlaku" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" :input-class-name="getDateInputClass(row.masa_berlaku)" :dark="isDarkMode" />
                      </td>
                      <td class="px-5 py-3 sm:px-6">
                        <input v-model="row.keterangan" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </td>
                      <td class="px-5 py-3 sm:px-6 max-w-[260px] break-words whitespace-normal">
                        <div class="flex items-center gap-3">
                          <label :for="`edit-supir-doc-${index}`" class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                            Pilih File
                          </label>
                          <span class="text-xs text-gray-500 dark:text-gray-400">
                            {{ row.file?.name || 'Belum dipilih' }}
                          </span>
                        </div>
                        <input :id="`edit-supir-doc-${index}`" type="file" class="sr-only" @change="handleRowFileChange($event, row)" />
                        <div v-if="row.dok_file" class="mt-2 flex items-center justify-between gap-2">
                          <a :href="docUrl(row.dok_file)" target="_blank" class="text-xs text-brand-600 hover:underline dark:text-brand-400">
                            {{ row.dok_original || row.dok_file }}
                          </a>
                          <button type="button" class="text-xs text-error-600 hover:underline dark:text-error-400" @click="handleDeleteRowFile(row)">
                            Hapus
                          </button>
                        </div>
                        <div class="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            :disabled="!row.file"
                            @click="handleUploadRowFile(row)"
                          >
                            {{ row.dok_file ? 'Ganti' : 'Upload' }}
                          </button>
                          <span class="text-xs text-gray-400">Maksimal 1 file</span>
                        </div>
                      </td>
                      <td class="px-5 py-3 text-right sm:px-6 relative">
                        <button
                          type="button"
                          class="relative z-10 pointer-events-auto rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400"
                          @click="removeLicenseRow(index)"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3">
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Menyimpan...' : 'Update' }}
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
    <ToastHost />
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useToast } from '@/composables/useToast'
import { API_BASE, API_ORIGIN } from '@/config/api'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { useTheme } from '@/components/layout/ThemeProvider.vue'
import { useDialog } from '@/composables/useDialog'

const currentPageTitle = 'Edit Data Supir'
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { isDarkMode } = useTheme()
const { confirm } = useDialog()
const loading = ref(true)
const isSubmitting = ref(false)
const formError = ref('')

const form = reactive({
  id_driver: '',
  no_polisi: '',
  nik: '',
  lisensi: [],
})

const display = reactive({
  nama_driver: '',
  no_telp: '',
  no_ktp: '',
  alamat: '',
})

const lisensiOptions = [
  'SIM A',
  'SIM B1 Umum',
  'SIM B2 Umum',
  'SIM C',
  'SIM D',
  'Sertifikat Angkut Barang B3',
  'SIO Forklfit Kelas II',
  'Sertifikat Angkut Barang Khusus',
  'Sertifikat K3 Driver',
  'Sertifikat Lain-lain',
]

const baseDateInputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'

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
    return '!bg-error-50 !text-error-700 !border-error-200 dark:!bg-error-500/10 dark:!text-error-400 dark:!border-error-500/20'
  }
  if (diffDays <= 30) {
    return '!bg-warning-50 !text-warning-700 !border-warning-200 dark:!bg-warning-500/10 dark:!text-warning-400 dark:!border-warning-500/20'
  }
  return '!bg-success-50 !text-success-700 !border-success-200 dark:!bg-success-500/10 dark:!text-success-400 dark:!border-success-500/20'
}

const getDateInputClass = (dateValue) => {
  const statusClass = getDateStatusClass(dateValue)
  return statusClass ? `${baseDateInputClass} ${statusClass}` : baseDateInputClass
}

const addLicenseRow = () => {
  form.lisensi.push({
    jenis_lisensi: '',
    nomor: '',
    masa_berlaku: '',
    keterangan: '',
    dok_file: '',
    dok_original: '',
    file: null,
  })
}

const removeLicenseRow = async (index) => {
  const row = form.lisensi[index]
  if (!row) return
  if (row?.dok_file && row?._id) {
    const ok = await confirm({
      title: 'Konfirmasi Hapus',
      message: 'Hapus lisensi ini beserta dokumennya?',
      confirmText: 'Ya, hapus',
      cancelText: 'Batal',
      variant: 'danger'
    })
    if (!ok) {
      return
    }
    await handleDeleteRowFile(row)
  }
  form.lisensi.splice(index, 1)
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

const normalizeLisensi = (list) => {
  return list
    .filter((item) =>
      item &&
      (item.jenis_lisensi || item.nomor || item.masa_berlaku || item.keterangan)
    )
    .map((item) => ({
      jenis_lisensi: item.jenis_lisensi || '',
      nomor: item.nomor || '',
      masa_berlaku: item.masa_berlaku || null,
      keterangan: item.keterangan || '',
      dok_file: item.dok_file || '',
      dok_original: item.dok_original || '',
    }))
}

const docUrl = (filename) => `${API_ORIGIN}/doc-supir/${filename}`

const handleRowFileChange = (event, row) => {
  const file = event.target.files && event.target.files[0] ? event.target.files[0] : null
  row.file = file
}

const handleUploadRowFile = async (row) => {
  if (!row?._id) {
    toast.info('Dokumen akan diunggah saat Update.')
    return
  }
  if (!row.file) {
    toast.warning('Pilih dokumen terlebih dahulu.')
    return
  }
  if (row.dok_file) {
    const ok = await confirm({
      title: 'Ganti Dokumen',
      message: 'Dokumen lama akan diganti. Lanjutkan?',
      confirmText: 'Ya, ganti',
      cancelText: 'Batal',
      variant: 'warning'
    })
    if (!ok) {
      return
    }
    await handleDeleteRowFile(row)
  }
  const maxSize = 2 * 1024 * 1024
  if (row.file.size > maxSize) {
    toast.warning('Ukuran Maksimal adalah 2MB')
    return
  }

  const formData = new FormData()
  formData.append('dok_file', row.file)
  try {
    const response = await fetch(`${API_BASE}/data-supir/by-id-driver/${form.id_driver}/lisensi/${row._id}/document`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Upload gagal')
    }
    const updated = await response.json()
    const updatedRow = updated?.lisensi?.find((item) => item._id === row._id)
    row.dok_file = updatedRow?.dok_file || row.dok_file
    row.dok_original = updatedRow?.dok_original || row.dok_original
    row.file = null
    toast.success('Dokumen berhasil diunggah')
  } catch (error) {
    toast.error(error.message)
  }
}

const uploadLisensiFile = async (idDriver, lisensiId, row) => {
  if (!row?.file || !lisensiId) return
  const maxSize = 2 * 1024 * 1024
  if (row.file.size > maxSize) {
    toast.warning('Ukuran Maksimal adalah 2MB')
    return
  }
  const formData = new FormData()
  formData.append('dok_file', row.file)
  const response = await fetch(`${API_BASE}/data-supir/by-id-driver/${idDriver}/lisensi/${lisensiId}/document`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    const json = await response.json().catch(() => ({}))
    throw new Error(json.message || 'Upload gagal')
  }
  const updated = await response.json()
  return updated
}

const handleDeleteRowFile = async (row) => {
  if (!row?._id || !row.dok_file) return
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message: 'Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) return
  try {
    const response = await fetch(`${API_BASE}/data-supir/by-id-driver/${form.id_driver}/lisensi/${row._id}/document`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal menghapus dokumen')
    }
    const updated = await response.json()
    const updatedRow = updated?.lisensi?.find((item) => item._id === row._id)
    row.dok_file = updatedRow?.dok_file || ''
    row.dok_original = updatedRow?.dok_original || ''
    toast.success('Dokumen berhasil dihapus')
  } catch (error) {
    toast.error(error.message)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/data-supir/by-id-driver/${route.params.id}`)
    if (!response.ok) throw new Error('Failed to load data')
    const item = await response.json()

    form.id_driver = item.id_driver || ''
    form.no_polisi = item.no_polisi || ''
    form.nik = item.nik || ''
    display.nama_driver = item.nama_driver || ''
    display.no_telp = item.no_telp || ''
    display.no_ktp = item.no_ktp || ''
    display.alamat = item.alamat || ''

    if (Array.isArray(item.lisensi) && item.lisensi.length > 0) {
      form.lisensi = item.lisensi.map((lis) => ({
        _id: lis._id,
        jenis_lisensi: lis.jenis_lisensi || '',
        nomor: lis.nomor || '',
        masa_berlaku: lis.masa_berlaku ? formatDateForInput(lis.masa_berlaku) : '',
        keterangan: lis.keterangan || '',
        dok_file: lis.dok_file || '',
        dok_original: lis.dok_original || '',
        file: null,
      }))
    } else {
      form.lisensi = [
        { jenis_lisensi: '', nomor: '', masa_berlaku: '', keterangan: '', dok_file: '', dok_original: '', file: null },
      ]
    }
  } catch (error) {
    formError.value = error.message
    toast.error('Failed to load data')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.id_driver) {
    toast.warning('Periksa input Anda')
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  formError.value = ''

  try {
    const payload = {
      nik: form.nik,
      lisensi: normalizeLisensi(form.lisensi),
    }
    const response = await fetch(`${API_BASE}/data-supir/by-id-driver/${form.id_driver}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.message || 'Failed to update')
    }

    if (Array.isArray(json.lisensi)) {
      form.lisensi = form.lisensi.map((row, index) => ({
        ...row,
        _id: json.lisensi[index]?._id || row._id,
      }))
    }

    const rowsWithFile = form.lisensi
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.file)

    if (rowsWithFile.length > 0) {
      for (const item of rowsWithFile) {
        const lisensiId = json?.lisensi?.[item.index]?._id || item.row._id
        if (!lisensiId) continue
        const updated = await uploadLisensiFile(form.id_driver, lisensiId, item.row)
        const updatedRow = updated?.lisensi?.find((lis) => lis._id === lisensiId)
        if (updatedRow) {
          item.row.dok_file = updatedRow.dok_file || item.row.dok_file
          item.row.dok_original = updatedRow.dok_original || item.row.dok_original
        }
        item.row.file = null
      }
    }

    toast.success('Data berhasil diperbarui')
    router.push('/data-transport/data-supir')
  } catch (error) {
    formError.value = error.message
    toast.error(error.message)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
