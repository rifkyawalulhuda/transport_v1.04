<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Transaksi Sub Contractor">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Tambah Transaksi
          </div>
          <RouterLink
            to="/subcontractor"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <SubcontractorForm
          mode="create"
          submit-label="Simpan"
          :submitting="isSubmitting"
          :submit-error="formError"
          @submit="handleSubmit"
        />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SubcontractorForm from '@/components/subcontractor/SubcontractorForm.vue'
import { subcontractorService } from '@/services/subcontractorService'
import { useToast } from '@/composables/useToast'

const currentPageTitle = ref('Input Sub Contractor')
const router = useRouter()
const formError = ref('')
const isSubmitting = ref(false)
const toast = useToast()

const handleSubmit = async (payload: Record<string, unknown>) => {
  if (isSubmitting.value) {
    return
  }
  formError.value = ''
  isSubmitting.value = true
  try {
    await subcontractorService.createSubcontractor(payload)
    toast.success('Data berhasil disimpan')
    router.push('/subcontractor')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan data'
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
</script>
