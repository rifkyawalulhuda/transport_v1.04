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
        </form>
      </ComponentCard>

      <!-- Data Table Section -->
      <ComponentCard title="Daftar Data Truck">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
          <RouterLink
            to="/data-transport/data-truck/create"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Tambah Data Truck
          </RouterLink>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total: {{ filteredItems.length }} data
          </p>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">No</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Truck No / Asset</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Merk / Type / Model</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Tahun / Silinder</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Masa Berlaku STNK</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6 uppercase tracking-wider">Masa Berlaku KIR</th>
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
                    <div class="flex items-center justify-center gap-2">
                      <RouterLink
                        :to="`/data-transport/data-truck/detail/${item._id}`"
                        class="rounded-lg bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-400"
                      >
                        Detail
                      </RouterLink>
                      <RouterLink
                        :to="`/data-transport/data-truck/edit/${item._id}`"
                        class="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        Edit
                      </RouterLink>
                      <button
                        @click="confirmDelete(item._id)"
                        class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400"
                      >
                        Hapus
                      </button>
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
import { ref, onMounted, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useToast } from '@/composables/useToast'
import { API_BASE } from '@/config/api'

const pageTitle = 'Data Transport: Data Truck'
const toast = useToast()
const items = ref([])
const loading = ref(false)
const searchColumn = ref('all')
const searchInput = ref('')
const searchKeyword = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = 10

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

const totalPages = computed(() => {
  if (filteredItems.value.length === 0) return 1
  return Math.ceil(filteredItems.value.length / pageSize)
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
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

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const confirmDelete = async (id) => {
  if (confirm('Are you sure you want to delete this item?')) {
    try {
      const response = await fetch(`${API_BASE}/data-trucks/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Deleted successfully')
      fetchData()
    } catch (error) {
      toast.error(error.message)
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>
