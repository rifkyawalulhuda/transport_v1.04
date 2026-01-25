<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Filter Schedule Pengiriman">
        <form class="space-y-4" @submit.prevent="applyFilter">
          <div class="grid gap-4 sm:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Delivery Order
              </label>
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
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Arrival Order
              </label>
              <input
                v-model="filters.endDate"
                type="date"
                @click="openDatePicker"
                @focus="openDatePicker"
                @keydown.prevent
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kata Kunci (No Police / Customer / Driver / No DN)
              </label>
              <input
                v-model="filters.search"
                type="text"
                placeholder="Cari schedule..."
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
          <p
            v-if="filterError"
            class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
          >
            {{ filterError }}
          </p>
        </form>
      </ComponentCard>

      <ComponentCard title="Schedule Pengiriman">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total: {{ meta.totalItems }} transaksi
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
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    <button
                      type="button"
                      class="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      :disabled="!hasExpandableRows"
                      :aria-label="allExpanded ? 'Collapse all' : 'Expand all'"
                      @click="toggleAll"
                    >
                      <svg
                        class="h-4 w-4 transition-transform duration-200"
                        :class="allExpanded ? 'rotate-180' : ''"
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
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('delivery_order')"
                  >
                    <div class="flex items-center gap-1">
                      Delivery Order
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
                          :class="sortIconClass('delivery_order', 'asc')"
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
                          :class="sortIconClass('delivery_order', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
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
                          :class="sortIconClass('no_police', 'asc')"
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
                          :class="sortIconClass('no_police', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('driver')"
                  >
                    <div class="flex items-center gap-1">
                      Driver
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
                          :class="sortIconClass('driver', 'asc')"
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
                          :class="sortIconClass('driver', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('customer')"
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
                          :class="sortIconClass('customer', 'asc')"
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
                          :class="sortIconClass('customer', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('route')"
                  >
                    <div class="flex items-center gap-1">
                      Rute
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
                          :class="sortIconClass('route', 'asc')"
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
                          :class="sortIconClass('route', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('arrival')"
                  >
                    <div class="flex items-center gap-1">
                      Arrival Order
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
                          :class="sortIconClass('arrival', 'asc')"
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
                          :class="sortIconClass('arrival', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('no_po')"
                  >
                    <div class="flex items-center gap-1">
                      No. PO
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
                          :class="sortIconClass('no_po', 'asc')"
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
                          :class="sortIconClass('no_po', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('jenis_pengiriman')"
                  >
                    <div class="flex items-center gap-1">
                      Jenis Pengiriman
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
                          :class="sortIconClass('jenis_pengiriman', 'asc')"
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
                          :class="sortIconClass('jenis_pengiriman', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    DN
                  </th>
                  <th
                    class="group cursor-pointer px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6"
                    @click="toggleSort('trip')"
                  >
                    <div class="flex items-center gap-1">
                      Trip
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
                          :class="sortIconClass('trip', 'asc')"
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
                          :class="sortIconClass('trip', 'desc')"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody v-if="loading">
                <tr>
                  <td
                    :colspan="parentColumnCount"
                    class="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              </tbody>
              <tbody v-else-if="rows.length === 0">
                <tr>
                  <td
                    :colspan="parentColumnCount"
                    class="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada schedule pada rentang ini.
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <template v-for="row in rows" :key="row.id_sales_cost">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <td class="px-4 py-3 sm:px-6">
                      <button
                        v-if="row.dnCount > 0"
                        type="button"
                        class="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                        :aria-expanded="expanded[row.id_sales_cost] || false"
                        @click.stop="toggleExpand(row.id_sales_cost)"
                      >
                        <svg
                          class="h-4 w-4 transition-transform duration-200"
                          :class="expanded[row.id_sales_cost] ? 'rotate-180' : ''"
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
                      <span v-else class="inline-flex h-7 w-7 items-center justify-center text-gray-300">
                        -
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ formatDate(row.delivery_order) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.truck.no_police || '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.driver.name || '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.customer.name || '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.route.name || '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ formatDate(row.arrival) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.no_po || '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.jenis_pengiriman || '-' }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ row.dnCount }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 sm:px-6">
                      {{ resolveTrip(row) }}
                    </td>
                    <td class="px-4 py-3 sm:px-6">
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        :disabled="isDetailDisabled"
                        @click="goToDetail(row)"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                  <tr v-if="expanded[row.id_sales_cost]">
                    <td :colspan="parentColumnCount" class="px-5 py-4 sm:px-6">
                      <div
                        class="rounded-lg border border-gray-200 bg-emerald-50 p-5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-200"
                      >
                        <div class="max-w-full overflow-x-auto custom-scrollbar">
                          <table class="min-w-full">
                            <thead>
                              <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  No. DN
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Pickup
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Drop
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Qty
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  PKG
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  G.W
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  No. Container
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  No. Aju
                                </th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="item in row.dnItems"
                                :key="item._id"
                                class="border-b border-gray-200 last:border-b-0 dark:border-gray-700"
                              >
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.no_dn || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.almt_pickup || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.almt_drop || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.qty || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.pkg || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.gw || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.no_container || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.no_aju || '-' }}
                                </td>
                                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
                                  {{ item.remarks || '-' }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div
          class="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400"
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
              Sebelumnya
            </button>
            <div class="flex items-center gap-1">
              <template v-for="item in paginationItems" :key="item.key">
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
              :disabled="loading || currentPage >= meta.totalPages"
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import { API_BASE } from '@/config/api'
import { authFetch, useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'

type DnItem = {
  _id: string
  no_dn: string | null
  almt_pickup: string | null
  almt_drop: string | null
  qty: string | null
  pkg: string | null
  gw: string | null
  no_container: string | null
  no_aju: string | null
  remarks: string | null
}

type ScheduleRow = {
  id_sales_cost: number
  delivery_order: string | null
  arrival: string | null
  no_spk: string | number
  no_po: string | null
  jenis_pengiriman: string | null
  trip: string | null
  truck: { id: number | null; no_police: string | null; jenis_kendaraan?: string | null }
  driver: { id: number | null; name: string | null }
  customer: { id: number | null; name: string | null }
  route: { id: number | null; name: string | null }
  dnCount: number
  dnItems: DnItem[]
  detailUrl: string
}

type SortKey =
  | 'delivery_order'
  | 'no_police'
  | 'driver'
  | 'customer'
  | 'route'
  | 'arrival'
  | 'no_po'
  | 'jenis_pengiriman'
  | 'trip'

type ScheduleMeta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  start_date: string
  end_date: string
  search: string
}

type ScheduleResponse = {
  meta: ScheduleMeta
  rows: ScheduleRow[]
}

type PaginationItem =
  | { type: 'page'; value: number; key: string }
  | { type: 'ellipsis'; key: string }

const currentPageTitle = ref('Schedule Pengiriman')
const router = useRouter()
const toast = useToast()
const authUser = useAuthUser()
const isDetailDisabled = computed(() => {
  const level = authUser.value?.level
  return level === 'cs' || level === 'mekanik'
})

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDefaultDateRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  }
}

const filters = reactive({
  startDate: '',
  endDate: '',
  search: ''
})
const filterError = ref('')
const rows = ref<ScheduleRow[]>([])
const loading = ref(false)
const expanded = reactive<Record<number, boolean>>({})

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 50]
const sortColumn = ref<SortKey>('delivery_order')
const sortOrder = ref<'asc' | 'desc'>('asc')

const meta = reactive<ScheduleMeta>({
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  start_date: '',
  end_date: '',
  search: ''
})

const parentColumnCount = 12
const hasExpandableRows = computed(() => rows.value.some((row) => row.dnCount > 0))
const allExpanded = computed(() => {
  const expandable = rows.value.filter((row) => row.dnCount > 0)
  if (expandable.length === 0) {
    return false
  }
  return expandable.every((row) => expanded[row.id_sales_cost])
})

const paginationItems = computed<PaginationItem[]>(() => {
  const total = meta.totalPages || 1
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

const openDatePicker = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (target && typeof target.showPicker === 'function') {
    target.showPicker()
  }
}

const resolveTrip = (row: ScheduleRow) => {
  const tripValue = row.trip ? String(row.trip).trim() : ''
  if (tripValue) {
    return tripValue
  }
  const jenis = row.jenis_pengiriman ? String(row.jenis_pengiriman).trim() : ''
  if (jenis) {
    return jenis
  }
  return row.dnCount
}

const applyFilter = () => {
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    filterError.value = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir.'
    return
  }
  filterError.value = ''
  currentPage.value = 1
  loadData()
}

const resetFilter = () => {
  const defaults = getDefaultDateRange()
  filters.startDate = defaults.startDate
  filters.endDate = defaults.endDate
  filters.search = ''
  filterError.value = ''
  currentPage.value = 1
  loadData()
}

const buildParams = () => {
  const params = new URLSearchParams()
  params.append('page', String(currentPage.value))
  params.append('pageSize', String(pageSize.value))
  params.append('sort_by', sortColumn.value)
  params.append('sort_dir', sortOrder.value)
  if (filters.startDate) {
    params.append('start_date', filters.startDate)
  }
  if (filters.endDate) {
    params.append('end_date', filters.endDate)
  }
  if (filters.search.trim()) {
    params.append('search', filters.search.trim())
  }
  return params
}

const loadData = async () => {
  loading.value = true
  try {
    const params = buildParams()
    const res = await authFetch(`${API_BASE}/schedule-pengiriman?${params.toString()}`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat schedule pengiriman.')
    }
    const data = (await res.json()) as ScheduleResponse
    rows.value = Array.isArray(data.rows) ? data.rows : []
    if (data.meta) {
      meta.page = data.meta.page
      meta.pageSize = data.meta.pageSize
      meta.totalItems = data.meta.totalItems
      meta.totalPages = data.meta.totalPages
      meta.start_date = data.meta.start_date
      meta.end_date = data.meta.end_date
      meta.search = data.meta.search
    }
    if (!filters.startDate && meta.start_date) {
      filters.startDate = meta.start_date
    }
    if (!filters.endDate && meta.end_date) {
      filters.endDate = meta.end_date
    }
    Object.keys(expanded).forEach((key) => {
      delete expanded[Number(key)]
    })
  } catch (error: any) {
    console.error(error)
    toast.error(error.message || 'Terjadi kesalahan saat memuat data.')
  } finally {
    loading.value = false
  }
}

const toggleExpand = (id: number) => {
  expanded[id] = !expanded[id]
}

const toggleAll = () => {
  const shouldExpand = !allExpanded.value
  rows.value.forEach((row) => {
    if (row.dnCount > 0) {
      expanded[row.id_sales_cost] = shouldExpand
    }
  })
}

const toggleSort = (column: SortKey) => {
  if (sortColumn.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  loadData()
}

const sortIconClass = (column: SortKey, direction: 'asc' | 'desc') => {
  return sortColumn.value === column && sortOrder.value === direction
    ? 'text-brand-500'
    : 'text-gray-300 group-hover:text-gray-400'
}

const goToDetail = (row: ScheduleRow) => {
  const target = row.detailUrl || `/sales-cost/${row.id_sales_cost}`
  router.push(target)
}

const goToPage = (page: number) => {
  if (page < 1 || page > meta.totalPages) {
    return
  }
  currentPage.value = page
  loadData()
}

const changePageSize = () => {
  currentPage.value = 1
  loadData()
}

onMounted(() => {
  const defaults = getDefaultDateRange()
  filters.startDate = defaults.startDate
  filters.endDate = defaults.endDate
  loadData()
})
</script>
