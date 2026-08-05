<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Transaksi Sub Contractor">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Edit Transaksi
          </div>
          <RouterLink
            to="/subcontractor"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <SubcontractorForm
          mode="edit"
          submit-label="Simpan"
          :initial-data="initialData"
          :loading="loading"
          :submitting="isSubmitting"
          :submit-error="formError"
          @submit="handleSubmit"
        />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SubcontractorForm from '@/components/subcontractor/SubcontractorForm.vue'
import { subcontractorService } from '@/services/subcontractorService'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const currentPageTitle = ref('Edit Sub Contractor')
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const isSubmitting = ref(false)
const formError = ref('')
const initialData = ref<Record<string, unknown>>({})
const { confirm } = useDialog()
const toast = useToast()

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
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
    const detail = await subcontractorService.fetchSubcontractorById(idParam)
    initialData.value = detail
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat detail transaksi. Silakan coba lagi.'
    formError.value = message
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: Record<string, unknown>) => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID transaksi tidak ditemukan.'
    return
  }
  if (isSubmitting.value) {
    return
  }

  const ok = await confirm({
    title: 'Konfirmasi Perubahan',
    message: 'Simpan perubahan pada data ini?',
    confirmText: 'Ya, simpan',
    cancelText: 'Batal',
    variant: 'warning'
  })
  if (!ok) {
    return
  }

  formError.value = ''
  isSubmitting.value = true
  try {
    await subcontractorService.updateSubcontractor(idParam, payload)
    // save DN items (non-blocking)
    const dnItems = payload._dnItems
    if (Array.isArray(dnItems)) {
      try {
        await subcontractorService.saveDNList(Number(idParam), dnItems)
      } catch {
        toast.warning('Data DN gagal disimpan, data utama tersimpan.')
      }
    }
    toast.success('Perubahan berhasil disimpan')
    router.push('/subcontractor')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui transaksi'
    formError.value = message
    const status = (error as { status?: number }).status
    if (status === 400 || status === 422) {
      toast.warning('Periksa input Anda')
    } else {
      toast.error(message)
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>
