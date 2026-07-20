<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">

      <!-- -- Filter Section (Compact) ------------------------------ -->
      <ComponentCard :title="filterTitle">
        <form class="space-y-4" @submit.prevent="applyFilter">
          <div class="grid gap-4 sm:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Departure
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
                Tanggal Arrival
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
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Status
              </label>
              <select
                v-model="filters.status"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="">Semua Status</option>
                <option value="waiting">Menunggu</option>
                <option value="on_trip">Dalam Perjalanan</option>
                <option value="overdue">Terlambat</option>
                <option value="completed">Selesai</option>
                <option value="incomplete_finish">Belum Lengkap</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kata Kunci
              </label>
              <input
                v-model="filters.search"
                type="text"
                placeholder="No. Police / Customer / Driver / No. DN..."
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

      <!-- SPK filter banner from Monitoring Kendaraan -->
      <div
        v-if="spkIdsActive"
        class="flex items-center justify-between rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm dark:border-warning-500/30 dark:bg-warning-500/10"
      >
        <div class="flex items-center gap-2 text-warning-700 dark:text-warning-300">
          <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
          <span>
            Menampilkan <strong>{{ spkIdsActive.split(',').length }} SPK</strong> aktif dari Monitoring Kendaraan
          </span>
        </div>
        <button
          type="button"
          class="ml-4 text-xs font-medium text-warning-600 hover:text-warning-800 dark:text-warning-400 dark:hover:text-warning-200"
          @click="spkIdsActive = ''; loadData()"
        >
          × Hapus filter
        </button>
      </div>

      <!-- -- Schedule Cards ---------------------------------------- -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <!-- Toolbar -->
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              <span class="font-semibold text-gray-700 dark:text-gray-200">{{ meta.totalItems }}</span> transaksi ditemukan
            </p>
            <p v-if="filters.startDate || filters.search" class="text-xs text-gray-400 dark:text-gray-500">
              {{ filters.startDate }} &mdash; {{ filters.endDate }}
              <span v-if="filters.search"> &bull; cari: "{{ filters.search }}"</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
            <select
              v-model.number="pageSize"
              class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @change="changePageSize"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
          <div v-for="n in 3" :key="n" class="animate-pulse rounded-xl border border-gray-200 p-5 dark:border-gray-700">
            <div class="mb-3 h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="mb-2 h-3 w-80 rounded bg-gray-200 dark:bg-gray-700" />
            <div class="h-3 w-64 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredRows.length === 0" class="flex flex-col items-center gap-2 py-12 text-center">
          <svg class="h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p class="text-sm text-gray-500 dark:text-gray-400">Tidak ada schedule pada rentang ini.</p>
        </div>

        <!-- Cards -->
        <div v-else class="space-y-3">
          <div
            v-for="row in filteredRows"
            :key="row.id_sales_cost"
            class="group rounded-xl border bg-white transition hover:border-brand-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500/40"
          >
            <!-- Card Header -->
              <button
                type="button"
                class="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-gray-800/30"
                @click="toggleCard(row.id_sales_cost)"
              >
                <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">SPK</span>
                <span class="text-sm font-bold text-gray-800 dark:text-gray-100">{{ row.id_sales_cost }}</span>
                <span class="mx-1 text-gray-300 dark:text-gray-600">|</span>
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ row.truck.no_police || '-' }}</span>
                <span v-if="row.truck.jenis_kendaraan" class="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {{ row.truck.jenis_kendaraan }}
                </span>
              </div>
                <div class="flex items-center gap-2">
                  <!-- Status badge -->
                <span
                  v-if="resolveStatus(row).color === 'success'"
                  class="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-0.5 text-[11px] font-semibold text-success-700 dark:bg-success-500/15 dark:text-success-400"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                  {{ resolveStatus(row).label }}
                </span>
                <span
                  v-else-if="resolveStatus(row).color === 'error'"
                  class="inline-flex items-center gap-1 rounded-full bg-error-100 px-2.5 py-0.5 text-[11px] font-semibold text-error-700 dark:bg-error-500/15 dark:text-error-400"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                  {{ resolveStatus(row).label }}
                </span>
                <span
                  v-else-if="resolveStatus(row).color === 'warning'"
                  class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-[11px] font-semibold text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
                >
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  {{ resolveStatus(row).label }}
                </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  >
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ resolveStatus(row).label }}
                  </span>

                  <svg
                    class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                    :class="isCardExpanded(row.id_sales_cost) ? 'rotate-180' : ''"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25L12 15.75 4.5 8.25" />
                  </svg>
                </div>
              </button>

              <!-- Card Body -->
              <div class="px-4 py-3">
              <!-- Meta row: Customer � Driver � Rute -->
              <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                  <span class="font-medium text-gray-600 dark:text-gray-300">{{ row.driver.name || '-' }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <svg class="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008z"/></svg>
                  <span class="text-gray-600 dark:text-gray-300">{{ row.customer.name || '-' }}</span>
                </span>
                <span class="flex items-center gap-1">
                  <svg class="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>
                  <span class="text-gray-600 dark:text-gray-300">{{ row.route.name || '-' }}</span>
                </span>
              </div>

              <!-- Compact summary always visible -->
              <div class="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {{ resolveProgressLabel(row) }}
                </span>
                <span
                  v-if="row.finish_hit"
                  class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  Finish tercapai
                </span>
              </div>

              <p
                v-if="resolveScheduleHint(row)"
                class="mb-3 text-xs"
                :class="
                  row.has_incomplete_finish
                    ? 'text-warning-700 dark:text-warning-400'
                    : row.schedule_status === 'completed'
                      ? 'text-success-700 dark:text-success-400'
                      : row.schedule_status === 'overdue'
                        ? 'text-error-700 dark:text-error-400'
                        : 'text-gray-500 dark:text-gray-400'
                "
              >
                {{ resolveScheduleHint(row) }}
              </p>

              <!-- Expanded content only -->
              <div v-if="isCardExpanded(row.id_sales_cost)">
              <!-- Full Timeline: all delivery stops with actual status -->
              <div class="relative mb-3 pl-8">
                <div class="absolute left-3 top-4 bottom-4 w-0.5 bg-gradient-to-b from-brand-300 via-gray-200 to-gray-300 dark:from-brand-500/50 dark:via-gray-700 dark:to-gray-600" />

                <div class="space-y-3">
                  <div
                    v-for="(stop, stopIdx) in row.delivery_stops_summary"
                    :key="stop.id"
                    class="relative"
                  >
                    <!-- Node dot -->
                    <div
                      class="absolute -left-8 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900"
                      :class="
                        stop.incomplete_finish
                          ? 'bg-warning-500'
                          : stop.hit
                            ? 'bg-success-500'
                            : stop.inferred_passed
                              ? 'bg-success-500'
                              : stop.overdue
                                ? 'bg-error-500'
                                : stop.is_departure
                                  ? 'bg-brand-500'
                                  : stop.is_finish
                                    ? 'bg-gray-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                      "
                    >
                      <span class="text-[10px] font-bold text-white">
                        <template v-if="stop.is_departure">D</template>
                        <template v-else-if="stop.is_finish">F</template>
                        <template v-else>{{ stop.stop_order }}</template>
                      </span>
                    </div>

                    <!-- Stop content -->
                    <div class="rounded-lg border px-3 py-2"
                      :class="
                        stop.incomplete_finish
                          ? 'border-warning-200 bg-warning-50/50 dark:border-warning-500/30 dark:bg-warning-500/10'
                          : stop.hit || stop.inferred_passed
                            ? 'border-success-200 bg-success-50/50 dark:border-success-500/20 dark:bg-success-500/5'
                            : stop.overdue
                              ? 'border-error-200 bg-error-50/50 dark:border-error-500/30 dark:bg-error-500/10'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                      "
                    >
                      <div class="flex flex-wrap items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                              <template v-if="stop.is_departure">Departure</template>
                              <template v-else-if="stop.is_finish">Finish</template>
                              <template v-else>Tujuan {{ stop.stop_order }}</template>
                            </span>
                            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              {{ stop.wialon_zone_name || stop.stop_name || '-' }}
                            </span>
                          </div>

                          <div class="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>
                              <span class="font-medium text-gray-600 dark:text-gray-300">Alamat:</span>
                              {{ stop.wialon_zone_name || stop.stop_name || '-' }}
                            </span>
                            <span>
                              <span class="font-medium text-gray-600 dark:text-gray-300">Est:</span>
                              {{ stop.estimated_arrival ? formatDateTime(stop.estimated_arrival) : '-' }}
                            </span>
                            <span v-if="stop.actual_arrival">
                              <span class="font-medium text-gray-600 dark:text-gray-300">Aktual:</span>
                              {{ formatDateTime(stop.actual_arrival) }}
                            </span>
                          </div>

                          <p
                            v-if="stop.incomplete_finish"
                            class="mt-1 text-[11px] text-warning-700 dark:text-warning-400"
                          >
                            Masih ada tujuan yang belum dikunjungi.
                          </p>
                          <p
                            v-else-if="stop.inferred_passed"
                            class="mt-1 text-[11px] text-success-700 dark:text-success-400"
                          >
                            Keberangkatan dianggap sudah terlampaui karena tujuan berikutnya sudah visited.
                          </p>
                        </div>

                        <div class="flex-shrink-0">
                          <span
                            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            :class="
                              resolveStopBadge(stop).color === 'success'
                                ? 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                                : resolveStopBadge(stop).color === 'warning'
                                  ? 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
                                  : resolveStopBadge(stop).color === 'error'
                                    ? 'bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            "
                          >
                            {{ resolveStopBadge(stop).label }}
                          </span>
                          <span
                            v-if="stop.hit"
                            class="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            :class="
                              stop.is_manual
                                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                : 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300'
                            "
                          >
                            {{ stop.is_manual ? 'Manual' : 'GPS' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Info row: PO, Jenis, Trip -->
              <div class="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span v-if="row.no_po" class="flex items-center gap-1">
                  <span class="font-medium text-gray-600 dark:text-gray-300">PO:</span> {{ row.no_po }}
                </span>
                <span v-if="row.jenis_pengiriman" class="flex items-center gap-1">
                  <span class="font-medium text-gray-600 dark:text-gray-300">Jenis:</span> {{ row.jenis_pengiriman }}
                </span>
                <span v-if="resolveTrip(row)" class="flex items-center gap-1">
                  <span class="font-medium text-gray-600 dark:text-gray-300">Trip:</span> {{ resolveTrip(row) }}
                </span>
              </div>
              </div>
            </div>

            <!-- Card Footer: DN pills + Action -->
            <div class="flex items-center justify-between gap-3 rounded-b-xl border-t border-gray-100 bg-gray-50/50 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/30">
              <!-- DN pill chips -->
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <button
                  v-if="row.dnCount > 0"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                  @click="toggleExpand(row.id_sales_cost)"
                >
                  <svg
                    class="h-3 w-3 transition-transform"
                    :class="expanded[row.id_sales_cost] ? 'rotate-90' : ''"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  {{ row.dnCount }} DN
                </button>
                <span
                  v-for="(item, dnIdx) in row.dnItems.slice(0, expanded[row.id_sales_cost] ? row.dnItems.length : 2)"
                  :key="dnIdx"
                  class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-gray-500 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700"
                >
                  <span class="max-w-[120px] truncate">{{ item.no_dn || item.almt_pickup?.split(' ').slice(0,2).join(' ') || '-' }}</span>
                  <svg class="h-2.5 w-2.5 flex-shrink-0 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  <span class="max-w-[120px] truncate">{{ item.almt_drop?.split(' ').slice(0,2).join(' ') || '-' }}</span>
                </span>
                <span v-if="!expanded[row.id_sales_cost] && row.dnCount > 2" class="text-[10px] text-gray-400 dark:text-gray-500">
                  +{{ row.dnCount - 2 }} lagi
                </span>
              </div>

              <!-- Action button -->
              <div class="flex-shrink-0">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-brand-500/10"
                  :disabled="isDetailDisabled"
                  @click="goToDetail(row)"
                >
                  Detail
                  <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </button>
              </div>
            </div>

            <!-- Expanded DN Items (collapsible pills) -->
            <div v-if="expanded[row.id_sales_cost] && row.dnItems.length > 0" class="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="(item, dnIdx) in row.dnItems"
                  :key="dnIdx"
                  class="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900/50"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{{ item.no_dn || '-' }}</span>
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">{{ item.qty || '-' }} {{ item.pkg || '' }}</span>
                  </div>
                  <p class="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {{ item.almt_pickup || '-' }} → {{ item.almt_drop || '-' }}
                  </p>
                  <div v-if="item.gw || item.no_container" class="mt-1 flex gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <span v-if="item.gw">GW: {{ item.gw }}</span>
                    <span v-if="item.no_container">Cont: {{ item.no_container }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          class="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/30"
        >
          <div>
            Halaman <span class="font-medium text-gray-700 dark:text-gray-200">{{ currentPage }}</span>
            dari <span class="font-medium text-gray-700 dark:text-gray-200">{{ meta.totalPages }}</span>
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
      </div>
    </div>
  </AdminLayout>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

type DeliveryStopSummary = {
  id: number
  stop_order: number
  stop_name: string
  wialon_zone_name: string | null
  estimated_arrival: string | null
  is_departure: boolean
  is_finish: boolean
  hit: boolean
  actual_arrival: string | null
  is_manual: boolean
  inferred_passed: boolean
  incomplete_finish: boolean
  overdue: boolean
}

type ScheduleRow = {
  id_sales_cost: number
  departure_datetime: string | null
  arrival: string | null
  finish_order_datetime: string | null
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

  schedule_status: 'waiting' | 'on_trip' | 'overdue' | 'incomplete_finish' | 'completed'
  visited_stops: number
  total_stops: number
  finish_hit: boolean
  has_incomplete_finish: boolean
  delivery_stops_summary: DeliveryStopSummary[]
}

type SortKey =
  | 'departure_datetime'
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
const route = useRoute()
const spkIdsActive = ref<string>('')  // comma-separated spk_ids from URL, empty = normal mode
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
  start.setDate(start.getDate() - 7)  // 7 hari lalu
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 7)      // 7 hari ke depan
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  }
}

const filters = reactive({
  startDate: '',
  endDate: '',
  search: '',
  status: ''
})
const filterError = ref('')
const rows = ref<ScheduleRow[]>([])
const loading = ref(false)
const expanded = reactive<Record<number, boolean>>({})
const expandedCards = reactive<Record<number, boolean>>({})

// Client-side status filter applied on top of server-side date/search filter
const filteredRows = computed(() => {
  if (!filters.status) return rows.value
  return rows.value.filter(row => row.schedule_status === filters.status)
})

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 50]
const sortColumn = ref<SortKey>('departure_datetime')
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

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
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

const resolveStatus = (row: ScheduleRow): { label: string; color: string } => {
  switch (row.schedule_status) {
    case 'completed':
      return { label: 'Selesai', color: 'success' }
    case 'incomplete_finish':
      return { label: 'Belum Lengkap', color: 'warning' }
    case 'overdue':
      return { label: 'Terlambat', color: 'error' }
    case 'on_trip':
      return { label: 'Dalam Perjalanan', color: 'warning' }
    default:
      return { label: 'Menunggu', color: 'gray' }
  }
}

const resolveProgressLabel = (row: ScheduleRow) => {
  if (!row.total_stops) {
    return 'Belum ada tujuan terdaftar'
  }
  return `${row.visited_stops} / ${row.total_stops} tujuan tercapai`
}

const resolveScheduleHint = (row: ScheduleRow) => {
  if (row.has_incomplete_finish) {
    return 'Finish sudah tercapai, tapi masih ada tujuan yang belum lengkap.'
  }
  if (row.schedule_status === 'completed') {
    return 'Semua tujuan sudah tercapai.'
  }
  if (row.schedule_status === 'overdue') {
    return 'Estimasi arrival sudah lewat.'
  }
  return ''
}

const isCardExpanded = (id: number) => Boolean(expandedCards[id])

const toggleCard = (id: number) => {
  expandedCards[id] = !expandedCards[id]
}

const resolveStopBadge = (stop: DeliveryStopSummary): { label: string; color: string } => {
  if (stop.incomplete_finish) {
    return { label: 'Belum Lengkap', color: 'warning' }
  }
  if (stop.hit) {
    return { label: 'Sudah Tiba', color: 'success' }
  }
  if (stop.inferred_passed) {
    return { label: 'Terlampaui', color: 'success' }
  }
  if (stop.overdue) {
    return { label: 'Terlambat', color: 'error' }
  }
  return { label: 'Menunggu', color: 'gray' }
}

const filterTitle = computed(() => {
  const prefix = filters.startDate || filters.search ? 'Filter' : 'Filter Schedule Pengiriman'
  const suffix = filters.startDate ? ` (${filters.startDate} — ${filters.endDate})` : ''
  return prefix + suffix
})

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
  filters.status = ''
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
  if (spkIdsActive.value) {
    params.append('spk_ids', spkIdsActive.value)
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
    Object.keys(expandedCards).forEach((key) => {
      delete expandedCards[Number(key)]
    })
    rows.value.forEach((row) => {
      if (row.schedule_status === 'overdue' || row.schedule_status === 'incomplete_finish') {
        expandedCards[row.id_sales_cost] = true
      }
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
  if (route.query.spk_ids) {
    // Navigate from Monitoring Kendaraan badge — filter by specific SPK IDs
    spkIdsActive.value = String(route.query.spk_ids)
    // Don't set date range defaults — spk_ids mode bypasses date filter
  } else {
    const defaults = getDefaultDateRange()
    filters.startDate = defaults.startDate
    filters.endDate = defaults.endDate
  }
  loadData()
})
</script>
