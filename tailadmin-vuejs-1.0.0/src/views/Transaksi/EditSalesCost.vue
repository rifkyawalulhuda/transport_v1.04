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
    <!-- Backfill Geofence Dialog -->
    <div
      v-if="backfillDialog.open"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
    >
      <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h3 class="mb-1 text-base font-semibold text-gray-900 dark:text-white">
          Geofence Tujuan Diubah
        </h3>
        <p v-if="backfillCurrentStop" class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Geofence <strong>{{ backfillCurrentStop.stop_name }}</strong> telah diubah ke
          <strong>{{ backfillCurrentStop.new_zone_name }}</strong>.
          <span v-if="backfillDialog.stops.length > 1">
            ({{ backfillDialog.currentIdx + 1 }} dari {{ backfillDialog.stops.length }})
          </span>
        </p>

        <!-- idle -->
        <template v-if="backfillDialog.status === 'idle'">
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Truk mungkin sudah mengunjungi lokasi ini. Ingin mencari hit GPS aktual dari data Wialon?
          </p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              @click="skipBackfillStop"
            >Lewati</button>
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              @click="runBackfillGps"
            >Cek GPS &amp; Backfill</button>
          </div>
        </template>

        <!-- loading -->
        <template v-else-if="backfillDialog.status === 'loading'">
          <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <svg class="h-5 w-5 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Mencari data GPS Wialon...
          </div>
        </template>

        <!-- found -->
        <template v-else-if="backfillDialog.status === 'found'">
          <p class="mb-4 text-sm text-emerald-700 dark:text-emerald-300">
            <span v-if="backfillDialog.isManualResult">Kunjungan dicatat secara manual:</span>
            <span v-else>Hit GPS ditemukan:</span>
            <strong> {{ backfillDialog.resultGpsTime }}</strong>
          </p>
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              @click="skipBackfillStop"
            >{{ backfillDialog.currentIdx + 1 < backfillDialog.stops.length ? 'Lanjut' : 'Selesai' }}</button>
          </div>
        </template>

        <!-- not_found -->
        <template v-else-if="backfillDialog.status === 'not_found'">
          <p class="mb-3 text-sm text-amber-700 dark:text-amber-300">
            GPS tidak mengkonfirmasi kunjungan ke zone ini. Ingin mencatat kunjungan secara manual?
          </p>
          <div class="mb-4">
            <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Waktu kunjungan manual
            </label>
            <input
              v-model="backfillDialog.manualDateTime"
              type="datetime-local"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              @click="skipBackfillStop"
            >Lewati</button>
            <button
              type="button"
              :disabled="!backfillDialog.manualDateTime"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              @click="runBackfillManual"
            >Simpan Manual</button>
          </div>
        </template>

        <!-- already_hit -->
        <template v-else-if="backfillDialog.status === 'already_hit'">
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Stop ini sudah memiliki catatan kunjungan, tidak perlu backfill.
          </p>
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              @click="skipBackfillStop"
            >{{ backfillDialog.currentIdx + 1 < backfillDialog.stops.length ? 'Lanjut' : 'Selesai' }}</button>
          </div>
        </template>

        <!-- error -->
        <template v-else-if="backfillDialog.status === 'error'">
          <p class="mb-4 text-sm text-red-600 dark:text-red-400">
            {{ backfillDialog.errorMessage }}
          </p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700"
              @click="skipBackfillStop"
            >Lewati</button>
            <button
              type="button"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              @click="runBackfillGps"
            >Coba Lagi</button>
          </div>
        </template>
      </div>
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

// --- Backfill dialog state ---
type BackfillStop = {
  id: number
  stop_name: string
  stop_order: number
  new_zone_name: string
  already_hit: boolean
}
type BackfillStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'already_hit' | 'error' | 'manual_input'
const backfillDialog = ref<{
  open: boolean
  stops: BackfillStop[]
  id_sales_cost: string
  currentIdx: number
  status: BackfillStatus
  resultGpsTime: string | null
  errorMessage: string
  manualDateTime: string
  isManualResult: boolean
}>({
  open: false,
  stops: [],
  id_sales_cost: '',
  currentIdx: 0,
  status: 'idle',
  resultGpsTime: null,
  errorMessage: '',
  manualDateTime: '',
  isManualResult: false
})

const backfillCurrentStop = computed(() =>
  backfillDialog.value.stops[backfillDialog.value.currentIdx] ?? null
)

const closeBackfillDialog = () => {
  backfillDialog.value.open = false
  router.push('/sales-cost')
}

const skipBackfillStop = () => {
  const next = backfillDialog.value.currentIdx + 1
  if (next >= backfillDialog.value.stops.length) {
    closeBackfillDialog()
    return
  }
  backfillDialog.value.currentIdx = next
  backfillDialog.value.status = 'idle'
  backfillDialog.value.resultGpsTime = null
  backfillDialog.value.errorMessage = ''
  backfillDialog.value.manualDateTime = ''
  backfillDialog.value.isManualResult = false
}

const runBackfillGps = async () => {
  const stop = backfillCurrentStop.value
  if (!stop) return
  backfillDialog.value.status = 'loading'
  try {
    const res = await salesCostService.backfillStop(backfillDialog.value.id_sales_cost, stop.id)
    if (res.skipped) {
      backfillDialog.value.status = 'already_hit'
    } else if (res.found) {
      backfillDialog.value.status = 'found'
      backfillDialog.value.resultGpsTime = res.gps_time
      backfillDialog.value.isManualResult = res.manual === true
    } else {
      backfillDialog.value.status = 'not_found'
    }
  } catch (err: unknown) {
    backfillDialog.value.status = 'error'
    backfillDialog.value.errorMessage = err instanceof Error ? err.message : 'Gagal menjalankan backfill'
  }
}

const runBackfillManual = async () => {
  const stop = backfillCurrentStop.value
  if (!stop || !backfillDialog.value.manualDateTime) return
  backfillDialog.value.status = 'loading'
  const formattedTime = backfillDialog.value.manualDateTime.replace('T', ' ') + ':00'
  try {
    const res = await salesCostService.backfillStop(
      backfillDialog.value.id_sales_cost,
      stop.id,
      { manual: true, manual_gps_time: formattedTime }
    )
    if (res.found) {
      backfillDialog.value.status = 'found'
      backfillDialog.value.resultGpsTime = res.gps_time
      backfillDialog.value.isManualResult = true
    } else {
      backfillDialog.value.status = 'error'
      backfillDialog.value.errorMessage = 'Gagal menyimpan kunjungan manual'
    }
  } catch (err: unknown) {
    backfillDialog.value.status = 'error'
    backfillDialog.value.errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan'
  }
}
// --- End backfill dialog state ---

const isAdmin = computed(() => user.value?.level === 'admin')

const deliveryDate = computed(() => {
  const value = initialData.value?.departure_datetime
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
    const updateResult = await salesCostService.updateSalesCost(idParam, mysqlPayload)
    
    if (Array.isArray(dnItems)) {
      await salesCostService.saveDNList(idParam, dnItems)
      try {
        await upsertAddressBook(dnItems)
      } catch (error) {
        console.error(error)
      }
    }

    toast.success('Perubahan berhasil disimpan')

    // Check if any geofence was changed and truck may have visited — offer backfill
    const changedStops: BackfillStop[] = Array.isArray(updateResult?.geofence_changed_stops)
      ? (updateResult.geofence_changed_stops as BackfillStop[]).filter((s: BackfillStop) => !s.already_hit)
      : []

    if (changedStops.length > 0) {
      backfillDialog.value = {
        open: true,
        stops: changedStops,
        id_sales_cost: idParam,
        currentIdx: 0,
        status: 'idle',
        resultGpsTime: null,
        errorMessage: '',
        manualDateTime: '',
        isManualResult: false
      }
      // Don't navigate yet — dialog will call closeBackfillDialog → router.push when done
    } else {
      router.push('/sales-cost')
    }
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
