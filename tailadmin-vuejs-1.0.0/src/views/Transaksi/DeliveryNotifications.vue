<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <!-- Filter & Pencarian -->
    <ComponentCard title="Filter & Pencarian">
      <form class="space-y-4" @submit.prevent="applyFilter">
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Kata Kunci
            </label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="No. Polisi / Rute..."
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
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Tampilkan
            </button>
            <button
              type="button"
              class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @click="resetFilter"
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </ComponentCard>

    <!-- Daftar Notifikasi -->
    <ComponentCard title="Notifikasi Pengiriman">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Total: {{ meta.totalItems }} notifikasi
          <span v-if="meta.unreadCount > 0" class="ml-2 font-medium text-amber-500">({{ meta.unreadCount }} belum dibaca)</span>
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <label
            v-if="notifications.length"
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              :checked="allSelected"
              @change="toggleSelectAll"
            />
            Pilih semua
          </label>
          <button
            v-if="notifications.length"
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            @click="handleMarkAll"
          >
            Tandai semua
          </button>
          <button
            v-if="selectedIds.length"
            type="button"
            class="rounded-lg border border-error-200 px-3 py-2 text-sm font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-500/40 dark:bg-gray-900 dark:text-error-400"
            @click="handleDeleteSelected"
          >
            Hapus terpilih
          </button>
          <button
            v-if="notifications.length"
            type="button"
            class="rounded-lg border border-error-200 px-3 py-2 text-sm font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-error-500/40 dark:bg-gray-900 dark:text-error-400"
            @click="handleDeleteAll"
          >
            Hapus semua
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mt-4 space-y-3">
        <div v-for="n in 3" :key="n" class="animate-pulse flex gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 w-80 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      <!-- List notifikasi -->
      <div v-else class="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ul class="divide-y divide-gray-100 dark:divide-gray-800">
          <li
            v-for="item in notifications"
            :key="item._id"
            class="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
            :class="{ 'bg-amber-50/40 dark:bg-amber-500/5': !item.read }"
          >
            <div class="pt-1">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                :value="item._id"
                :checked="selectedMap[item._id]"
                @change="toggleSelected(item._id)"
              />
            </div>

            <!-- Avatar: truck icon -->
            <div class="relative h-10 w-10 shrink-0">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full"
                :class="!item.read
                  ? 'bg-amber-100 dark:bg-amber-500/20'
                  : 'bg-gray-100 dark:bg-gray-800'"
              >
                <svg
                  class="h-5 w-5"
                  :class="!item.read
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              </div>
              <span
                v-if="!item.read"
                class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-brand-500 dark:border-gray-900"
              ></span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                  {{ item.title }}
                </p>
                <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">{{ item.timeAgo }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                {{ item.message }}
              </p>
              <div class="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  class="font-medium text-brand-500 hover:text-brand-600"
                  @click="handleOpen(item)"
                >
                  Buka
                </button>
                <span class="h-1 w-1 rounded-full bg-gray-400"></span>
                <span>{{ item.type }}</span>
                <span class="h-1 w-1 rounded-full bg-gray-400"></span>
                <span
                  v-if="!item.read"
                  class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                >Belum Baca</span>
                <span
                  v-else
                  class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                >Sudah Baca</span>
              </div>
            </div>
          </li>
          <li
            v-if="!notifications.length"
            class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            Belum ada notifikasi pengiriman
          </li>
        </ul>
      </div>

      <!-- Pagination -->
      <div
        v-if="notifications.length > 0"
        class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <button
          @click="goToPage(meta.page - 1)"
          :disabled="meta.page <= 1"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
        >
          ← Sebelumnya
        </button>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Halaman {{ meta.page }} dari {{ meta.totalPages }}
        </span>
        <button
          @click="goToPage(meta.page + 1)"
          :disabled="meta.page >= meta.totalPages"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
        >
          Berikutnya →
        </button>
      </div>
    </ComponentCard>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
// @ts-ignore — plain JS service
import { deliveryNotificationService } from '@/services/deliveryNotificationService'
import { useToast } from '@/composables/useToast'

const pageTitle = 'Notifikasi Pengiriman'
const router = useRouter()
const toast = useToast()

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

type NotificationItem = {
  _id: number
  id_sales_cost: number
  title: string
  message: string
  type: string
  read: boolean
  timeAgo: string
}

const rows = ref<DeliveryNotificationRow[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

const meta = reactive({
  totalItems: 0,
  totalPages: 1,
  page: 1,
  unreadCount: 0
})

const filters = reactive({
  search: '',
  status: ''
})

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

const notifications = computed<NotificationItem[]>(() =>
  rows.value.map((item) => ({
    _id: item.id,
    id_sales_cost: item.id_sales_cost,
    title: item.truck_plate + (item.route_name ? ` — ${item.route_name}` : ''),
    message: item.message,
    type: item.notification_type,
    read: item.is_read === 1,
    timeAgo: formatTimeAgo(item.created_at)
  }))
)

// ─── Selection ────────────────────────────────────────────────────────────────

const selectedMap = ref<Record<number, boolean>>({})
const selectedIds = computed(() => Object.keys(selectedMap.value).map(Number))
const allSelected = computed(
  () => notifications.value.length > 0 && selectedIds.value.length === notifications.value.length
)

const toggleSelected = (id: number) => {
  if (selectedMap.value[id]) {
    delete selectedMap.value[id]
  } else {
    selectedMap.value[id] = true
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedMap.value = {}
    return
  }
  const next: Record<number, boolean> = {}
  notifications.value.forEach((item) => {
    next[item._id] = true
  })
  selectedMap.value = next
}

// Clean up selectedMap when notifications change
watch(notifications, (items) => {
  const ids = new Set(items.map((item) => item._id))
  Object.keys(selectedMap.value).forEach((id) => {
    if (!ids.has(Number(id))) {
      delete selectedMap.value[Number(id)]
    }
  })
})

// ─── Data fetching ────────────────────────────────────────────────────────────

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
    meta.unreadCount = data.meta.unread_count
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat notifikasi.')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => { currentPage.value = 1; void fetchNotifications() }
const resetFilter = () => { filters.search = ''; filters.status = ''; currentPage.value = 1; void fetchNotifications() }
const goToPage = (p: number) => {
  if (p >= 1 && p <= meta.totalPages) {
    currentPage.value = p
    void fetchNotifications()
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const handleOpen = async (item: NotificationItem) => {
  try {
    await deliveryNotificationService.markRead(item._id)
  } catch {
    // non-blocking — still navigate
  }
  if (item.id_sales_cost) {
    router.push(`/sales-cost/${item.id_sales_cost}`)
  }
}

const handleMarkAll = async () => {
  try {
    await deliveryNotificationService.markAllRead()
    void fetchNotifications()
  } catch (error: any) {
    toast.error(error?.message || 'Gagal menandai semua notifikasi.')
  }
}

const handleDeleteSelected = async () => {
  try {
    await Promise.all(selectedIds.value.map((id) => deliveryNotificationService.dismiss(id)))
    selectedMap.value = {}
    void fetchNotifications()
  } catch (error: any) {
    toast.error(error?.message || 'Gagal menghapus notifikasi.')
  }
}

const handleDeleteAll = async () => {
  try {
    await Promise.all(rows.value.map((row) => deliveryNotificationService.dismiss(row.id)))
    selectedMap.value = {}
    void fetchNotifications()
  } catch (error: any) {
    toast.error(error?.message || 'Gagal menghapus notifikasi.')
  }
}

onMounted(() => {
  void fetchNotifications()
})
</script>
