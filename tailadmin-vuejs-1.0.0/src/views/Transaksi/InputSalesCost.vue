<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Transaksi Sales & Cost">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Halaman Tambah Transaksi
          </div>
          <RouterLink
            to="/sales-cost"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
        </div>

        <SalesCostForm
          mode="create"
          submit-label="Simpan"
          :submitting="isSubmitting"
          :submit-error="formError"
          @submit="handleSubmit"
        >
          <template #pre-submit>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                v-model="printAfterSave"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
              />
              Cetak setelah simpan
            </label>
          </template>
        </SalesCostForm>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SalesCostForm from '@/components/sales-cost/SalesCostForm.vue'
import { salesCostService } from '@/services/salesCostService'
import { addressBookService } from '@/services/addressBookService'
import { useToast } from '@/composables/useToast'

const currentPageTitle = ref('Input Sales Cost')
const router = useRouter()
const formError = ref('')
const isSubmitting = ref(false)
const printAfterSave = ref(true)
const toast = useToast()

const printPreferenceKey = 'salesCost.printAfterSave'
localStorage.setItem(printPreferenceKey, 'true')

watch(printAfterSave, (value) => {
  localStorage.setItem(printPreferenceKey, String(value))
})

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

const handleSubmit = async (payload: Record<string, unknown>) => {
  if (isSubmitting.value) {
    return
  }
  formError.value = ''
  isSubmitting.value = true
  const printWindow = printAfterSave.value ? window.open('', '_blank') : null
  try {
    const { dnItems, ...mysqlPayload } = payload
    const created = await salesCostService.createSalesCost(mysqlPayload)
    const createdId =
      created?.id ??
      created?.id_sales_cost ??
      created?.data?.id_sales_cost ??
      created?.data?.id

    if (createdId && Array.isArray(dnItems)) {
      await salesCostService.saveDNList(createdId, dnItems)
      try {
        await upsertAddressBook(dnItems)
      } catch (error) {
        console.error(error)
      }
    }

    if (printAfterSave.value && createdId) {
      const printUrl = `/sales-cost/${createdId}/print`
      if (printWindow) {
        printWindow.location.href = printUrl
      } else {
        window.open(printUrl, '_blank')
      }
    }

    toast.success('Data berhasil disimpan')
    router.push('/sales-cost')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan transaksi'
    formError.value = message
    const status = (error as { status?: number }).status
    if (status === 400 || status === 422) {
      toast.warning('Periksa input Anda')
    } else {
      toast.error(message)
    }
    if (printWindow && !printWindow.closed) {
      printWindow.close()
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
