<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Filter Tanggal & Pencarian">
        <form class="space-y-4" @submit.prevent="loadData">
          <div class="grid gap-4 sm:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Tanggal Mulai</label
              >
              <input
                v-model="filters.startDate"
                type="date"
                @click="openDatePicker"
                @focus="openDatePicker"
                @keydown.prevent
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Tanggal Akhir</label
              >
              <input
                v-model="filters.endDate"
                type="date"
                @click="openDatePicker"
                @focus="openDatePicker"
                @keydown.prevent
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Kolom Pencarian</label
              >
              <select
                v-model="searchColumn"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option
                  v-for="option in searchColumns"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Kata Kunci</label
              >
              <input
                v-model="searchInput"
                type="text"
                :placeholder="searchPlaceholder"
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
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
              :disabled="isExporting"
              @click="exportExcel"
            >
              {{ isExporting ? 'Mengekspor...' : 'Export Excel' }}
            </button>
          </div>
          <p
            v-if="filterError"
            class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
          >
            {{ filterError }}
          </p>
        </form>
      </ComponentCard>

      <ComponentCard title="Daftar Sub Contractor">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <RouterLink
            to="/subcontractor/new"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Tambah Transaksi
          </RouterLink>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total: {{ totalCount }} transaksi</p>
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
        </div>

        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">No</th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('order_date')"
                  >
                    <div class="flex items-center gap-1">
                      Tanggal Order
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'order_date' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'order_date' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('nama_subcont')"
                  >
                    <div class="flex items-center gap-1">
                      Nama Subcont
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'nama_subcont' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'nama_subcont' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('nama_customer')"
                  >
                    <div class="flex items-center gap-1">
                      Nama Customer
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'nama_customer' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'nama_customer' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('kode_warehouse')"
                  >
                    <div class="flex items-center gap-1">
                      Warehouse
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'kode_warehouse' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'kode_warehouse' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('no_surat_jalan')"
                  >
                    <div class="flex items-center gap-1">
                      Nomor Surat Jalan
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'no_surat_jalan' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'no_surat_jalan' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('sales')"
                  >
                    <div class="flex items-center justify-end gap-1">
                      Sales
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'sales' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'sales' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('gross_profit')"
                  >
                    <div class="flex items-center justify-end gap-1">
                      Gross Profit
                      <span class="flex flex-col">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="transition-colors"
                          :class="sortColumn === 'gross_profit' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          stroke-width="2" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" 
                          class="-mt-1 transition-colors"
                          :class="sortColumn === 'gross_profit' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <tr v-for="(item, index) in pagedItems" :key="item.id_subcontractor">
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatDate(item.order_date) }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.nama_subcont }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.nama_customer }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatWarehouse(item) }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.no_surat_jalan }}
                  </td>
                  <td class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatCurrency(item.sales) }}
                  </td>
                  <td class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatCurrency(item.gross_profit) }}
                  </td>
                  <td class="px-5 py-3 text-center sm:px-6">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <RouterLink
                        :to="`/subcontractor/${item.id_subcontractor}/detail`"
                        class="w-24 rounded-lg bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-400"
                      >
                        Details
                      </RouterLink>
                      <RouterLink
                        :to="`/subcontractor/${item.id_subcontractor}/edit`"
                        class="w-24 rounded-lg bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400"
                      >
                        Edit
                      </RouterLink>
                      <button
                        v-if="isAdmin"
                        type="button"
                        class="w-24 rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-error-500/15 dark:text-error-400"
                        :disabled="deletingId === item.id_subcontractor"
                        @click="remove(item)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && items.length === 0">
                  <td
                    colspan="9"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
                <tr v-if="loading">
                  <td
                    colspan="9"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div
          class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 sm:px-6 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400"
        >
          <div>
            Halaman
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ currentPage }}</span>
            dari
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ totalPages }}</span>
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
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { authService } from '@/services/auth'
import { subcontractorService } from '@/services/subcontractorService'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

type SubcontractorItem = {
  id_subcontractor: number
  order_date: string
  nama_subcont: string
  nama_customer: string
  kode_warehouse: string
  nm_warehouse: string
  no_surat_jalan: string
  sales: number
  gross_profit: number
}

type PaginationItem =
  | { type: 'page'; value: number; key: string }
  | { type: 'ellipsis'; key: string }

const currentPageTitle = ref('Sub Contractor')
const user = ref(authService.getUser())
const isAdmin = computed(() => user.value?.level === 'admin')
const { confirm } = useDialog()
const toast = useToast()
const items = ref<SubcontractorItem[]>([])
const loading = ref(false)
const isExporting = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const pageSizeOptions = [15, 20, 50, 75, 100]
const totalCount = ref(0)
const deletingId = ref<number | null>(null)

const searchColumns = [
  { value: 'all', label: 'Semua Kolom', placeholder: 'Cari transaksi...' },
  { value: 'nama_subcont', label: 'Nama Subcont', placeholder: 'Cari nama subcont' },
  { value: 'nama_customer', label: 'Nama Customer', placeholder: 'Cari customer' },
  { value: 'warehouse', label: 'Warehouse', placeholder: 'Cari warehouse' },
  { value: 'no_surat_jalan', label: 'Nomor Surat Jalan', placeholder: 'Cari nomor surat jalan' },
  { value: 'truck', label: 'No. Police', placeholder: 'Cari no. police' }
]
const searchColumn = ref('all')
const searchInput = ref('')
const searchKeyword = ref('')
const searchPlaceholder = computed(() => {
  const active = searchColumns.find((option) => option.value === searchColumn.value)
  return active?.placeholder || 'Cari transaksi...'
})

const sortColumn = ref<keyof SubcontractorItem | ''>('id_subcontractor')
const sortOrder = ref<'asc' | 'desc'>('desc')

const toggleSort = (column: keyof SubcontractorItem) => {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortOrder.value = 'asc'
  }
}

const sortedItems = computed(() => {
  if (!sortColumn.value) {
    return items.value
  }

  return [...items.value].sort((a, b) => {
    const aValue = a[sortColumn.value as keyof SubcontractorItem]
    const bValue = b[sortColumn.value as keyof SubcontractorItem]

    if (aValue === bValue) return 0
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    let comparison = 0
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else {
      comparison = String(aValue).localeCompare(String(bValue))
    }

    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  if (items.value.length === 0) {
    return 1
  }
  return Math.ceil(items.value.length / pageSize.value)
})

const paginationItems = computed<PaginationItem[]>(() => {
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

  const pagination: PaginationItem[] = []

  if (start > 1) {
    pagination.push({ type: 'page', value: 1, key: 'page-1' })
    if (start > 2) {
      pagination.push({ type: 'ellipsis', key: 'ellipsis-start' })
    }
  }

  for (let page = start; page <= end; page += 1) {
    pagination.push({ type: 'page', value: page, key: `page-${page}` })
  }

  if (end < total) {
    if (end < total - 1) {
      pagination.push({ type: 'ellipsis', key: 'ellipsis-end' })
    }
    pagination.push({ type: 'page', value: total, key: `page-${total}` })
  }

  return pagination
})

const filters = reactive({
  startDate: '',
  endDate: ''
})
const filterError = ref('')

const openDatePicker = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (target && typeof (target as HTMLInputElement).showPicker === 'function') {
    ;(target as HTMLInputElement).showPicker()
  }
}

const buildFilterParams = () => {
  const params: Record<string, string | number> = {
    // page: currentPage.value, // Remove server-side pagination
    // pageSize
    limit: 1000 // Load more for client-side sorting
  }
  if (filters.startDate) {
    params.start_date = filters.startDate
  }
  if (filters.endDate) {
    params.end_date = filters.endDate
  }
  if (searchKeyword.value.trim()) {
    params.keyword = searchKeyword.value.trim()
    params.search_column = searchColumn.value
  }
  return params
}

const loadData = async () => {
  loading.value = true
  try {
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      filterError.value = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.'
      loading.value = false
      return
    }
    filterError.value = ''
    const params = buildFilterParams()
    const response = await subcontractorService.fetchSubcontractors(params)
    items.value = response.data || []
    totalCount.value = response.total || 0
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error) {
    console.error(error)
    toast.error('Gagal memuat data.')
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) {
    return
  }
  currentPage.value = page
  // loadData() // Remove loadData from here as we use client-side pagination
}

const changePageSize = () => {
  currentPage.value = 1
}

const resetFilter = () => {
  filters.startDate = ''
  filters.endDate = ''
  searchColumn.value = 'all'
  searchInput.value = ''
  searchKeyword.value = ''
  filterError.value = ''
  currentPage.value = 1
  loadData()
}

const formatWarehouse = (item: SubcontractorItem) =>
  `${item.kode_warehouse} - ${item.nm_warehouse}`

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const formatCurrency = (value: number) => {
  const number = Number(value) || 0
  return `Rp. ${number.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

const getFilenameFromHeader = (header: string | null) => {
  if (!header) {
    return ''
  }
  const match = header.match(/filename="?([^"]+)"?/i)
  return match ? match[1] : ''
}

const exportExcel = async () => {
  if (isExporting.value) {
    return
  }
  if (filterError.value) {
    toast.warning(filterError.value)
    return
  }
  isExporting.value = true
  try {
    const params = buildFilterParams()
    const res = await subcontractorService.exportSubcontractor(params)
    if (!res.ok) {
      const message = await res.text()
      toast.error(message || 'Gagal export data.')
      return
    }
    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      toast.info('Tidak ada data untuk diexport.')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    const fallbackName = `subcontractor_${today}.xlsx`
    const filename =
      getFilenameFromHeader(res.headers.get('content-disposition')) || fallbackName
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
    toast.success('Export berhasil.')
  } catch (error) {
    console.error(error)
    toast.error('Gagal export data.')
  } finally {
    isExporting.value = false
  }
}

const remove = async (item: SubcontractorItem) => {
  if (deletingId.value) {
    return
  }
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message:
      'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) {
    return
  }
  try {
    deletingId.value = item.id_subcontractor
    await subcontractorService.deleteSubcontractor(item.id_subcontractor)
    toast.success('Data berhasil dihapus')
    await loadData()
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Gagal menghapus data.'
    toast.error(message)
  } finally {
    deletingId.value = null
  }
}

onMounted(loadData)

watch(searchInput, (value, _prev, onCleanup) => {
  const handle = window.setTimeout(() => {
    searchKeyword.value = value
    currentPage.value = 1
    loadData()
  }, 300)
  onCleanup(() => {
    window.clearTimeout(handle)
  })
})

watch(searchColumn, () => {
  currentPage.value = 1
  if (searchKeyword.value.trim()) {
    loadData()
  }
})

watch(
  () => [filters.startDate, filters.endDate],
  () => {
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      filterError.value = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.'
    } else {
      filterError.value = ''
    }
  }
)
</script>
