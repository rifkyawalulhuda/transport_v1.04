<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Transaksi Repair">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Tambah Transaksi
          </div>
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-4 rounded-full px-5 py-3 text-xs font-medium"
              :class="statusBadgeClass"
              @click="toggleStatusMenu"
            >
              <span>{{ statusBadgeLabel }}</span>
              <span class="text-[10px]">▾</span>
            </button>
            <div
              v-if="statusMenuOpen"
              class="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <button
                type="button"
                class="w-full rounded-md px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                @click="setStatusRepair('PROSES')"
              >
                Proses Perbaikan
              </button>
              <button
                type="button"
                class="w-full rounded-md px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                @click="setStatusRepair('SELESAI')"
              >
                Perbaikan Selesai
              </button>
            </div>
          </div>
          <RouterLink
            to="/repair"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <RepairForm
          mode="create"
          submit-label="Simpan"
          v-model:status-repair="statusRepair"
          v-model:tgl-proses="tglProses"
          v-model:tgl-selesai="tglSelesai"
          :submitting="isSubmitting"
          :submit-error="formError"
          @submit="handleSubmit"
        />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import RepairForm from '@/components/repair/RepairForm.vue'
import { repairService } from '@/services/repair'
import { useToast } from '@/composables/useToast'

const currentPageTitle = ref('Input Repair')
const router = useRouter()
const formError = ref('')
const isSubmitting = ref(false)
const toast = useToast()
const statusMenuOpen = ref(false)
const statusRepair = ref<'PROSES' | 'SELESAI'>('PROSES')
const tglProses = ref('')
const tglSelesai = ref<string | null>(null)

const statusBadgeLabel = computed(() =>
  statusRepair.value === 'SELESAI' ? 'Perbaikan Selesai' : 'Proses Perbaikan'
)
const statusBadgeClass = computed(() =>
  statusRepair.value === 'SELESAI'
    ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400'
    : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
)

const toggleStatusMenu = () => {
  statusMenuOpen.value = !statusMenuOpen.value
}

const setStatusRepair = (value: 'PROSES' | 'SELESAI') => {
  statusRepair.value = value
  if (value === 'PROSES') {
    tglSelesai.value = null
  }
  statusMenuOpen.value = false
}

const parseNumber = (value: string) => {
  if (!value) {
    return 0
  }
  const numeric = value.replace(/[^\d]/g, '')
  return numeric ? Number(numeric) : 0
}

const handleSubmit = async (payload: Record<string, any>) => {
  if (isSubmitting.value) {
    return
  }
  formError.value = ''
  isSubmitting.value = true
  try {
    if (statusRepair.value === 'SELESAI' && !tglSelesai.value) {
      toast.error('Tanggal selesai wajib diisi')
      isSubmitting.value = false
      return
    }
    const requestPayload = {
      ...payload,
      biaya_perbaikan: parseNumber(payload.biaya_perbaikan || ''),
      status_repair: statusRepair.value,
      tgl_proses: tglProses.value || undefined,
      tgl_selesai: statusRepair.value === 'SELESAI' ? tglSelesai.value : null
    }
    const created = await repairService.createRepair(requestPayload)
    toast.success('Data berhasil disimpan')
    const id = created?.id_repair
    router.push('/repair')
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
