<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Data Transport: Data Chasis">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Edit Data Chasis
          </div>
          <RouterLink
            to="/data-transport/data-chasis"
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
          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">Identitas Chasis</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chasis No <span class="text-red-500">*</span></label>
                <input
                  v-model="form.chasis_no"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                  readonly
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset No</label>
                <input v-model="form.asset_no" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maker/Merk</label>
                <input v-model="form.maker_merk" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <input v-model="form.type" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <input v-model="form.year" type="text" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
                <select v-model="form.size" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">-Pilih-</option>
                  <option value="20 Feet">20 Feet</option>
                  <option value="40 Feet">40 Feet</option>
                </select>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">Keur Chassis</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Berlaku Keur Chassis</label>
                <VueDatePicker v-model="form.masa_berlaku_keur_chassis" :enable-time-picker="false" format="dd/MM/yyyy" model-type="yyyy-MM-dd" auto-apply :teleport="true" :input-class-name="getDateInputClass(form.masa_berlaku_keur_chassis)" :dark="isDarkMode" />
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
            <textarea v-model="form.keterangan" rows="3" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>

          <div class="mb-6">
            <h4 class="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 border-b pb-2">Dokumen</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keur</label>
                <div class="flex items-center gap-3">
                  <label for="edit-chasis-dok-keur" class="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    Pilih File
                  </label>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ selectedFiles.dok_keur.length ? selectedFiles.dok_keur.map(file => file.name).join(', ') : 'Belum dipilih' }}
                  </span>
                </div>
                <input id="edit-chasis-dok-keur" type="file" class="sr-only" @change="handleFileChange($event, 'dok_keur')" multiple />
                <div v-if="docsByType('dok_keur').length" class="mt-2 space-y-1">
                  <div v-for="doc in docsByType('dok_keur')" :key="doc.filename" class="flex items-center justify-between gap-2">
                    <a :href="docUrl(doc.filename)" target="_blank" class="text-xs text-brand-600 hover:underline dark:text-brand-400">
                      {{ docName(doc) }}
                    </a>
                    <button type="button" class="text-xs text-error-600 hover:underline dark:text-error-400" @click="handleDeleteDocument(doc)">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-8 flex items-center justify-center">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-green-200 px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                :disabled="uploadingDocs"
                @click="handleUploadDocuments"
              >
                {{ uploadingDocs ? 'Mengunggah...' : 'Upload Dokumen' }}
              </button>
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

const currentPageTitle = 'Edit Data Chasis'
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { confirm } = useDialog()
const { isDarkMode } = useTheme()
const loading = ref(true)
const isSubmitting = ref(false)
const formError = ref('')
const uploadingDocs = ref(false)
const selectedFiles = reactive({
  dok_keur: [],
})
const docs = ref([])

const errors = reactive({
  chasis_no: '',
})

const form = reactive({
  chasis_no: '',
  maker_merk: '',
  type: '',
  year: '',
  asset_no: '',
  size: '',
  masa_berlaku_keur_chassis: '',
  keterangan: '',
})

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
    return 'bg-error-50 text-error-700 border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20'
  }
  if (diffDays <= 30) {
    return 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20'
  }
  return 'bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20'
}

const getDateInputClass = (dateValue) => {
  const statusClass = getDateStatusClass(dateValue)
  return statusClass ? `${baseDateInputClass} ${statusClass}` : baseDateInputClass
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

const docUrl = (filename) => `${API_ORIGIN}/doc-data-chasis/${filename}`

const docName = (doc) => doc?.original_name || doc?.filename || ''

const docsByType = (type) => {
  return docs.value.filter((doc) => doc.doc_type === type)
}

const handleFileChange = (event, key) => {
  const files = event.target.files ? Array.from(event.target.files) : []
  selectedFiles[key] = files
}

const handleUploadDocuments = async () => {
  if (!form.chasis_no) {
    toast.warning('Chasis No wajib diisi.')
    return
  }
  const files = Object.values(selectedFiles).flat().filter(Boolean)
  if (files.length === 0) {
    toast.warning('Pilih dokumen terlebih dahulu.')
    return
  }
  if (selectedFiles.dok_keur.length > 3) {
    toast.warning('Maksimal 3 file per kolom.')
    return
  }
  const maxSize = 2 * 1024 * 1024
  if (files.some((file) => file.size > maxSize)) {
    toast.warning('Ukuran Maksimal adalah 2MB')
    return
  }

  const formData = new FormData()
  selectedFiles.dok_keur.forEach((file) => {
    formData.append('dok_keur', file)
  })

  uploadingDocs.value = true
  try {
    const response = await fetch(`${API_BASE}/data-chasis/by-chasis-no/${form.chasis_no}/documents`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Upload gagal')
    }
    const updated = await response.json()
    docs.value = Array.isArray(updated.dokumen) ? updated.dokumen : docs.value
    selectedFiles.dok_keur = []
    toast.success('Dokumen berhasil diunggah')
  } catch (error) {
    toast.error(error.message)
  } finally {
    uploadingDocs.value = false
  }
}

const handleDeleteDocument = async (doc) => {
  if (!doc?.filename) return
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message: 'Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) {
    return
  }
  try {
    const response = await fetch(`${API_BASE}/data-chasis/by-chasis-no/${form.chasis_no}/documents/${doc.filename}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal menghapus dokumen')
    }
    const updated = await response.json()
    docs.value = Array.isArray(updated.dokumen) ? updated.dokumen : []
    toast.success('Dokumen berhasil dihapus')
  } catch (error) {
    toast.error(error.message)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE}/data-chasis/${route.params.id}`)
    if (!response.ok) throw new Error('Failed to load data')
    const item = await response.json()

    Object.keys(form).forEach((key) => {
      if (key === 'masa_berlaku_keur_chassis') {
        form[key] = item[key] ? formatDateForInput(item[key]) : ''
      } else {
        form[key] = item[key] || ''
      }
    })
    if (Array.isArray(item.dokumen)) {
      docs.value = item.dokumen
    } else if (item.dok_keur) {
      docs.value = [{ doc_type: 'dok_keur', filename: item.dok_keur, original_name: item.dok_keur }]
    } else {
      docs.value = []
    }
  } catch (error) {
    formError.value = error.message
    toast.error('Failed to load data')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  errors.chasis_no = ''
  if (!form.chasis_no) {
    errors.chasis_no = 'Chasis No wajib diisi.'
    toast.warning('Periksa input Anda')
    return
  }
  if (isSubmitting.value) return
  isSubmitting.value = true
  formError.value = ''

  try {
    const response = await fetch(`${API_BASE}/data-chasis/${route.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })

    if (!response.ok) {
      const json = await response.json()
      throw new Error(json.message || 'Failed to update')
    }

    toast.success('Data berhasil diperbarui')
    router.push('/data-transport/data-chasis')
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
