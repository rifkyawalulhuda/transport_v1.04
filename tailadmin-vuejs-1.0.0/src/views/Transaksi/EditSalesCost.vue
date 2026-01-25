<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Transaksi Sales & Cost">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Edit Transaksi
          </div>
          <div class="flex items-center gap-2">
            <RouterLink
              v-if="printLink"
              :to="printLink"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Cetak
            </RouterLink>
            <RouterLink
              to="/sales-cost"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Kembali
            </RouterLink>
          </div>
        </div>

        <p
          v-if="isReadOnly"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          Data tidak dapat diedit karena sudah melewati bulan transaksi.
        </p>

        <SalesCostForm
          mode="edit"
          submit-label="Simpan"
          :initial-data="initialData"
          :loading="loading"
          :submitting="isSubmitting"
          :submit-error="formError"
          :read-only="isReadOnly"
          @submit="handleSubmit"
        />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SalesCostForm from '@/components/sales-cost/SalesCostForm.vue'
import { salesCostService } from '@/services/salesCostService'
import { addressBookService } from '@/services/addressBookService'
import { authService } from '@/services/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const currentPageTitle = ref('Edit Sales Cost')
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const isSubmitting = ref(false)
const formError = ref('')
const initialData = ref<Record<string, unknown>>({})
const { confirm } = useDialog()
const toast = useToast()
const user = ref(authService.getUser())

const isAdmin = computed(() => user.value?.level === 'admin')

const deliveryDate = computed(() => {
  const value = initialData.value?.delivery_order
  if (!value || typeof value !== 'string') {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
})

const isLockedByMonth = computed(() => {
  if (!deliveryDate.value) {
    return false
  }
  const now = new Date()
  const deliveryYear = deliveryDate.value.getFullYear()
  const deliveryMonth = deliveryDate.value.getMonth()
  if (now.getFullYear() > deliveryYear) {
    return true
  }
  if (now.getFullYear() === deliveryYear && now.getMonth() > deliveryMonth) {
    return true
  }
  return false
})

const isReadOnly = computed(() => !isAdmin.value && isLockedByMonth.value)

const upsertAddressBook = async (dnItems: Array<Record<string, unknown>>) => {
  const unique = new Set<string>()
  dnItems.forEach((item) => {
    const pickup = typeof item.pickup_alamat === 'string' ? item.pickup_alamat.trim() : ''
    const drop = typeof item.drop_alamat === 'string' ? item.drop_alamat.trim() : ''
    if (pickup.length >= 5) {
      unique.add(pickup)
    }
    if (drop.length >= 5) {
      unique.add(drop)
    }
  })
  const tasks = Array.from(unique).map((address) =>
    addressBookService.upsert(address).catch(() => null)
  )
  await Promise.all(tasks)
}

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const printLink = computed(() => {
  const idParam = resolveIdParam()
  return idParam ? `/sales-cost/${idParam}/print` : ''
})

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }

  loading.value = true
  try {
    const [detail, dnResponse] = await Promise.all([
      salesCostService.fetchSalesCostById(idParam),
      salesCostService.fetchDNList(idParam).catch(() => ({ items: [] }))
    ])
    // Backend returns { items: [...] } for DN list
    // If catch block triggered, we use { items: [] }
    // So we safely access .items property
    const items = dnResponse?.items || []
    initialData.value = { ...detail, dnItems: items }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat detail transaksi. Silakan coba lagi.'
    formError.value = message
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: Record<string, unknown>) => {
  if (isReadOnly.value) {
    formError.value = 'Data terkunci. Tidak bisa diedit.'
    return
  }
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
    const { dnItems, ...mysqlPayload } = payload
    await salesCostService.updateSalesCost(idParam, mysqlPayload)
    
    if (Array.isArray(dnItems)) {
      await salesCostService.saveDNList(idParam, dnItems)
      try {
        await upsertAddressBook(dnItems)
      } catch (error) {
        console.error(error)
      }
    }

    toast.success('Perubahan berhasil disimpan')
    router.push('/sales-cost')
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
