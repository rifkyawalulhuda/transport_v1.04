<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Filter Tanggal & Pencarian">
        <form
          class="space-y-4"
          @submit.prevent="loadData"
        >
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

      <ComponentCard title="Daftar Sales Cost">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
          <RouterLink
            to="/sales-cost/new"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Tambah Transaksi
          </RouterLink>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total: {{ filteredItems.length }} transaksi
          </p>
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
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >Delivery Order</label
                >
                <input
                  v-model="form.delivery_order"
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
                  v-model="form.arrival_order"
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
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    No
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    No. SPK
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Tanggal Kirim
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Customer
                  </th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">
                    Sales
                  </th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">
                    Ops Cost
                  </th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">
                    Gross Profit
                  </th>
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <template v-for="(item, index) in pagedItems" :key="item.id_sales_cost">
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.id_sales_cost }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ formatDate(item.delivery_order) }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.nama_customer }}
                    </td>
                    <td class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ formatRupiah(item.price) }}
                    </td>
                    <td class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ formatRupiah(item.total ?? item.ops_cost) }}
                    </td>
                    <td class="px-5 py-3 text-right text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ formatRupiah(item.margin) }}
                    </td>
                    <td class="px-5 py-3 text-center sm:px-6">
                      <div class="flex items-center justify-center gap-2">
                        <RouterLink
                          :to="`/sales-cost/${item.id_sales_cost}`"
                          class="w-24 rounded-lg bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-400"
                        >
                          Details
                        </RouterLink>
                        <RouterLink
                          :to="`/sales-cost/${item.id_sales_cost}/edit`"
                          class="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400"
                        >
                          Edit
                        </RouterLink>
                        <RouterLink
                          :to="`/sales-cost/${item.id_sales_cost}/print`"
                          target="_blank"
                          rel="noopener"
                          class="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400"
                        >
                          Cetak
                        </RouterLink>
                        <button
                          v-if="isAdmin"
                          type="button"
                          :disabled="deletingId === item.id_sales_cost"
                          class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-error-500/15 dark:text-error-400"
                          @click="remove(item)"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="editingId === item.id_sales_cost">
                    <td
                      colspan="8"
                      class="bg-gray-50 px-5 py-4 sm:px-6 dark:bg-gray-900/40"
                    >
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
                                >Delivery Order</label
                              >
                              <input
                                v-model="form.delivery_order"
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
                                v-model="form.arrival_order"
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
                    colspan="8"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
                <tr v-if="loading">
                  <td
                    colspan="8"
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
      <div
        class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h3 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          Import Sales Cost
        </h3>
        
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            {{ isDownloadingTemplate ? 'Mengunduh...' : 'Download Template' }}
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="selectFile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
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
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { API_BASE } from '@/config/api'
import { authFetch, authService } from '@/services/auth'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

type SalesCostItem = {
  id_sales_cost: number
  delivery_order: string
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
  delivery_order: string | null
  arrival_order: string | null
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
  delivery_order: string
  arrival_order: string
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
const { confirm } = useDialog()
const toast = useToast()
const items = ref<SalesCostItem[]>([])
const loading = ref(false)
const isExporting = ref(false)
const isImporting = ref(false)
const isDownloadingTemplate = ref(false)
const showImportModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const currentPage = ref(1)
const pageSize = 15
const searchColumns = [
  { value: 'all', label: 'Semua Kolom', placeholder: 'Cari transaksi...' },
  { value: 'id_sales_cost', label: 'No. SPK', placeholder: 'Cari no. SPK' },
  { value: 'nama_customer', label: 'Customer', placeholder: 'Cari customer' },
  { value: 'nama_area', label: 'Rute', placeholder: 'Cari rute' },
  { value: 'nama_driver', label: 'Driver', placeholder: 'Cari driver' },
  { value: 'no_police', label: 'No. Police', placeholder: 'Cari no. police' }
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
        item.no_police
      ].some(matches)
    )
  }
  return items.value.filter((item) => matches(item[searchColumn.value as keyof SalesCostItem]))
})
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})
const totalPages = computed(() => {
  if (filteredItems.value.length === 0) {
    return 1
  }
  return Math.ceil(filteredItems.value.length / pageSize)
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
  endDate: ''
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
  delivery_order: '',
  arrival_order: '',
  price: '',
  ops_cost: '',
  additional_cost: ''
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

const formatRupiah = (value: number) => {
  const number = Number(value) || 0
  return number.toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
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
    fetch(`${apiBase}/areas`)
  ])
  trucks.value = await truckRes.json()
  drivers.value = await driverRes.json()
  customers.value = await customerRes.json()
  areas.value = await areaRes.json()
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
      `${apiBase}/sales-costs${params.toString() ? `?${params.toString()}` : ''}`
    )
    const data = await res.json()
    items.value = data
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

const resetFilter = () => {
  filters.startDate = ''
  filters.endDate = ''
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
    const filename =
      getFilenameFromHeader(res.headers.get('content-disposition')) || fallbackName
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
      body: formData
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Gagal import data')
    }

    toast.success(`Import berhasil: ${data.count} data tersimpan`)
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
  form.delivery_order = ''
  form.arrival_order = ''
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
  form.delivery_order = toDateInputValue(detail.delivery_order)
  form.arrival_order = toDateInputValue(detail.arrival_order)
  form.price = detail.price !== null ? String(detail.price) : ''
  form.ops_cost = detail.ops_cost !== null ? String(detail.ops_cost) : ''
  form.additional_cost = detail.additional_cost !== null ? String(detail.additional_cost) : ''
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
  form.delivery_order = toDateInputValue(item.delivery_order)
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
    delivery_order: form.delivery_order,
    arrival_order: form.arrival_order,
    price: Number(form.price || 0),
    ops_cost: Number(form.ops_cost || 0),
    additional_cost: Number(form.additional_cost || 0),
    tgl_order: form.delivery_order
  }

  const isUpdate = Boolean(form.id)
  if (isUpdate) {
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
  }

  formSubmitting.value = true
  try {
    if (isUpdate) {
      const res = await fetch(`${apiBase}/sales-costs/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
    deletingId.value = item.id_sales_cost
    const res = await authFetch(`${apiBase}/sales-costs/${item.id_sales_cost}`, {
      method: 'DELETE'
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
  await Promise.all([loadOptions(), loadData()])
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

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})
</script>
