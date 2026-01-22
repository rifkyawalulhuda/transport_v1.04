<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Transaksi Repair">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Edit Transaksi
          </div>
          <RouterLink
            to="/repair"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <RepairForm
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
import RepairForm from '@/components/repair/RepairForm.vue'
import { repairService } from '@/services/repair'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const currentPageTitle = ref('Edit Repair')
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

const parseNumber = (value: string) => {
  if (!value) {
    return 0
  }
  const numeric = value.replace(/[^\d]/g, '')
  return numeric ? Number(numeric) : 0
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
    const detail = await repairService.fetchRepairById(idParam)
    initialData.value = detail
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat detail transaksi. Silakan coba lagi.'
    formError.value = message
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: Record<string, string>) => {
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
    const requestPayload = {
      ...payload,
      biaya_perbaikan: parseNumber(payload.biaya_perbaikan || '')
    }
    await repairService.updateRepair(idParam, requestPayload)
    toast.success('Perubahan berhasil disimpan')
    router.push(`/repair/${idParam}`)
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
