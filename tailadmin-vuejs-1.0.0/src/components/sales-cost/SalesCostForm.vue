<template>
  <div class="space-y-4">
    <p
      v-if="submitError"
      class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
    >
      {{ submitError }}
    </p>
    <p v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">Memuat data transaksi...</p>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div v-if="checkingTruckStatus" class="text-xs text-gray-500 dark:text-gray-400">
        Memeriksa status truck...
      </div>
      <div
        v-if="truckStatus"
        :class="[
          'rounded-lg border px-4 py-3 text-sm',
          truckStatus.type === 'repair'
            ? 'border-error-200 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200'
            : 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-200',
        ]"
      >
        {{ truckStatus.message }}
      </div>
      <fieldset :disabled="isDisabled" class="space-y-6">
        <!-- Section: Kendaraan & Driver -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="flex items-center gap-2 mb-4">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h6l3-3V9h-3"/></svg>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Data Kendaraan & Driver</p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >No. Police</label
            >
            <SearchableSelect
              v-model="form.id_truck"
              :options="trucks"
              value-key="id_truck"
              :label-formatter="formatTruckLabel"
              :search-keys="['no_police', 'jenis_kendaraan']"
              placeholder="-Pilih-"
              search-placeholder="Cari no polisi atau jenis kendaraan"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_truck" class="mt-1 text-xs text-error-600">
              {{ errors.id_truck }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Driver</label
            >
            <SearchableSelect
              v-model="form.id_driver"
              :options="drivers"
              value-key="id_driver"
              label-key="nama_driver"
              :search-keys="['nama_driver']"
              placeholder="-Pilih-"
              search-placeholder="Cari nama driver"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_driver" class="mt-1 text-xs text-error-600">
              {{ errors.id_driver }}
            </p>
          </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 mt-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Customer</label
            >
            <SearchableSelect
              v-model="form.id_customer"
              :options="customers"
              value-key="id_customer"
              label-key="nama_customer"
              :search-keys="['nama_customer']"
              placeholder="-Pilih-"
              search-placeholder="Cari nama customer"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_customer" class="mt-1 text-xs text-error-600">
              {{ errors.id_customer }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Rute</label
            >
            <SearchableSelect
              v-model="form.id_area"
              :options="areas"
              value-key="id_area"
              label-key="nama_area"
              :search-keys="['nama_area']"
              placeholder="-Pilih-"
              search-placeholder="Cari nama rute"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_area" class="mt-1 text-xs text-error-600">
              {{ errors.id_area }}
            </p>
          </div>
        </div>

        <div v-if="isHB" class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Container Size <span v-if="isHB">*</span></label
            >
            <select
              v-model="form.container_size"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :required="isHB"
            >
              <option value="">-Pilih-</option>
              <option value="20 Feet">20 Feet</option>
              <option value="40 Feet">40 Feet</option>
            </select>
          </div>
        </div>
        </div>

        <!-- Section: Tanggal Transaksi (hidden - values synced from Jadwal Pengiriman) -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800" style="display:none">
          <div class="flex items-center gap-2 mb-4">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Tanggal Transaksi</p>
          </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Departure</label
            >
            <DatePickerInput
              v-model="form.departure_datetime"
              placeholder="Pilih tanggal & waktu"
              :enable-time="true"
              :disabled="isDisabled"
            />
            <p v-if="errors.departure_datetime" class="mt-1 text-xs text-error-600">
              {{ errors.departure_datetime }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Arrival</label
            >
            <DatePickerInput
              v-model="form.arrival_datetime"
              placeholder="Pilih tanggal & waktu"
              :enable-time="true"
              :disabled="isDisabled"
            />
            <p
              v-if="dateOrderErrors.arrival_datetime || errors.arrival_datetime"
              class="mt-1 text-xs text-error-600"
            >
              {{ dateOrderErrors.arrival_datetime || errors.arrival_datetime }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Finish Order</label
            >
            <DatePickerInput
              v-model="form.finish_order_datetime"
              placeholder="Pilih tanggal & waktu"
              :enable-time="true"
              :disabled="isDisabled"
            />
            <p
              v-if="dateOrderErrors.finish_order_datetime || errors.finish_order_datetime"
              class="mt-1 text-xs text-error-600"
            >
              {{ dateOrderErrors.finish_order_datetime || errors.finish_order_datetime }}
            </p>
          </div>
        </div>

        </div>

        <!-- Jadwal Pengiriman — Modern Timeline Design -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <!-- Section header -->
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <svg class="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">Jadwal Pengiriman</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ deliveryStops.length - 2 + 2 }} titik perjalanan</p>
              </div>
            </div>
            <!-- Pakai Template button -->
            <button
              v-if="!isDisabled && templates.length > 0"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
              @click="showTemplateModal = true"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Pakai Template
            </button>
            <!-- Toggle Mode Manual / GPS -->
            <button
              type="button"
              :title="useManualMode ? 'Klik untuk kembali ke mode GPS Wialon' : 'Klik untuk input manual (tanpa GPS Wialon)'"
              class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
              :class="useManualMode
                ? 'border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'"
              @click="toggleManualMode"
            >
              <!-- GPS icon -->
              <svg v-if="!useManualMode" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              <!-- Pencil icon -->
              <svg v-else class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              {{ useManualMode ? 'Mode Manual' : 'Mode GPS' }}
            </button>
          </div>

          <!-- Info banner saat mode manual aktif -->
          <div
            v-if="useManualMode"
            class="mb-4 flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2.5 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
          >
            <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>Mode Manual aktif — geofence Wialon tidak diperlukan. Nama stop dan estimasi waktu tetap wajib diisi.</span>
          </div>

          <!-- Timeline container -->
          <div class="relative pl-10">
            <!-- Vertical connector line -->
            <div class="absolute left-4 top-5 bottom-5 w-0.5 bg-gradient-to-b from-brand-400 via-gray-200 to-gray-400 dark:from-brand-500/60 dark:via-gray-700 dark:to-gray-600" />

            <!-- ── DEPARTURE node ─────────────────────── -->
            <div class="relative mb-4">
              <!-- Node dot -->
              <div class="absolute -left-10 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-500/20">
                <svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
              </div>
              <!-- Card -->
              <div class="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-500/30 dark:from-brand-500/5 dark:to-gray-900">
                <div class="mb-3 flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Keberangkatan</span>
                  <span class="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">Wajib</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <!-- GPS mode: tampilkan geofence picker -->
                    <template v-if="!useManualMode">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span class="mr-1">📍</span>Geofence Keberangkatan
                      </label>
                      <SearchableSelect
                        :model-value="getStopGeofenceValue(departureStop)"
                        :options="geofenceSelectOptions"
                        value-key="value"
                        placeholder="Pilih zona keberangkatan..."
                        :disabled="isDisabled"
                        @update:model-value="(v: string) => onStopGeofenceChange(departureStop, v)"
                      />
                    </template>
                    <!-- Manual mode: placeholder -->
                    <p v-else class="mt-1 text-xs italic text-gray-400 dark:text-gray-500">
                      Geofence tidak dikonfigurasi (mode manual)
                    </p>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      <span class="mr-1">🕐</span>Estimasi Waktu Berangkat
                    </label>
                    <DatePickerInput
                      v-model="departureStop.estimated_arrival"
                      placeholder="Pilih tanggal & waktu"
                      :enable-time="true"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
                <div v-if="getStopErrors(0).geofence || getStopErrors(0).time || getStopErrors(0).order" class="mt-2.5 rounded-lg bg-error-50 px-3 py-2 dark:bg-error-500/10">
                  <p v-if="getStopErrors(0).geofence" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(0).geofence }}</p>
                  <p v-if="getStopErrors(0).time" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(0).time }}</p>
                  <p v-if="getStopErrors(0).order" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(0).order }}</p>
                </div>
              </div>
            </div>

            <!-- ── MIDDLE STOPS nodes ──────────────────── -->
            <div
              v-for="(stop, idx) in middleStops"
              :key="idx"
              class="relative mb-4"
            >
              <!-- Node dot: numbered -->
              <div class="absolute -left-10 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-xs font-bold text-gray-500 ring-4 ring-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-900">
                {{ idx + 1 }}
              </div>
              <!-- Card -->
              <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div class="mb-3 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tujuan {{ idx + 1 }}</span>
                  </div>
                  <button
                    v-if="!isDisabled"
                    type="button"
                    :aria-label="`Hapus Tujuan ${idx + 1}`"
                    class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                    @click="removeDeliveryStop(idx)"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <!-- GPS mode: tampilkan geofence picker -->
                    <template v-if="!useManualMode">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span class="mr-1">📍</span>Geofence Tujuan
                      </label>
                      <SearchableSelect
                        :model-value="getStopGeofenceValue(stop)"
                        :options="geofenceSelectOptions"
                        value-key="value"
                        placeholder="Pilih zona tujuan..."
                        :disabled="isDisabled"
                        @update:model-value="(v: string) => onStopGeofenceChange(stop, v)"
                      />
                    </template>
                    <!-- Manual mode: placeholder -->
                    <p v-else class="mt-1 text-xs italic text-gray-400 dark:text-gray-500">
                      Geofence tidak dikonfigurasi (mode manual)
                    </p>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      <span class="mr-1">🕐</span>Estimasi Waktu Tiba
                    </label>
                    <DatePickerInput
                      v-model="stop.estimated_arrival"
                      placeholder="Pilih tanggal & waktu"
                      :enable-time="true"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
                <div v-if="getStopErrors(idx + 1).geofence || getStopErrors(idx + 1).time || getStopErrors(idx + 1).order" class="mt-2.5 rounded-lg bg-error-50 px-3 py-2 dark:bg-error-500/10">
                  <p v-if="getStopErrors(idx + 1).geofence" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(idx + 1).geofence }}</p>
                  <p v-if="getStopErrors(idx + 1).time" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(idx + 1).time }}</p>
                  <p v-if="getStopErrors(idx + 1).order" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(idx + 1).order }}</p>
                </div>
              </div>
            </div>

            <!-- ── ADD STOP node ───────────────────────── -->
            <div v-if="!isDisabled" class="relative mb-4 flex items-center gap-3">
              <!-- Node dot: dashed add button -->
              <button
                type="button"
                class="group absolute -left-10 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white transition hover:border-brand-400 hover:bg-brand-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                @click="addDeliveryStop"
                aria-label="Tambah tujuan pengiriman"
              >
                <svg class="h-3.5 w-3.5 text-gray-400 transition group-hover:text-brand-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <!-- Add card -->
              <button
                type="button"
                class="group flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:text-gray-500 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/5 dark:hover:text-brand-400"
                @click="addDeliveryStop"
              >
                <svg class="h-4 w-4 transition group-hover:scale-110" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Tambah tujuan pengiriman
              </button>
            </div>

            <!-- ── FINISH node ─────────────────────────── -->
            <div class="relative">
              <!-- Node dot: flag/finish -->
              <div class="absolute -left-10 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 ring-4 ring-gray-100 dark:bg-gray-500 dark:ring-gray-900">
                <svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
              </div>
              <!-- Card -->
              <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-900">
                <div class="mb-3 flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Kembali ke Base</span>
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">Wajib</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <!-- GPS mode: tampilkan geofence picker -->
                    <template v-if="!useManualMode">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span class="mr-1">🏁</span>Geofence Finish
                      </label>
                      <SearchableSelect
                        :model-value="getStopGeofenceValue(finishStop)"
                        :options="geofenceSelectOptions"
                        value-key="value"
                        placeholder="Pilih zona finish..."
                        :disabled="isDisabled"
                        @update:model-value="(v: string) => onStopGeofenceChange(finishStop, v)"
                      />
                    </template>
                    <!-- Manual mode: placeholder -->
                    <p v-else class="mt-1 text-xs italic text-gray-400 dark:text-gray-500">
                      Geofence tidak dikonfigurasi (mode manual)
                    </p>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      <span class="mr-1">🕐</span>Estimasi Waktu Selesai
                    </label>
                    <DatePickerInput
                      v-model="finishStop.estimated_arrival"
                      placeholder="Pilih tanggal & waktu"
                      :enable-time="true"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
                <div v-if="getStopErrors(deliveryStops.length - 1).geofence || getStopErrors(deliveryStops.length - 1).time || getStopErrors(deliveryStops.length - 1).order" class="mt-2.5 rounded-lg bg-error-50 px-3 py-2 dark:bg-error-500/10">
                  <p v-if="getStopErrors(deliveryStops.length - 1).geofence" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(deliveryStops.length - 1).geofence }}</p>
                  <p v-if="getStopErrors(deliveryStops.length - 1).time" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(deliveryStops.length - 1).time }}</p>
                  <p v-if="getStopErrors(deliveryStops.length - 1).order" class="text-xs text-error-600 dark:text-error-400">{{ getStopErrors(deliveryStops.length - 1).order }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Main Fields: No DN, Pickup, Drop Removed -->
        <!-- Section: Informasi Pesanan -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="flex items-center gap-2 mb-4">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Informasi Pesanan</p>
          </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-1">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >No. PO</label
            >
            <input
              v-model="form.no_po"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Nomor PO"
              required
            />
          </div>
          <div class="sm:col-span-1">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Bills</label
            >
            <input
              v-model="form.bills"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Bills"
            />
          </div>
        </div>
        </div>

        <!-- Section: DN List -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">DN List / Rincian DN</p>
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">{{ dnList.length }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              @click="expandAllDn"
            >
              Buka Semua
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              @click="collapseAllDn"
            >
              Tutup Semua
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              @click="addDnItem"
            >
              + Add DN
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="(item, index) in dnList"
            :key="index"
            class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="toggleDnItem(index)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <svg
                  class="h-4 w-4 flex-none text-gray-400 transition-transform duration-200"
                  :class="dnCollapsed[index] ? '' : 'rotate-90'"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-200">Item #{{ index + 1 }}</span>
                <span v-if="item.no_dn" class="ml-1 truncate text-xs text-gray-400">— {{ item.no_dn }}</span>
              </div>
              <span
                v-if="dnList.length > 1"
                class="flex-none text-error-500 hover:text-error-700 text-xs cursor-pointer px-2 py-1"
                role="button"
                @click.stop="removeDnItem(index)"
              >
                Hapus
              </span>
            </button>

            <Transition name="dn-collapse">
              <div v-show="!dnCollapsed[index]" class="px-4 pb-4">
            <div class="space-y-4">
              <!-- No DN -->
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                  >No. DN</label
                >
                <input
                  v-model="item.no_dn"
                  type="text"
                  maxlength="20"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  placeholder="No. DN"
                />
              </div>

              <!-- Pickup & Drop -->
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >Pickup Alamat</label
                  >
                  <AddressAutocomplete
                    v-model="item.pickup_alamat"
                    placeholder="Alamat Pickup"
                    :disabled="isDisabled"
                    @selected="markAddressUsed"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >Drop Alamat</label
                  >
                  <AddressAutocomplete
                    v-model="item.drop_alamat"
                    placeholder="Alamat Drop"
                    :disabled="isDisabled"
                    @selected="markAddressUsed"
                  />
                </div>
              </div>

              <!-- Qty, PKG, GW -->
              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >Qty</label
                  >
                  <input
                    v-model="item.qty"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="Qty"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >PKG</label
                  >
                  <select
                    v-model="item.pkg"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <option value="">-Pilih-</option>
                    <option value="IBC">IBC</option>
                    <option value="CTN">CTN</option>
                    <option value="PIL">PIL</option>
                    <option value="DRM">DRM</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >G.W</label
                  >
                  <input
                    v-model="item.gw"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="G.W"
                  />
                </div>
              </div>

              <!-- Container, Aju -->
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >No. Container</label
                  >
                  <input
                    v-model="item.no_container"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="No. Container"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                    >No. Aju</label
                  >
                  <input
                    v-model="item.no_aju"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="No. Aju"
                  />
                </div>
              </div>

              <!-- Remarks -->
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
                  >Remarks</label
                >
                <textarea
                  v-model="item.remarks"
                  rows="1"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  placeholder="Catatan..."
                ></textarea>
              </div>
            </div>
              </div>
            </Transition>
          </div>
        </div>
        </div>

        <!-- Section: Biaya & Detail -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="flex items-center gap-2 mb-4">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Biaya & Detail</p>
          </div>
        <h4 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
          BIAYA OPSIONAL & DETAIL
        </h4>

        <div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200"
            @click="toggleOptionalCosts"
          >
            Tampilkan / Sembunyikan Biaya Opsional & Detail
          </button>
        </div>

        <div v-show="showOptionalCosts" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Lift On</label
              >
              <input
                v-model="form.lift_on"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Lift On"
                @input="formatNumeric('lift_on')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Lift Off</label
              >
              <input
                v-model="form.lift_of"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Lift Off"
                @input="formatNumeric('lift_of')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Container Depot</label
              >
              <input
                v-model="form.container_depot"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Container Depot"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >TAX</label
              >
              <input
                v-model="form.tax"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan TAX"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Admin Charge</label
              >
              <input
                v-model="form.admin_charge"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Admin Charge"
                required
                @input="formatNumeric('admin_charge')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Allowance Cost</label
              >
              <input
                v-model="form.materai"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Allowance Cost"
                required
                @input="formatNumeric('materai')"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Container Repair</label
              >
              <input
                v-model="form.container_repair"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Container Repair"
                required
                @input="formatNumeric('container_repair')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Demurrage Chargers</label
              >
              <input
                v-model="form.demurrage_chargers"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Demurrage Chargers"
                required
                @input="formatNumeric('demurrage_chargers')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Detention Chargers</label
              >
              <input
                v-model="form.detention_chargers"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Detention Chargers"
                required
                @input="formatNumeric('detention_chargers')"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Extend Gate Pass</label
              >
              <input
                v-model="form.extend_gate_pass"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Extend Gate Pass"
                required
                @input="formatNumeric('extend_gate_pass')"
              />
            </div>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Trip</label
            >
            <input
              v-model="form.trip"
              type="number"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Trip"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Jenis Pengiriman</label
            >
            <select
              v-model="form.jenis_trip"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="Trip">Trip</option>
              <option value="Day">Day</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Sales</label
            >
            <input
              v-model="form.price"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Sales"
              @input="formatNumeric('price')"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Additional Cost</label
            >
            <input
              v-model="form.additional_cost"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @input="formatNumeric('additional_cost')"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Operasional Cost</label
            >
            <input
              v-model="form.ops_cost"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Nominal Biaya Operasional Cost"
              required
              @input="formatNumeric('ops_cost')"
            />
            <p v-if="errors.ops_cost" class="mt-1 text-xs text-error-600">
              {{ errors.ops_cost }}
            </p>
          </div>
        </div>
        </div>
      </fieldset>

      <div v-if="$slots['pre-submit']" class="flex items-center gap-4">
        <slot name="pre-submit" />
      </div>
      <br />
      <div class="mt-5 flex items-center justify-center">
        <button
          v-if="!readOnly"
          type="submit"
          class="inline-flex w-80 items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-14px font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
          :disabled="isDisabled"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>

    <!-- Template Picker Modal -->
    <div
      v-if="showTemplateModal"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      @click.self="showTemplateModal = false"
    >
      <div class="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Pakai Template Jadwal</h3>

        <div class="mb-3">
          <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Pilih Template</label>
          <select
            v-model="selectedTemplateId"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option :value="null" disabled>Pilih template...</option>
            <option v-for="t in templates" :key="t.id" :value="t.id">
              {{ t.template_name }}
              <span v-if="t.stops?.length"> ({{ t.stops.length }} stop)</span>
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Tanggal Pengiriman</label>
          <DatePickerInput
            :model-value="templateBaseDate ? `${templateBaseDate} 00:00` : ''"
            placeholder="Pilih tanggal pengiriman..."
            :enable-time="false"
            @update:model-value="(v: string) => { templateBaseDate = v ? v.slice(0, 10) : '' }"
          />
          <p class="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Jam dari template akan digabung dengan tanggal ini.</p>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            @click="showTemplateModal = false"
          >Batal</button>
          <button
            type="button"
            :disabled="!selectedTemplateId || !templateBaseDate || templatePickerLoading"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            @click="handleApplyTemplate"
          >
            {{ templatePickerLoading ? 'Memuat...' : 'Terapkan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import AddressAutocomplete from '@/components/common/AddressAutocomplete.vue'
import { salesCostService } from '@/services/salesCostService'
import { addressBookService } from '@/services/addressBookService'
import { monitoringKendaraanService } from '@/services/monitoringKendaraanService'
import { authFetch } from '@/services/auth'
import { API_BASE } from '@/config/api'
import { useToast } from '@/composables/useToast'
import { deliveryTemplateService, type DeliveryTemplate } from '@/services/deliveryTemplateService'

type TruckOption = {
  id_truck: number
  no_police: string
  jenis_kendaraan: string
}

type DriverOption = {
  id_driver: number
  nama_driver: string
}

type CustomerOption = {
  id_customer: number
  nama_customer: string
}

type AreaOption = {
  id_area: number
  nama_area: string
}

type SalesCostFormData = {
  id_truck: string
  id_driver: string
  id_customer: string
  id_area: string
  container_size: string
  bills: string
  lift_on: string
  lift_of: string
  departure_datetime: string
  arrival_datetime: string
  finish_order_datetime: string
  container_depot: string
  no_po: string
  tax: string
  admin_charge: string
  materai: string
  container_repair: string
  demurrage_chargers: string
  detention_chargers: string
  extend_gate_pass: string
  trip: string
  jenis_trip: string
  price: string
  additional_cost: string
  ops_cost: string
  tgl_order: string
  nik_admin: string
  id_print: string
  dnItems?: DnItem[]
}

type DnItem = {
  no_dn: string
  pickup_alamat: string
  drop_alamat: string
  qty: string
  pkg: 'IBC' | 'CTN' | 'PIL' | 'DRM' | ''
  gw: string
  no_container: string
  no_aju: string
  remarks: string
}

interface DeliveryStop {
  id?: number
  stop_order: number
  stop_name: string
  wialon_resource_id: number | null
  wialon_zone_id: number | null
  wialon_zone_name: string | null
  is_departure: 0 | 1
  is_finish: 0 | 1
  estimated_arrival: string
}

type Props = {
  mode?: 'create' | 'edit'
  initialData?: Partial<SalesCostFormData>
  submitLabel?: string
  submitting?: boolean
  submitError?: string
  loading?: boolean
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  initialData: () => ({}),
  submitLabel: 'Simpan',
  submitting: false,
  submitError: '',
  loading: false,
  readOnly: false,
})

const emit = defineEmits<{
  (event: 'submit', payload: Record<string, unknown>): void
}>()

const trucks = ref<TruckOption[]>([])
const drivers = ref<DriverOption[]>([])
const customers = ref<CustomerOption[]>([])
const areas = ref<AreaOption[]>([])
const showOptionalCosts = ref(false)
const errors = reactive<Record<string, string>>({})
const dateOrderErrors = reactive<Record<'arrival_datetime' | 'finish_order_datetime', string>>({
  arrival_datetime: '',
  finish_order_datetime: '',
})
const toast = useToast()
const checkingTruckStatus = ref(false)
const truckStatus = ref<{ type: 'repair' | 'transaksi'; message: string } | null>(null)
let truckStatusRequestId = 0

const geofenceRows = ref<Array<{ resource_id: number; resource_name: string; zone_id: number; zone_name: string }>>([])
const geofenceLoading = ref(false)

const geofenceSelectOptions = computed(() =>
  geofenceRows.value.map((row) => ({
    value: `${row.resource_id}:${row.zone_id}`,
    label: row.zone_name,
    resource_name: row.resource_name,
    zone_name: row.zone_name,
  }))
)

const loadGeofences = async () => {
  if (geofenceRows.value.length > 0 || geofenceLoading.value) return
  geofenceLoading.value = true
  try {
    const res = await authFetch(`${API_BASE}/wialon/geofences`)
    const data = await res.json()
    geofenceRows.value = Array.isArray(data?.rows) ? data.rows : []
  } catch (error) {
    console.error('Failed to load geofences', error)
  } finally {
    geofenceLoading.value = false
  }
}

const deliveryStops = ref<DeliveryStop[]>([
  {
    stop_order: 0,
    stop_name: 'Departure',
    wialon_resource_id: null,
    wialon_zone_id: null,
    wialon_zone_name: null,
    is_departure: 1,
    is_finish: 0,
    estimated_arrival: ''
  },
  {
    stop_order: 99,
    stop_name: 'Finish',
    wialon_resource_id: null,
    wialon_zone_id: null,
    wialon_zone_name: null,
    is_departure: 0,
    is_finish: 1,
    estimated_arrival: ''
  }
])

// Mode manual: geofence picker disembunyikan, hanya stop_name + estimated_arrival wajib diisi
// Digunakan saat server GPS Wialon error/offline — reset ke false setiap kali form dibuka
const useManualMode = ref(false)

// Toggle mode: saat switch ke Manual, clear semua geofence data dari stops
// sehingga template yang sudah dipilih tidak menghalangi mode manual (#template-override)
const toggleManualMode = () => {
  useManualMode.value = !useManualMode.value
  if (useManualMode.value) {
    deliveryStops.value = deliveryStops.value.map(stop => ({
      ...stop,
      wialon_resource_id: null,
      wialon_zone_id: null,
      wialon_zone_name: null
    }))
  }
}

const departureStop = computed(() => deliveryStops.value.find(s => s.is_departure === 1)!)
const finishStop = computed(() => deliveryStops.value.find(s => s.is_finish === 1)!)
const middleStops = computed(() => deliveryStops.value.filter(s => s.is_departure === 0 && s.is_finish === 0))

// Returns errors for a stop based on its sorted index (0=departure, 1..N=middle, last=finish)
const getStopErrors = (sortedIndex: number) => {
  return {
    geofence: errors[`stop_geofence_${sortedIndex}`] || '',
    time: errors[`stop_time_${sortedIndex}`] || '',
    order: errors[`stop_order_${sortedIndex}`] || '',
  }
}

// Realtime date order validation — only checks ordering, not required fields
const updateStopOrderErrors = () => {
  const sortedStops = [...deliveryStops.value].sort((a, b) => a.stop_order - b.stop_order)
  for (let i = 1; i < sortedStops.length; i++) {
    const stop = sortedStops[i]
    const prev = sortedStops[i - 1]
    const key = `stop_order_${i}`
    if (stop.estimated_arrival && prev.estimated_arrival &&
        stop.estimated_arrival < prev.estimated_arrival) {
      const label = stop.is_finish ? 'Finish' : `Tujuan ${i}`
      const prevLabel = prev.is_departure ? 'Departure' : `Tujuan ${i - 1}`
      errors[key] = `Waktu ${label} tidak boleh kurang dari ${prevLabel}.`
    } else {
      delete errors[key]
    }
  }
}

// Trigger realtime date order check whenever any stop's estimated_arrival changes
watch(
  () => deliveryStops.value.map(s => s.estimated_arrival),
  () => { updateStopOrderErrors() },
  { deep: true }
)

const addDeliveryStop = () => {
  const existingMiddle = middleStops.value
  const nextOrder = existingMiddle.length > 0
    ? Math.max(...existingMiddle.map(s => s.stop_order)) + 1
    : 1
  deliveryStops.value.splice(deliveryStops.value.length - 1, 0, {
    stop_order: nextOrder,
    stop_name: `Tujuan ${existingMiddle.length + 1}`,
    wialon_resource_id: null,
    wialon_zone_id: null,
    wialon_zone_name: null,
    is_departure: 0,
    is_finish: 0,
    estimated_arrival: ''
  })
}

const removeDeliveryStop = (index: number) => {
  const stopToRemove = middleStops.value[index]
  const idx = deliveryStops.value.findIndex(s => s === stopToRemove)
  if (idx !== -1) deliveryStops.value.splice(idx, 1)
}

const onStopGeofenceChange = (stop: DeliveryStop, value: string) => {
  if (!value) {
    stop.wialon_resource_id = null
    stop.wialon_zone_id = null
    stop.wialon_zone_name = null
    return
  }
  const [resourceId, zoneId] = value.split(':')
  const option = geofenceSelectOptions.value.find(o => o.value === value)
  stop.wialon_resource_id = resourceId ? Number(resourceId) : null
  stop.wialon_zone_id = zoneId ? Number(zoneId) : null
  stop.wialon_zone_name = option?.zone_name || null
}

const getStopGeofenceValue = (stop: DeliveryStop): string => {
  if (!stop.wialon_resource_id || !stop.wialon_zone_id) return ''
  return `${stop.wialon_resource_id}:${stop.wialon_zone_id}`
}

const markAddressUsed = async (item?: { _id?: string }) => {
  if (!item?._id) {
    return
  }
  try {
    await addressBookService.markUsed(item._id)
  } catch (error) {
    console.error(error)
  }
}

const form = reactive<SalesCostFormData>({
  id_truck: '',
  id_driver: '',
  id_customer: '',
  id_area: '',
  container_size: '',
  bills: '',
  lift_on: '0',
  lift_of: '0',
  departure_datetime: '',
  arrival_datetime: '',
  finish_order_datetime: '',
  container_depot: '0',
  no_po: '0',
  tax: '0',
  admin_charge: '0',
  materai: '0',
  container_repair: '0',
  demurrage_chargers: '0',
  detention_chargers: '0',
  extend_gate_pass: '0',
  trip: '',
  jenis_trip: 'Trip',
  price: '',
  additional_cost: '0',
  ops_cost: '',
  tgl_order: '',
  nik_admin: '',
  id_print: '',
})

const dnList = ref<DnItem[]>([
  {
    no_dn: '',
    pickup_alamat: '',
    drop_alamat: '',
    qty: '',
    pkg: '',
    gw: '',
    no_container: '',
    no_aju: '',
    remarks: '',
  },
])

const dnCollapsed = ref<boolean[]>([])

// Default all DN items to collapsed when the list changes (load/edit/initial)
watch(
  () => dnList.value.length,
  (len) => {
    dnCollapsed.value = Array.from({ length: len }, (_, i) =>
      dnCollapsed.value[i] === undefined ? true : dnCollapsed.value[i]
    )
  },
  { immediate: true }
)

const toggleDnItem = (index: number) => {
  dnCollapsed.value[index] = !dnCollapsed.value[index]
}

const expandAllDn = () => {
  dnCollapsed.value = dnList.value.map(() => false)
}

const collapseAllDn = () => {
  dnCollapsed.value = dnList.value.map(() => true)
}

const addDnItem = () => {
  dnList.value.push({
    no_dn: '',
    pickup_alamat: '',
    drop_alamat: '',
    qty: '',
    pkg: '',
    gw: '',
    no_container: '',
    no_aju: '',
    remarks: '',
  })
  // New item starts expanded; collapse existing others for focus
  dnCollapsed.value = dnList.value.map(() => true)
  dnCollapsed.value[dnList.value.length - 1] = false
}

const removeDnItem = (index: number) => {
  if (dnList.value.length > 1) {
    dnList.value.splice(index, 1)
    dnCollapsed.value.splice(index, 1)
  }
}

const numericFields = [
  'admin_charge',
  'materai',
  'price',
  'container_repair',
  'demurrage_chargers',
  'detention_chargers',
  'extend_gate_pass',
  'additional_cost',
  'ops_cost',
]

const selectedTruck = computed(() =>
  trucks.value.find((truck) => String(truck.id_truck) === form.id_truck),
)

const isHB = computed(() => selectedTruck.value?.jenis_kendaraan === 'HB')

const isDisabled = computed(() => props.submitting || props.loading || props.readOnly)

const formatTruckLabel = (truck: TruckOption) => `${truck.no_police} - ${truck.jenis_kendaraan}`

const parseIndonesianNumber = (input: string) => {
  if (!input) {
    return 0
  }
  const normalized = input.replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatIndonesianNumber = (value: number) =>
  value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const formatNumeric = (field: string) => {
  const value = (form as Record<string, string>)[field] ?? ''
  const parsed = parseIndonesianNumber(value)
  ;(form as Record<string, string>)[field] = formatIndonesianNumber(parsed)
}

const normalizeDateTime = (value?: string | null): string => {
  if (!value) {
    return ''
  }
  // Already YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM, slice to 16 chars
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) {
    return String(value).slice(0, 16).replace('T', ' ')
  }
  // Fallback: date-only string — return as-is (no time to add)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function isValidIsoDateTime(value: string): boolean {
  if (!value) return false
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return false
  const d = new Date(value.replace('T', ' '))
  return !isNaN(d.getTime())
}

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    delete errors[key]
  })
}


const ARRIVAL_LT_DELIVERY_MSG =
  'Tanggal Arrival Order tidak boleh kurang dari tanggal Delivery Order.'
const FINISH_LT_ARRIVAL_MSG = 'Tanggal Finish Order tidak boleh kurang dari tanggal Arrival.'

const updateDateOrderErrors = () => {
  let arrivalOrderMessage = ''
  let finishOrderMessage = ''

  if (
    form.departure_datetime &&
    form.arrival_datetime &&
    isValidIsoDateTime(form.departure_datetime) &&
    isValidIsoDateTime(form.arrival_datetime) &&
    form.arrival_datetime < form.departure_datetime
  ) {
    arrivalOrderMessage = ARRIVAL_LT_DELIVERY_MSG
  }

  if (
    form.arrival_datetime &&
    form.finish_order_datetime &&
    isValidIsoDateTime(form.arrival_datetime) &&
    isValidIsoDateTime(form.finish_order_datetime) &&
    form.finish_order_datetime < form.arrival_datetime
  ) {
    finishOrderMessage = FINISH_LT_ARRIVAL_MSG
  }

  dateOrderErrors.arrival_datetime = arrivalOrderMessage
  dateOrderErrors.finish_order_datetime = finishOrderMessage

  if (!arrivalOrderMessage && errors.arrival_datetime === ARRIVAL_LT_DELIVERY_MSG) {
    delete errors.arrival_datetime
  }
  if (!finishOrderMessage && errors.finish_order_datetime === FINISH_LT_ARRIVAL_MSG) {
    delete errors.finish_order_datetime
  }
}

const validateForm = () => {
  clearErrors()
  if (!form.id_truck) {
    errors.id_truck = 'No. Police wajib dipilih.'
  }
  if (!form.id_driver) {
    errors.id_driver = 'Driver wajib dipilih.'
  }
  if (!form.id_customer) {
    errors.id_customer = 'Customer wajib dipilih.'
  }
  if (!form.id_area) {
    errors.id_area = 'Rute wajib dipilih.'
  }
  if (!form.departure_datetime) {
    // No validation - synced from Jadwal Pengiriman (departureStop.estimated_arrival)
  } else if (form.departure_datetime && !isValidIsoDateTime(form.departure_datetime)) {
    errors.departure_datetime = 'Format Departure harus YYYY-MM-DD HH:MM.'
  }
  if (!form.arrival_datetime) {
    // No validation - synced from Jadwal Pengiriman (last middle stop)
  } else if (form.arrival_datetime && !isValidIsoDateTime(form.arrival_datetime)) {
    errors.arrival_datetime = 'Format Arrival harus YYYY-MM-DD HH:MM.'
  }
  if (props.mode === 'create' && !form.finish_order_datetime) {
    // No validation - synced from Jadwal Pengiriman (finishStop.estimated_arrival)
  } else if (form.finish_order_datetime && !isValidIsoDateTime(form.finish_order_datetime)) {
    errors.finish_order_datetime = 'Format Finish Order harus YYYY-MM-DD HH:MM.'
  }
  updateDateOrderErrors()
  if (!errors.arrival_datetime && dateOrderErrors.arrival_datetime) {
    errors.arrival_datetime = dateOrderErrors.arrival_datetime
  }
  if (!errors.finish_order_datetime && dateOrderErrors.finish_order_datetime) {
    errors.finish_order_datetime = dateOrderErrors.finish_order_datetime
  }
  if (!form.ops_cost) {
    errors.ops_cost = 'Operasional Cost wajib diisi.'
  }

  // Validasi Jadwal Pengiriman
  const sortedStops = [...deliveryStops.value].sort((a, b) => a.stop_order - b.stop_order)
  for (let i = 0; i < sortedStops.length; i++) {
    const stop = sortedStops[i]
    const label = stop.is_departure ? 'Departure'
      : stop.is_finish ? 'Finish'
      : `Tujuan ${i}` // i = index in sorted array (0=departure, 1..N=middle, last=finish)

    // Wajib pilih geofence — hanya di mode GPS
    if (!useManualMode.value && !stop.wialon_zone_id) {
      errors[`stop_geofence_${i}`] = `Geofence ${label} wajib dipilih.`
    }

    // Wajib isi estimasi waktu
    if (!stop.estimated_arrival) {
      errors[`stop_time_${i}`] = `Estimasi waktu ${label} wajib diisi.`
    }

    // Validasi urutan tanggal: tidak boleh kurang dari stop sebelumnya
    if (i > 0 && stop.estimated_arrival && sortedStops[i - 1].estimated_arrival) {
      if (stop.estimated_arrival < sortedStops[i - 1].estimated_arrival) {
        const prevLabel = sortedStops[i - 1].is_departure ? 'Departure'
          : sortedStops[i - 1].is_finish ? 'Finish'
          : `Tujuan ${i - 1}`
        errors[`stop_order_${i}`] = `Waktu ${label} tidak boleh kurang dari ${prevLabel}.`
      }
    }
  }

  return Object.keys(errors).length === 0
}

const generateRandomString = (length: number) => {
  const alphabet = 'abcdef0123456789'
  const values = new Uint8Array(length)
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(values)
  } else {
    for (let i = 0; i < length; i += 1) {
      values[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

const getDefaultOrderDate = () => {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// --- Template state ---
const templates = ref<DeliveryTemplate[]>([])
const showTemplateModal = ref(false)
const templateBaseDate = ref('')
const templatePickerLoading = ref(false)
const selectedTemplateId = ref<number | null>(null)
const areaAutoPopulating = ref(false)

const loadTemplates = async () => {
  try {
    templates.value = await deliveryTemplateService.fetchTemplates()
  } catch {
    // silent fail — templates are optional
  }
}

const isStopsDefault = () => {
  return (
    deliveryStops.value.length === 2 &&
    !deliveryStops.value[0].estimated_arrival &&
    !deliveryStops.value[1].estimated_arrival
  )
}

const applyTemplateStops = (
  stops: Array<{
    stop_order: number
    stop_name: string
    wialon_resource_id?: number | null
    wialon_zone_id?: number | null
    wialon_zone_name?: string | null
    is_departure: number
    is_finish: number
    time_hhmm?: string | null
  }>,
  baseDate: string | null
) => {
  deliveryStops.value = stops.map((s) => ({
    stop_order: Number(s.stop_order),
    stop_name: s.stop_name || '',
    wialon_resource_id: s.wialon_resource_id ?? null,
    wialon_zone_id: s.wialon_zone_id ?? null,
    wialon_zone_name: s.wialon_zone_name ?? null,
    is_departure: Number(s.is_departure) as 0 | 1,
    is_finish: Number(s.is_finish) as 0 | 1,
    estimated_arrival: baseDate && s.time_hhmm ? `${baseDate} ${s.time_hhmm}:00` : ''
  }))
}

const handleApplyTemplate = async () => {
  if (!selectedTemplateId.value || !templateBaseDate.value) return
  templatePickerLoading.value = true
  try {
    const tmpl = await deliveryTemplateService.fetchTemplate(selectedTemplateId.value)
    applyTemplateStops(tmpl.stops, templateBaseDate.value)
    showTemplateModal.value = false
    selectedTemplateId.value = null
    templateBaseDate.value = ''
    toast.success('Template jadwal diterapkan. Periksa dan sesuaikan waktu jika perlu.')
  } catch {
    toast.error('Gagal memuat template.')
  } finally {
    templatePickerLoading.value = false
  }
}
// --- End template state ---

const resetForm = () => {
  form.id_truck = ''
  form.id_driver = ''
  form.id_customer = ''
  form.id_area = ''
  form.container_size = ''
  form.bills = ''
  form.lift_on = '0'
  form.lift_of = '0'
  form.departure_datetime = ''
  form.arrival_datetime = ''
  form.finish_order_datetime = ''
  form.container_depot = '0'
  form.no_po = '0'
  form.tax = '0'
  form.admin_charge = '0'
  form.materai = '0'
  form.container_repair = '0'
  form.demurrage_chargers = '0'
  form.detention_chargers = '0'
  form.extend_gate_pass = '0'
  form.trip = ''
  form.jenis_trip = 'Trip'
  form.price = ''
  form.additional_cost = '0'
  form.ops_cost = ''
  dnList.value = [
    {
      no_dn: '',
      pickup_alamat: '',
      drop_alamat: '',
      qty: '',
      pkg: '',
      gw: '',
      no_container: '',
      no_aju: '',
      remarks: '',
    },
  ]
  deliveryStops.value = [
    { stop_order: 0, stop_name: 'Departure', wialon_resource_id: null, wialon_zone_id: null, wialon_zone_name: null, is_departure: 1, is_finish: 0, estimated_arrival: '' },
    { stop_order: 99, stop_name: 'Finish', wialon_resource_id: null, wialon_zone_id: null, wialon_zone_name: null, is_departure: 0, is_finish: 1, estimated_arrival: '' }
  ]
}

const applyInitialData = (data: Partial<SalesCostFormData>) => {
  useManualMode.value = false // reset ke GPS mode setiap kali form dibuka
  form.id_truck = data.id_truck ? String(data.id_truck) : ''
  form.id_driver = data.id_driver ? String(data.id_driver) : ''
  form.id_customer = data.id_customer ? String(data.id_customer) : ''
  form.id_area = data.id_area ? String(data.id_area) : ''
  form.container_size = data.container_size || ''
  form.bills = data.bills || ''
  form.lift_on = formatIndonesianNumber(parseIndonesianNumber(String(data.lift_on ?? '0')))
  form.lift_of = formatIndonesianNumber(parseIndonesianNumber(String(data.lift_of ?? '0')))
  form.departure_datetime = normalizeDateTime(data.departure_datetime)
  form.arrival_datetime = normalizeDateTime(data.arrival_datetime)
  form.finish_order_datetime = normalizeDateTime(data.finish_order_datetime)
  form.container_depot = data.container_depot ?? '0'
  form.no_po = data.no_po ?? '0'
  form.tax = data.tax ?? '0'
  form.admin_charge = formatIndonesianNumber(
    parseIndonesianNumber(String(data.admin_charge ?? '0')),
  )
  form.materai = formatIndonesianNumber(parseIndonesianNumber(String(data.materai ?? '0')))
  form.container_repair = formatIndonesianNumber(
    parseIndonesianNumber(String(data.container_repair ?? '0')),
  )
  form.demurrage_chargers = formatIndonesianNumber(
    parseIndonesianNumber(String(data.demurrage_chargers ?? '0')),
  )
  form.detention_chargers = formatIndonesianNumber(
    parseIndonesianNumber(String(data.detention_chargers ?? '0')),
  )
  form.extend_gate_pass = formatIndonesianNumber(
    parseIndonesianNumber(String(data.extend_gate_pass ?? '0')),
  )
  form.trip = data.trip ?? ''
  form.jenis_trip = data.jenis_trip ?? 'Trip'
  form.price = formatIndonesianNumber(parseIndonesianNumber(String(data.price ?? '0')))
  form.additional_cost = formatIndonesianNumber(
    parseIndonesianNumber(String(data.additional_cost ?? '0')),
  )
  form.ops_cost = formatIndonesianNumber(parseIndonesianNumber(String(data.ops_cost ?? '0')))
  form.tgl_order = data.tgl_order || getDefaultOrderDate()
  form.nik_admin = data.nik_admin || data.id_admin || localStorage.getItem('nik_admin') || ''
  form.id_print = data.id_print || `Print_${generateRandomString(29)}`

  if (data.dnItems && Array.isArray(data.dnItems) && data.dnItems.length > 0) {
    dnList.value = data.dnItems.map((item) => ({
      no_dn: item.no_dn || '',
      pickup_alamat: item.pickup_alamat || '',
      drop_alamat: item.drop_alamat || '',
      qty: item.qty || '',
      pkg: item.pkg || '',
      gw: item.gw || '',
      no_container: item.no_container || '',
      no_aju: item.no_aju || '',
      remarks: item.remarks || '',
    }))
  } else {
    // Keep default if no data, or reset if editing but no DNs (shouldn't happen often)
    // If mode is edit but no DN items, we might want to keep the default 1 empty row?
    // Let's stick to the default behavior of resetForm which sets 1 empty row.
    // But applyInitialData is called after resetForm.
    if (props.mode === 'create') {
      // already reset
    } else {
      // If edit and no items, maybe user deleted all? Or data missing.
      // Default to 1 empty row if array is empty
      dnList.value = [
        {
          no_dn: '',
          pickup_alamat: '',
          drop_alamat: '',
          qty: '',
          pkg: '',
          gw: '',
          no_container: '',
          no_aju: '',
          remarks: '',
        },
      ]
    }
  }

  const optionalValues = [
    form.container_depot,
    form.no_po,
    form.tax,
    form.admin_charge,
    form.materai,
    form.container_repair,
    form.demurrage_chargers,
    form.detention_chargers,
    form.extend_gate_pass,
    form.lift_on,
    form.lift_of,
  ]
  // Populate delivery stops from existing data
  if (data.delivery_stops && Array.isArray((data as any).delivery_stops) && (data as any).delivery_stops.length > 0) {
    deliveryStops.value = (data as any).delivery_stops.map((s: DeliveryStop) => ({
      id: s.id,
      stop_order: Number(s.stop_order),
      stop_name: s.stop_name || '',
      wialon_resource_id: s.wialon_resource_id ? Number(s.wialon_resource_id) : null,
      wialon_zone_id: s.wialon_zone_id ? Number(s.wialon_zone_id) : null,
      wialon_zone_name: s.wialon_zone_name || null,
      is_departure: s.is_departure as 0 | 1,
      is_finish: s.is_finish as 0 | 1,
      estimated_arrival: normalizeDateTime(s.estimated_arrival) || ''
    }))
  }

  // Cek jika ada nilai yang tidak kosong/0 untuk menampilkan opsi
  showOptionalCosts.value = false
}

const buildPayload = () => {
  // Sync datetime fields from deliveryStops (Opsi B: hidden Tanggal Transaksi)
  const depStop = deliveryStops.value.find(s => s.is_departure === 1)
  const finStop = deliveryStops.value.find(s => s.is_finish === 1)
  const lastMiddle = [...deliveryStops.value]
    .filter(s => s.is_departure === 0 && s.is_finish === 0 && s.estimated_arrival)
    .sort((a, b) => b.stop_order - a.stop_order)[0]

  const synced_departure = depStop?.estimated_arrival || form.departure_datetime || null
  const synced_arrival = lastMiddle?.estimated_arrival || form.arrival_datetime || null
  const synced_finish = finStop?.estimated_arrival || form.finish_order_datetime || null

  return {
  tgl_order: form.tgl_order,
  id_truck: form.id_truck ? Number(form.id_truck) : null,
  id_driver: form.id_driver ? Number(form.id_driver) : null,
  id_area: form.id_area ? Number(form.id_area) : null,
  id_customer: form.id_customer ? Number(form.id_customer) : null,
  nik_admin: form.nik_admin,
  departure_datetime: synced_departure,
  arrival_datetime: synced_arrival,
  finish_order_datetime: synced_finish,
  is_manual_mode: useManualMode.value ? 1 : 0,
  bills: form.bills,
  lift_on: parseIndonesianNumber(form.lift_on || '0'),
  lift_of: parseIndonesianNumber(form.lift_of || '0'),
  container_depot: form.container_depot,
  no_po: form.no_po,
  tax: form.tax,
  admin_charge: parseIndonesianNumber(form.admin_charge || '0'),
  materai: parseIndonesianNumber(form.materai || '0'),
  trip: form.trip,
  jenis_trip: form.jenis_trip,
  container_size: isHB.value ? form.container_size || null : null,
  price: parseIndonesianNumber(form.price || '0'),
  container_repair: parseIndonesianNumber(form.container_repair || '0'),
  demurrage_chargers: parseIndonesianNumber(form.demurrage_chargers || '0'),
  detention_chargers: parseIndonesianNumber(form.detention_chargers || '0'),
  extend_gate_pass: parseIndonesianNumber(form.extend_gate_pass || '0'),
  additional_cost: parseIndonesianNumber(form.additional_cost || '0'),
  ops_cost: parseIndonesianNumber(form.ops_cost || '0'),
  id_print: form.id_print,
  dnItems: dnList.value,
  delivery_stops: deliveryStops.value.map(s => ({
    ...(s.id ? { id: s.id } : {}),
    stop_order: s.stop_order,
    stop_name: s.stop_name,
    wialon_resource_id: s.wialon_resource_id,
    wialon_zone_id: s.wialon_zone_id,
    wialon_zone_name: s.wialon_zone_name,
    is_departure: s.is_departure,
    is_finish: s.is_finish,
    estimated_arrival: s.estimated_arrival || null
  })),
  }
}

const toggleOptionalCosts = () => {
  showOptionalCosts.value = !showOptionalCosts.value
}

const handleSubmit = () => {
  if (isHB.value && !form.container_size) {
    toast.error('Container Size wajib diisi untuk kendaraan HB')
    return
  }
  if (!validateForm()) {
    toast.warning('Periksa input Anda')
    return
  }
  emit('submit', buildPayload())
}

const currentSalesCostId = computed(() => {
  const raw =
    (props.initialData as Record<string, unknown>)?.id_sales_cost ??
    (props.initialData as Record<string, unknown>)?.id ??
    null
  if (raw === null || raw === undefined || raw === '') {
    return null
  }
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? null : parsed
})

const updateTruckStatus = async () => {
  const truck = selectedTruck.value
  if (!truck?.no_police) {
    truckStatus.value = null
    return
  }

  const requestId = (truckStatusRequestId += 1)
  checkingTruckStatus.value = true

  try {
    const response = await monitoringKendaraanService.fetchMonitoring({
      search: truck.no_police,
      limit: 5,
    })

    if (requestId !== truckStatusRequestId) {
      return
    }

    const matchesTruck = (item: any) =>
      String(item?.id_truck) === String(truck.id_truck) ||
      String(item?.no_police || '').toLowerCase() === String(truck.no_police || '').toLowerCase()

    const repairMatch = response?.repair?.find(matchesTruck)
    const transaksiMatch = response?.transaksi?.find(matchesTruck)

    if (repairMatch) {
      const spk = repairMatch?.repair?.no_spk_perbaikan || '-'
      truckStatus.value = {
        type: 'repair',
        message: `Truck ini sedang dalam Perbaikan dengan nomor SPK Perbaikan: ${spk}`,
      }
      return
    }

    if (transaksiMatch) {
      const trxId = Number(transaksiMatch?.transaksi?.id_sales_cost)
      if (
        props.mode === 'edit' &&
        currentSalesCostId.value &&
        Number.isFinite(trxId) &&
        trxId === currentSalesCostId.value
      ) {
        truckStatus.value = null
        return
      }
      const spk = transaksiMatch?.transaksi?.no_spk || '-'
      truckStatus.value = {
        type: 'transaksi',
        message: `Truck ini sudah memiliki Transaksi dengan nomor SPK : ${spk}`,
      }
      return
    }

    truckStatus.value = null
  } catch (error) {
    if (requestId !== truckStatusRequestId) {
      return
    }
    truckStatus.value = null
  } finally {
    if (requestId === truckStatusRequestId) {
      checkingTruckStatus.value = false
    }
  }
}

const loadOptions = async () => {
  const [truckData, driverData, customerData, areaData] = await Promise.all([
    salesCostService.fetchTrucks(),
    salesCostService.fetchDrivers(),
    salesCostService.fetchCustomers(),
    salesCostService.fetchAreas(),
  ])
  trucks.value = truckData
  if (
    props.mode === 'edit' &&
    form.id_truck &&
    !trucks.value.some((truck) => String(truck.id_truck) === form.id_truck)
  ) {
    try {
      const currentTruck = await salesCostService.fetchTruck(form.id_truck)
      trucks.value = [currentTruck, ...trucks.value]
    } catch (error) {
      console.error(error)
    }
  }
  drivers.value = driverData
  if (
    props.mode === 'edit' &&
    form.id_driver &&
    !drivers.value.some((driver) => String(driver.id_driver) === form.id_driver)
  ) {
    try {
      const currentDriver = await salesCostService.fetchDriver(form.id_driver)
      drivers.value = [currentDriver, ...drivers.value]
    } catch (error) {
      console.error(error)
    }
  }
  customers.value = customerData
  areas.value = areaData
}

watch(isHB, (value) => {
  if (!value) {
    form.container_size = ''
  }
})

watch(
  () => props.initialData,
  (value) => {
    if (props.mode === 'edit' && value) {
      applyInitialData(value)
    }
  },
  { deep: true, immediate: true },
)

watch(
  () => props.mode,
  (value) => {
    if (value === 'create') {
      resetForm()
      applyInitialData({})
    }
  },
)

watch(
  () => form.id_truck,
  () => {
    truckStatus.value = null
    if (!form.id_truck) {
      return
    }
    void updateTruckStatus()
  },
)

watch(
  () => [form.departure_datetime, form.arrival_datetime, form.finish_order_datetime],
  () => {
    updateDateOrderErrors()
  },
  { immediate: true },
)

// Auto-populate delivery stops when area changes (edit mode guard)
watch(
  () => form.id_area,
  async (newAreaId, oldAreaId) => {
    if (!newAreaId || newAreaId === oldAreaId || props.mode === 'edit' || areaAutoPopulating.value) return
    if (!isStopsDefault()) return  // Don't overwrite user's existing stops
    areaAutoPopulating.value = true
    try {
      const data = await salesCostService.fetchAreaRouteSteps(newAreaId)
      if (data?.stops?.length > 0) {
        applyTemplateStops(data.stops, null)
        toast.info('Jadwal diisi dari rute area. Silakan lengkapi tanggal dan jam.')
      }
    } catch {
      // silent fail
    } finally {
      areaAutoPopulating.value = false
    }
  }
)

onMounted(async () => {
  await loadOptions()
  void loadGeofences()
  void loadTemplates()
  if (props.mode === 'create') {
    resetForm()
    applyInitialData({})
  }
})
</script>

<style scoped>
.dn-collapse-enter-active,
.dn-collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.dn-collapse-enter-from,
.dn-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.dn-collapse-enter-to,
.dn-collapse-leave-from {
  opacity: 1;
  max-height: 1200px;
}
</style>
