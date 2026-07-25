<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-4">
      <section
        class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-5"
      >
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="space-y-2">
            <div
              class="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300"
            >
              <span class="rounded-full bg-brand-50 px-3 py-1 dark:bg-brand-500/10"
                >Fleet Workspace</span
              >
              <span
                class="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                Auto refresh 30 detik
              </span>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white/90 sm:text-2xl">
                Lokasi Truk
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Peta live Wialon dengan inspector kendaraan dan daftar armada yang selalu sinkron.
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div
              class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300"
            >
              <p class="font-semibold text-gray-900 dark:text-white/90">
                {{ formatNumber(trackingData.summary.total) }} armada
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sinkron terakhir {{ formatDateTime(trackingData.meta.fetched_at) }}
              </p>
            </div>

            <RouterLink
              to="/monitoring-kendaraan"
              class="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-400 dark:hover:text-brand-300"
            >
              Monitoring
            </RouterLink>

            <button
              type="button"
              :disabled="loading"
              class="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              @click="refreshLocations"
            >
              {{ loading ? 'Menyegarkan...' : 'Refresh Sekarang' }}
            </button>
          </div>
        </div>
      </section>

      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        {{ errorMessage }}
      </div>

      <div class="grid gap-4 xl:items-start" :class="workspaceGridClass">
        <section
          class="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03] xl:h-[78vh]"
        >
          <div
            class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800"
          >
            <div>
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Live Map</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Marker mengikuti hasil search dan filter GPS.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 text-[11px] font-medium">
              <button
                type="button"
                title="Filter: Moving"
                class="inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 transition-all"
                :class="gpsFilter === 'moving'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'"
                @click="gpsFilter = gpsFilter === 'moving' ? 'all' : 'moving'"
              >
                Moving
              </button>
              <button
                type="button"
                title="Filter: Idle"
                class="inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 transition-all"
                :class="gpsFilter === 'idle'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20'"
                @click="gpsFilter = gpsFilter === 'idle' ? 'all' : 'idle'"
              >
                Idle
              </button>
              <button
                type="button"
                title="Filter: Offline"
                class="inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 transition-all"
                :class="gpsFilter === 'offline'
                  ? 'bg-slate-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'"
                @click="gpsFilter = gpsFilter === 'offline' ? 'all' : 'offline'"
              >
                Offline
              </button>
              <button
                type="button"
                title="Filter: Belum Terhubung"
                class="inline-flex cursor-pointer items-center rounded-full px-2.5 py-1 transition-all"
                :class="gpsFilter === 'attention'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20'"
                @click="gpsFilter = gpsFilter === 'attention' ? 'all' : 'attention'"
              >
                Belum Terhubung
              </button>
            </div>
          </div>

          <div class="relative">
            <div ref="mapRef" class="h-[68vh] min-h-[520px] w-full xl:h-[calc(78vh-61px)]"></div>

            <div
              v-if="loading && !hasInitialized"
              class="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-medium text-gray-600 backdrop-blur dark:bg-gray-950/75 dark:text-gray-200"
            >
              Memuat peta...
            </div>

            <div
              class="pointer-events-none absolute left-4 top-4 right-4 flex justify-between gap-3 xl:hidden"
            >
              <button
                v-if="detailPanelVisible"
                type="button"
                class="pointer-events-auto inline-flex items-center rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200"
                @click="mobileDetailOpen = !mobileDetailOpen"
              >
                {{ mobileDetailOpen ? 'Tutup Detail' : 'Buka Detail' }}
              </button>
              <button
                type="button"
                class="pointer-events-auto inline-flex items-center rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200"
                @click="mobileFleetOpen = !mobileFleetOpen"
              >
                {{ mobileFleetOpen ? 'Tutup Fleet' : 'Buka Fleet' }}
              </button>
            </div>
          </div>
        </section>

        <Transition
          enter-active-class="transition-all duration-[220ms] ease-out"
          enter-from-class="opacity-0 -translate-x-3"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-[160ms] ease-in"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-3"
        >
        <section
          v-if="detailPanelVisible"
          class="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03] xl:h-[78vh] xl:self-start xl:flex xl:flex-col"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 text-left dark:border-gray-800"
            @click="mobileDetailOpen = !mobileDetailOpen"
          >
            <div>
              <p class="text-lg font-semibold text-gray-900 dark:text-white/90">Vehicle Detail</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Inspector kendaraan yang sedang dipilih.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-400 dark:hover:text-brand-300"
                @click.stop="clearSelectedTruck"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  class="h-4 w-4"
                >
                  <path d="M6 6 14 14" stroke-linecap="round" />
                  <path d="m14 6-8 8" stroke-linecap="round" />
                </svg>
              </button>
              <svg
                class="h-5 w-5 text-gray-400 transition xl:hidden"
                :class="mobileDetailOpen ? 'rotate-180' : ''"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path d="M5 8.5 10 13.5 15 8.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </button>

          <div
            class="p-4 sm:p-5 xl:flex-1 xl:min-h-0"
            :class="mobileDetailOpen ? 'block' : 'hidden xl:block'"
          >
            <div
              v-if="selectedTruck"
              class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900/50"
            >
              <div class="space-y-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p
                      class="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500"
                    >
                      Kendaraan Aktif
                    </p>
                    <h3
                      class="mt-2 truncate text-xl font-semibold text-gray-900 dark:text-white/90"
                    >
                      {{ selectedTruck.no_police || `Truck ${selectedTruck.id_truck}` }}
                    </h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ resolveVehicleName(selectedTruck) }}
                    </p>
                  </div>

                  <div class="flex flex-col items-end gap-2">
                    <span
                      class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      :class="statusBadgeClass(selectedTruck.status)"
                    >
                      {{ statusLabel(selectedTruck.status) }}
                    </span>
                    <span
                      class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                      :class="operationalBadgeClass(selectedTruck.operational_status)"
                    >
                      {{ operationalStatusLabel(selectedTruck.operational_status) }}
                    </span>
                  </div>
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-sm font-medium transition"
                    :class="
                      hasCoordinates(selectedTruck)
                        ? 'border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'cursor-not-allowed border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500'
                    "
                    :disabled="!hasCoordinates(selectedTruck)"
                    @click="focusSelectedTruckOnMap"
                  >
                    Center on Map
                  </button>

                  <RouterLink
                    v-if="selectedTruck.transaksi?.id_sales_cost"
                    :to="`/sales-cost/${selectedTruck.transaksi.id_sales_cost}`"
                    class="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-400 dark:hover:text-brand-300 sm:col-span-2"
                  >
                    Detail Sales Cost
                  </RouterLink>
                </div>
              </div>

              <div class="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                <div class="grid gap-3 sm:grid-cols-2">
                  <div
                    class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40"
                  >
                    <p
                      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      Driver
                    </p>
                    <p class="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                      {{ selectedTruck.driver_name || '-' }}
                    </p>
                  </div>

                  <div
                    class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40"
                  >
                    <p
                      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      Unit Wialon
                    </p>
                    <p class="mt-2 break-all text-sm font-medium text-gray-900 dark:text-white/90">
                      {{ selectedTruck.wialon_unit_id || '-' }}
                    </p>
                  </div>

                  <div
                    class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40"
                  >
                    <p
                      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      Kecepatan
                    </p>
                    <p class="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                      {{ formatSpeed(selectedTruck.gps?.speed) }}
                    </p>
                  </div>

                  <div
                    class="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40"
                  >
                    <p
                      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      Last GPS Update
                    </p>
                    <p class="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                      {{
                        formatDateTime(selectedTruck.gps?.device_time || selectedTruck.synced_at)
                      }}
                    </p>
                  </div>
                </div>

                <div
                  class="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950/40"
                >
                  <div>
                    <p
                      class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                    >
                      Lokasi
                    </p>
                    <p class="mt-2 text-sm font-medium text-gray-900 dark:text-white/90">
                      {{ selectedTruckLocationValue }}
                    </p>
                    <!-- Skeleton shimmer while loading -->
                    <div
                      v-if="selectedTruckAddressLoading"
                      class="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                    ></div>

                    <!-- Address result -->
                    <p
                      v-else-if="selectedTruckAddress"
                      class="mt-2 text-sm font-medium text-gray-900 dark:text-white/90"
                    >
                      {{ selectedTruckAddress }}
                    </p>

                    <!-- Error fallback: coords only when load is done and failed -->
                    <p
                      v-else-if="selectedTruckAddressError"
                      class="mt-2 text-xs text-gray-400 dark:text-gray-500"
                    >
                      {{ selectedTruck?.gps?.lat?.toFixed(5) }}, {{ selectedTruck?.gps?.lon?.toFixed(5) }}
                    </p>

                    <!-- No GPS coordinates -->
                    <p v-else class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Koordinat tidak tersedia
                    </p>
                  </div>

                  <p
                    v-if="!hasCoordinates(selectedTruck)"
                    class="mt-3 text-sm text-amber-700 dark:text-amber-300"
                  >
                    Kendaraan ini masih ada di daftar fleet, tetapi belum punya koordinat yang bisa
                    ditampilkan di peta.
                  </p>
                </div>

                <div
                  v-if="selectedTruck.transaksi"
                  class="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p
                        class="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                      >
                        Transaksi Aktif
                      </p>
                      <p class="mt-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Sales Cost #{{ selectedTruck.transaksi.id_sales_cost || '-' }}
                      </p>
                    </div>
                    <span
                      class="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {{ selectedTruck.transaksi.route || 'Rute belum ada' }}
                    </span>
                  </div>

                  <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p class="text-xs text-emerald-700/70 dark:text-emerald-300/70">Trip</p>
                      <p class="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        {{ selectedTruck.transaksi.trip || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-emerald-700/70 dark:text-emerald-300/70">Jenis Trip</p>
                      <p class="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        {{ selectedTruck.transaksi.jenis_trip || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-emerald-700/70 dark:text-emerald-300/70">
                        Departure
                      </p>
                      <p class="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        {{ formatDate(selectedTruck.transaksi.departure_datetime) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-emerald-700/70 dark:text-emerald-300/70">
                        Arrival
                      </p>
                      <p class="mt-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                        {{
                          formatDate(
                            selectedTruck.transaksi.finish_order_datetime ||
                              selectedTruck.transaksi.arrival_datetime,
                          )
                        }}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="selectedTruck.repair"
                  class="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4 dark:border-amber-500/20 dark:bg-amber-500/10"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p
                        class="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300"
                      >
                        Repair Aktif
                      </p>
                      <p class="mt-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                        {{ selectedTruck.repair.no_spk_perbaikan || 'Tanpa No. SPK Repair' }}
                      </p>
                    </div>
                    <span
                      class="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      {{ selectedTruck.repair.kategori_repair || 'PROSES' }}
                    </span>
                  </div>

                  <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p class="text-xs text-amber-700/70 dark:text-amber-300/70">
                        Jenis Kerusakan
                      </p>
                      <p class="mt-1 text-sm font-medium text-amber-900 dark:text-amber-100">
                        {{ selectedTruck.repair.jenis_kerusakan || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-amber-700/70 dark:text-amber-300/70">Tanggal Proses</p>
                      <p class="mt-1 text-sm font-medium text-amber-900 dark:text-amber-100">
                        {{ formatDate(selectedTruck.repair.tgl_proses) }}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="selectedTruck.last_transaction"
                  class="rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950/40"
                >
                  <p
                    class="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                  >
                    Transaksi Terakhir
                  </p>
                  <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Sales Cost</p>
                      <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                        #{{ selectedTruck.last_transaction.id_sales_cost || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Route</p>
                      <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                        {{ selectedTruck.last_transaction.route || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Driver</p>
                      <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                        {{ selectedTruck.last_transaction.driver_name || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Departure</p>
                      <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white/90">
                        {{ formatDate(selectedTruck.last_transaction.departure_datetime) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        </Transition>

        <aside
          class="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03] xl:h-[78vh] xl:self-start xl:flex xl:flex-col"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 text-left xl:pointer-events-none dark:border-gray-800"
            @click="mobileFleetOpen = !mobileFleetOpen"
          >
            <div>
              <p class="text-lg font-semibold text-gray-900 dark:text-white/90">Fleet</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ visibleTrucks.length }} dari {{ trackingData.trucks.length }} kendaraan tampil.
              </p>
            </div>
            <svg
              class="h-5 w-5 text-gray-400 transition xl:hidden"
              :class="mobileFleetOpen ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M5 8.5 10 13.5 15 8.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <div
            class="p-4 sm:p-5 xl:flex-1 xl:min-h-0"
            :class="mobileFleetOpen ? 'block' : 'hidden xl:block'"
          >
            <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
              <div
                class="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/50"
              >
                <label
                  class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Search Fleet
                </label>
                <div class="relative">
                  <input
                    v-model="searchInput"
                    type="text"
                    placeholder="Plat, driver, unit ID, route"
                    class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950/40 dark:text-gray-100"
                  />
                  <svg
                    class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="filter in gpsFilterOptions"
                  :key="filter.key"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition"
                  :class="
                    gpsFilter === filter.key
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-400 dark:hover:text-brand-300'
                  "
                  @click="gpsFilter = filter.key"
                >
                  <span>{{ filter.label }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    :class="
                      gpsFilter === filter.key
                        ? 'bg-white text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    "
                  >
                    {{ formatNumber(filter.count) }}
                  </span>
                </button>
              </div>

              <div
                class="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-300"
              >
                <p class="font-medium text-gray-900 dark:text-white/90">
                  {{ visibleTrucks.length }} hasil sesuai filter
                </p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Filter GPS aktif: {{ activeGpsFilterLabel }}
                </p>
              </div>

              <div ref="truckListRef" class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                <button
                  v-for="truck in visibleTrucks"
                  :key="truck.id_truck"
                  type="button"
                  :data-truck-id="truck.id_truck"
                  class="w-full rounded-2xl border p-3.5 text-left transition"
                  :class="
                    selectedTruckId === truck.id_truck
                      ? 'border-brand-500 bg-brand-50 shadow-sm dark:border-brand-400/40 dark:bg-brand-500/10'
                      : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-brand-500/10'
                  "
                  @click="focusTruck(truck)"
                >
                  <!-- Status bar vertikal + content -->
                  <div class="flex min-h-0 items-stretch gap-0 overflow-hidden rounded-xl">
                    <!-- Left status bar -->
                    <div
                      class="w-1 shrink-0 rounded-l-xl transition-colors duration-300"
                      :class="[statusBarClass(truck.status), truck.status === 'moving' ? 'status-bar--moving' : '']"
                    ></div>

                    <!-- Card content -->
                    <div class="min-w-0 flex-1 px-3 py-2.5">
                      <!-- Row 1: plat + GPS badge -->
                      <div class="flex items-center justify-between gap-2">
                        <h3 class="truncate text-sm font-bold text-gray-900 dark:text-white/90">
                          {{ truck.no_police || `Truck ${truck.id_truck}` }}
                        </h3>
                        <span
                          class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          :class="statusBadgeClass(truck.status)"
                        >
                          {{ statusLabel(truck.status) }}
                        </span>
                      </div>

                      <!-- Row 2: driver name + rute -->
                      <p class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        <span v-if="truck.driver_name">{{ truck.driver_name }}</span>
                        <span v-else class="italic text-gray-400 dark:text-gray-500">Tidak ada driver</span>
                        <template v-if="truck.transaksi?.route">
                          <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                          <span class="text-gray-400 dark:text-gray-500">{{ truck.transaksi.route }}</span>
                        </template>
                      </p>

                      <!-- Row 3: speed (moving only) + last GPS time -->
                      <div class="mt-1.5 flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
                        <span
                          v-if="truck.status === 'moving' && truck.gps?.speed != null"
                          class="font-semibold text-emerald-600 dark:text-emerald-400"
                        >
                          {{ truck.gps.speed }} km/h
                        </span>
                        <span class="truncate">
                          {{ truck.gps?.device_time
                            ? formatDateTime(truck.gps.device_time)
                            : truck.synced_at
                              ? formatDateTime(truck.synced_at)
                              : '-' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                <div
                  v-if="!visibleTrucks.length && !loading"
                  class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                >
                  Tidak ada kendaraan yang cocok dengan search dan filter aktif.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import * as L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { truckLocationService } from '@/services/truckLocationService'
import { useToast } from '@/composables/useToast'

type TruckGps = {
  lat: number | null
  lon: number | null
  speed: number | null
  heading: number | null
  altitude: number | null
  satellites: number | null
  device_time: string | null
  fetched_at: string
}

type TruckTransaction = {
  id_sales_cost: number | null
  no_spk: number | null
  departure_datetime: string | null
  arrival_datetime: string | null
  finish_order_datetime: string | null
  trip: string | null
  jenis_trip: string | null
  no_po: string | null
  no_aju: string | null
  no_container: string | null
  route: string | null
}

type TruckRepair = {
  id_repair: number | null
  no_spk_perbaikan: string | null
  kategori_repair: string | null
  jenis_kerusakan: string | null
  status_repair: string | null
  tgl_kerusakan: string | null
  tgl_input: string | null
  tgl_proses: string | null
  tgl_selesai: string | null
}

type TruckLastTransaction = {
  id_sales_cost: number | null
  departure_datetime: string | null
  arrival_datetime: string | null
  finish_order_datetime: string | null
  driver_name: string | null
  route: string | null
}

type GpsStatus = 'moving' | 'idle' | 'offline' | 'unlinked' | 'no_position' | 'unknown'
type OperationalStatus = 'transaksi' | 'repair' | 'idle'
type GpsFilter = 'all' | 'moving' | 'idle' | 'offline' | 'attention'

type TruckLocation = {
  id_truck: number
  no_police: string | null
  jenis_kendaraan: string | null
  merk_mobil: string | null
  model: string | null
  type_truck: string | null
  wialon_unit_id: string | null
  wialon_unit_name: string | null
  status: GpsStatus
  gps: TruckGps
  synced_at: string
  driver_name: string | null
  operational_status: OperationalStatus
  transaksi: TruckTransaction | null
  repair: TruckRepair | null
  last_transaction: TruckLastTransaction | null
}

type TruckLocationPayload = {
  summary: {
    total: number
    linked: number
    unlinked: number
    moving: number
    idle: number
    offline: number
    no_position: number
  }
  trucks: TruckLocation[]
  meta: {
    fetched_at: string
    wialon_available: boolean
    wialon_error: string | null
  }
}

type ReverseGeocodePayload = {
  formatted_address: string | null
  cached: boolean
  provider: string
  coordinates: {
    lat: number | null
    lon: number | null
  }
  error: string | null
}

type AddressCacheEntry = {
  value: string
  cachedAt: number
}

type AddressCacheStoragePayload = {
  version?: number
  entries?: unknown
}

type MarkerRevealOptions = {
  animate?: boolean
  openPopup?: boolean
}

type MarkerSyncOptions = {
  focusSelected?: boolean
  openPopupForSelected?: boolean
  preserveView?: boolean
}

type ClusterStatusSummary = {
  moving: number
  idle: number
  offline: number
  unlinked: number
  no_position: number
  total: number
}

const pageTitle = 'Lokasi Truk'
const toast = useToast()

const defaultCenter: [number, number] = [-2.5489, 118.0149]
const defaultZoom = 5
const detailZoom = 17

const mapRef = ref<HTMLDivElement | null>(null)
const truckListRef = ref<HTMLDivElement | null>(null)
const mapInstance = ref<L.Map | null>(null)
const markerClusterLayer = ref<L.MarkerClusterGroup | null>(null)
const hasInitialized = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const searchInput = ref('')
const gpsFilter = ref<GpsFilter>('all')
const selectedTruckId = ref<number | null>(null)
const selectedTruckAddress = ref<string | null>(null)
const selectedTruckAddressLoading = ref(false)
const selectedTruckAddressError = ref<string | null>(null)
const selectedTruckAddressCacheKey = ref<string | null>(null)
const mobileDetailOpen = ref(false)
const mobileFleetOpen = ref(true)
const trackingData = ref<TruckLocationPayload>({
  summary: {
    total: 0,
    linked: 0,
    unlinked: 0,
    moving: 0,
    idle: 0,
    offline: 0,
    no_position: 0,
  },
  trucks: [],
  meta: {
    fetched_at: '',
    wialon_available: true,
    wialon_error: null,
  },
})

let refreshTimer: number | null = null
let markerIndex = new Map<number, L.Marker>()
let addressLookupRequestId = 0
let pendingRevealRequestId = 0
let pendingRevealAnimationFrame: number | null = null
let pendingRevealMoveEndHandler: (() => void) | null = null
const addressCache = new Map<string, AddressCacheEntry>()
const addressCacheStorageKey = 'transport_v1_04:wialon_reverse_geocode_cache_v1'
const addressCacheMaxEntries = 250
const addressCacheTtlMs = 24 * 60 * 60 * 1000

const isLocalStorageAvailable = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const isAddressCacheEntryFresh = (entry: AddressCacheEntry | null | undefined) =>
  Boolean(entry) &&
  Number.isFinite(entry.cachedAt) &&
  Date.now() - entry.cachedAt < addressCacheTtlMs

const removeAddressCache = (cacheKey: string, persist = true) => {
  if (!cacheKey || !addressCache.has(cacheKey)) {
    return
  }

  addressCache.delete(cacheKey)
  if (persist) {
    persistAddressCache()
  }
}

const readAddressCache = (cacheKey: string | null) => {
  if (!cacheKey) {
    return null
  }

  const entry = addressCache.get(cacheKey)
  if (!isAddressCacheEntryFresh(entry)) {
    removeAddressCache(cacheKey)
    return null
  }

  return entry.value
}

const removeExpiredAddressCacheEntries = () => {
  let hasExpiredEntries = false

  addressCache.forEach((entry, cacheKey) => {
    if (!isAddressCacheEntryFresh(entry)) {
      addressCache.delete(cacheKey)
      hasExpiredEntries = true
    }
  })

  return hasExpiredEntries
}

const persistAddressCache = () => {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    removeExpiredAddressCacheEntries()
    const entries = Array.from(addressCache.entries()).slice(-addressCacheMaxEntries)
    window.localStorage.setItem(
      addressCacheStorageKey,
      JSON.stringify({
        version: 2,
        entries,
      }),
    )
  } catch {
    // Ignore storage quota or parsing issues; in-memory cache still works.
  }
}

const rememberAddressCache = (cacheKey: string, address: string) => {
  if (!cacheKey || !address) {
    return
  }

  if (addressCache.has(cacheKey)) {
    addressCache.delete(cacheKey)
  }

  addressCache.set(cacheKey, {
    value: address,
    cachedAt: Date.now(),
  })

  while (addressCache.size > addressCacheMaxEntries) {
    const oldestKey = addressCache.keys().next().value
    if (!oldestKey) {
      break
    }
    addressCache.delete(oldestKey)
  }

  persistAddressCache()
}

const hydrateAddressCache = () => {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const raw = window.localStorage.getItem(addressCacheStorageKey)
    if (!raw) {
      return
    }

    const parsed = JSON.parse(raw) as AddressCacheStoragePayload

    const entries = Array.isArray(parsed.entries) ? parsed.entries : []
    addressCache.clear()
    let shouldPersistNormalizedCache = parsed.version !== 2

    entries.slice(-addressCacheMaxEntries).forEach((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) {
        shouldPersistNormalizedCache = true
        return
      }

      const [key, value] = entry
      if (typeof key !== 'string' || !key) {
        shouldPersistNormalizedCache = true
        return
      }

      // Legacy cache values without cachedAt are treated as expired and ignored.
      if (
        !value ||
        typeof value !== 'object' ||
        typeof (value as AddressCacheEntry).value !== 'string' ||
        !Number.isFinite((value as AddressCacheEntry).cachedAt)
      ) {
        shouldPersistNormalizedCache = true
        return
      }

      const normalizedEntry = value as AddressCacheEntry
      if (!isAddressCacheEntryFresh(normalizedEntry)) {
        shouldPersistNormalizedCache = true
        return
      }

      addressCache.set(key, normalizedEntry)
    })

    if (removeExpiredAddressCacheEntries()) {
      shouldPersistNormalizedCache = true
    }

    if (shouldPersistNormalizedCache) {
      persistAddressCache()
    }
  } catch {
    addressCache.clear()
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(addressCacheStorageKey)
    }
  }
}

const cancelPendingReveal = () => {
  pendingRevealRequestId += 1

  if (pendingRevealAnimationFrame !== null) {
    window.cancelAnimationFrame(pendingRevealAnimationFrame)
    pendingRevealAnimationFrame = null
  }

  if (mapInstance.value && pendingRevealMoveEndHandler) {
    mapInstance.value.off('moveend', pendingRevealMoveEndHandler)
  }

  pendingRevealMoveEndHandler = null
}

const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat('id-ID').format(Number(value) || 0)

const formatSpeed = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '-'
  }
  return `${formatNumber(value)} km/j`
}

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const resolveVehicleName = (truck: TruckLocation) => {
  const parts = [truck.merk_mobil, truck.model, truck.type_truck, truck.jenis_kendaraan].filter(
    Boolean,
  )
  return parts.length ? parts.join(' ') : '-'
}

const gpsFilterLabel = (filter: GpsFilter) => {
  switch (filter) {
    case 'moving':
      return 'Moving'
    case 'idle':
      return 'Idle'
    case 'offline':
      return 'Offline'
    case 'attention':
      return 'Belum Terhubung'
    default:
      return 'All'
  }
}

const activeGpsFilterLabel = computed(() => gpsFilterLabel(gpsFilter.value))

const statusLabel = (status: GpsStatus) => {
  switch (status) {
    case 'moving':
      return 'Moving'
    case 'idle':
      return 'Idle'
    case 'unlinked':
      return 'Belum Terhubung'
    case 'offline':
      return 'Offline'
    case 'no_position':
      return 'No Posisi'
    default:
      return 'Unknown'
  }
}

const operationalStatusLabel = (status: OperationalStatus) => {
  switch (status) {
    case 'transaksi':
      return 'Transaksi'
    case 'repair':
      return 'Repair'
    default:
      return 'Idle Operasional'
  }
}

const statusBadgeClass = (status: GpsStatus) => {
  switch (status) {
    case 'moving':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'idle':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
    case 'offline':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    case 'no_position':
    case 'unlinked':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

const statusBarClass = (status: GpsStatus) => {
  switch (status) {
    case 'moving':
      return 'bg-emerald-500'
    case 'idle':
      return 'bg-blue-500'
    case 'offline':
      return 'bg-slate-400'
    case 'no_position':
    case 'unlinked':
      return 'bg-amber-400'
    default:
      return 'bg-gray-300'
  }
}

const operationalBadgeClass = (status: OperationalStatus) => {
  switch (status) {
    case 'transaksi':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'repair':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

const gpsDotClass = (status: GpsStatus) => {
  switch (status) {
    case 'moving':
      return 'bg-emerald-500'
    case 'idle':
      return 'bg-blue-500'
    case 'offline':
      return 'bg-slate-500'
    case 'no_position':
    case 'unlinked':
      return 'bg-amber-500'
    default:
      return 'bg-gray-400'
  }
}

const hasCoordinates = (truck: TruckLocation) =>
  typeof truck.gps?.lat === 'number' &&
  Number.isFinite(truck.gps.lat) &&
  typeof truck.gps?.lon === 'number' &&
  Number.isFinite(truck.gps.lon)

const formatCoordinates = (truck: TruckLocation) => {
  if (!hasCoordinates(truck)) {
    return '-'
  }
  return `${Number(truck.gps.lat).toFixed(6)}, ${Number(truck.gps.lon).toFixed(6)}`
}

const buildCoordinateCacheKey = (truck: TruckLocation) => {
  if (!hasCoordinates(truck)) {
    return null
  }

  // Fixed precision keeps the cache key stable for nearly identical GPS readings.
  return `${Number(truck.gps.lat).toFixed(5)},${Number(truck.gps.lon).toFixed(5)}`
}

const matchesGpsFilter = (truck: TruckLocation) => {
  switch (gpsFilter.value) {
    case 'moving':
      return truck.status === 'moving'
    case 'idle':
      return truck.status === 'idle'
    case 'offline':
      return truck.status === 'offline'
    case 'attention':
      return truck.status === 'unlinked' || truck.status === 'no_position'
    default:
      return true
  }
}

const visibleTrucks = computed(() => {
  const keyword = searchInput.value.trim().toLowerCase()
  const trucks = trackingData.value.trucks.filter(matchesGpsFilter)

  if (!keyword) {
    return trucks
  }

  return trucks.filter((truck) => {
    const haystack = [
      truck.no_police,
      truck.jenis_kendaraan,
      truck.merk_mobil,
      truck.model,
      truck.type_truck,
      truck.wialon_unit_id,
      truck.wialon_unit_name,
      truck.status,
      truck.driver_name,
      truck.operational_status,
      truck.transaksi?.route,
      truck.transaksi?.trip,
      truck.transaksi?.no_container,
      truck.repair?.jenis_kerusakan,
      truck.last_transaction?.route,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
})

const selectedTruck = computed(
  () => visibleTrucks.value.find((truck) => truck.id_truck === selectedTruckId.value) ?? null,
)
const detailPanelVisible = computed(() => Boolean(selectedTruck.value))
const workspaceGridClass = computed(() =>
  detailPanelVisible.value
    ? 'xl:grid-cols-[minmax(0,1.95fr)_320px_340px]'
    : 'xl:grid-cols-[minmax(0,2.55fr)_360px]',
)
const selectedTruckLocationValue = computed(() => {
  if (!selectedTruck.value) {
    return '-'
  }

  if (selectedTruckAddress.value) {
    return selectedTruckAddress.value
  }

  return formatCoordinates(selectedTruck.value)
})

const gpsFilterOptions = computed(() => {
  const summary = trackingData.value.summary
  return [
    { key: 'all' as const, label: 'All', count: summary.total },
    { key: 'moving' as const, label: 'Moving', count: summary.moving },
    { key: 'idle' as const, label: 'Idle', count: summary.idle },
    { key: 'offline' as const, label: 'Offline', count: summary.offline },
    {
      key: 'attention' as const,
      label: 'Belum Terhubung',
      count: Number(summary.unlinked || 0) + Number(summary.no_position || 0),
    },
  ]
})

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const buildPopupContent = (truck: TruckLocation) => {
  const route = truck.transaksi?.route || truck.last_transaction?.route || '-'
  return `
    <div class="space-y-2 min-w-[230px]">
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Truk</div>
        <div class="text-sm font-semibold text-slate-900">${escapeHtml(truck.no_police || `Truck ${truck.id_truck}`)}</div>
        <div class="text-xs text-slate-500">${escapeHtml(resolveVehicleName(truck))}</div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <div class="text-slate-400">GPS</div>
          <div class="font-semibold">${escapeHtml(statusLabel(truck.status))}</div>
        </div>
        <div>
          <div class="text-slate-400">Operasional</div>
          <div class="font-semibold">${escapeHtml(operationalStatusLabel(truck.operational_status))}</div>
        </div>
        <div>
          <div class="text-slate-400">Driver</div>
          <div class="font-semibold">${escapeHtml(truck.driver_name || '-')}</div>
        </div>
        <div>
          <div class="text-slate-400">Speed</div>
          <div class="font-semibold">${escapeHtml(formatSpeed(truck.gps?.speed))}</div>
        </div>
        <div class="col-span-2">
          <div class="text-slate-400">Route</div>
          <div class="font-semibold">${escapeHtml(route)}</div>
        </div>
      </div>
    </div>
  `
}

const getClusterStatusSummary = (markers: L.Marker[]) => {
  return markers.reduce<ClusterStatusSummary>(
    (summary, marker) => {
      const truck = (marker.options as { truck?: TruckLocation }).truck
      if (!truck) {
        return summary
      }

      summary.total += 1
      switch (truck.status) {
        case 'moving':
          summary.moving += 1
          break
        case 'idle':
          summary.idle += 1
          break
        case 'offline':
          summary.offline += 1
          break
        case 'unlinked':
          summary.unlinked += 1
          break
        case 'no_position':
          summary.no_position += 1
          break
        default:
          break
      }

      return summary
    },
    {
      moving: 0,
      idle: 0,
      offline: 0,
      unlinked: 0,
      no_position: 0,
      total: 0,
    },
  )
}

const getClusterPrimaryStatus = (summary: ClusterStatusSummary) => {
  const ranked = [
    { status: 'moving', count: summary.moving },
    { status: 'idle', count: summary.idle },
    { status: 'offline', count: summary.offline },
    { status: 'unlinked', count: summary.unlinked },
    { status: 'no_position', count: summary.no_position },
  ].sort((left, right) => right.count - left.count)

  return ranked[0]?.count ? ranked[0].status : 'unknown'
}

const clusterStatusLabel = (summary: ClusterStatusSummary) => {
  const parts = [
    summary.moving ? `Moving ${summary.moving}` : null,
    summary.idle ? `Idle ${summary.idle}` : null,
    summary.offline ? `Offline ${summary.offline}` : null,
    summary.unlinked ? `Belum Terhubung ${summary.unlinked}` : null,
    summary.no_position ? `No Pos ${summary.no_position}` : null,
  ].filter(Boolean)

  return parts.length ? parts.join(' | ') : 'Tidak ada data'
}

const buildClusterPopupContent = (cluster: L.Marker) => {
  const childMarkers = (cluster as L.MarkerCluster).getAllChildMarkers() as L.Marker[]
  const summary = getClusterStatusSummary(childMarkers)
  const sampleTrucks = childMarkers
    .map((marker) => (marker.options as { truck?: TruckLocation }).truck)
    .filter((truck): truck is TruckLocation => Boolean(truck))
    .slice(0, 8)

  return `
    <div class="space-y-3 min-w-[260px] max-w-[320px]">
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cluster Truk</div>
        <div class="text-sm font-semibold text-slate-900">${escapeHtml(summary.total)} truk</div>
        <div class="text-xs text-slate-500">${escapeHtml(clusterStatusLabel(summary))}</div>
      </div>
      <div class="space-y-1">
        ${sampleTrucks
          .map(
            (truck) => `
              <div class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <div class="font-semibold text-slate-900">${escapeHtml(truck.no_police || `Truck ${truck.id_truck}`)}</div>
                <div class="text-slate-500">${escapeHtml(resolveVehicleName(truck))}</div>
                <div class="mt-1">${escapeHtml(statusLabel(truck.status))} - ${escapeHtml(operationalStatusLabel(truck.operational_status))}</div>
              </div>
            `,
          )
          .join('')}
        ${
          summary.total > sampleTrucks.length
            ? `<div class="text-[11px] text-slate-400">+${summary.total - sampleTrucks.length} truk lainnya</div>`
            : ''
        }
      </div>
    </div>
  `
}

const getClusterIconClass = (status: string) => {
  switch (status) {
    case 'moving':
      return 'cluster-pin--moving'
    case 'idle':
      return 'cluster-pin--idle'
    case 'offline':
      return 'cluster-pin--offline'
    case 'unlinked':
      return 'cluster-pin--unlinked'
    case 'no_position':
      return 'cluster-pin--no_position'
    default:
      return 'cluster-pin--unknown'
  }
}

const createClusterIcon = (cluster: L.MarkerCluster) => {
  const childMarkers = cluster.getAllChildMarkers() as L.Marker[]
  const summary = getClusterStatusSummary(childMarkers)
  const primaryStatus = getClusterPrimaryStatus(summary)

  return L.divIcon({
    className: '',
    html: `
      <div class="cluster-pin ${getClusterIconClass(primaryStatus)}">
        <span class="cluster-pin__count">${escapeHtml(summary.total)}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}

const getTruckMarkerLabel = (truck: TruckLocation) => truck.no_police || `Truck ${truck.id_truck}`

const createTruckIcon = (truck: TruckLocation, isSelected = false) =>
  L.divIcon({
    className: '',
    html: `
      <div class="truck-pin ${isSelected ? 'truck-pin--selected' : ''}">
        <span class="truck-pin__label">${escapeHtml(getTruckMarkerLabel(truck))}</span>
        <div class="truck-pin__body">
          <span class="truck-pin__halo"></span>
          <div class="truck-pin__badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3063fd" aria-hidden="true" class="truck-pin__icon">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M13 4a1 1 0 0 1 1 1h4a1 1 0 0 1 .783 .378l.074 .108l3 5l.055 .103l.04 .107l.029 .109l.016 .11l.003 .085v6a1 1 0 0 1 -1 1h-1.171a3.001 3.001 0 0 1 -5.658 0h-4.342a3.001 3.001 0 0 1 -5.658 0h-1.171a1 1 0 0 1 -1 -1v-11a2 2 0 0 1 2 -2zm-6 12a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m10 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m.434 -9h-3.434v3h5.234z" />
            </svg>
          </div>
        </div>
      </div>
    `,
    iconSize: [88, 62],
    iconAnchor: [44, 50],
    popupAnchor: [0, -48],
  })

const updateMarkerSelection = () => {
  markerIndex.forEach((marker, truckId) => {
    const truck = (marker.options as { truck?: TruckLocation }).truck
    if (!truck) {
      return
    }
    marker.setIcon(createTruckIcon(truck, selectedTruckId.value === truckId))
  })
}

const scrollTruckCardIntoView = async (truckId: number, behavior: ScrollBehavior = 'smooth') => {
  await nextTick()

  const container = truckListRef.value
  if (!container) {
    return
  }

  const target = container.querySelector<HTMLElement>(`[data-truck-id="${truckId}"]`)
  target?.scrollIntoView({
    behavior,
    block: 'nearest',
  })
}

const revealTruckMarker = (truckId: number, options?: MarkerRevealOptions) => {
  if (!mapInstance.value || !markerClusterLayer.value) {
    return
  }

  cancelPendingReveal()

  const map = mapInstance.value
  const clusterLayer = markerClusterLayer.value
  const marker = markerIndex.get(truckId)
  if (!marker || !clusterLayer.hasLayer(marker)) {
    return
  }

  const requestId = pendingRevealRequestId
  const target = marker.getLatLng()
  const shouldAnimate = options?.animate ?? true
  const shouldOpenPopup = options?.openPopup ?? true
  const targetZoom = Math.max(map.getZoom(), detailZoom)

  const openPopupSafely = () => {
    pendingRevealMoveEndHandler = null

    if (requestId !== pendingRevealRequestId) {
      return
    }

    const currentMarker = markerIndex.get(truckId)
    if (!currentMarker || !markerClusterLayer.value?.hasLayer(currentMarker)) {
      return
    }

    if (shouldOpenPopup) {
      currentMarker.openPopup()
    }
  }

  map.stop()

  if (map.getZoom() === targetZoom && map.getCenter().distanceTo(target) < 1) {
    openPopupSafely()
    return
  }

  pendingRevealMoveEndHandler = openPopupSafely
  map.once('moveend', openPopupSafely)
  map.flyTo(target, targetZoom, {
    animate: shouldAnimate,
    duration: shouldAnimate ? 0.8 : 0,
  })
}

const clearSelectedTruck = () => {
  addressLookupRequestId += 1
  selectedTruckId.value = null
  selectedTruckAddress.value = null
  selectedTruckAddressError.value = null
  selectedTruckAddressLoading.value = false
  selectedTruckAddressCacheKey.value = null
  mobileDetailOpen.value = false
  mapInstance.value?.closePopup()
}

const loadSelectedTruckAddress = async (truck: TruckLocation | null) => {
  addressLookupRequestId += 1
  const requestId = addressLookupRequestId

  if (!truck || !hasCoordinates(truck)) {
    selectedTruckAddress.value = null
    selectedTruckAddressError.value = null
    selectedTruckAddressLoading.value = false
    selectedTruckAddressCacheKey.value = null
    return
  }

  const cacheKey = buildCoordinateCacheKey(truck)
  if (cacheKey && selectedTruckAddressCacheKey.value === cacheKey && selectedTruckAddress.value) {
    const cachedAddress = readAddressCache(cacheKey)
    if (cachedAddress && cachedAddress === selectedTruckAddress.value) {
      return
    }
  }

  selectedTruckAddress.value = null
  selectedTruckAddressError.value = null
  selectedTruckAddressLoading.value = false

  const cachedAddress = readAddressCache(cacheKey)
  if (cachedAddress) {
    selectedTruckAddress.value = cachedAddress
    selectedTruckAddressCacheKey.value = cacheKey
    return
  }

  selectedTruckAddressLoading.value = true
  selectedTruckAddressCacheKey.value = cacheKey

  try {
    const payload = (await truckLocationService.reverseGeocode(
      Number(truck.gps.lat),
      Number(truck.gps.lon),
    )) as ReverseGeocodePayload

    if (requestId !== addressLookupRequestId) {
      return
    }

    if (payload.formatted_address) {
      selectedTruckAddress.value = payload.formatted_address
      if (cacheKey) {
        rememberAddressCache(cacheKey, payload.formatted_address)
        selectedTruckAddressCacheKey.value = cacheKey
      }
      return
    }

    selectedTruckAddressError.value = payload.error || 'Alamat belum tersedia untuk titik GPS ini.'
  } catch (error: any) {
    if (requestId !== addressLookupRequestId) {
      return
    }

    selectedTruckAddressError.value = error?.message || 'Gagal mengambil alamat lokasi.'
  } finally {
    if (requestId === addressLookupRequestId) {
      selectedTruckAddressLoading.value = false
    }
  }
}

const alignSelectedTruck = () => {
  if (!selectedTruckId.value) {
    return
  }

  if (!visibleTrucks.value.length) {
    selectedTruckId.value = null
    mobileDetailOpen.value = false
    return
  }

  if (!visibleTrucks.value.some((truck) => truck.id_truck === selectedTruckId.value)) {
    selectedTruckId.value = null
    mobileDetailOpen.value = false
  }
}

const initMap = () => {
  if (!mapRef.value || mapInstance.value) {
    return
  }

  const map = L.map(mapRef.value, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView(defaultCenter, defaultZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)

  markerClusterLayer.value = L.markerClusterGroup({
    chunkedLoading: true,
    disableClusteringAtZoom: 16,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    maxClusterRadius: 58,
    iconCreateFunction: (cluster) => createClusterIcon(cluster),
  }).addTo(map)

  markerClusterLayer.value.on('clusterclick', (event) => {
    const cluster = event.layer
    cluster.bindPopup(buildClusterPopupContent(cluster))
    cluster.openPopup()
  })

  mapInstance.value = map
}

const syncMarkers = (options?: MarkerSyncOptions) => {
  if (!mapInstance.value || !markerClusterLayer.value) {
    return
  }

  cancelPendingReveal()
  mapInstance.value.closePopup()
  markerClusterLayer.value.clearLayers()
  markerIndex = new Map<number, L.Marker>()

  const focusSelected = options?.focusSelected ?? false
  const openPopupForSelected = options?.openPopupForSelected ?? false
  const preserveView = options?.preserveView ?? false
  const trucksWithCoordinates = visibleTrucks.value.filter((truck) => hasCoordinates(truck))
  const bounds = L.latLngBounds([])

  trucksWithCoordinates.forEach((truck) => {
    const lat = Number(truck.gps.lat)
    const lon = Number(truck.gps.lon)
    const marker = L.marker([lat, lon], {
      icon: createTruckIcon(truck, selectedTruckId.value === truck.id_truck),
      truck,
    })

    marker.bindPopup(buildPopupContent(truck), {
      closeButton: true,
      autoPanPadding: [24, 24],
    })

    marker.on('click', () => {
      selectedTruckId.value = truck.id_truck
      mobileDetailOpen.value = true
      void scrollTruckCardIntoView(truck.id_truck)
      void loadSelectedTruckAddress(truck)
    })

    marker.addTo(markerClusterLayer.value as L.MarkerClusterGroup)
    markerIndex.set(truck.id_truck, marker)
    bounds.extend([lat, lon])
  })

  if (selectedTruckId.value && markerIndex.has(selectedTruckId.value) && focusSelected) {
    pendingRevealAnimationFrame = window.requestAnimationFrame(() => {
      pendingRevealAnimationFrame = null
      revealTruckMarker(selectedTruckId.value as number, {
        animate: false,
        openPopup: openPopupForSelected,
      })
    })
    return
  }

  if (preserveView) {
    return
  }

  if (bounds.isValid()) {
    mapInstance.value.fitBounds(bounds.pad(0.18))
  } else {
    mapInstance.value.setView(defaultCenter, defaultZoom)
  }
}

const refreshLocations = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = (await truckLocationService.fetchTruckLocations()) as TruckLocationPayload
    trackingData.value = response
    alignSelectedTruck()
    await nextTick()
    syncMarkers({
      focusSelected: false,
      openPopupForSelected: false,
      preserveView: hasInitialized.value,
    })
    hasInitialized.value = true

    if (!response.meta.wialon_available) {
      errorMessage.value = response.meta.wialon_error
        ? `Wialon sedang tidak tersedia: ${response.meta.wialon_error}`
        : 'Wialon sedang tidak tersedia. Menampilkan data terbaru yang berhasil dimuat.'
    }
  } catch (error: any) {
    const message = error?.message || 'Gagal memuat lokasi truk.'
    errorMessage.value = message
    toast.error(message)
  } finally {
    loading.value = false
  }
}

const focusTruck = (truck: TruckLocation) => {
  selectedTruckId.value = truck.id_truck
  mobileDetailOpen.value = true
  mobileFleetOpen.value = true
  void scrollTruckCardIntoView(truck.id_truck)
  void loadSelectedTruckAddress(truck)

  if (!hasCoordinates(truck)) {
    return
  }

  revealTruckMarker(truck.id_truck, {
    animate: true,
    openPopup: true,
  })
}

const focusSelectedTruckOnMap = () => {
  if (!selectedTruck.value || !hasCoordinates(selectedTruck.value)) {
    return
  }

  mapRef.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

  revealTruckMarker(selectedTruck.value.id_truck, {
    animate: true,
    openPopup: true,
  })
}

watch(selectedTruckId, () => {
  updateMarkerSelection()
})

// gpsFilter changes are instant — no debounce
watch(gpsFilter, async () => {
  alignSelectedTruck()
  if (!hasInitialized.value) return
  await nextTick()
  syncMarkers({ focusSelected: false, openPopupForSelected: false })
})

// searchInput is debounced 250ms — avoids marker rebuild on every keystroke
const debouncedSyncOnSearch = useDebounceFn(async () => {
  alignSelectedTruck()
  if (!hasInitialized.value) return
  await nextTick()
  syncMarkers({ focusSelected: false, openPopupForSelected: false })
}, 250)

watch(searchInput, debouncedSyncOnSearch)

onMounted(async () => {
  hydrateAddressCache()
  initMap()
  await refreshLocations()
  refreshTimer = window.setInterval(() => {
    void refreshLocations()
  }, 30000)
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
  }
  refreshTimer = null
  cancelPendingReveal()
  markerIndex.clear()
  markerClusterLayer.value?.remove()
  mapInstance.value?.remove()
  markerClusterLayer.value = null
  mapInstance.value = null
})
</script>

<style>
.truck-pin {
  position: relative;
  width: 88px;
  height: 62px;
  transform: translate(-50%, -100%);
}

.truck-pin__label {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 3;
  max-width: 84px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 2px 6px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.01em;
  pointer-events: none;
  transform: translateX(-50%);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.truck-pin__body {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 42px;
  height: 42px;
  transform: translateX(-50%);
  filter: drop-shadow(0 10px 16px rgba(15, 23, 42, 0.22));
}

.truck-pin__halo {
  position: absolute;
  inset: -7px -7px 3px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.18);
  opacity: 0;
  transform: scale(0.84);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.truck-pin--selected .truck-pin__halo {
  opacity: 1;
  transform: scale(1);
}

.truck-pin--selected .truck-pin__label {
  border-color: rgba(37, 99, 235, 0.34);
  background: rgba(239, 246, 255, 0.98);
  color: #1d4ed8;
}

.truck-pin__badge {
  position: absolute;
  inset: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(59, 130, 246, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 20px rgba(37, 99, 235, 0.28);
}

.truck-pin__icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.cluster-pin {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.96);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.18);
}

.cluster-pin__count {
  position: relative;
  z-index: 1;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.cluster-pin--moving {
  background: linear-gradient(135deg, #10b981, #059669);
}

.cluster-pin--idle {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.cluster-pin--offline {
  background: linear-gradient(135deg, #64748b, #475569);
}

.cluster-pin--unlinked {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.cluster-pin--no_position {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.cluster-pin--unknown {
  background: linear-gradient(135deg, #64748b, #334155);
}

/* Moving truck pulse — left status bar in fleet list */
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

.status-bar--moving {
  animation: status-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .status-bar--moving {
    animation: none;
  }
}
</style>
