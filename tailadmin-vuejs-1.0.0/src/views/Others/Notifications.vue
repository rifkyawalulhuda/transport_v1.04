<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <ComponentCard title="Notifications">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Total: {{ notifications.length }} notifikasi
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

      <div class="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <ul class="divide-y divide-gray-100 dark:divide-gray-800">
          <li
            v-for="item in notifications"
            :key="item._id"
            class="flex gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
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
            <div class="relative h-10 w-10 shrink-0">
              <img
                :src="item.avatarUrl"
                alt="Avatar"
                class="h-10 w-10 rounded-full object-cover"
              />
              <span
                v-if="!item.read"
                class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-brand-500 dark:border-gray-900"
              ></span>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ item.title }}
                </p>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.timeAgo }}</span>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
              </div>
            </div>
          </li>
          <li
            v-if="!notifications.length"
            class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            Belum ada notifikasi
          </li>
        </ul>
      </div>
    </ComponentCard>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { API_ORIGIN } from '@/config/api'
import { useToast } from '@/composables/useToast'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthUser } from '@/services/auth'

const currentPageTitle = 'Notifications'
const toast = useToast()
const router = useRouter()
const authUser = useAuthUser()

const {
  notifications: rawNotifications,
  fetchNotifications,
  markRead,
  markAllRead,
  deleteMany,
  deleteAll
} = useNotifications()

const apiBase = API_ORIGIN

const formatTimeAgo = (dateValue) => {
  if (!dateValue) {
    return ''
  }
  const date = new Date(dateValue)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) {
    return `${diff}s ago`
  }
  const minutes = Math.floor(diff / 60)
  if (minutes < 60) {
    return `${minutes} min ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hours ago`
  }
  const days = Math.floor(hours / 24)
  if (days === 1) {
    return 'yesterday'
  }
  return `${days} days ago`
}

const displayNotifications = computed(() =>
  rawNotifications.value.map((item) => ({
    ...item,
    avatarUrl: item.actor?.gambar ? `${apiBase}/img/${item.actor.gambar}` : '/images/user/default.jpg',
    timeAgo: formatTimeAgo(item.createdAt)
  }))
)

const resolveRoute = (notification) => {
  if (notification.meta?.route) {
    return notification.meta.route
  }
  const map = {
    sales_cost: '/sales-cost',
    subcontractor: '/subcontractor',
    truck: '/master/trucks',
    driver: '/master/drivers',
    customer: '/master/customers',
    area: '/master/areas',
    warehouse: '/master/warehouses',
    subcont: '/master/subconts',
    admin: '/master/admins',
    repair: '/repair'
  }
  return map[notification.entity] || '/'
}

const isMasterEntity = (entity) =>
  ['truck', 'driver', 'customer', 'area', 'warehouse', 'subcont', 'admin'].includes(entity)

const handleOpen = async (item) => {
  try {
    await markRead(item._id)
  } catch (error) {
    toast.error(error?.message || 'Gagal memperbarui notifikasi.')
  }
  if (isMasterEntity(item.entity) && authUser.value?.level === 'user') {
    toast.error('Anda tidak memiliki akses ke Master data.')
    return
  }
  const target = resolveRoute(item)
  if (target) {
    router.push(target)
  }
}

const handleMarkAll = async () => {
  try {
    await markAllRead()
  } catch (error) {
    toast.error(error?.message || 'Gagal menandai semua notifikasi.')
  }
}

const selectedMap = ref({})
const selectedIds = computed(() => Object.keys(selectedMap.value))
const allSelected = computed(
  () => notifications.value.length > 0 && selectedIds.value.length === notifications.value.length
)

const toggleSelected = (id) => {
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
  const next = {}
  notifications.value.forEach((item) => {
    next[item._id] = true
  })
  selectedMap.value = next
}

const handleDeleteSelected = async () => {
  try {
    await deleteMany(selectedIds.value)
    selectedMap.value = {}
  } catch (error) {
    toast.error(error?.message || 'Gagal menghapus notifikasi.')
  }
}

const handleDeleteAll = async () => {
  try {
    await deleteAll()
    selectedMap.value = {}
  } catch (error) {
    toast.error(error?.message || 'Gagal menghapus notifikasi.')
  }
}

const notifications = computed(() => displayNotifications.value)

onMounted(async () => {
  try {
    await fetchNotifications({ limit: 50 })
  } catch (error) {
    toast.error(error?.message || 'Gagal memuat notifikasi.')
  }
})

watch(notifications, (items) => {
  const ids = new Set(items.map((item) => item._id))
  Object.keys(selectedMap.value).forEach((id) => {
    if (!ids.has(id)) {
      delete selectedMap.value[id]
    }
  })
})
</script>
