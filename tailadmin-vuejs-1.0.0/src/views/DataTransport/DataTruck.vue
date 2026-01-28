<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <!-- Filter Section -->
      <ComponentCard title="Filter & Pencarian">
        <form class="space-y-4" @submit.prevent="applyFilter">
          <div class="grid gap-4 sm:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kolom Pencarian
              </label>
              <select
                v-model="searchColumn"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="all">Semua Kolom</option>
                <option value="truck_no">Truck No</option>
                <option value="merk">Merk</option>
                <option value="type">Type</option>
                <option value="tahun_pembuatan">Tahun</option>
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kata Kunci
              </label>
              <input
                v-model="searchInput"
                type="text"
                placeholder="Cari data truck..."
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
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
            <button
              type="button"
              @click="exportToExcel"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-green-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export to Excel
            </button>
          </div>
        </form>
      </ComponentCard>

      <!-- Data Table Section -->
      <ComponentCard title="Daftar Data Truck">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total: {{ filteredItems.length }} data
          </p>
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
            <select
              v-model.number="pageSize"
              class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @change="changePageSize"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </div>
        </div>

        <div class="overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">No</th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider"
                    @click="toggleSort('truck_no')"
                  >
                    <div class="flex items-center gap-1">
                      Truck No / Asset
                      <span class="flex flex-col">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-colors" :class="sortColumn === 'truck_no' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m18 15-6-6-6 6"/></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-mt-1 transition-colors" :class="sortColumn === 'truck_no' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider"
                    @click="toggleSort('merk')"
                  >
                    <div class="flex items-center gap-1">
                      Merk / Type / Model
                      <span class="flex flex-col">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-colors" :class="sortColumn === 'merk' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m18 15-6-6-6 6"/></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-mt-1 transition-colors" :class="sortColumn === 'merk' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider"
                    @click="toggleSort('tahun_pembuatan')"
                  >
                    <div class="flex items-center gap-1">
                      Tahun / Silinder
                      <span class="flex flex-col">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-colors" :class="sortColumn === 'tahun_pembuatan' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m18 15-6-6-6 6"/></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-mt-1 transition-colors" :class="sortColumn === 'tahun_pembuatan' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider"
                    @click="toggleSort('masa_berlaku_stnk')"
                  >
                    <div class="flex items-center gap-1">
                      Masa Berlaku STNK
                      <span class="flex flex-col">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-colors" :class="sortColumn === 'masa_berlaku_stnk' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m18 15-6-6-6 6"/></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-mt-1 transition-colors" :class="sortColumn === 'masa_berlaku_stnk' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider"
                    @click="toggleSort('masa_berlaku_keur_head_truck')"
                  >
                    <div class="flex items-center gap-1">
                      Masa Berlaku KIR
                      <span class="flex flex-col">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-colors" :class="sortColumn === 'masa_berlaku_keur_head_truck' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m18 15-6-6-6 6"/></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-mt-1 transition-colors" :class="sortColumn === 'masa_berlaku_keur_head_truck' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"><path d="m6 9 6 6 6-6"/></svg>
                      </span>
                    </div>
                  </th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <tr v-if="loading">
                  <td colspan="7" class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6">Loading...</td>
                </tr>
                <tr v-else-if="filteredItems.length === 0">
                  <td colspan="7" class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6">Tidak ada data</td>
                </tr>
                <tr v-else v-for="(item, index) in pagedItems" :key="item._id" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    <div class="font-medium">{{ item.truck_no }}</div>
                    <div class="text-xs text-gray-500">{{ item.no_asset }}</div>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    <div>{{ item.merk }}</div>
                    <div class="text-xs text-gray-500">{{ item.type }} - {{ item.model }}</div>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    <div>{{ item.tahun_pembuatan }}</div>
                    <div class="text-xs text-gray-500">{{ item.isi_silinder }} cc</div>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    <div>{{ formatDate(item.masa_berlaku_stnk) }}</div>
                    <div class="text-xs text-gray-500">Pajak: {{ formatDate(item.masa_berlaku_pajak_stnk) }}</div>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatDate(item.masa_berlaku_keur_head_truck) }}
                  </td>
                  <td class="px-5 py-3 text-right text-sm sm:px-6">
                    <div class="relative inline-flex justify-center">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        @click.stop="toggleActionMenu(item.truck_no, $event)"
                      >
                        
                        <svg
                          class="h-3.5 w-3.5"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.6"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="m5 8 5 5 5-5" />
                        </svg>
                      </button>
                      <Teleport to="body">
                        <div
                          v-if="openActionId === item.truck_no"
                          ref="actionMenuRef"
                          class="fixed z-[9999] w-36 -translate-x-full rounded-lg border border-gray-200 bg-white py-1 text-left shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
                          :style="actionMenuStyle"
                          @click.stop
                        >
                          <RouterLink
                            :to="`/data-transport/data-truck/detail/${item.truck_no}`"
                            class="block px-3 py-2 text-xs font-medium text-sky-600 hover:bg-gray-50 dark:text-sky-400 dark:hover:bg-white/[0.03]"
                            @click="closeActionMenu"
                          >
                            Detail
                          </RouterLink>
                          <RouterLink
                            v-if="!isMekanik"
                            :to="`/data-transport/data-truck/edit/${item.truck_no}`"
                            class="block px-3 py-2 text-xs font-medium text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-white/[0.03]"
                            @click="closeActionMenu"
                          >
                            Edit
                          </RouterLink>
                        </div>
                      </Teleport>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 sm:px-6 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          <div>
            Halaman <span class="font-medium text-gray-700 dark:text-gray-200">{{ currentPage }}</span> dari <span class="font-medium text-gray-700 dark:text-gray-200">{{ totalPages }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              Sebelumnya
            </button>
            <div class="flex items-center gap-1">
              <template v-for="(item, index) in paginationItems" :key="item.key ?? index">
                <button
                  v-if="item.type === 'page'"
                  type="button"
                  class="rounded-md border px-3 py-1 text-xs font-medium"
                  :class="
                    item.value === currentPage
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                  "
                  @click="goToPage(item.value)"
                >
                  {{ item.value }}
                </button>
                <span v-else class="px-2 text-xs text-gray-400">...</span>
              </template>
            </div>
            <button
              type="button"
              class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </ComponentCard>
    </div>

    <ToastHost />
  </AdminLayout>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, computed, watch, nextTick } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useToast } from '@/composables/useToast'
import { API_BASE } from '@/config/api'
import { useAuthUser } from '@/services/auth'

const pageTitle = 'Data Transport: Data Truck'
const toast = useToast()
const authUser = useAuthUser()
const isMekanik = computed(() => authUser.value?.level === 'mekanik')
const items = ref([])
const loading = ref(false)
const searchColumn = ref('all')
const searchInput = ref('')
const searchKeyword = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 50]

const sortColumn = ref('updatedAt')
const sortOrder = ref('desc')

const openActionId = ref(null)
const actionMenuRef = ref(null)
const actionMenuPosition = ref({ top: 0, left: 0 })

const setActionMenuPosition = (event) => {
  const trigger = event?.currentTarget
  if (!trigger) {
    return
  }
  const rect = trigger.getBoundingClientRect()
  const top = rect.bottom + 8
  const left = rect.right
  actionMenuPosition.value = { top, left }

  nextTick(() => {
    const menuEl = actionMenuRef.value
    const element = Array.isArray(menuEl) ? menuEl[0] : menuEl
    if (!element) return
    const menuHeight = element.offsetHeight || 0
    if (top + menuHeight > window.innerHeight - 8) {
      actionMenuPosition.value = {
        top: Math.max(8, rect.top - menuHeight - 8),
        left,
      }
    }
  })
}

const actionMenuStyle = computed(() => ({
  top: `${actionMenuPosition.value.top}px`,
  left: `${actionMenuPosition.value.left}px`,
}))

const toggleActionMenu = (id, event) => {
  if (openActionId.value === id) {
    closeActionMenu()
    return
  }
  openActionId.value = id
  setActionMenuPosition(event)
}

const closeActionMenu = () => {
  openActionId.value = null
}

const toggleSort = (column) => {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortOrder.value = 'asc'
  }
}

const filteredItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return items.value
  
  return items.value.filter(item => {
    if (searchColumn.value === 'all') {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(keyword)
      )
    } else {
      const val = item[searchColumn.value]
      return val && String(val).toLowerCase().includes(keyword)
    }
  })
})

const sortedItems = computed(() => {
  const result = [...filteredItems.value]
  const col = sortColumn.value
  const order = sortOrder.value

  result.sort((a, b) => {
    let valA = a[col]
    let valB = b[col]

    // Handle nested fields or display fields if necessary
    // But for now simple fields are enough

    if (valA === null || valA === undefined) valA = ''
    if (valB === null || valB === undefined) valB = ''

    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return order === 'asc' ? -1 : 1
    if (valA > valB) return order === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const totalPages = computed(() => {
  if (sortedItems.value.length === 0) return 1
  return Math.ceil(sortedItems.value.length / pageSize.value)
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

const paginationItems = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const maxVisible = 5

  if (total <= maxVisible + 2) {
    return Array.from({ length: total }, (_, index) => ({
      type: 'page',
      value: index + 1,
      key: `page-${index + 1}`
    }))
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = end - maxVisible + 1
  }

  const items = []

  if (start > 1) {
    items.push({ type: 'page', value: 1, key: 'page-1' })
    if (start > 2) {
      items.push({ type: 'ellipsis', key: 'ellipsis-start' })
    }
  }

  for (let page = start; page <= end; page += 1) {
    items.push({ type: 'page', value: page, key: `page-${page}` })
  }

  if (end < total) {
    if (end < total - 1) {
      items.push({ type: 'ellipsis', key: 'ellipsis-end' })
    }
    items.push({ type: 'page', value: total, key: `page-${total}` })
  }

  return items
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID')
}

const fetchData = async () => {
  loading.value = true
  try {
    let url = `${API_BASE}/data-trucks`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch data')
    items.value = await response.json()
    // Client-side search is handled by computed property
  } catch (error) {
    console.error(error)
    toast.error('Failed to load data')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  searchKeyword.value = searchInput.value
  currentPage.value = 1
}

const resetFilter = () => {
  searchColumn.value = 'all'
  searchInput.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
}

const exportToExcel = () => {
  try {
    window.open(`${API_BASE}/data-trucks/export`, '_blank')
  } catch (error) {
    console.error(error)
    toast.error('Gagal export data')
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const changePageSize = () => {
  currentPage.value = 1
}


onMounted(() => {
  fetchData()
})

const handleDocumentClick = () => {
  closeActionMenu()
}

const handleWindowChange = () => {
  closeActionMenu()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('scroll', handleWindowChange, true)
  window.addEventListener('resize', handleWindowChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('scroll', handleWindowChange, true)
  window.removeEventListener('resize', handleWindowChange)
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})
</script>
