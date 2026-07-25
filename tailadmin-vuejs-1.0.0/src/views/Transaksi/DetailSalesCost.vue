<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Transaksi Sales Cost">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi</div>
          <div class="flex items-center gap-2">
            <RouterLink
              :to="`/sales-cost/${$route.params.id}/print`"
              target="_blank"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              Print
            </RouterLink>
            <RouterLink
              to="/sales-cost"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Kembali
            </RouterLink>
          </div>
        </div>

        <p
          v-if="formError"
          class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
        >
          {{ formError }}
        </p>
        <p v-else-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
          Memuat detail transaksi...
        </p>

        <div v-else class="space-y-6">
          <!-- Header: Info Utama -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div class="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-200 dark:divide-gray-800">
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">No. SPK</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatText(detail.id_sales_cost) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Customer</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatText(detail.nama_customer) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Dibuat oleh</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.created_by_name) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Rute</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.nama_area) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Driver</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.nama_driver) }}</p>
              </div>
              <div class="p-4">
                <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Jenis Pengiriman</p>
                <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ formatText(detail.jenis_trip) }}</p>
              </div>
            </div>
          </div>

          <!-- Kendaraan & Container -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h6l3-3V9h-3"/></svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Kendaraan & Container</p>
            </div>
            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <div><span class="text-xs text-gray-400 dark:text-gray-500">No. Police</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.no_police) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Jenis Kendaraan</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.jenis_kendaraan) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Container Size</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.container_size) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">No. Container</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.no_container) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Container Depot</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.container_depot) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Trip</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.trip) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">No. PO</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.no_po) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Bills</span><p class="text-sm font-medium text-gray-800 dark:text-gray-100">{{ formatText(detail.bills) }}</p></div>
            </div>
          </div>

          <!-- Timeline Pengiriman -->
          <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-gray-900/30">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Timeline Pengiriman</p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Departure</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDateTime(detail.departure_datetime) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Arrival</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDateTime(detail.arrival_datetime) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Finish Order</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDateTime(detail.finish_order_datetime) }}</p>
              </div>
              <div class="rounded-lg border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
                <p class="text-[11px] text-brand-600 dark:text-brand-400">Waktu Pengiriman</p>
                <p class="mt-1 text-sm font-bold text-brand-700 dark:text-brand-300">{{ shippingDurationLabel }}</p>
              </div>
            </div>

            <!-- Jadwal & Realisasi Pengiriman — Modern Timeline Design -->
            <div v-if="deliveryStopsWithHistory.length > 0" class="mt-4">
              <!-- Section header -->
              <div class="mb-4 flex items-center gap-2">
                <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                  <svg class="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">Jadwal &amp; Realisasi Pengiriman</p>
                  <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ deliveryStopsWithHistory.length }} titik perjalanan</p>
                </div>
              </div>

              <!-- Timeline -->
              <div class="relative pl-10">
                <!-- Connector line -->
                <div class="absolute left-4 top-5 bottom-5 w-0.5 bg-gradient-to-b from-brand-400 via-gray-200 to-gray-400 dark:from-brand-500/60 dark:via-gray-700 dark:to-gray-600" />

                <div
                  v-for="(stop, index) in deliveryStopsWithHistory"
                  :key="stop.id"
                  class="relative mb-4 last:mb-0"
                >
                  <!-- Node dot -->
                  <div
                    class="absolute -left-10 top-2 z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4"
                    :class="stop.incomplete_finish
                      ? 'bg-warning-500 ring-warning-100 dark:ring-warning-500/20'
                      : stop.hit
                        ? 'bg-success-500 ring-success-100 dark:ring-success-500/20'
                        : stop.geofence_skipped
                          ? 'bg-warning-500 ring-warning-100 dark:ring-warning-500/20'
                          : stop.inferred_passed
                            ? 'bg-success-500 ring-success-100 dark:ring-success-500/20'
                            : stop.overdue
                              ? 'bg-warning-500 ring-warning-100 dark:ring-warning-500/20'
                              : stop.is_departure
                                ? 'bg-brand-500 ring-brand-100 dark:ring-brand-500/20'
                                : stop.is_finish
                                  ? 'bg-gray-600 ring-gray-100 dark:bg-gray-500 dark:ring-gray-900'
                                  : 'border-2 border-gray-300 bg-white ring-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:ring-gray-900'"
                  >
                    <!-- Departure icon -->
                    <svg v-if="stop.is_departure" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    <!-- Finish icon -->
                    <svg v-else-if="stop.is_finish" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                    </svg>
                    <!-- Incomplete finish warning -->
                    <svg v-else-if="stop.incomplete_finish" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <!-- Hit checkmark -->
                    <svg v-else-if="stop.hit" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <!-- Geofence skipped -->
                    <svg v-else-if="stop.geofence_skipped" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <!-- Inferred departure passed -->
                    <svg v-else-if="stop.inferred_passed" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                    <!-- Overdue warning -->
                    <svg v-else-if="stop.overdue" class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <!-- Middle stop: numbered -->
                    <span v-else class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ index }}</span>
                  </div>

                  <!-- Card -->
                  <div
                    class="rounded-xl border p-4 transition-all"
                    :class="stop.incomplete_finish
                      ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-white dark:border-warning-500/20 dark:from-warning-500/5 dark:to-gray-900'
                      : stop.hit
                        ? 'border-success-200 bg-gradient-to-br from-success-50 to-white dark:border-success-500/20 dark:from-success-500/5 dark:to-gray-900'
                        : stop.geofence_skipped
                          ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-white dark:border-warning-500/20 dark:from-warning-500/5 dark:to-gray-900'
                          : stop.inferred_passed
                            ? 'border-success-200 bg-gradient-to-br from-success-50 to-white dark:border-success-500/20 dark:from-success-500/5 dark:to-gray-900'
                            : stop.overdue
                              ? 'border-warning-200 bg-gradient-to-br from-warning-50 to-white dark:border-warning-500/20 dark:from-warning-500/5 dark:to-gray-900'
                              : stop.is_departure
                                ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-white dark:border-brand-500/30 dark:from-brand-500/5 dark:to-gray-900'
                                : stop.is_finish
                                  ? 'border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-900'
                                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0 flex-1">
                        <!-- Label row -->
                        <div class="mb-1 flex flex-wrap items-center gap-2">
                          <span
                            class="text-[10px] font-bold uppercase tracking-widest"
                            :class="stop.is_departure
                              ? 'text-brand-600 dark:text-brand-400'
                              : stop.is_finish
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-400 dark:text-gray-500'"
                          >
                            <span v-if="stop.is_departure">Keberangkatan</span>
                            <span v-else-if="stop.is_finish">Kembali ke Base</span>
                            <span v-else>Tujuan {{ index }}</span>
                          </span>
                        </div>

                        <!-- Zone name -->
                        <div v-if="stop.wialon_zone_name" class="mb-1.5 flex items-center gap-1.5">
                          <svg class="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                          </svg>
                          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ stop.wialon_zone_name }}</span>
                        </div>
                        <p v-else class="mb-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ stop.stop_name || '-' }}</p>

                        <!-- Times -->
                        <div class="space-y-0.5">
                          <div v-if="stop.estimated_arrival" class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>Est: <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatDateTime(stop.estimated_arrival) }}</span></span>
                          </div>
                          <div v-if="stop.actual_arrival" class="flex flex-wrap items-center gap-1.5 text-xs text-success-600 dark:text-success-400">
                            <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                            </svg>
                            <span class="font-medium">Tiba: {{ formatDateTime(stop.actual_arrival) }}</span>
                            <span
                              class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              :class="stop.is_manual
                                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                : 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300'"
                            >
                              {{ stop.is_manual ? 'Manual' : 'GPS' }}
                            </span>
                          </div>
                          <p v-if="!stop.estimated_arrival && !stop.actual_arrival" class="text-xs italic text-gray-400 dark:text-gray-500">Tidak ada estimasi waktu</p>
                          <p v-if="stop.incomplete_finish" class="mt-1 text-xs text-warning-700 dark:text-warning-400">Masih ada tujuan yang belum dikunjungi.</p>
                          <p v-else-if="stop.geofence_skipped" class="mt-1 text-xs text-warning-700 dark:text-warning-400">Geofence dilewati — SPK selesai tanpa hit GPS di stop ini.</p>
                          <p v-else-if="stop.inferred_passed" class="mt-1 text-xs text-success-700 dark:text-success-400">Keberangkatan dianggap sudah terlampaui karena tujuan berikutnya sudah visited.</p>
                        </div>
                      </div>

                      <!-- Status badge -->
                      <div class="flex flex-shrink-0 flex-col items-end gap-2">
                        <span v-if="stop.incomplete_finish" class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                          Belum Lengkap
                        </span>
                        <span v-else-if="stop.hit" class="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-400">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                          Sudah Tiba
                        </span>
                        <span v-else-if="stop.geofence_skipped" class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                          Geofence dilewati
                        </span>
                        <span v-else-if="stop.inferred_passed" class="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-400">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/></svg>
                          Terlampaui
                        </span>
                        <span v-else-if="stop.overdue" class="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                          Terlambat
                        </span>
                        <span v-else class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          Menunggu
                        </span>
                        <button
                          v-if="!stop.hit && !stop.geofence_skipped && !stop.is_departure"
                          type="button"
                          class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          @click="openCheckIn(stop)"
                        >
                          Tandai Tiba
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Biaya -->
          <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div class="flex items-center gap-2 mb-4">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Rincian Biaya</p>
            </div>
            <div class="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Lift On</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.lift_on) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Lift Off</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.lift_of) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Demurrage</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.demurrage_chargers) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Detention</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.detention_chargers) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Container Repair</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.container_repair) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Extend Gate Pass</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.extend_gate_pass) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Ops Cost</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.ops_cost) }}</p></div>
              <div><span class="text-xs text-gray-400 dark:text-gray-500">Additional Cost</span><p class="text-sm text-gray-700 dark:text-gray-200">Rp {{ formatNumber(detail.additional_cost) }}</p></div>
            </div>
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 grid gap-4 sm:grid-cols-3">
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Total Cost</p>
                <p class="mt-1 text-sm font-bold text-gray-800 dark:text-gray-100">Rp {{ formatNumber(totalCost) }}</p>
              </div>
              <div class="rounded-lg border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
                <p class="text-[11px] text-brand-600 dark:text-brand-400">Sales</p>
                <p class="mt-1 text-sm font-bold text-brand-700 dark:text-brand-300">Rp {{ formatNumber(detail.price) }}</p>
              </div>
              <div class="rounded-lg border p-3" :class="grossProfit >= 0 ? 'border-success-200 bg-success-50/60 dark:border-success-500/30 dark:bg-success-500/10' : 'border-error-200 bg-error-50/60 dark:border-error-500/30 dark:bg-error-500/10'">
                <p class="text-[11px]" :class="grossProfit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'">Gross Profit</p>
                <p class="mt-1 text-sm font-bold" :class="grossProfit >= 0 ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300'">Rp {{ formatNumber(grossProfit) }}</p>
              </div>
            </div>
          </div>
          
          <!-- DN List Section -->
          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
             <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                DN List (Rincian)
              </h3>
            </div>

            <div v-if="dnLoading" class="text-sm text-gray-500 dark:text-gray-400">
              Loading DN...
            </div>
            
            <div v-else-if="dnItems.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
              Tidak ada DN untuk transaksi ini.
            </div>

            <div v-else class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
               <div class="overflow-x-auto">
                 <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                   <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                     <tr>
                       <th class="px-4 py-3">No. DN</th>
                       <th class="px-4 py-3">Pickup Alamat</th>
                       <th class="px-4 py-3">Drop Alamat</th>
                       <th class="px-4 py-3">Qty</th>
                       <th class="px-4 py-3">PKG</th>
                       <th class="px-4 py-3">G.W</th>
                       <th class="px-4 py-3">No. Container</th>
                       <th class="px-4 py-3">No. Aju</th>
                       <th class="px-4 py-3">Remarks</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr
                       v-for="(item, index) in paginatedDnItems"
                       :key="index"
                       class="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-600"
                     >
                       <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ item.no_dn || '-' }}</td>
                       <td class="px-4 py-3 max-w-xs truncate" :title="item.pickup_alamat">{{ item.pickup_alamat || '-' }}</td>
                       <td class="px-4 py-3 max-w-xs truncate" :title="item.drop_alamat">{{ item.drop_alamat || '-' }}</td>
                       <td class="px-4 py-3">{{ item.qty || '-' }}</td>
                       <td class="px-4 py-3">{{ item.pkg || '-' }}</td>
                       <td class="px-4 py-3">{{ item.gw || '-' }}</td>
                       <td class="px-4 py-3">{{ item.no_container || '-' }}</td>
                       <td class="px-4 py-3">{{ item.no_aju || '-' }}</td>
                       <td class="px-4 py-3 max-w-xs truncate" :title="item.remarks">{{ item.remarks || '-' }}</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
               
               <!-- Pagination -->
               <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Halaman {{ currentPage }} dari {{ totalPages }}
                  </div>
                  <div class="flex gap-2">
                    <button
                      :disabled="currentPage === 1"
                      class="rounded px-3 py-1 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700 dark:text-gray-300"
                      @click="currentPage--"
                    >
                      Prev
                    </button>
                    <button
                      :disabled="currentPage === totalPages"
                      class="rounded px-3 py-1 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700 dark:text-gray-300"
                      @click="currentPage++"
                    >
                      Next
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <!-- Rute GPS Aktual (Wialon playback) -->
          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Rute GPS Aktual
                </h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Playback trail Wialon untuk window trip SPK
                </p>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
                :disabled="gpsTrailLoading"
                @click="loadGpsTrail"
              >
                {{ gpsTrailLoading ? 'Memuat...' : 'Muat ulang' }}
              </button>
            </div>

            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <p v-if="gpsTrailLoading" class="text-sm text-gray-500 dark:text-gray-400">
                Memuat rute GPS...
              </p>
              <p v-else-if="gpsTrailError" class="text-sm text-error-600 dark:text-error-400">
                {{ gpsTrailError }}
              </p>
              <template v-else-if="gpsTrail">
                <p
                  v-if="gpsTrail.reason && !hasGpsTrailMapContent"
                  class="mb-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ gpsTrailReasonLabel(gpsTrail.reason) }}
                </p>
                <p
                  v-else-if="gpsTrail.reason && hasGpsTrailMapContent && (!gpsTrail.points || !gpsTrail.points.length)"
                  class="mb-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ gpsTrailReasonLabel(gpsTrail.reason) }} Geofence tujuan tetap ditampilkan.
                </p>
                <div
                  v-if="hasGpsTrailMapContent"
                  class="mb-2 flex flex-wrap items-center gap-1.5"
                >
                  <button
                    v-for="chip in gpsLayerChips"
                    :key="chip.key"
                    type="button"
                    class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                    :class="
                      gpsLayerVisibility[chip.key]
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-300'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5'
                    "
                    @click="toggleGpsLayer(chip.key)"
                  >
                    {{ chip.label }}
                  </button>
                </div>
                <div v-if="hasGpsTrailMapContent" class="relative">
                  <div
                    ref="gpsTrailMapEl"
                    class="w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 transition-[height] duration-300 ease-out dark:border-gray-800 dark:bg-gray-950"
                    :style="{ height: gpsTrailMapExpanded ? '520px' : '300px' }"
                  ></div>
                  <button
                    type="button"
                    class="absolute bottom-2 right-2 z-[500] inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300 dark:hover:bg-gray-800"
                    @click="toggleGpsTrailMapSize"
                  >
                    <svg
                      class="h-3.5 w-3.5 transition-transform duration-200"
                      :class="gpsTrailMapExpanded ? 'rotate-180' : ''"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        v-if="!gpsTrailMapExpanded"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                      <path
                        v-else
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 4v4m0 0H5m4 0L4 3m11 5h4m0 0V4m0 4l5-5M9 16v4m0 0H5m4 0l-5 5m15-5h4m0 0v4m0-4l5 5"
                      />
                    </svg>
                    {{ gpsTrailMapExpanded ? 'Perkecil' : 'Perbesar' }}
                  </button>
                </div>
                <div
                  v-if="playbackAvailable"
                  class="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950/60"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="inline-flex h-8 min-w-[4.5rem] items-center justify-center rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600"
                      @click="toggleGpsPlayback"
                    >
                      {{ gpsPlayback.playing ? 'Pause' : 'Play' }}
                    </button>
                    <div class="flex items-center gap-1">
                      <button
                        v-for="s in playbackSpeedOptions"
                        :key="s"
                        type="button"
                        class="inline-flex h-7 items-center rounded-full border px-2 text-[11px] font-medium transition-colors"
                        :class="
                          gpsPlayback.speed === s
                            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-300'
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                        "
                        @click="setPlaybackSpeed(s)"
                      >
                        {{ s }}×
                      </button>
                    </div>
                    <span class="ml-auto text-[11px] font-medium text-gray-600 dark:text-gray-300">
                      {{ playbackTimeLabel }}
                      <span v-if="playbackSpeedLabel" class="text-gray-400">
                        · {{ playbackSpeedLabel }}
                      </span>
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-2">
                    <input
                      type="range"
                      class="h-1.5 w-full cursor-pointer accent-brand-500"
                      :min="0"
                      :max="playbackMaxIndex"
                      :value="gpsPlayback.index"
                      @input="onPlaybackScrub"
                    />
                  </div>
                  <div
                    class="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500"
                  >
                    <span>{{ playbackStartLabel }}</span>
                    <span>{{ playbackEndLabel }}</span>
                  </div>
                </div>
                <p
                  v-if="hasGpsTrailMapContent"
                  class="mt-2 text-[11px] text-gray-500 dark:text-gray-400"
                >
                  <template v-if="gpsTrail.points?.length">
                    {{ gpsTrail.point_count }} titik GPS
                    <span v-if="gpsTrail.downsampled">
                      (dari {{ gpsTrail.point_count_raw }}, di-downsample)
                    </span>
                    · {{ formatUnixLocal(gpsTrail.from) }}
                    → {{ formatUnixLocal(gpsTrail.to) }}
                  </template>
                  <span v-if="gpsTrail.no_police"> · {{ gpsTrail.no_police }}</span>
                  <span v-if="plannedStopsWithCoords.length">
                    · {{ plannedStopsWithCoords.length }} pin tujuan
                  </span>
                  <span v-if="plannedStopsWithPolygon.length">
                    · {{ plannedStopsWithPolygon.length }} polygon
                  </span>
                  <span v-if="gpsTrail.markers?.length">
                    · {{ gpsTrail.markers.length }} hit aktual
                  </span>
                </p>
                <p
                  v-if="hasGpsTrailMapContent"
                  class="mt-1 text-[11px] text-gray-400 dark:text-gray-500"
                >
                  Area oranye = Tujuan · Ungu = Departure · Abu = Finish · Hijau = hit · Biru = trail · slider = playback
                </p>
                <p
                  v-else-if="!gpsTrail.reason"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  Tidak ada titik GPS atau geofence tujuan untuk ditampilkan.
                </p>
              </template>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                Rute GPS belum dimuat.
              </p>
            </div>
          </div>

          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Riwayat Geofence Pengiriman
              </h3>
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  History Aktual
                </p>

                <div v-if="routeHistory.length === 0" class="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Belum ada timestamp geofence yang tercatat untuk transaksi ini.
                </div>

                <div v-else class="space-y-4">
                  <div
                    v-for="(history, index) in routeHistory"
                    :key="history.id_sales_cost_route_history"
                    class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {{ history.step_name }}
                          </span>
                          <span class="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                            Actual #{{ index + 1 }}
                          </span>
                          <span class="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            Rencana #{{ history.step_order }}
                          </span>
                          <span
                            v-if="isOutOfOrder(history, index)"
                            class="rounded-full bg-warning-100 px-2.5 py-1 text-[11px] font-medium text-warning-700 dark:bg-warning-500/20 dark:text-warning-200"
                          >
                            Di luar urutan rencana
                          </span>
                        </div>
                        <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {{ history.wialon_zone_name }}
                        </div>
                      </div>
                      <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {{ formatDateTime(history.gps_time) }}
                      </div>
                    </div>

                    <div class="mt-3 grid gap-3 sm:grid-cols-2">
                      <div class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Koordinat
                        </div>
                        <div class="mt-1">
                          {{ formatCoordinate(history.lat, history.lon) }}
                        </div>
                      </div>
                      <div class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        <div class="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Dicatat Pada
                        </div>
                        <div class="mt-1">
                          {{ formatDateTime(history.recorded_at) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>

    <div
      v-if="checkInModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-6"
      @click.self="closeCheckIn"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Tandai Tiba - {{ checkInModal.stop?.stop_name }}
          </h3>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {{ resolveCheckInStopLabel(checkInModal.stop) }}
            </span>
            <span v-if="checkInModal.stop?.estimated_arrival">
              Estimasi: {{ formatDateTime(checkInModal.stop?.estimated_arrival) }}
            </span>
          </div>
        </div>

        <div class="space-y-4 px-5 py-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Waktu Tiba
            </label>
            <DatePickerInput
              v-model="checkInModal.arrivedAt"
              :enable-time="true"
              placeholder="Pilih waktu tiba"
            />
            <p v-if="checkInModal.error" class="mt-2 text-sm text-error-600 dark:text-error-400">
              {{ checkInModal.error }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            :disabled="checkInModal.loading"
            @click="closeCheckIn"
          >
            Batal
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="checkInModal.loading"
            @click="submitCheckIn"
          >
            {{ checkInModal.loading ? 'Menyimpan...' : 'Simpan Waktu Tiba' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import { salesCostService } from '@/services/salesCostService'

type DetailData = {
  id_sales_cost: number | null
  nama_customer: string
  nama_area: string
  kode_area?: string | null
  created_by_name: string | null
  no_police: string
  jenis_kendaraan: string
  container_size: string | null
  nama_driver: string
  departure_datetime: string | null
  arrival_datetime: string | null
  finish_order_datetime: string | null
  jenis_trip: string | null
  no_container: string | null
  trip: string | number | null
  price: number | null
  ops_cost: number | null
  additional_cost: number | null
  total: number | null
  demurrage_chargers?: number | null
  detention_chargers?: number | null
  container_repair?: number | null
  extend_gate_pass?: number | null
  almt_pickup?: string | null
  almt_drop?: string | null
  no_dn?: string | null
  container_depot?: string | null
  no_po?: string | null
  tax?: string | null
  bills?: string | null
  lift_on?: number | null
  lift_of?: number | null
  route_steps?: RouteStepItem[]
  route_history?: RouteHistoryItem[]
  finish_step?: PlannedStepItem | null
  delivery_stops?: Array<{
    id: number
    stop_order: number
    stop_name: string
    wialon_resource_id: number | null
    wialon_zone_id: number | null
    wialon_zone_name: string | null
    is_departure: number
    is_finish: number
    estimated_arrival: string | null
  }>
}

type RouteStepItem = {
  id_area_route_step: number
  step_order: number
  step_name: string
  step_key?: string
  system_step_code?: string | null
  wialon_resource_id: number
  wialon_zone_id: number
  wialon_zone_name: string
}

type PlannedStepItem = {
  id_area_route_step: number | null
  step_order: number
  step_name: string
  step_key: string
  system_step_code: string | null
  wialon_resource_id: number | null
  wialon_zone_id: number | null
  wialon_zone_name: string
}

type RouteHistoryItem = {
  id_sales_cost_route_history: number
  id_sales_cost: number
  id_area: number
  id_area_route_step: number | null
  id_sc_stop?: number | null
  step_key: string
  system_step_code: string | null
  id_truck: number
  step_order: number
  step_name: string
  wialon_resource_id: number
  wialon_zone_id: number
  wialon_zone_name: string
  gps_time: string | null
  recorded_at: string | null
  lat: number | null
  lon: number | null
  is_manual?: boolean | null
}

type DnItem = {
  no_dn: string
  pickup_alamat: string
  drop_alamat: string
  qty: string
  pkg: string
  gw: string
  no_container: string
  no_aju: string
  remarks: string
}

const currentPageTitle = ref('Detail Sales Cost')
const route = useRoute()
const apiBase = `${import.meta.env.VITE_API_URL || window.location.origin}/api`
const loading = ref(true)
const dnLoading = ref(false)
const formError = ref('')
const dnItems = ref<DnItem[]>([])
const currentPage = ref(1)

type GpsTrailPoint = { t: number; lat: number; lon: number; speed?: number | null }
type GpsTrailMarker = {
  type: string
  label: string
  step_key?: string | null
  t?: number | null
  lat: number
  lon: number
}
type GpsPlannedStop = {
  id?: number
  stop_order?: number
  stop_name?: string
  label?: string
  kind?: 'departure' | 'middle' | 'finish' | string
  middle_index?: number | null
  wialon_zone_name?: string | null
  lat?: number | null
  lon?: number | null
  polygon?: [number, number][] | null
  hit?: boolean
}

type GpsTrailPayload = {
  id_sales_cost?: number | null
  wialon_unit_id?: string | null
  no_police?: string | null
  from?: number
  to?: number
  point_count_raw?: number
  point_count?: number
  downsampled?: boolean
  points?: GpsTrailPoint[]
  markers?: GpsTrailMarker[]
  planned_stops?: GpsPlannedStop[]
  reason?: string | null
}

type GpsLayerKey = 'trail' | 'planned' | 'polygon' | 'hits'
type PlaybackSpeed = 1 | 2 | 4

const gpsTrail = ref<GpsTrailPayload | null>(null)
const gpsTrailLoading = ref(false)
const gpsTrailError = ref('')
const gpsTrailMapEl = ref<HTMLElement | null>(null)
const gpsTrailMapExpanded = ref(false)
const gpsLayerVisibility = ref<Record<GpsLayerKey, boolean>>({
  trail: true,
  planned: true,
  polygon: true,
  hits: true
})
const gpsLayerChips: { key: GpsLayerKey; label: string }[] = [
  { key: 'trail', label: 'Trail GPS' },
  { key: 'planned', label: 'Tujuan' },
  { key: 'polygon', label: 'Polygon' },
  { key: 'hits', label: 'Hit aktual' }
]
const playbackSpeedOptions: PlaybackSpeed[] = [1, 2, 4]
const gpsPlayback = ref({
  playing: false,
  speed: 2 as PlaybackSpeed,
  index: 0
})
let gpsTrailMap: L.Map | null = null
let gpsLayerTrail: L.LayerGroup | null = null
let gpsLayerPlanned: L.LayerGroup | null = null
let gpsLayerPolygons: L.LayerGroup | null = null
let gpsLayerHits: L.LayerGroup | null = null
let gpsLayerPlayback: L.LayerGroup | null = null
let gpsTruckMarker: L.CircleMarker | null = null
let gpsProgressLine: L.Polyline | null = null
let gpsPlaybackTimer: ReturnType<typeof setInterval> | null = null
let gpsPlaybackLatLngs: L.LatLng[] = []

const plannedStopsWithCoords = computed(() => {
  const list = gpsTrail.value?.planned_stops
  if (!Array.isArray(list)) return [] as GpsPlannedStop[]
  return list.filter(
    (s) =>
      s.lat != null &&
      s.lon != null &&
      Number.isFinite(Number(s.lat)) &&
      Number.isFinite(Number(s.lon)) &&
      Number(s.lat) !== 0 &&
      Number(s.lon) !== 0
  )
})

const plannedStopsWithPolygon = computed(() => {
  const list = gpsTrail.value?.planned_stops
  if (!Array.isArray(list)) return [] as GpsPlannedStop[]
  return list.filter(
    (s) => Array.isArray(s.polygon) && s.polygon.length >= 3
  )
})

const hasGpsTrailMapContent = computed(() => {
  const pts = gpsTrail.value?.points?.length || 0
  return (
    pts > 0 ||
    plannedStopsWithCoords.value.length > 0 ||
    plannedStopsWithPolygon.value.length > 0
  )
})

const playbackPoints = computed(() => {
  const pts = gpsTrail.value?.points
  if (!Array.isArray(pts)) return [] as GpsTrailPoint[]
  return pts.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
})

const playbackAvailable = computed(() => playbackPoints.value.length >= 2)

const playbackMaxIndex = computed(() =>
  Math.max(0, playbackPoints.value.length - 1)
)

const playbackTimeLabel = computed(() => {
  const p = playbackPoints.value[gpsPlayback.value.index]
  return p?.t ? formatUnixLocal(p.t) : '-'
})

const playbackSpeedLabel = computed(() => {
  const p = playbackPoints.value[gpsPlayback.value.index]
  if (p?.speed == null || !Number.isFinite(Number(p.speed))) return ''
  return `${Number(p.speed).toFixed(0)} km/j`
})

const playbackStartLabel = computed(() => {
  const p = playbackPoints.value[0]
  return p?.t ? formatUnixLocal(p.t) : '-'
})

const playbackEndLabel = computed(() => {
  const list = playbackPoints.value
  const p = list[list.length - 1]
  return p?.t ? formatUnixLocal(p.t) : '-'
})

const toggleGpsTrailMapSize = () => {
  gpsTrailMapExpanded.value = !gpsTrailMapExpanded.value
  setTimeout(() => {
    gpsTrailMap?.invalidateSize()
  }, 320)
}

const applyGpsLayerVisibility = () => {
  if (!gpsTrailMap) return
  const sync = (group: L.LayerGroup | null, on: boolean) => {
    if (!group || !gpsTrailMap) return
    if (on) {
      if (!gpsTrailMap.hasLayer(group)) group.addTo(gpsTrailMap)
    } else if (gpsTrailMap.hasLayer(group)) {
      gpsTrailMap.removeLayer(group)
    }
  }
  sync(gpsLayerTrail, gpsLayerVisibility.value.trail)
  sync(gpsLayerPlanned, gpsLayerVisibility.value.planned)
  sync(gpsLayerPolygons, gpsLayerVisibility.value.polygon)
  sync(gpsLayerHits, gpsLayerVisibility.value.hits)
  // Playback (truck + progress) always on when present
  if (gpsLayerPlayback && !gpsTrailMap.hasLayer(gpsLayerPlayback)) {
    gpsLayerPlayback.addTo(gpsTrailMap)
  }
}

const toggleGpsLayer = (key: GpsLayerKey) => {
  gpsLayerVisibility.value = {
    ...gpsLayerVisibility.value,
    [key]: !gpsLayerVisibility.value[key]
  }
  applyGpsLayerVisibility()
}

const stopGpsPlayback = () => {
  if (gpsPlaybackTimer != null) {
    clearInterval(gpsPlaybackTimer)
    gpsPlaybackTimer = null
  }
  gpsPlayback.value = {
    ...gpsPlayback.value,
    playing: false
  }
}

const playbackIntervalMs = (speed: PlaybackSpeed) => {
  if (speed === 4) return 100
  if (speed === 2) return 200
  return 400
}

const applyPlaybackFrame = (index: number) => {
  const pts = playbackPoints.value
  if (!pts.length || !gpsPlaybackLatLngs.length) return
  const max = pts.length - 1
  const i = Math.max(0, Math.min(index, max))
  gpsPlayback.value = { ...gpsPlayback.value, index: i }

  const ll = gpsPlaybackLatLngs[i]
  if (ll && gpsTruckMarker) {
    gpsTruckMarker.setLatLng(ll)
  }
  if (gpsProgressLine) {
    const slice = gpsPlaybackLatLngs.slice(0, i + 1)
    gpsProgressLine.setLatLngs(slice.length ? slice : [gpsPlaybackLatLngs[0]])
  }
}

const startGpsPlayback = () => {
  const max = playbackMaxIndex.value
  if (max < 1) return
  stopGpsPlayback()
  // Restart from start if already at end
  if (gpsPlayback.value.index >= max) {
    applyPlaybackFrame(0)
  }
  gpsPlayback.value = { ...gpsPlayback.value, playing: true }
  gpsPlaybackTimer = setInterval(() => {
    const next = gpsPlayback.value.index + 1
    if (next >= playbackMaxIndex.value) {
      applyPlaybackFrame(playbackMaxIndex.value)
      stopGpsPlayback()
      return
    }
    applyPlaybackFrame(next)
  }, playbackIntervalMs(gpsPlayback.value.speed))
}

const toggleGpsPlayback = () => {
  if (!playbackAvailable.value) return
  if (gpsPlayback.value.playing) {
    stopGpsPlayback()
  } else {
    startGpsPlayback()
  }
}

const setPlaybackSpeed = (speed: PlaybackSpeed) => {
  const wasPlaying = gpsPlayback.value.playing
  gpsPlayback.value = { ...gpsPlayback.value, speed }
  if (wasPlaying) {
    startGpsPlayback()
  }
}

const onPlaybackScrub = (event: Event) => {
  const target = event.target as HTMLInputElement
  const i = Number(target.value)
  if (!Number.isFinite(i)) return
  const wasPlaying = gpsPlayback.value.playing
  if (wasPlaying) stopGpsPlayback()
  applyPlaybackFrame(i)
}
const itemsPerPage = 5
const checkInModal = ref({
  open: false,
  stop: null as null | {
    id: number
    stop_name: string
    stop_order: number
    estimated_arrival: string | null
    is_finish: number
  },
  arrivedAt: '',
  loading: false,
  error: ''
})

const detail = ref<DetailData>({
  id_sales_cost: null,
  nama_customer: '',
  nama_area: '',
  created_by_name: '',
  no_police: '',
  jenis_kendaraan: '',
  container_size: null,
  nama_driver: '',
  departure_datetime: null,
  arrival_datetime: null,
  finish_order_datetime: null,
  jenis_trip: '',
  no_container: '',
  trip: '',
  price: 0,
  ops_cost: 0,
  additional_cost: 0,
  total: null,
  demurrage_chargers: 0,
  detention_chargers: 0,
  container_repair: 0,
  extend_gate_pass: 0,
  container_depot: '',
  no_po: '',
  bills: '',
  lift_on: 0,
  lift_of: 0,
  route_steps: [],
  route_history: [],
  finish_step: null
})

const resolveIdParam = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const number = Number(value)
  return Number.isNaN(number) ? 0 : number
}

const totalCost = computed(() => {
  if (detail.value.total !== null && detail.value.total !== undefined) {
    return toNumber(detail.value.total)
  }
  // Total cost sekarang menyertakan liftOn/liftOf kembali.
  return (
    toNumber(detail.value.ops_cost) +
    toNumber(detail.value.demurrage_chargers) +
    toNumber(detail.value.detention_chargers) +
    toNumber(detail.value.container_repair) +
    toNumber(detail.value.extend_gate_pass) +
    toNumber(detail.value.additional_cost) +
    toNumber(detail.value.lift_on) +
    toNumber(detail.value.lift_of)
  )
})

const grossProfit = computed(() => toNumber(detail.value.price) - totalCost.value)

const formatNumber = (value: unknown) => {
  const number = toNumber(value)
  return number.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

const formatText = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
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
    year: 'numeric'
  }).format(date)
}

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return null
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const shippingDurationDays = computed(() => {
  const delivery = parseDateOnly(detail.value.departure_datetime)
  const arrival = parseDateOnly(detail.value.arrival_datetime)
  if (!delivery || !arrival) {
    return null
  }
  const diff = Math.floor((arrival.getTime() - delivery.getTime()) / 86400000)
  if (diff < 0) {
    return null
  }
  return diff + 1
})

const shippingDurationLabel = computed(() => {
  if (shippingDurationDays.value === null) {
    return '-'
  }
  return `${shippingDurationDays.value} Hari`
})

const routeHistory = computed(() => detail.value.route_history || [])

const routeHistoryByStepKey = computed(() => {
  const mapped = new Map<string, RouteHistoryItem>()
  routeHistory.value.forEach((history) => {
    mapped.set(history.step_key, history)
  })
  return mapped
})

const deliveryStopsWithHistory = computed(() => {
  if (!detail.value?.delivery_stops?.length) return []

  const historyByStopId = new Map(
    (detail.value.route_history || [])
      .filter(h => h.id_sc_stop)
      .map(h => [Number(h.id_sc_stop), h])
  )

  // system:finish_order is stored with id_sc_stop = NULL — find it via step_key as fallback
  const finishOrderHistory = (detail.value.route_history || []).find(h => h.step_key === 'system:finish_order') || null

  const now = new Date()

  const baseStops = detail.value.delivery_stops.map(s => {
    // For is_finish stops, also check system:finish_order history entry as fallback
    const historyEntry = historyByStopId.get(s.id)
      || (s.is_finish === 1 ? finishOrderHistory : null)
    const hit = !!historyEntry
    const overdue = !hit && !!s.estimated_arrival && new Date(s.estimated_arrival) < now
    return {
      ...s,
      hit,
      overdue,
      actual_arrival: hit ? historyEntry?.gps_time : null,
      is_manual: historyEntry?.is_manual === true,
      inferred_passed: false,
      incomplete_finish: false
    }
  })

  const hasAnyVisitedAfterDeparture = baseStops.some(stop => !stop.is_departure && stop.hit)
  const finishHit = !!finishOrderHistory || baseStops.some(stop => stop.is_finish && stop.hit)

  return baseStops.map(stop => {
    if (stop.is_departure && !stop.hit && hasAnyVisitedAfterDeparture) {
      return {
        ...stop,
        inferred_passed: true
      }
    }

    // Middle stop never GPS-hit after SPK finished (loose finish / skip tujuan)
    if (
      finishHit &&
      !stop.hit &&
      !stop.is_departure &&
      !stop.is_finish
    ) {
      return {
        ...stop,
        geofence_skipped: true,
        overdue: false
      }
    }

    return stop
  })
})

const parseDateTimeValue = (value?: string | null) => {
  if (!value) {
    return null
  }

  const normalized = String(value)
    .trim()
    .replace('T', ' ')
    .replace(/Z$/, '')
    .replace(/[+-]\d{2}:\d{2}$/, '')
    .slice(0, 16)

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const parsed = new Date(year, month - 1, day, hour, minute)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null
  }

  return parsed
}

const resolveCheckInStopLabel = (
  stop?: {
    stop_order: number
    is_finish: number
  } | null
) => {
  if (!stop) {
    return '-'
  }

  return stop.is_finish ? 'Finish' : `Tujuan ${stop.stop_order}`
}

const validateCheckIn = (arrivedAt: string, stop: typeof checkInModal.value.stop) => {
  if (!arrivedAt) {
    return 'Waktu tiba wajib diisi.'
  }

  const arrivedAtDate = parseDateTimeValue(arrivedAt)
  if (!arrivedAtDate) {
    return 'Format waktu tiba tidak valid.'
  }

  if (arrivedAtDate.getTime() > Date.now()) {
    return 'Waktu tiba tidak boleh di masa depan.'
  }

  if (!stop) {
    return ''
  }

  const previousStop = [...deliveryStopsWithHistory.value]
    .filter(item => item.stop_order < stop.stop_order)
    .sort((a, b) => b.stop_order - a.stop_order)[0]

  if (!previousStop) {
    return ''
  }

  const previousComparisonValue = previousStop.actual_arrival || previousStop.estimated_arrival
  if (!previousComparisonValue) {
    return ''
  }

  const previousDate = parseDateTimeValue(previousComparisonValue)
  if (!previousDate) {
    return ''
  }

  if (arrivedAtDate.getTime() < previousDate.getTime()) {
    const stopLabel = resolveCheckInStopLabel(stop)
    const prevLabel = previousStop.is_departure ? 'Departure' : `Tujuan ${previousStop.stop_order}`
    return `Waktu ${stopLabel} tidak boleh kurang dari ${prevLabel}.`
  }

  return ''
}

const totalPages = computed(() => Math.ceil(dnItems.value.length / itemsPerPage))

const paginatedDnItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return dnItems.value.slice(start, end)
})

const closeCheckIn = () => {
  checkInModal.value = {
    open: false,
    stop: null,
    arrivedAt: '',
    loading: false,
    error: ''
  }
}

const openCheckIn = (stop: {
  id: number
  stop_name: string
  stop_order: number
  estimated_arrival: string | null
  is_finish: number
}) => {
  checkInModal.value.open = true
  checkInModal.value.stop = {
    id: stop.id,
    stop_name: stop.stop_name,
    stop_order: stop.stop_order,
    estimated_arrival: stop.estimated_arrival,
    is_finish: stop.is_finish
  }
  checkInModal.value.arrivedAt = stop.estimated_arrival || ''
  checkInModal.value.loading = false
  checkInModal.value.error = ''
}

const submitCheckIn = async () => {
  const selectedStop = checkInModal.value.stop
  if (!selectedStop) {
    return
  }

  const validationError = validateCheckIn(checkInModal.value.arrivedAt, selectedStop)
  if (validationError) {
    checkInModal.value.error = validationError
    return
  }

  const idParam = resolveIdParam()
  if (!idParam) {
    checkInModal.value.error = 'ID transaksi tidak ditemukan.'
    return
  }

  checkInModal.value.loading = true
  checkInModal.value.error = ''

  try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
    const response = await fetch(`${apiBase}/sales-costs/${idParam}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        id_sc_stop: selectedStop.id,
        arrived_at: checkInModal.value.arrivedAt
      })
    })

    if (!response.ok) {
      const raw = await response.text()
      let message = raw || 'Gagal menyimpan waktu tiba.'

      try {
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed?.message) {
          message = parsed.message
        }
      } catch {
        // Keep non-JSON response text as-is.
      }

      checkInModal.value.error = message
      return
    }

    closeCheckIn()
    await loadDetail()
  } catch (error: unknown) {
    checkInModal.value.error = error instanceof Error ? error.message : 'Gagal menyimpan waktu tiba.'
  } finally {
    if (checkInModal.value.open) {
      checkInModal.value.loading = false
    }
  }
}

const gpsTrailReasonLabel = (reason?: string | null) => {
  switch (reason) {
    case 'no_truck':
      return 'SPK tidak memiliki truck.'
    case 'no_wialon_unit':
      return 'Truck belum terhubung ke unit Wialon (wialon_unit_id kosong).'
    case 'no_departure':
      return 'Departure datetime belum diisi; window trail tidak bisa ditentukan.'
    case 'wialon_empty':
      return 'Tidak ada pesan GPS Wialon pada window trip ini.'
    case 'wialon_error':
      return 'Gagal mengambil data dari Wialon. Coba muat ulang.'
    case 'not_found':
      return 'Transaksi tidak ditemukan.'
    case 'invalid_window':
      return 'Window waktu trail tidak valid.'
    default:
      return reason ? `Trail tidak tersedia (${reason}).` : 'Trail tidak tersedia.'
  }
}

const formatUnixLocal = (unix?: number | null) => {
  if (!unix || !Number.isFinite(Number(unix))) return '-'
  const date = new Date(Number(unix) * 1000)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const destroyGpsTrailMap = () => {
  stopGpsPlayback()
  if (gpsTrailMap) {
    gpsTrailMap.remove()
    gpsTrailMap = null
  }
  gpsLayerTrail = null
  gpsLayerPlanned = null
  gpsLayerPolygons = null
  gpsLayerHits = null
  gpsLayerPlayback = null
  gpsTruckMarker = null
  gpsProgressLine = null
  gpsPlaybackLatLngs = []
  gpsPlayback.value = { playing: false, speed: gpsPlayback.value.speed, index: 0 }
}

const plannedStopStyle = (kind?: string) => {
  if (kind === 'departure') {
    return { color: '#7a5af8', fillColor: '#9b8afb', labelBg: '#7a5af8' }
  }
  if (kind === 'finish') {
    return { color: '#344054', fillColor: '#667085', labelBg: '#344054' }
  }
  return { color: '#dc6803', fillColor: '#f79009', labelBg: '#dc6803' }
}

const plannedStopKindLabel = (s: GpsPlannedStop) => {
  if (s.kind === 'departure') return 'Departure (geofence rencana)'
  if (s.kind === 'finish') return 'Finish (geofence rencana)'
  return `Tujuan ${s.middle_index ?? ''} (geofence rencana)`.trim()
}

const renderGpsTrailMap = async () => {
  await nextTick()
  const el = gpsTrailMapEl.value
  const points = gpsTrail.value?.points || []
  const plannedPins = plannedStopsWithCoords.value
  const plannedPolys = plannedStopsWithPolygon.value
  if (
    !el ||
    (points.length === 0 && plannedPins.length === 0 && plannedPolys.length === 0)
  ) {
    destroyGpsTrailMap()
    return
  }

  const mapHeight = gpsTrailMapExpanded.value ? 520 : 300
  el.style.width = '100%'
  el.style.height = `${mapHeight}px`
  el.style.minHeight = `${mapHeight}px`

  const latLngs = points
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => L.latLng(p.lat, p.lon))

  destroyGpsTrailMap()

  gpsTrailMap = L.map(el, {
    zoomControl: true,
    attributionControl: true
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(gpsTrailMap)

  // Z-order: polygons under trail under hits under pins under playback
  gpsLayerPolygons = L.layerGroup()
  gpsLayerTrail = L.layerGroup()
  gpsLayerHits = L.layerGroup()
  gpsLayerPlanned = L.layerGroup()
  gpsLayerPlayback = L.layerGroup()
  gpsTruckMarker = null
  gpsProgressLine = null
  gpsPlaybackLatLngs = latLngs

  const bounds: L.LatLngBounds = L.latLngBounds([])

  // Polygons first (under everything)
  for (const s of plannedPolys) {
    const ring = (s.polygon || []).filter(
      (pair) =>
        Array.isArray(pair) &&
        pair.length >= 2 &&
        Number.isFinite(Number(pair[0])) &&
        Number.isFinite(Number(pair[1]))
    ) as [number, number][]
    if (ring.length < 3) continue
    const style = plannedStopStyle(s.kind)
    const poly = L.polygon(ring, {
      color: style.color,
      fillColor: style.fillColor,
      weight: 2,
      opacity: 0.85,
      fillOpacity: 0.15
    })
    poly.bindPopup(
      [
        `<strong>${s.label || s.stop_name || 'Stop'}</strong>`,
        plannedStopKindLabel(s),
        s.wialon_zone_name ? `Zone: ${s.wialon_zone_name}` : null,
        s.hit
          ? '<span style="color:#027a48">Sudah hit (aktual)</span>'
          : '<span style="color:#b54708">Belum hit</span>'
      ]
        .filter(Boolean)
        .join('<br/>')
    )
    gpsLayerPolygons.addLayer(poly)
    bounds.extend(poly.getBounds())
  }

  if (latLngs.length >= 1) {
    // Full trail (muted when playback available)
    const line = L.polyline(latLngs, {
      color: '#465fff',
      weight: latLngs.length >= 2 ? 3 : 4,
      opacity: latLngs.length >= 2 ? 0.35 : 0.85
    })
    gpsLayerTrail.addLayer(line)
    bounds.extend(line.getBounds())

    const maxDotMarkers = 120
    const step =
      points.length <= maxDotMarkers ? 1 : Math.ceil(points.length / maxDotMarkers)
    for (let i = 0; i < points.length; i += step) {
      if (i === 0 || i === points.length - 1) continue
      const p = points[i]
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue
      const timeLabel = p.t ? formatUnixLocal(p.t) : '-'
      const speedLabel =
        p.speed != null && Number.isFinite(Number(p.speed))
          ? `${Number(p.speed).toFixed(0)} km/j`
          : null
      const dot = L.circleMarker([p.lat, p.lon], {
        radius: 3,
        color: '#465fff',
        fillColor: '#84adff',
        fillOpacity: 0.9,
        weight: 1,
        opacity: 0.85
      })
      dot.bindPopup(
        [
          '<strong>Titik GPS</strong>',
          `Waktu: ${timeLabel}`,
          `Koordinat: ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`,
          speedLabel ? `Speed: ${speedLabel}` : null
        ]
          .filter(Boolean)
          .join('<br/>')
      )
      gpsLayerTrail.addLayer(dot)
    }

    const start = points[0]
    const end = points[points.length - 1]
    L.circleMarker(latLngs[0], {
      radius: 7,
      color: '#465fff',
      fillColor: '#fff',
      fillOpacity: 1,
      weight: 3
    })
      .bindPopup(
        [
          '<strong>Awal trail</strong>',
          `Waktu: ${start?.t ? formatUnixLocal(start.t) : '-'}`,
          `Koordinat: ${latLngs[0].lat.toFixed(5)}, ${latLngs[0].lng.toFixed(5)}`
        ].join('<br/>')
      )
      .addTo(gpsLayerTrail)
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 7,
      color: '#f04438',
      fillColor: '#fff',
      fillOpacity: 1,
      weight: 3
    })
      .bindPopup(
        [
          '<strong>Akhir trail</strong>',
          `Waktu: ${end?.t ? formatUnixLocal(end.t) : '-'}`,
          `Koordinat: ${latLngs[latLngs.length - 1].lat.toFixed(5)}, ${latLngs[latLngs.length - 1].lng.toFixed(5)}`
        ].join('<br/>')
      )
      .addTo(gpsLayerTrail)
  }

  // Planned pin badges
  for (const s of plannedPins) {
    const lat = Number(s.lat)
    const lon = Number(s.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const style = plannedStopStyle(s.kind)
    const badgeText =
      s.kind === 'middle' && s.middle_index != null
        ? String(s.middle_index)
        : s.kind === 'departure'
          ? 'D'
          : s.kind === 'finish'
            ? 'F'
            : '•'
    const icon = L.divIcon({
      className: 'gps-planned-stop-icon',
      html: `<div style="
        width:26px;height:26px;border-radius:9999px;
        background:${style.labelBg};color:#fff;
        border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;
        font:700 11px/1 Arial,sans-serif;
      ">${badgeText}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
    const m = L.marker([lat, lon], { icon, zIndexOffset: 600 })
    m.bindPopup(
      [
        `<strong>${s.label || s.stop_name || 'Stop'}</strong>`,
        plannedStopKindLabel(s),
        s.wialon_zone_name ? `Zone: ${s.wialon_zone_name}` : null,
        `Koordinat: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        s.hit
          ? '<span style="color:#027a48">Sudah hit (aktual)</span>'
          : '<span style="color:#b54708">Belum hit</span>'
      ]
        .filter(Boolean)
        .join('<br/>')
    )
    gpsLayerPlanned.addLayer(m)
    bounds.extend([lat, lon])
  }

  // Actual geofence hits
  const markers = gpsTrail.value?.markers || []
  for (const m of markers) {
    if (!Number.isFinite(m.lat) || !Number.isFinite(m.lon)) continue
    const timeLabel = m.t ? formatUnixLocal(m.t) : '-'
    const marker = L.circleMarker([m.lat, m.lon], {
      radius: 8,
      color: '#027a48',
      fillColor: '#12b76a',
      fillOpacity: 0.95,
      weight: 2
    })
    marker.bindPopup(
      [
        `<strong>${m.label || 'Stop'}</strong>`,
        '<span style="color:#027a48">Hit geofence aktual</span>',
        `Waktu: ${timeLabel}`,
        `Koordinat: ${m.lat.toFixed(5)}, ${m.lon.toFixed(5)}`
      ].join('<br/>')
    )
    gpsLayerHits.addLayer(marker)
    bounds.extend([m.lat, m.lon])
  }

  // Playback: progress path + truck marker (always-on layer)
  if (latLngs.length >= 2 && gpsLayerPlayback) {
    gpsProgressLine = L.polyline([latLngs[0]], {
      color: '#465fff',
      weight: 4,
      opacity: 0.95
    })
    gpsLayerPlayback.addLayer(gpsProgressLine)

    gpsTruckMarker = L.circleMarker(latLngs[0], {
      radius: 9,
      color: '#1d4ed8',
      fillColor: '#465fff',
      fillOpacity: 1,
      weight: 3
    })
    gpsTruckMarker.bindPopup('<strong>Posisi truck</strong>')
    gpsLayerPlayback.addLayer(gpsTruckMarker)
    applyPlaybackFrame(0)
  }

  applyGpsLayerVisibility()

  if (bounds.isValid()) {
    gpsTrailMap.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 })
  }
  gpsTrailMap.invalidateSize()
}

const loadGpsTrail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) return
  gpsTrailLoading.value = true
  gpsTrailError.value = ''
  destroyGpsTrailMap()
  try {
    const data = (await salesCostService.fetchGpsTrail(idParam)) as GpsTrailPayload
    gpsTrail.value = data
    gpsTrailLoading.value = false
    const hasPlannedPin = (data.planned_stops || []).some(
      (s) =>
        s.lat != null &&
        s.lon != null &&
        Number.isFinite(Number(s.lat)) &&
        Number.isFinite(Number(s.lon))
    )
    const hasPoly = (data.planned_stops || []).some(
      (s) => Array.isArray(s.polygon) && s.polygon.length >= 3
    )
    if ((data.points && data.points.length > 0) || hasPlannedPin || hasPoly) {
      await nextTick()
      await nextTick()
      await renderGpsTrailMap()
      requestAnimationFrame(() => {
        gpsTrailMap?.invalidateSize()
        setTimeout(() => gpsTrailMap?.invalidateSize(), 150)
      })
    }
  } catch (error: unknown) {
    gpsTrailError.value =
      error instanceof Error ? error.message : 'Gagal memuat rute GPS.'
    gpsTrail.value = null
    destroyGpsTrailMap()
    gpsTrailLoading.value = false
  }
}

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  dnLoading.value = true
  destroyGpsTrailMap()
  gpsTrail.value = null
  gpsTrailError.value = ''
  gpsTrailMapExpanded.value = false

  try {
    const [data, dnResponse] = await Promise.all([
      salesCostService.fetchSalesCostById(idParam),
      salesCostService.fetchDNList(idParam).catch(() => ({ items: [] }))
    ])
    detail.value = data
    dnItems.value = dnResponse.items || []
    // Lazy load trail after main detail (non-blocking for first paint)
    void loadGpsTrail()
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat detail transaksi. Silakan coba lagi.'
    formError.value = message
  } finally {
    loading.value = false
    dnLoading.value = false
  }
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  // Strip timezone suffix (Z or +HH:MM) to treat all datetimes as local server time
  // This ensures gps_time (stored as UTC in DB but represents WIB server time) displays correctly
  const normalized = String(value).replace('T', ' ').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '').slice(0, 16)
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatCoordinate = (lat?: number | null, lon?: number | null) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return '-'
  }
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`
}

const isOutOfOrder = (history: RouteHistoryItem, index: number) => history.step_order !== index + 1

watch(
  () => route.params.id,
  () => {
    currentPage.value = 1
    loadDetail()
  }
)

onMounted(() => {
  loadDetail()
})

onBeforeUnmount(() => {
  destroyGpsTrailMap()
})
</script>
