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
                <option v-for="option in searchColumns" :key="option.value" :value="option.value">
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
              class="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
              :disabled="isImporting"
              @click="triggerImport"
            >
              {{ isImporting ? 'Mengimport...' : 'Import Excel' }}
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

      <ComponentCard title="Daftar Sales Cost">
        <div
          class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
        >
          <div class="flex flex-wrap items-center gap-2">
            <RouterLink
              to="/sales-cost/new"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Tambah Transaksi
            </RouterLink>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
              :disabled="selectedSalesCostIds.length === 0"
              @click="printSelectedSalesCosts"
            >
              Cetak Terpilih ({{ selectedSalesCostIds.length }})
            </button>
            <button
              v-if="selectedSalesCostIds.length > 0"
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @click="clearSelectedSalesCosts"
            >
              Batal Pilih
            </button>
          </div>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">Tahun</label>
              <select
                v-model="filters.year"
                class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @change="handleYearFilterChange"
              >
                <option value="">Semua</option>
                <option v-for="year in yearOptions" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total: {{ filteredItems.length }} transaksi
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
          v-if="showCreateForm"
          class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
        >
          <h3 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
            {{ formTitle }}
          </h3>
          <p
            v-if="formError"
            class="mb-3 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
          >
            {{ formError }}
          </p>
          <p v-if="formLoading" class="text-sm text-gray-500 dark:text-gray-400">
            Memuat data transaksi...
          </p>
          <form v-else class="space-y-4" @submit.prevent="submitForm">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Truck</label
                >
                <select
                  v-model="form.id_truck"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                >
                  <option value="">Pilih Truck</option>
                  <option
                    v-for="truck in trucks"
                    :key="truck.id_truck"
                    :value="String(truck.id_truck)"
                  >
                    {{ truck.no_police }} - {{ truck.jenis_kendaraan }}
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Driver</label
                >
                <select
                  v-model="form.id_driver"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                >
                  <option value="">Pilih Driver</option>
                  <option
                    v-for="driver in drivers"
                    :key="driver.id_driver"
                    :value="String(driver.id_driver)"
                  >
                    {{ driver.nama_driver }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Customer</label
                >
                <select
                  v-model="form.id_customer"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                >
                  <option value="">Pilih Customer</option>
                  <option
                    v-for="customer in customers"
                    :key="customer.id_customer"
                    :value="String(customer.id_customer)"
                  >
                    {{ customer.nama_customer }}
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Rute</label
                >
                <select
                  v-model="form.id_area"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                >
                  <option value="">Pilih Area</option>
                  <option v-for="area in areas" :key="area.id_area" :value="String(area.id_area)">
                    {{ area.nama_area }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Departure</label
                >
                <input
                  v-model="form.departure_datetime"
                  type="date"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Arrival</label
                >
                <input
                  v-model="form.arrival_datetime"
                  type="date"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Sales</label
                >
                <input
                  v-model="form.price"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Ops Cost</label
                >
                <input
                  v-model="form.ops_cost"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Additional Cost</label
                >
                <input
                  v-model="form.additional_cost"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @click="cancelForm"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="formLoading || formSubmitting"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
        <div
          class="overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="w-12 px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    <input
                      ref="selectAllCheckbox"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                      :checked="isAllPagedSelected"
                      :disabled="pagedItems.length === 0"
                      aria-label="Pilih semua transaksi pada halaman ini"
                      @change="togglePagedSelection"
                    />
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">No</th>
                  <th
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('id_sales_cost')"
                  >
                    <div class="flex items-center gap-1">
                      No. SPK
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
                          :class="
                            sortColumn === 'id_sales_cost' && sortOrder === 'asc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m18 15-6-6-6 6" />
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
                          :class="
                            sortColumn === 'id_sales_cost' && sortOrder === 'desc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('departure_datetime')"
                  >
                    <div class="flex items-center gap-1">
                      Departure
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
                          :class="
                            sortColumn === 'departure_datetime' && sortOrder === 'asc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m18 15-6-6-6 6" />
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
                          :class="
                            sortColumn === 'departure_datetime' && sortOrder === 'desc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('nama_customer')"
                  >
                    <div class="flex items-center gap-1">
                      Customer
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
                          :class="
                            sortColumn === 'nama_customer' && sortOrder === 'asc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m18 15-6-6-6 6" />
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
                          :class="
                            sortColumn === 'nama_customer' && sortOrder === 'desc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('price')"
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
                          :class="
                            sortColumn === 'price' && sortOrder === 'asc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m18 15-6-6-6 6" />
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
                          :class="
                            sortColumn === 'price' && sortOrder === 'desc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('ops_cost')"
                  >
                    <div class="flex items-center justify-end gap-1">
                      Ops Cost
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
                          :class="
                            sortColumn === 'ops_cost' && sortOrder === 'asc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m18 15-6-6-6 6" />
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
                          :class="
                            sortColumn === 'ops_cost' && sortOrder === 'desc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('margin')"
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
                          :class="
                            sortColumn === 'margin' && sortOrder === 'asc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m18 15-6-6-6 6" />
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
                          :class="
                            sortColumn === 'margin' && sortOrder === 'desc'
                              ? 'text-brand-500'
                              : 'text-gray-300 group-hover:text-gray-400'
                          "
                        >
                          <path d="m6 9 6 6 6-6" />
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
                <template v-for="(item, index) in pagedItems" :key="item.id_sales_cost">
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-5 py-3 sm:px-6">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
                        :checked="isSalesCostSelected(item.id_sales_cost)"
                        :aria-label="`Pilih sales cost ${item.id_sales_cost}`"
                        @click.stop
                        @change="toggleSalesCostSelection(item.id_sales_cost, $event)"
                      />
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.id_sales_cost }}
                    </td>
                     <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ formatDateTime(item.departure_datetime) }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.nama_customer }}
                    </td>
                    <td
                      class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200"
                    >
                      {{ formatRupiah(item.price) }}
                    </td>
                    <td
                      class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200"
                    >
                      {{ formatRupiah(item.total ?? item.ops_cost) }}
                    </td>
                    <td
                      class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200"
                    >
                      {{ formatRupiah(item.margin) }}
                    </td>
                    <td class="px-5 py-3 text-center sm:px-6">
                      <div class="relative inline-flex justify-center">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          @click.stop="toggleActionMenu(item.id_sales_cost, $event)"
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
                            v-if="openActionId === item.id_sales_cost"
                            ref="actionMenuRef"
                            class="fixed z-[9999] w-36 -translate-x-full rounded-lg border border-gray-200 bg-white py-1 text-left shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
                            :style="actionMenuStyle"
                            @click.stop
                          >
                            <RouterLink
                              :to="`/sales-cost/${item.id_sales_cost}`"
                              class="block px-3 py-2 text-xs font-medium text-sky-600 hover:bg-gray-50 dark:text-sky-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Details
                            </RouterLink>
                            <RouterLink
                              :to="`/sales-cost/${item.id_sales_cost}/edit`"
                              class="block px-3 py-2 text-xs font-medium text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Edit
                            </RouterLink>
                            <RouterLink
                              :to="`/sales-cost/${item.id_sales_cost}/print`"
                              target="_blank"
                              rel="noopener"
                              class="block px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-white/[0.03]"
                              @click="closeActionMenu"
                            >
                              Cetak
                            </RouterLink>
                            <button
                              v-if="isAdmin"
                              type="button"
                              :disabled="deletingId === item.id_sales_cost"
                              class="block w-full px-3 py-2 text-left text-xs font-medium text-error-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:bg-white/[0.03]"
                              @click="handleDelete(item)"
                            >
                              Hapus
                            </button>
                          </div>
                        </Teleport>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="editingId === item.id_sales_cost">
                    <td colspan="9" class="bg-gray-50 px-5 py-4 sm:px-6 dark:bg-gray-900/40">
                      <div
                        class="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
                      >
                        <h3 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {{ formTitle }}
                        </h3>
                        <p
                          v-if="formError"
                          class="mb-3 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
                        >
                          {{ formError }}
                        </p>
                        <p v-if="formLoading" class="text-sm text-gray-500 dark:text-gray-400">
                          Memuat data transaksi...
                        </p>
                        <form v-else class="space-y-4" @submit.prevent="submitForm">
                          <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Truck</label
                              >
                              <select
                                v-model="form.id_truck"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              >
                                <option value="">Pilih Truck</option>
                                <option
                                  v-for="truck in trucks"
                                  :key="truck.id_truck"
                                  :value="String(truck.id_truck)"
                                >
                                  {{ truck.no_police }} - {{ truck.jenis_kendaraan }}
                                </option>
                              </select>
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Driver</label
                              >
                              <select
                                v-model="form.id_driver"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              >
                                <option value="">Pilih Driver</option>
                                <option
                                  v-for="driver in drivers"
                                  :key="driver.id_driver"
                                  :value="String(driver.id_driver)"
                                >
                                  {{ driver.nama_driver }}
                                </option>
                              </select>
                            </div>
                          </div>

                          <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Customer</label
                              >
                              <select
                                v-model="form.id_customer"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              >
                                <option value="">Pilih Customer</option>
                                <option
                                  v-for="customer in customers"
                                  :key="customer.id_customer"
                                  :value="String(customer.id_customer)"
                                >
                                  {{ customer.nama_customer }}
                                </option>
                              </select>
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Rute</label
                              >
                              <select
                                v-model="form.id_area"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              >
                                <option value="">Pilih Area</option>
                                <option
                                  v-for="area in areas"
                                  :key="area.id_area"
                                  :value="String(area.id_area)"
                                >
                                  {{ area.nama_area }}
                                </option>
                              </select>
                            </div>
                          </div>

                          <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Departure</label
                              >
                              <input
                                v-model="form.departure_datetime"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Arrival</label
                              >
                              <input
                                v-model="form.arrival_datetime"
                                type="date"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                          </div>

                          <div class="grid gap-4 sm:grid-cols-3">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Sales</label
                              >
                              <input
                                v-model="form.price"
                                type="number"
                                min="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Ops Cost</label
                              >
                              <input
                                v-model="form.ops_cost"
                                type="number"
                                min="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                                >Additional Cost</label
                              >
                              <input
                                v-model="form.additional_cost"
                                type="number"
                                min="0"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              />
                            </div>
                          </div>

                          <div class="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              @click="cancelForm"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              :disabled="formLoading || formSubmitting"
                              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                            >
                              Simpan
                            </button>
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                </template>
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

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx, .xls"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Import Modal -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">Import Sales Cost</h3>

        <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Silakan download template terlebih dahulu untuk memastikan format data sesuai.
        </p>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            :disabled="isDownloadingTemplate"
            @click="downloadTemplate"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {{ isDownloadingTemplate ? 'Mengunduh...' : 'Download Template' }}
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="selectFile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-upload"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            Upload File Excel
          </button>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="showImportModal = false"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <Teleport to="body">
      <Transition name="fade-export">
        <div v-if="showExportModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showExportModal = false"></div>
          <div class="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">Export Sales Cost</h3>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors"
                @click="showExportModal = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Pilih rentang data berdasarkan <span class="font-medium text-gray-700 dark:text-gray-200">Tanggal Delivery Order</span></p>

            <div class="space-y-3 mb-5">
              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'month' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="month" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Per Bulan</span>
                  <p class="text-xs text-gray-400 mt-0.5">Export data satu bulan berdasarkan tanggal DO</p>
                </div>
              </label>

              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'year' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="year" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Per Tahun</span>
                  <p class="text-xs text-gray-400 mt-0.5">Export data satu tahun penuh berdasarkan tanggal DO</p>
                </div>
              </label>

              <label class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer transition-colors hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500/50" :class="exportRange === 'all' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500' : ''">
                <input v-model="exportRange" type="radio" value="all" class="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500" />
                <div class="flex-1">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Semua Data</span>
                  <p class="text-xs text-gray-400 mt-0.5">Export seluruh data Sales Cost</p>
                </div>
              </label>
            </div>

            <div v-if="exportRange === 'month'" class="mb-5">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Pilih Bulan</label>
              <input
                ref="exportMonthInputSC"
                v-model="exportMonthSC"
                type="month"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 cursor-pointer"
                @click="(exportMonthInputSC as HTMLInputElement)?.showPicker?.()"
              />
            </div>

            <div v-if="exportRange === 'year'" class="mb-5">
              <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-300">Pilih Tahun</label>
              <select
                v-model="exportYearSC"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option v-for="y in exportYearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                @click="showExportModal = false"
              >
                Batal
              </button>
              <button
                type="button"
                :disabled="isExporting"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="doExportModal"
              >
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
import { API_BASE } from '@/config/api'
import { authFetch, authService } from '@/services/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

type SalesCostItem = {
  id_sales_cost: number
  departure_datetime: string
  nama_customer: string
  nama_area?: string | null
  nama_driver?: string | null
  no_police?: string | null
  price: number
  ops_cost: number
  additional_cost?: number
  total?: number
  margin: number
}

type SalesCostDetail = {
  id_sales_cost: number
  id_truck: number | null
  id_driver: number | null
  id_customer: number | null
  id_area: number | null
  departure_datetime: string | null
  arrival_datetime: string | null
  price: number | null
  ops_cost: number | null
  additional_cost: number | null
}

type OptionItem = {
  id_truck?: number
  no_police?: string
  jenis_kendaraan?: string
  id_driver?: number
  nama_driver?: string
  id_customer?: number
  nama_customer?: string
  id_area?: number
  nama_area?: string
}

type FormState = {
  id?: number | null
  id_truck: string
  id_driver: string
  id_customer: string
  id_area: string
  departure_datetime: string
  arrival_datetime: string
  price: string
  ops_cost: string
  additional_cost: string
}

type PaginationItem =
  | { type: 'page'; value: number; key: string }
  | { type: 'ellipsis'; key: string }

const currentPageTitle = ref('Sales Cost')
const user = ref(authService.getUser())
const isAdmin = computed(() => user.value?.level === 'admin')
const { confirm, alert } = useDialog()
const toast = useToast()
const items = ref<SalesCostItem[]>([])
const loading = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const isDownloadingTemplate = ref(false)

// Export Modal state
const showExportModal = ref(false)
const exportRange = ref<'month' | 'year' | 'all'>('month')
const exportMonthSC = ref((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })())
const exportMonthInputSC = ref<HTMLInputElement | null>(null)
const exportYearSC = ref(String(new Date().getFullYear()))
const exportYearOptions = computed(() => {
  const current = new Date().getFullYear()
  const years: string[] = []
  for (let y = current; y >= current - 5; y--) years.push(String(y))
  return years
})
const showImportModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const currentPage = ref(1)
const pageSize = ref(15)
const pageSizeOptions = [15, 20, 50, 75, 100]
const currentYear = new Date().getFullYear()
const defaultYear = String(currentYear)
const yearOptions = ref<string[]>([])
const searchColumns = [
  { value: 'all', label: 'Semua Kolom', placeholder: 'Cari transaksi...' },
  { value: 'id_sales_cost', label: 'No. SPK', placeholder: 'Cari no. SPK' },
  { value: 'nama_customer', label: 'Customer', placeholder: 'Cari customer' },
  { value: 'nama_area', label: 'Rute', placeholder: 'Cari rute' },
  { value: 'nama_driver', label: 'Driver', placeholder: 'Cari driver' },
  { value: 'no_police', label: 'No. Police', placeholder: 'Cari no. police' },
]
const searchColumn = ref('all')
const searchInput = ref('')
const searchKeyword = ref('')
const searchPlaceholder = computed(() => {
  const active = searchColumns.find((option) => option.value === searchColumn.value)
  return active?.placeholder || 'Cari transaksi...'
})
const filteredItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return items.value
  }
  const matches = (value: unknown) => {
    if (value === null || value === undefined) {
      return false
    }
    return String(value).toLowerCase().includes(keyword)
  }
  if (searchColumn.value === 'all') {
    return items.value.filter((item) =>
      [
        item.id_sales_cost,
        item.nama_customer,
        item.nama_area,
        item.nama_driver,
        item.no_police,
      ].some(matches),
    )
  }
  return items.value.filter((item) => matches(item[searchColumn.value as keyof SalesCostItem]))
})

const sortColumn = ref<keyof SalesCostItem | ''>('id_sales_cost')
const sortOrder = ref<'asc' | 'desc'>('desc')

const toggleSort = (column: keyof SalesCostItem) => {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortOrder.value = 'asc'
  }
}

const sortedItems = computed(() => {
  if (!sortColumn.value) {
    return filteredItems.value
  }

  return [...filteredItems.value].sort((a, b) => {
    const aValue = a[sortColumn.value as keyof SalesCostItem]
    const bValue = b[sortColumn.value as keyof SalesCostItem]

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
const selectedSalesCostIds = ref<number[]>([])
const selectAllCheckbox = ref<HTMLInputElement | null>(null)
const selectedSalesCostIdSet = computed(() => new Set(selectedSalesCostIds.value))
const pagedSalesCostIds = computed(() =>
  pagedItems.value
    .map((item) => Number(item.id_sales_cost))
    .filter((id) => Number.isFinite(id) && id > 0),
)
const isAllPagedSelected = computed(
  () =>
    pagedSalesCostIds.value.length > 0 &&
    pagedSalesCostIds.value.every((id) => selectedSalesCostIdSet.value.has(id)),
)
const isSomePagedSelected = computed(() =>
  pagedSalesCostIds.value.some((id) => selectedSalesCostIdSet.value.has(id)),
)
const totalPages = computed(() => {
  if (filteredItems.value.length === 0) {
    return 1
  }
  return Math.ceil(filteredItems.value.length / pageSize.value)
})

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
        left,
      }
    }
  })
}

const actionMenuStyle = computed(() => ({
  top: `${actionMenuPosition.value.top}px`,
  left: `${actionMenuPosition.value.left}px`,
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

const handleDelete = (item: SalesCostItem) => {
  closeActionMenu()
  remove(item)
}

const getChecked = (event: Event) => (event.target as HTMLInputElement | null)?.checked ?? false

const isSalesCostSelected = (id: number) => selectedSalesCostIdSet.value.has(Number(id))

const toggleSalesCostSelection = (id: number, event: Event) => {
  const targetId = Number(id)
  if (!Number.isFinite(targetId) || targetId <= 0) {
    return
  }
  const nextIds = new Set(selectedSalesCostIds.value)
  if (getChecked(event)) {
    nextIds.add(targetId)
  } else {
    nextIds.delete(targetId)
  }
  selectedSalesCostIds.value = Array.from(nextIds)
}

const togglePagedSelection = (event: Event) => {
  const nextIds = new Set(selectedSalesCostIds.value)
  if (getChecked(event)) {
    pagedSalesCostIds.value.forEach((id) => nextIds.add(id))
  } else {
    pagedSalesCostIds.value.forEach((id) => nextIds.delete(id))
  }
  selectedSalesCostIds.value = Array.from(nextIds)
}

const clearSelectedSalesCosts = () => {
  selectedSalesCostIds.value = []
}

const printSelectedSalesCosts = () => {
  if (selectedSalesCostIds.value.length === 0) {
    toast.warning('Pilih minimal satu transaksi untuk dicetak.')
    return
  }
  const ids = selectedSalesCostIds.value.join(',')
  window.open(`/sales-cost/${selectedSalesCostIds.value[0]}/print?ids=${ids}`, '_blank', 'noopener')
}

const paginationItems = computed<PaginationItem[]>(() => {
  const total = totalPages.value
  const current = currentPage.value
  const maxVisible = 5

  if (total <= maxVisible + 2) {
    return Array.from({ length: total }, (_, index) => ({
      type: 'page',
      value: index + 1,
      key: `page-${index + 1}`,
    }))
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = end - maxVisible + 1
  }

  const items: PaginationItem[] = []

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
const filters = reactive({
  startDate: '',
  endDate: '',
  year: defaultYear,
})
const filterError = ref('')

const showCreateForm = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('Tambah Transaksi')
const formLoading = ref(false)
const formSubmitting = ref(false)
const formError = ref('')
const deletingId = ref<number | null>(null)
const form = reactive<FormState>({
  id: null,
  id_truck: '',
  id_driver: '',
  id_customer: '',
  id_area: '',
  departure_datetime: '',
  arrival_datetime: '',
  price: '',
  ops_cost: '',
  additional_cost: '',
})

const trucks = ref<OptionItem[]>([])
const drivers = ref<OptionItem[]>([])
const customers = ref<OptionItem[]>([])
const areas = ref<OptionItem[]>([])

const apiBase = API_BASE

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return ''
  }
  return value.split('T')[0]
}

const parseDateForDisplay = (value?: string | null) => {
  if (!value) {
    return null
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    return new Date(year, month - 1, day)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = parseDateForDisplay(value)
  if (!date) {
    return value
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const formatRupiah = (value: number) => {
  const number = Number(value) || 0
  return number.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  })
}

const openDatePicker = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (target && typeof (target as HTMLInputElement).showPicker === 'function') {
    ;(target as HTMLInputElement).showPicker()
  }
}

const loadOptions = async () => {
  const [truckRes, driverRes, customerRes, areaRes] = await Promise.all([
    fetch(`${apiBase}/trucks`),
    fetch(`${apiBase}/drivers`),
    fetch(`${apiBase}/customers`),
    fetch(`${apiBase}/areas`),
  ])
  trucks.value = await truckRes.json()
  drivers.value = await driverRes.json()
  customers.value = await customerRes.json()
  areas.value = await areaRes.json()
}

const ensureSelectedTruckOption = async (idTruck: string) => {
  if (!idTruck || trucks.value.some((truck) => String(truck.id_truck) === idTruck)) {
    return
  }
  try {
    const res = await fetch(`${apiBase}/trucks/${idTruck}`)
    if (!res.ok) {
      return
    }
    const truck = await res.json()
    trucks.value = [truck, ...trucks.value]
  } catch (error) {
    console.error(error)
  }
}

const loadYearOptions = async () => {
  try {
    const res = await fetch(`${apiBase}/sales-costs/years`)
    if (!res.ok) {
      throw new Error('Gagal memuat daftar tahun.')
    }
    const data = await res.json()
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
    const res = await fetch(
      `${apiBase}/sales-costs${params.toString() ? `?${params.toString()}` : ''}`,
    )
    const data = await res.json()
    items.value = data
    const availableIds = new Set(
      items.value
        .map((item) => Number(item.id_sales_cost))
        .filter((id) => Number.isFinite(id) && id > 0),
    )
    selectedSalesCostIds.value = selectedSalesCostIds.value.filter((id) => availableIds.has(id))
    currentPage.value = 1
    editingId.value = null
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) {
    return
  }
  currentPage.value = page
  editingId.value = null
}

const changePageSize = () => {
  currentPage.value = 1
}

const handleYearFilterChange = () => {
  currentPage.value = 1
  loadData()
}

const resetFilter = () => {
  filters.startDate = ''
  filters.endDate = ''
  filters.year = yearOptions.value.includes(defaultYear) ? defaultYear : yearOptions.value[0] || ''
  searchColumn.value = 'all'
  searchInput.value = ''
  searchKeyword.value = ''
  filterError.value = ''
  loadData()
}

const buildFilterParams = () => {
  const params = new URLSearchParams()
  if (filters.startDate) {
    params.append('start_date', filters.startDate)
  }
  if (filters.endDate) {
    params.append('end_date', filters.endDate)
  }
  if (filters.year) {
    params.append('year', filters.year)
  }
  if (searchKeyword.value.trim()) {
    params.append('q', searchKeyword.value.trim())
    if (searchColumn.value && searchColumn.value !== 'all') {
      params.append('column', searchColumn.value)
    }
  }
  return params
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
  if (filteredItems.value.length === 0) {
    toast.info('Tidak ada data untuk diexport.')
    return
  }
  isExporting.value = true
  try {
    const params = buildFilterParams()
    const url = `${apiBase}/sales-costs/export${params.toString() ? `?${params}` : ''}`
    const res = await authFetch(url)
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
    const fallbackName = `sales-cost_${today}.xlsx`
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

const doExportModal = async () => {
  isExporting.value = true
  try {
    const params = new URLSearchParams()
    if (exportRange.value === 'month' && exportMonthSC.value) {
      const [y, m] = exportMonthSC.value.split('-')
      const lastDay = new Date(Number(y), Number(m), 0).getDate()
      params.append('start_date', `${exportMonthSC.value}-01`)
      params.append('end_date', `${exportMonthSC.value}-${String(lastDay).padStart(2, '0')}`)
    } else if (exportRange.value === 'year' && exportYearSC.value) {
      params.append('start_date', `${exportYearSC.value}-01-01`)
      params.append('end_date', `${exportYearSC.value}-12-31`)
    }
    // 'all' → no date params sent = export all

    const url = `${apiBase}/sales-costs/export${params.toString() ? `?${params}` : ''}`
    const res = await authFetch(url)
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
    const fallbackName = `sales-cost_${today}.xlsx`
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

const triggerImport = () => {
  showImportModal.value = true
}

const downloadTemplate = async () => {
  if (isDownloadingTemplate.value) {
    return
  }
  isDownloadingTemplate.value = true
  try {
    const res = await authFetch(`${apiBase}/sales-costs/import/template`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal download template')
    }

    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      toast.info('Template belum tersedia.')
      return
    }
    const fallbackName = 'Template-Sales-Cost.xlsx'
    const filename = getFilenameFromHeader(res.headers.get('content-disposition')) || fallbackName
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 0)
    toast.success('Template berhasil diunduh.')
  } catch (error) {
    console.error(error)
    toast.error('Gagal mendownload template')
  } finally {
    isDownloadingTemplate.value = false
  }
}

const selectFile = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset input value so same file can be selected again
  target.value = ''

  const formData = new FormData()
  formData.append('file', file)

  isImporting.value = true
  showImportModal.value = false // Close modal during process

  try {
    const res = await authFetch(`${apiBase}/sales-costs/import`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Gagal import data')
    }

    const failures = Array.isArray(data.failures) ? data.failures : []
    const successCount = Number(data.successCountSalesCost ?? data.count ?? 0)
    const failCount = Number(data.failCountSalesCost ?? failures.length ?? 0)

    if (failCount > 0) {
      const hasContainerRequired = failures.some(
        (failure) => failure?.reasonCode === 'CONTAINER_SIZE_REQUIRED',
      )
      if (hasContainerRequired) {
        toast.error('Tolong Masukan Container Size')
      }
    }

    if (successCount > 0) {
      toast.success(`Import berhasil: ${successCount} data tersimpan`)
    } else if (failCount > 0) {
      toast.warning('Import selesai dengan kegagalan. Silakan cek data Anda.')
    } else {
      toast.info('Tidak ada data yang diimport.')
    }
    await alert({
      title: 'Hasil Import',
      message: `Berhasil: ${successCount}\nGagal: ${failCount}`,
      variant: failCount > 0 ? 'warning' : 'success',
      okText: 'OK',
    })
    await loadData()
  } catch (error: any) {
    console.error(error)
    toast.error(error.message || 'Terjadi kesalahan saat import')
  } finally {
    isImporting.value = false
  }
}

const resetForm = () => {
  form.id = null
  form.id_truck = ''
  form.id_driver = ''
  form.id_customer = ''
  form.id_area = ''
  form.departure_datetime = ''
  form.arrival_datetime = ''
  form.price = ''
  form.ops_cost = ''
  form.additional_cost = ''
}

const applyDetailToForm = (detail: SalesCostDetail) => {
  form.id = detail.id_sales_cost
  form.id_truck = detail.id_truck !== null ? String(detail.id_truck) : ''
  form.id_driver = detail.id_driver !== null ? String(detail.id_driver) : ''
  form.id_customer = detail.id_customer !== null ? String(detail.id_customer) : ''
  form.id_area = detail.id_area !== null ? String(detail.id_area) : ''
  form.departure_datetime = toDateInputValue(detail.departure_datetime)
  form.arrival_datetime = toDateInputValue(detail.arrival_datetime)
  form.price = detail.price !== null ? String(detail.price) : ''
  form.ops_cost = detail.ops_cost !== null ? String(detail.ops_cost) : ''
  form.additional_cost = detail.additional_cost !== null ? String(detail.additional_cost) : ''
  ensureSelectedTruckOption(form.id_truck)
}

const openForm = async (item?: SalesCostItem) => {
  formError.value = ''
  formLoading.value = false
  resetForm()
  if (!item) {
    formTitle.value = 'Tambah Transaksi'
    showCreateForm.value = true
    editingId.value = null
    return
  }

  formTitle.value = 'Edit Transaksi'
  form.id = item.id_sales_cost
  form.departure_datetime = toDateInputValue(item.departure_datetime)
  form.price = String(item.price)
  form.ops_cost = String(item.ops_cost)
  showCreateForm.value = false
  editingId.value = item.id_sales_cost
  formLoading.value = true

  try {
    const res = await fetch(`${apiBase}/sales-costs/${item.id_sales_cost}`)
    if (!res.ok) {
      throw new Error('Failed to fetch sales cost detail')
    }
    const detail = (await res.json()) as SalesCostDetail
    applyDetailToForm(detail)
  } catch (error) {
    console.error(error)
    formError.value = 'Gagal memuat detail transaksi. Silakan coba lagi.'
  } finally {
    formLoading.value = false
  }
}

const cancelForm = () => {
  showCreateForm.value = false
  editingId.value = null
  resetForm()
  formLoading.value = false
  formError.value = ''
}

const submitForm = async () => {
  if (formSubmitting.value || formLoading.value) {
    return
  }
  const payload: Record<string, unknown> = {
    id_truck: form.id_truck ? Number(form.id_truck) : null,
    id_driver: form.id_driver ? Number(form.id_driver) : null,
    id_customer: form.id_customer ? Number(form.id_customer) : null,
    id_area: form.id_area ? Number(form.id_area) : null,
    departure_datetime: form.departure_datetime,
    arrival_datetime: form.arrival_datetime,
    price: Number(form.price || 0),
    ops_cost: Number(form.ops_cost || 0),
    additional_cost: Number(form.additional_cost || 0),
    tgl_order: form.departure_datetime,
  }

  const isUpdate = Boolean(form.id)
  if (isUpdate) {
    const ok = await confirm({
      title: 'Konfirmasi Perubahan',
      message: 'Simpan perubahan pada data ini?',
      confirmText: 'Ya, simpan',
      cancelText: 'Batal',
      variant: 'warning',
    })
    if (!ok) {
      return
    }
  }

  formSubmitting.value = true
  try {
    if (isUpdate) {
      const res = await fetch(`${apiBase}/sales-costs/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const message = await res.text()
        if (res.status === 400 || res.status === 422) {
          toast.warning('Periksa input Anda')
        } else {
          toast.error(message || 'Gagal memperbarui transaksi.')
        }
        return
      }
      toast.success('Perubahan berhasil disimpan')
    } else {
      const res = await fetch(`${apiBase}/sales-costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const message = await res.text()
        if (res.status === 400 || res.status === 422) {
          toast.warning('Periksa input Anda')
        } else {
          toast.error(message || 'Gagal menyimpan transaksi.')
        }
        return
      }
      toast.success('Data berhasil disimpan')
    }
    showCreateForm.value = false
    editingId.value = null
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error(isUpdate ? 'Gagal memperbarui transaksi.' : 'Gagal menyimpan transaksi.')
  } finally {
    formSubmitting.value = false
  }
}

const remove = async (item: SalesCostItem) => {
  if (deletingId.value) {
    return
  }
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message: 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    deletingId.value = item.id_sales_cost
    const res = await authFetch(`${apiBase}/sales-costs/${item.id_sales_cost}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const message = await res.text()
      toast.error(message || 'Gagal menghapus transaksi.')
      return
    }
    toast.success('Data berhasil dihapus')
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Gagal menghapus transaksi.')
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadYearOptions()])
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
  },
)

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

watch(
  [isAllPagedSelected, isSomePagedSelected],
  () => {
    if (selectAllCheckbox.value) {
      selectAllCheckbox.value.indeterminate = isSomePagedSelected.value && !isAllPagedSelected.value
    }
  },
  { flush: 'post', immediate: true },
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
