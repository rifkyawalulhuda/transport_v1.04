<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />
    <div class="space-y-5 sm:space-y-6">

      <!-- -- Filter Section ----------------------------------------- -->
      <ComponentCard title="Filter &amp; Pencarian">
        <form class="space-y-4" @submit.prevent="applyFilter">
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kata Kunci
              </label>
              <input
                v-model="filters.search"
                type="text"
                placeholder="No. Polisi / Rute / Pesan..."
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Status
              </label>
              <select
                v-model="filters.status"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="">Semua</option>
                <option value="unread">Belum Baca</option>
                <option value="read">Sudah Baca</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <button
                type="submit"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              >
                Tampilkan
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @click="resetFilter"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </ComponentCard>

      <!-- -- Table Section ------------------------------------------ -->
      <ComponentCard title="Notifikasi Pengiriman">
        <!-- Toolbar -->
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span class="font-semibold text-gray-700 dark:text-gray-200">{{ meta.totalItems }}</span>
            notifikasi
            <span v-if="meta.unreadCount > 0" class="text-amber-600 dark:text-amber-400">
              (<span class="font-semibold">{{ meta.unreadCount }}</span> belum dibaca)
            </span>
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-brand-500/10"
              :disabled="loading || meta.unreadCount === 0"
              @click="handleMarkAllRead"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Tandai Semua Dibaca
            </button>
            <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
            <select
              v-model.number="pageSize"
              class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @change="changePageSize"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
          <div
            v-for="n in 3"
            :key="n"
            class="animate-pulse rounded-xl border border-gray-200 p-5 dark:border-gray-700"
          >
            <div class="mb-3 h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="mb-2 h-3 w-80 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 w-64 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="rows.length === 0"
          class="flex flex-col items-center gap-2 py-12 text-center"
        >
          <svg
            class="h-12 w-12 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          <p class="text-sm text-gray-500 dark:text-gray-400">Tidak ada notifikasi.</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/50">
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  No. Polisi
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Rute
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Estimasi
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Waktu Notif
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-transparent">
              <tr
                v-for="row in rows"
                :key="row.id"
                class="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                :class="{ 'bg-amber-50/40 dark:bg-amber-500/5': !row.is_read }"
              >
                <!-- No. Polisi + step -->
                <td class="px-4 py-3">
                  <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {{ row.truck_plate || '-' }}
                  </div>
                  <div v-if="row.step_name" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ row.step_name }}
                  </div>
                </td>

                <!-- Rute -->
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {{ row.route_name || '-' }}
                </td>

                <!-- Estimasi -->
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {{ formatDateTime(row.scheduled_arrival) }}
                </td>

                <!-- Waktu Notif -->
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatTimeAgo(row.created_at) }}
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <span
                    v-if="!row.is_read"
                    class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  >
                    Belum Baca
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300"
                  >
                    Sudah Baca
                  </span>
                </td>

                <!-- Aksi -->
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Lihat SPK"
                      class="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                      @click="handleViewSpk(row)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      v-if="!row.is_read"
                      type="button"
                      title="Tandai Dibaca"
                      class="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition hover:bg-green-50 hover:text-green-600 dark:text-gray-400 dark:hover:bg-green-500/10 dark:hover:text-green-400"
                      @click="handleMarkRead(row)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Hapus Notifikasi"
                      class="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      @click="handleDismiss(row)"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/30"
        >
          <div>
            Halaman
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ currentPage }}</span>
            dari
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ meta.totalPages }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="loading || currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              &larr; Sebelumnya
            </button>
            <button
              type="button"
              class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="loading || currentPage >= meta.totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Berikutnya &rarr;
            </button>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
// @ts-ignore - service is plain JS
import { deliveryNotificationService } from '@/services/deliveryNotificationService'
import { useToast } from '@/composables/useToast'

type DeliveryNotificationRow = {
  id: number
  id_sales_cost: number
  id_sc_stop: number | null
  step_name: string | null
  notification_type: string
  truck_plate: string
  route_name: string | null
  scheduled_arrival: string | null
  message: string
  is_read: 0 | 1
  read_at: string | null
  created_at: string
}

const pageTitle = 'Notifikasi Pengiriman'
const router = useRouter()
const toast = useToast()

const rows = ref<DeliveryNotificationRow[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const pageSizeOptions = [10, 20, 50, 100]

const meta = reactive({
  totalItems: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  unreadCount: 0
})

const filters = reactive({
  search: '',
  status: ''
})

const fetchNotifications = async () => {
  loading.value = true
  try {
    const data = await deliveryNotificationService.fetchList({
      status: filters.status,
      search: filters.search.trim(),
      page: currentPage.value,
      pageSize: pageSize.value
    })
    rows.value = data.rows || []
    meta.totalItems = data.meta.totalItems
    meta.totalPages = data.meta.totalPages
    meta.page = data.meta.page
    meta.pageSize = data.meta.pageSize
    meta.unreadCount = data.meta.unread_count
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat notifikasi.')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  currentPage.value = 1
  void fetchNotifications()
}

const resetFilter = () => {
  filters.search = ''
  filters.status = ''
  currentPage.value = 1
  void fetchNotifications()
}

const goToPage = (p: number) => {
  if (p >= 1 && p <= meta.totalPages) {
    currentPage.value = p
    void fetchNotifications()
  }
}

const changePageSize = () => {
  currentPage.value = 1
  void fetchNotifications()
}

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const formatTimeAgo = (value: string | null | undefined): string => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 0) return 'baru saja'
  if (diff < 60) return `${diff} dtk lalu`
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'kemarin'
  return `${days} hari lalu`
}

const handleViewSpk = (row: DeliveryNotificationRow) => {
  if (!row.id_sales_cost) return
  router.push(`/sales-cost/${row.id_sales_cost}`)
}

const handleMarkRead = async (row: DeliveryNotificationRow) => {
  try {
    await deliveryNotificationService.markRead(row.id)
    row.is_read = 1
    meta.unreadCount = Math.max(0, meta.unreadCount - 1)
  } catch (error: any) {
    toast.error(error?.message || 'Gagal menandai notifikasi.')
  }
}

const handleDismiss = async (row: DeliveryNotificationRow) => {
  try {
    await deliveryNotificationService.dismiss(row.id)
    rows.value = rows.value.filter((r) => r.id !== row.id)
    if (!row.is_read) meta.unreadCount = Math.max(0, meta.unreadCount - 1)
    meta.totalItems = Math.max(0, meta.totalItems - 1)
  } catch (error: any) {
    toast.error(error?.message || 'Gagal menghapus notifikasi.')
  }
}

const handleMarkAllRead = async () => {
  try {
    await deliveryNotificationService.markAllRead()
    void fetchNotifications()
  } catch (error: any) {
    toast.error(error?.message || 'Gagal menandai semua notifikasi.')
  }
}

onMounted(() => {
  void fetchNotifications()
})
</script>
