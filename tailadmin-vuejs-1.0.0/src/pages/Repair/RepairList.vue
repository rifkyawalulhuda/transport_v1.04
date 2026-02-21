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

      <ComponentCard title="Daftar Repair">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <RouterLink
            v-if="!isUser"
            to="/repair/new"
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
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total: {{ totalCount }} transaksi
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
                    @click="toggleSort('no_spk_perbaikan')"
                  >
                    <div class="flex items-center gap-1">
                      No. SPK Perbaikan
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
                          :class="sortColumn === 'no_spk_perbaikan' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'no_spk_perbaikan' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('no_police')"
                  >
                    <div class="flex items-center gap-1">
                      No. Police
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
                          :class="sortColumn === 'no_police' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'no_police' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('merk_mobil')"
                  >
                    <div class="flex items-center gap-1">
                      Maker
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
                          :class="sortColumn === 'merk_mobil' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'merk_mobil' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('status_repair')"
                  >
                    <div class="flex items-center gap-1">
                      Status
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
                          :class="sortColumn === 'status_repair' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'status_repair' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('tgl_kerusakan')"
                  >
                    <div class="flex items-center gap-1">
                      Tanggal Kerusakan
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
                          :class="sortColumn === 'tgl_kerusakan' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'tgl_kerusakan' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('tgl_proses')"
                  >
                    <div class="flex items-center gap-1">
                      Estimasi Tanggal Selesai
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
                          :class="sortColumn === 'tgl_proses' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'tgl_proses' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
                        >
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th 
                    class="group cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('biaya_perbaikan')"
                  >
                    <div class="flex items-center justify-end gap-1">
                      Biaya Perbaikan
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
                          :class="sortColumn === 'biaya_perbaikan' && sortOrder === 'asc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                          :class="sortColumn === 'biaya_perbaikan' && sortOrder === 'desc' ? 'text-brand-500' : 'text-gray-300 group-hover:text-gray-400'"
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
                <tr v-for="(item, index) in pagedItems" :key="item.id_repair">
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.no_spk_perbaikan || '-' }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.no_police || '-' }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.merk_mobil || '-' }}
                  </td>
                  <td class="px-5 py-3 text-sm sm:px-6">
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                      :class="
                        item.status_repair === 'SELESAI'
                          ? 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                      "
                    >
                      {{ item.status_repair === 'SELESAI' ? 'Perbaikan Selesai' : 'Proses Perbaikan' }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatDate(item.tgl_kerusakan) }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatDate(item.tgl_proses) }}
                  </td>
                  <td class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ formatNumber(item.biaya_perbaikan) }}
                  </td>
                  <td class="px-5 py-3 text-center sm:px-6">
                    <div class="relative inline-flex justify-center">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        @click.stop="toggleActionMenu(item.id_repair, $event)"
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
                            v-if="openActionId === item.id_repair"
                            ref="actionMenuRef"
                            class="fixed z-[9999] w-36 -translate-x-full rounded-lg border border-gray-200 bg-white py-1 text-left shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
                            :style="actionMenuStyle"
                            @click.stop
                          >
                            <RouterLink
                              :to="`/repair/${item.id_repair}`"
                              class="block px-3 py-2 text-xs font-medium text-sky-600 hover:bg-gray-50 dark:text-sky-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Details
                            </RouterLink>
                            <RouterLink
                              v-if="!isUser"
                              :to="`/repair/${item.id_repair}/edit`"
                              class="block px-3 py-2 text-xs font-medium text-amber-600 hover:bg-gray-50 dark:text-amber-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Edit
                            </RouterLink>
                            <button
                              v-if="isAdmin"
                              type="button"
                              class="block w-full px-3 py-2 text-left text-xs font-medium text-error-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:bg-white/[0.03]"
                              :disabled="deletingId === item.id_repair"
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
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch, nextTick } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { authService } from '@/services/auth'
import { repairService } from '@/services/repair'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

type RepairItem = {
  id_repair: number
  no_police?: string
  merk_mobil?: string
  status_repair?: 'PROSES' | 'SELESAI'
  tgl_kerusakan?: string
  tgl_proses?: string
  jadwal_berkala?: string
  no_spk_perbaikan?: string
  biaya_perbaikan?: number
}

type PaginationItem =
  | { type: 'page'; value: number; key: string }
  | { type: 'ellipsis'; key: string }

const currentPageTitle = ref('Repair')
const user = ref(authService.getUser())
const isAdmin = computed(() => user.value?.level === 'admin')
const isUser = computed(() => user.value?.level === 'user')
const { confirm } = useDialog()
const toast = useToast()
const items = ref<RepairItem[]>([])
const loading = ref(false)
const isExporting = ref(false)
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
  { value: 'no_police', label: 'No. Police', placeholder: 'Cari no. police' },
  { value: 'maker', label: 'Maker', placeholder: 'Cari maker' },
  { value: 'model', label: 'Model', placeholder: 'Cari model' },
  { value: 'no_spk_perbaikan', label: 'No. SPK Perbaikan', placeholder: 'Cari no. SPK' }
]
const searchColumn = ref('all')
const searchInput = ref('')
const searchKeyword = ref('')
const searchPlaceholder = computed(() => {
  const active = searchColumns.find((option) => option.value === searchColumn.value)
  return active?.placeholder || 'Cari transaksi...'
})

const sortColumn = ref<keyof RepairItem | ''>('id_repair')
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

const handleDelete = (item: RepairItem) => {
  closeActionMenu()
  remove(item)
}

const toggleSort = (column: keyof RepairItem) => {
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
    const aValue = a[sortColumn.value as keyof RepairItem]
    const bValue = b[sortColumn.value as keyof RepairItem]

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

const totalPages = computed(() => {
  if (totalCount.value === 0) {
    return 1
  }
  return Math.ceil(totalCount.value / pageSize.value)
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
    page: currentPage.value,
    pageSize: pageSize.value,
    dateField: 'damage'
  }
  if (filters.startDate) {
    params.startDate = filters.startDate
  }
  if (filters.endDate) {
    params.endDate = filters.endDate
  }
  if (filters.year) {
    params.year = filters.year
  }
  if (searchKeyword.value.trim()) {
    params.keyword = searchKeyword.value.trim()
    params.searchColumn = searchColumn.value
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
    const response = await repairService.fetchRepairs(params)
    items.value = Array.isArray(response) ? response : []
    totalCount.value = items.value.length
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

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) {
    return
  }
  currentPage.value = page
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
    const data = await repairService.fetchRepairYears()
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

const formatNumber = (value?: number | string | null) => {
  const numberValue = Number(value || 0)
  return numberValue.toLocaleString('en-US')
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
    const res = await repairService.exportRepairs(params)
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
    const fallbackName = `repair_${today}.xlsx`
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
  } catch (error) {
    console.error(error)
    toast.error('Gagal export data.')
  } finally {
    isExporting.value = false
  }
}

const remove = async (item: RepairItem) => {
  if (deletingId.value) {
    return
  }

  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message: 'Hapus transaksi repair ini?',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) {
    return
  }

  deletingId.value = item.id_repair
  try {
    await repairService.deleteRepair(item.id_repair)
    toast.success('Data berhasil dihapus')
    items.value = items.value.filter((row) => row.id_repair !== item.id_repair)
    totalCount.value = items.value.length
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus data'
    toast.error(message)
  } finally {
    deletingId.value = null
  }
}

watch(searchInput, (value) => {
  searchKeyword.value = value
})

watch([searchColumn], () => {
  currentPage.value = 1
})

watch([() => filters.startDate, () => filters.endDate], () => {
  currentPage.value = 1
})

watch(currentPage, () => {
  if (items.value.length) {
    return
  }
  loadData()
})

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
</script>
