<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
      :disabled="!isAvailable"
      @click="openModal"
    >
      Import Data
    </button>
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
      :disabled="!isAvailable"
      @click="downloadTemplate"
    >
      Template Data
    </button>
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
      :disabled="!hasExport"
      @click="downloadExport"
    >
      Export Data
    </button>

    <div v-if="isOpen" class="fixed inset-0 z-99999 flex items-center justify-center p-4">
      <div
        class="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[2px]"
        aria-hidden="true"
        @click="closeModal"
      ></div>
      <div
        class="relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Import Data {{ configLabel }}
          </h3>
          <button
            type="button"
            class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300"
            @click="closeModal"
          >
            Tutup
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Pilih File
            </label>
            <input
              ref="fileInputRef"
              type="file"
              :accept="acceptList"
              class="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-600 dark:text-gray-200"
              @change="onFileChange"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Format: {{ acceptList }} (maks {{ maxSizeLabel }} MB)
            </p>
          </div>

          <div
            v-if="errorMessage"
            class="rounded-md border border-error-200 bg-error-50 p-2 text-xs text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
          >
            <p>
              {{ errorMessage }}
              <span v-if="errorDetails?.status"> (HTTP {{ errorDetails.status }})</span>
            </p>
            <ul
              v-if="errorDetails?.errors && errorDetails.errors.length"
              class="mt-2 list-disc space-y-1 pl-5"
            >
              <li v-for="(err, index) in errorDetails.errors" :key="index">
                {{ formatError(err) }}
              </li>
            </ul>
          </div>

          <div v-if="result" class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <p class="font-semibold">
              {{ result.success ? 'Import berhasil.' : 'Import selesai dengan error.' }}
            </p>
            <p v-if="result.inserted !== null">
              Berhasil: {{ result.inserted }} baris
            </p>
            <p v-if="result.updated !== null && result.updated !== undefined">
              Diperbarui: {{ result.updated }} baris
            </p>
            <p v-if="result.failed !== null">
              Gagal: {{ result.failed }} baris
            </p>
            <p v-if="result.message">
              {{ result.message }}
            </p>
            <ul v-if="result.errors && result.errors.length" class="mt-2 list-disc space-y-1 pl-5">
              <li v-for="(err, index) in result.errors" :key="index">
                {{ formatError(err) }}
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            Batal
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
            :disabled="isSubmitting"
            @click="submitImport"
          >
            {{ isSubmitting ? 'Mengimpor...' : 'Import' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { masterImportService } from '@/services/masterImportService'

type ImportError = { row?: number; field?: string; message?: string } | string

type ImportResult = {
  success: boolean
  inserted: number | null
  updated?: number | null
  failed: number | null
  errors?: ImportError[]
  message?: string
}

type Props = {
  masterType: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: 'imported', result: ImportResult): void
}>()

const isOpen = ref(false)
const isSubmitting = ref(false)
const selectedFile = ref<File | null>(null)
const errorMessage = ref('')
const errorDetails = ref<{ status?: number; errors?: ImportError[]; raw?: string } | null>(null)
const result = ref<ImportResult | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const config = computed(() => masterImportService.getConfig(props.masterType))
const isAvailable = computed(() => Boolean(config.value) && config.value.enabled !== false)
const hasExport = computed(
  () => Boolean(config.value?.exportUrl) && config.value?.enabled !== false
)
const configLabel = computed(() => config.value?.label || 'Master')
const acceptList = computed(() => (config.value?.accept || ['.xls']).join(','))
const maxSizeMb = computed(() => config.value?.maxSizeMB || 2)
const maxSizeLabel = computed(() => maxSizeMb.value.toString())

const openModal = () => {
  if (!isAvailable.value) {
    errorMessage.value = 'Import belum tersedia.'
    return
  }
  isOpen.value = true
  result.value = null
  errorMessage.value = ''
  errorDetails.value = null
}

const closeModal = () => {
  isOpen.value = false
  selectedFile.value = null
  errorMessage.value = ''
  errorDetails.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const downloadTemplate = () => {
  if (!isAvailable.value) {
    errorMessage.value = 'Template belum tersedia.'
    return
  }
  masterImportService.downloadTemplate(props.masterType)
}

const downloadExport = () => {
  if (!hasExport.value) {
    errorMessage.value = 'Export belum tersedia.'
    return
  }
  masterImportService.downloadExport(props.masterType)
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
  errorMessage.value = ''
  errorDetails.value = null
  result.value = null
}

const validateFile = () => {
  if (!selectedFile.value) {
    errorMessage.value = 'Silakan pilih file terlebih dahulu.'
    errorDetails.value = null
    return false
  }
  const file = selectedFile.value
  const allowed = config.value?.accept || ['.xls']
  const lowerName = file.name.toLowerCase()
  const isAllowed = allowed.some((ext) => lowerName.endsWith(ext))
  if (!isAllowed) {
    errorMessage.value = `Format file harus ${allowed.join(', ')}.`
    errorDetails.value = null
    return false
  }
  const maxBytes = maxSizeMb.value * 1024 * 1024
  if (file.size > maxBytes) {
    errorMessage.value = `Ukuran file maksimal ${maxSizeMb.value} MB.`
    errorDetails.value = null
    return false
  }
  return true
}

const submitImport = async () => {
  if (!validateFile()) {
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  errorDetails.value = null
  result.value = null

  try {
    const data = await masterImportService.importData(props.masterType, selectedFile.value as File)
    const normalized: ImportResult = {
      success: data?.success !== false,
      inserted: typeof data?.inserted === 'number' ? data.inserted : null,
      updated: typeof data?.updated === 'number' ? data.updated : null,
      failed: typeof data?.failed === 'number' ? data.failed : null,
      errors: Array.isArray(data?.errors) ? data.errors : [],
      message: data?.message
    }
    result.value = normalized
    if (normalized.success) {
      emit('imported', normalized)
    }
  } catch (error: unknown) {
    console.error('Import gagal', {
      masterType: props.masterType,
      error
    })
    const errorData = error as { status?: number; data?: unknown; raw?: string; message?: string }
    const message = error instanceof Error ? error.message : 'Gagal mengimpor data.'
    const status = typeof errorData.status === 'number' ? errorData.status : undefined
    const data = errorData.data
    const dataObj = data && typeof data === 'object' ? (data as { errors?: ImportError[] }) : null
    const errors = Array.isArray(dataObj?.errors) ? dataObj?.errors : undefined
    errorMessage.value = message
    errorDetails.value = {
      status,
      errors,
      raw: typeof errorData.raw === 'string' ? errorData.raw : undefined
    }
  } finally {
    isSubmitting.value = false
  }
}

const formatError = (error: ImportError) => {
  if (typeof error === 'string') {
    return error
  }
  const rowText = error.row ? `Baris ${error.row}` : 'Baris tidak diketahui'
  const fieldText = error.field ? ` (${error.field})` : ''
  const message = error.message || 'Data tidak valid.'
  return `${rowText}${fieldText}: ${message}`
}
</script>
