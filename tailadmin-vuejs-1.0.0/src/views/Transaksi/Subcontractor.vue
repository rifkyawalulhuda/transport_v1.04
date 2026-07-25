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
              @click="showExportModal = true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Excel
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
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">Tahun</label>
              <select
                v-model="filters.year"
                class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @change="handleYearFilterChange"
              >
                <option v-for="year in yearOptions" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
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
          class="overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">No</th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('delivery_date')"
                  >
                    <div class="flex items-center gap-1">
                      Delivery Date
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
                          :class="sortColumn === 'delivery_date' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'delivery_date' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                    {{ formatDate(item.delivery_date) }}
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
                    <div class="relative inline-flex justify-center">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        @click.stop="toggleActionMenu(item.id_subcontractor, $event)"
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
                            v-if="openActionId === item.id_subcontractor"
                            ref="actionMenuRef"
                            class="fixed z-[9999] w-36 -translate-x-full rounded-lg border border-gray-200 bg-white py-1 text-left shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
                            :style="actionMenuStyle"
                            @click.stop
                          >
                            <RouterLink
                              :to="`/subcontractor/${item.id_subcontractor}/detail`"
                              class="block px-3 py-2 text-xs font-medium text-sky-600 hover:bg-gray-50 dark:text-sky-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Details
                            </RouterLink>
                            <RouterLink
                              :to="`/subcontractor/${item.id_subcontractor}/print`"
                              target="_blank"
                              class="block px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Print
                            </RouterLink>
                            <RouterLink
                              :to="`/subcontractor/${item.id_subcontractor}/edit`"
                              class="block px-3 py-2 text-xs font-medium text-amber-600 hover:bg-gray-50 dark:text-amber-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Edit
                            </RouterLink>
                            <button
                              v-if="isAdmin"
                              type="button"
                              class="block w-full px-3 py-2 text-left text-xs font-medium text-error-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:bg-white/[0.03]"
                              :disabled="deletingId === item.id_subcontractor"
                              @click="handleDelete(item)"
                            >
                              Delete
                            </button>
                          </div>
                        </Teleport>
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

    <!-- Export Modal -->
    <Teleport to="body">
      <Transition name="fade-export">
        <div v-if="showExportModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showExportModal = false"></div>
          <div class="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Export Subcontractor</h3>
              <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors" @click="showExportModal = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Pilih rentang data berdasarkan <span class="font-medium text-gray-700 dark:text-gray-200">Tanggal Pengerjaan</span></p>
            <div class="space-y-3 mb-5">
              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'month' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="month" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1"><span class="text-sm font-medium text-gray-700 dark:text-gray-200">Per Bulan</span><p class="text-xs text-gray-400 mt-0.5">Export data satu bulan</p></div>
              </label>
              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'year' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="year" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1"><span class="text-sm font-medium text-gray-700 dark:text-gray-200">Per Tahun</span><p class="text-xs text-gray-400 mt-0.5">Export data satu tahun penuh</p></div>
              </label>
              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'all' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="all" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1"><span class="text-sm font-medium text-gray-700 dark:text-gray-200">Semua Data</span><p class="text-xs text-gray-400 mt-0.5">Export seluruh data</p></div>
              </label>
            </div>
            <div v-if="exportRange === 'month'" class="mb-5">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Pilih Bulan</label>
              <input ref="exportMonthInput" v-model="exportMonthVal" type="month" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer" @click="(exportMonthInput as HTMLInputElement)?.showPicker?.()" />
            </div>
            <div v-if="exportRange === 'year'" class="mb-5">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Pilih Tahun</label>
              <select v-model="exportYearVal" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <option v-for="y in exportYearOpts" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
            <div class="flex gap-3">
              <button type="button" class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors" @click="showExportModal = false">Batal</button>
              <button type="button" :disabled="isExporting" class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" @click="doExportModal">
                <svg v-if="isExporting" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                {{ isExporting ? 'Mengunduh...' : 'Download Excel' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue'
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
  delivery_date: string
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
// Export Modal state
const showExportModal = ref(false)
const exportRange = ref<'month' | 'year' | 'all'>('month')
const exportMonthVal = ref((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })())
const exportMonthInput = ref<HTMLInputElement | null>(null)
const exportYearVal = ref(String(new Date().getFullYear()))
const exportYearOpts = computed(() => {
  const current = new Date().getFullYear()
  const years: string[] = []
  for (let y = current; y >= current - 5; y--) years.push(String(y))
  return years
})
const currentPage = ref(1)
const pageSize = ref(15)
const pageSizeOptions = [15, 20, 50, 75, 100]
const currentYear = new Date().getFullYear()
const defaultYear = String(currentYear)
const yearOptions = ref<string[]>([])
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

const openActionId = ref<number | null>(null)
const actionMenuRef = ref<HTMLElement | HTMLElement[] | null>(null)
const actionMenuPosition = ref({ top: 0, left: 0 })

const setActionMenuPosition = (event: MouseEvent) => {
  const trigger = event.currentTarget as HTMLElement | null
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
        left
      }
    }
  })
}

const actionMenuStyle = computed(() => ({
  top: `${actionMenuPosition.value.top}px`,
  left: `${actionMenuPosition.value.left}px`
}))

const toggleActionMenu = (id: number, event: MouseEvent) => {
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

const handleDelete = (item: SubcontractorItem) => {
  closeActionMenu()
  remove(item)
}

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
  endDate: '',
  year: defaultYear
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
  if (filters.year) {
    params.year = filters.year
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

const handleYearFilterChange = () => {
  currentPage.value = 1
  loadData()
}

const loadYearOptions = async () => {
  try {
    const data = await subcontractorService.fetchSubcontractorYears()
    if (!Array.isArray(data)) {
      yearOptions.value = []
      return
    }
    yearOptions.value = data
      .map((year) => Number.parseInt(String(year), 10))
      .filter((year) => Number.isInteger(year) && year >= 1900 && year <= 9999)
      .map((year) => String(year))

    if (yearOptions.value.length > 0 && !yearOptions.value.includes(filters.year)) {
      filters.year = yearOptions.value[0]
    }
  } catch (error) {
    console.error(error)
    yearOptions.value = []
  }
}

const resetFilter = () => {
  filters.startDate = ''
  filters.endDate = ''
  filters.year = yearOptions.value.includes(defaultYear)
    ? defaultYear
    : (yearOptions.value[0] || '')
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

const doExportModal = async () => {
  isExporting.value = true
  try {
    const params: Record<string, string | number> = { limit: 1000 }
    if (exportRange.value === 'month' && exportMonthVal.value) {
      const [y, m] = exportMonthVal.value.split('-')
      const lastDay = new Date(Number(y), Number(m), 0).getDate()
      params.start_date = `${exportMonthVal.value}-01`
      params.end_date = `${exportMonthVal.value}-${String(lastDay).padStart(2, '0')}`
    } else if (exportRange.value === 'year' && exportYearVal.value) {
      params.start_date = `${exportYearVal.value}-01-01`
      params.end_date = `${exportYearVal.value}-12-31`
    }
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
    const filename = getFilenameFromHeader(res.headers.get('content-disposition')) || fallbackName
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
    toast.success('Export berhasil.')
    showExportModal.value = false
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

onMounted(async () => {
  await loadYearOptions()
  await loadData()
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

<style scoped>
.fade-export-enter-active,
.fade-export-leave-active {
  transition: opacity 0.2s ease;
}
.fade-export-enter-from,
.fade-export-leave-to {
  opacity: 0;
}
</style>
