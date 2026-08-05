<template>
  <div class="space-y-4">
    <p
      v-if="submitError"
      class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
    >
      {{ submitError }}
    </p>
    <p v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
      Memuat data transaksi...
    </p>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <fieldset :disabled="isDisabled" class="space-y-6">
        <!-- Section 1: Mitra & Pesanan -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="mb-4 flex items-center gap-2">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Mitra &amp; Pesanan
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Warehouse</label>
              <SearchableSelect
                v-model="form.id_warehouse"
                :options="warehouses"
                value-key="id_warehouse"
                :label-formatter="formatWarehouseLabel"
                :search-keys="['kode_warehouse', 'nm_warehouse']"
                placeholder="-Pilih-"
                search-placeholder="Cari warehouse"
                :disabled="isDisabled"
              />
              <p v-if="errors.id_warehouse" class="mt-1 text-xs text-error-600">{{ errors.id_warehouse }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Customer</label>
              <SearchableSelect
                v-model="form.id_customer"
                :options="customers"
                value-key="id_customer"
                :label-formatter="formatCustomerLabel"
                :search-keys="['id_customer', 'nama_customer']"
                placeholder="-Pilih-"
                search-placeholder="Cari customer"
                :disabled="isDisabled"
              />
              <p v-if="errors.id_customer" class="mt-1 text-xs text-error-600">{{ errors.id_customer }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">SubCont</label>
              <SearchableSelect
                v-model="form.id_subcont"
                :options="subconts"
                value-key="id_subcont"
                label-key="nama_subcont"
                :search-keys="['nama_subcont']"
                placeholder="-Pilih-"
                search-placeholder="Cari subcont"
                :disabled="isDisabled"
              />
              <p v-if="errors.id_subcont" class="mt-1 text-xs text-error-600">{{ errors.id_subcont }}</p>
            </div>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Order Date</label>
              <DatePickerInput
                v-model="form.order_date"
                placeholder="Pilih tanggal"
                :disabled="isDisabled"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Trip</label>
              <input
                v-model="form.trip"
                type="number"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Jumlah trip"
                :disabled="isDisabled"
              />
              <p v-if="errors.trip" class="mt-1 text-xs text-error-600">{{ errors.trip }}</p>
            </div>
          </div>
        </div>

        <!-- Section 2: Kendaraan & Dokumen -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="mb-4 flex items-center gap-2">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h6l3-3V9h-3" />
            </svg>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Kendaraan &amp; Dokumen
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">No. Polisi</label>
              <input
                v-model="form.truck"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="No. Polisi"
                :disabled="isDisabled"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Jenis Kendaraan</label>
              <input
                v-model="form.jenis_kendaraan"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Jenis kendaraan"
                :disabled="isDisabled"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Tonase</label>
              <input
                v-model="form.tonase"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Tonase"
                :disabled="isDisabled"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Driver</label>
              <input
                v-model="form.driver"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Nama driver"
                :disabled="isDisabled"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">No. Surat Jalan</label>
              <input
                v-model="form.no_surat_jalan"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="No. surat jalan"
                :disabled="isDisabled"
              />
            </div>
          </div>
        </div>

        <!-- Section: Delivery Note (DN) -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Delivery Note (DN)</p>
            </div>
            <button
              v-if="!isDisabled"
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              @click="addDnItem"
            >
              + Add DN
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(item, index) in dnItems"
              :key="index"
              class="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                @click="toggleDnItem(index)"
              >
                <div class="flex min-w-0 items-center gap-2">
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
                  v-if="!isDisabled && dnItems.length > 1"
                  class="flex-none cursor-pointer px-2 py-1 text-xs text-error-500 hover:text-error-700"
                  role="button"
                  @click.stop="removeDnItem(index)"
                >
                  Hapus
                </span>
              </button>

              <Transition name="dn-collapse">
                <div v-show="!dnCollapsed[index]" class="px-4 pb-4">
                  <div class="space-y-4">
                    <div>
                      <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">No. DN</label>
                      <input
                        v-model="item.no_dn"
                        type="text"
                        maxlength="100"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        placeholder="Nomor DN"
                        :disabled="isDisabled"
                      />
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Pickup Alamat</label>
                        <AddressAutocomplete
                          v-model="item.pickup_alamat"
                          placeholder="Alamat Pickup"
                          :disabled="isDisabled"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Drop Alamat</label>
                        <AddressAutocomplete
                          v-model="item.drop_alamat"
                          placeholder="Alamat Drop"
                          :disabled="isDisabled"
                        />
                      </div>
                    </div>
                    <div class="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Qty</label>
                        <input
                          v-model="item.qty"
                          type="number"
                          min="0"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          placeholder="Qty"
                          :disabled="isDisabled"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">PKG</label>
                        <select
                          v-model="item.pkg"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          :disabled="isDisabled"
                        >
                          <option value="">-Pilih-</option>
                          <option value="IBC">IBC</option>
                          <option value="CTN">CTN</option>
                          <option value="PIL">PIL</option>
                          <option value="DRM">DRM</option>
                        </select>
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">G.W</label>
                        <input
                          v-model="item.gw"
                          type="text"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          placeholder="G.W"
                          :disabled="isDisabled"
                        />
                      </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">No. Container</label>
                        <input
                          v-model="item.no_container"
                          type="text"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          placeholder="No. Container"
                          :disabled="isDisabled"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">No. Aju</label>
                        <input
                          v-model="item.no_aju"
                          type="text"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          placeholder="No. Aju"
                          :disabled="isDisabled"
                        />
                      </div>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Remarks</label>
                      <textarea
                        v-model="item.remarks"
                        rows="1"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        placeholder="Catatan..."
                        :disabled="isDisabled"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <p v-if="dnItems.length === 0" class="text-center text-xs text-gray-400 dark:text-gray-500">
              Belum ada DN. Klik "+ Add DN" untuk menambahkan.
            </p>
          </div>
        </div>

        <!-- Section 3: Jadwal Pengiriman -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="mb-4 flex items-center gap-2">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Jadwal Pengiriman
              </p>
              <p class="text-[11px] text-gray-400 dark:text-gray-500">
                {{ deliveryStops.length }} titik perjalanan
              </p>
            </div>
          </div>

          <div class="relative ml-4 pl-6">
            <div class="absolute left-4 top-5 bottom-5 w-0.5 bg-gradient-to-b from-brand-400 via-gray-200 to-gray-400 dark:from-brand-500/60 dark:via-gray-700 dark:to-gray-600" />

            <div class="relative mb-4">
              <div class="absolute -left-10 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-500/20">
                <svg class="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
              </div>
              <div class="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-brand-500/30 dark:from-brand-500/5 dark:to-gray-900">
                <div class="mb-3 flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Keberangkatan</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Nama Stop</label>
                    <input
                      v-model="departureStop.stop_name"
                      type="text"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      placeholder="Departure"
                      :disabled="isDisabled"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Estimasi Waktu</label>
                    <DatePickerInput
                      v-model="departureStop.estimated_arrival"
                      placeholder="Pilih tanggal & waktu"
                      :enable-time="true"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
                <p v-if="getStopErrors(0).time || getStopErrors(0).order" class="mt-2 text-xs text-error-600">
                  {{ getStopErrors(0).time || getStopErrors(0).order }}
                </p>
              </div>
            </div>

            <div v-for="(stop, mi) in middleStops" :key="'m-' + mi" class="relative mb-4">
              <div class="absolute -left-10 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white ring-4 ring-gray-100 dark:ring-gray-700">
                {{ mi + 1 }}
              </div>
              <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tujuan {{ mi + 1 }}</span>
                  <button
                    v-if="!isDisabled"
                    type="button"
                    class="text-xs text-error-600 hover:underline"
                    @click="removeMiddleStop(mi)"
                  >
                    Hapus
                  </button>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Nama Stop</label>
                    <input
                      v-model="stop.stop_name"
                      type="text"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      placeholder="Nama tujuan"
                      :disabled="isDisabled"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Estimasi Tiba</label>
                    <DatePickerInput
                      v-model="stop.estimated_arrival"
                      placeholder="Pilih tanggal & waktu"
                      :enable-time="true"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
                <p v-if="getStopErrors(mi + 1).time || getStopErrors(mi + 1).name || getStopErrors(mi + 1).order" class="mt-2 text-xs text-error-600">
                  {{ getStopErrors(mi + 1).time || getStopErrors(mi + 1).name || getStopErrors(mi + 1).order }}
                </p>
              </div>
            </div>

            <div v-if="!isDisabled" class="relative mb-4">
              <div class="absolute -left-10 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-900">
                +
              </div>
              <button
                type="button"
                class="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-600 dark:text-gray-400"
                @click="addMiddleStop"
              >
                Tambah Tujuan
              </button>
            </div>

            <div class="relative mb-1">
              <div class="absolute -left-10 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 ring-4 ring-gray-100 dark:bg-gray-600 dark:ring-gray-800">
                <span class="text-[10px] font-bold text-white">F</span>
              </div>
              <div class="rounded-xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-600 dark:from-gray-800/50 dark:to-gray-900">
                <div class="mb-3 flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">Selesai / Finish</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Nama Stop</label>
                    <input
                      v-model="finishStop.stop_name"
                      type="text"
                      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      placeholder="Finish"
                      :disabled="isDisabled"
                    />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Estimasi Waktu Selesai</label>
                    <DatePickerInput
                      v-model="finishStop.estimated_arrival"
                      placeholder="Pilih tanggal & waktu"
                      :enable-time="true"
                      :disabled="isDisabled"
                    />
                  </div>
                </div>
                <p v-if="getStopErrors(deliveryStops.length - 1).time || getStopErrors(deliveryStops.length - 1).order" class="mt-2 text-xs text-error-600">
                  {{ getStopErrors(deliveryStops.length - 1).time || getStopErrors(deliveryStops.length - 1).order }}
                </p>
              </div>
            </div>
          </div>
          <p v-if="errors.delivery_stops" class="mt-3 text-xs text-error-600">{{ errors.delivery_stops }}</p>
        </div>

        <!-- Section 4: Biaya & Tagihan -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
          <div class="mb-4 flex items-center gap-2">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              Biaya &amp; Tagihan
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Cost</label>
              <input
                v-model="form.cost"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="0"
                :disabled="isDisabled"
                @input="formatNumeric('cost')"
              />
              <p v-if="errors.cost" class="mt-1 text-xs text-error-600">{{ errors.cost }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Sales</label>
              <input
                v-model="form.sales"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="0"
                :disabled="isDisabled"
                @input="formatNumeric('sales')"
              />
              <p v-if="errors.sales" class="mt-1 text-xs text-error-600">{{ errors.sales }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Invoice</label>
              <input
                v-model="form.no_invoice"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Nomor invoice"
                :disabled="isDisabled"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Billing Customer</label>
              <input
                v-model="form.billing_customer"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="No. billing"
                :disabled="isDisabled"
              />
            </div>
          </div>
        </div>
      </fieldset>

      <div class="flex items-center justify-center pt-2">
        <button
          v-if="!readOnly"
          type="submit"
          class="inline-flex w-full max-w-md items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
          :disabled="isDisabled"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import AddressAutocomplete from '@/components/common/AddressAutocomplete.vue'
import { subcontractorService } from '@/services/subcontractorService'
import { useToast } from '@/composables/useToast'

type WarehouseOption = {
  id_warehouse: number
  kode_warehouse: string
  nm_warehouse: string
}

type CustomerOption = {
  id_customer: number
  nama_customer: string
}

type SubcontOption = {
  id_subcont: number
  nama_subcont: string
}

type DeliveryStop = {
  id?: number
  stop_order: number
  stop_name: string
  is_departure: 0 | 1
  is_finish: 0 | 1
  estimated_arrival: string
}

type DNItem = {
  no_dn: string
  pickup_alamat: string
  drop_alamat: string
  qty: number | string
  pkg: string
  gw: number | string
  no_container: string
  no_aju: string
  remarks: string
}

type SubcontractorFormData = {
  order_date: string
  delivery_date: string
  arrival_date: string
  id_warehouse: string
  id_customer: string
  id_subcont: string
  no_surat_jalan: string
  trip: string
  truck: string
  jenis_kendaraan: string
  tonase: string
  tujuan_pengiriman: string
  driver: string
  cost: string
  no_invoice: string
  billing_customer: string
  sales: string
  delivery_stops?: DeliveryStop[]
}

type Props = {
  mode?: 'create' | 'edit'
  initialData?: Partial<SubcontractorFormData>
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
  readOnly: false
})

const emit = defineEmits<{
  (event: 'submit', payload: Record<string, unknown>): void
}>()

const toast = useToast()
const warehouses = ref<WarehouseOption[]>([])
const customers = ref<CustomerOption[]>([])

// ── DN state ──────────────────────────────────────────────────────────────────
const dnItems = ref<DNItem[]>([])
const dnCollapsed = ref<boolean[]>([])

const makeDnItem = (): DNItem => ({
  no_dn: '', pickup_alamat: '', drop_alamat: '',
  qty: 0, pkg: '', gw: 0, no_container: '', no_aju: '', remarks: ''
})

const addDnItem = () => {
  dnItems.value.push(makeDnItem())
  dnCollapsed.value.push(false)
}

const removeDnItem = (index: number) => {
  dnItems.value.splice(index, 1)
  dnCollapsed.value.splice(index, 1)
}

const toggleDnItem = (index: number) => {
  dnCollapsed.value[index] = !dnCollapsed.value[index]
}

const loadDnItems = async (id: number) => {
  try {
    const res = await subcontractorService.fetchDNList(id)
    dnItems.value = (res.items || []) as DNItem[]
    dnCollapsed.value = dnItems.value.map(() => false)
  } catch {
    // non-blocking: DN load failure doesn't block form
  }
}

const saveDnItems = async (id: number) => {
  try {
    await subcontractorService.saveDNList(id, dnItems.value)
  } catch {
    toast.warning('Data DN gagal disimpan, data utama tersimpan.')
  }
}
const subconts = ref<SubcontOption[]>([])
const errors = reactive<Record<string, string>>({})

const form = reactive<SubcontractorFormData>({
  order_date: '',
  delivery_date: '',
  arrival_date: '',
  id_warehouse: '',
  id_customer: '',
  id_subcont: '',
  no_surat_jalan: '',
  trip: '',
  truck: '',
  jenis_kendaraan: '',
  tonase: '',
  tujuan_pengiriman: '',
  driver: '',
  cost: '0',
  no_invoice: '',
  billing_customer: '',
  sales: '0'
})

const isDisabled = computed(() => props.submitting || props.loading || props.readOnly)

const makeDefaultStops = (): DeliveryStop[] => [
  {
    stop_order: 0,
    stop_name: 'Departure',
    is_departure: 1,
    is_finish: 0,
    estimated_arrival: ''
  },
  {
    stop_order: 99,
    stop_name: 'Finish',
    is_departure: 0,
    is_finish: 1,
    estimated_arrival: ''
  }
]

const deliveryStops = ref<DeliveryStop[]>(makeDefaultStops())

const departureStop = computed(() => deliveryStops.value.find((s) => s.is_departure === 1)!)
const finishStop = computed(() => deliveryStops.value.find((s) => s.is_finish === 1)!)
const middleStops = computed(() =>
  deliveryStops.value.filter((s) => s.is_departure === 0 && s.is_finish === 0)
)

const getStopErrors = (sortedIndex: number) => ({
  name: errors[`stop_name_${sortedIndex}`] || '',
  time: errors[`stop_time_${sortedIndex}`] || '',
  order: errors[`stop_order_${sortedIndex}`] || ''
})

const renumberStops = () => {
  const dep = deliveryStops.value.find((s) => s.is_departure === 1)
  const fin = deliveryStops.value.find((s) => s.is_finish === 1)
  const mids = deliveryStops.value.filter((s) => s.is_departure === 0 && s.is_finish === 0)
  const next: DeliveryStop[] = []
  if (dep) {
    next.push({ ...dep, stop_order: 0, is_departure: 1, is_finish: 0 })
  }
  mids.forEach((m, i) => {
    next.push({
      ...m,
      stop_order: i + 1,
      is_departure: 0,
      is_finish: 0,
      stop_name: m.stop_name || `Tujuan ${i + 1}`
    })
  })
  if (fin) {
    next.push({ ...fin, stop_order: 99, is_departure: 0, is_finish: 1 })
  }
  deliveryStops.value = next
}

const addMiddleStop = () => {
  const mids = middleStops.value
  deliveryStops.value.splice(deliveryStops.value.length - 1, 0, {
    stop_order: mids.length + 1,
    stop_name: `Tujuan ${mids.length + 1}`,
    is_departure: 0,
    is_finish: 0,
    estimated_arrival: ''
  })
  renumberStops()
}

const removeMiddleStop = (middleIndex: number) => {
  const mids = middleStops.value
  const target = mids[middleIndex]
  if (!target) return
  deliveryStops.value = deliveryStops.value.filter((s) => s !== target)
  renumberStops()
}

const formatWarehouseLabel = (warehouse: WarehouseOption) =>
  `${warehouse.kode_warehouse} - ${warehouse.nm_warehouse}`

const formatCustomerLabel = (customer: CustomerOption) =>
  `${customer.id_customer} - ${customer.nama_customer}`

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
    maximumFractionDigits: 0
  })

const formatNumeric = (field: string) => {
  const value = (form as Record<string, string>)[field] ?? ''
  const parsed = parseIndonesianNumber(value)
  ;(form as Record<string, string>)[field] = formatIndonesianNumber(parsed)
}

const normalizeDate = (value?: string | null) => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Normalize to YYYY-MM-DD HH:mm for DatePicker enableTime */
const normalizeDateTime = (value?: string | null) => {
  if (!value) return ''
  const s = String(value).trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return s.slice(0, 16)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const dateOnlyFromDt = (value?: string | null) => {
  if (!value) return ''
  const s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return normalizeDate(value)
}

const getTodayDate = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    delete errors[key]
  })
}

const updateStopOrderErrors = () => {
  const sorted = [...deliveryStops.value].sort((a, b) => a.stop_order - b.stop_order)
  for (let i = 1; i < sorted.length; i++) {
    const key = `stop_order_${i}`
    const cur = sorted[i].estimated_arrival
    const prev = sorted[i - 1].estimated_arrival
    if (cur && prev && cur < prev) {
      errors[key] = `Waktu stop tidak boleh lebih awal dari stop sebelumnya.`
    } else {
      delete errors[key]
    }
  }
}

const validateForm = () => {
  clearErrors()
  if (!form.id_warehouse) {
    errors.id_warehouse = 'Warehouse wajib dipilih.'
  }
  if (!form.id_customer) {
    errors.id_customer = 'Customer wajib dipilih.'
  }
  if (!form.id_subcont) {
    errors.id_subcont = 'Subcont wajib dipilih.'
  }
  // truck, jenis_kendaraan, tonase, driver, no_surat_jalan, tujuan_pengiriman: optional
  if (!form.cost) {
    errors.cost = 'Cost wajib diisi.'
  }
  if (!form.sales) {
    errors.sales = 'Sales wajib diisi.'
  }
  if (!form.trip) {
    errors.trip = 'Trip wajib diisi.'
  }

  const sorted = [...deliveryStops.value].sort((a, b) => a.stop_order - b.stop_order)
  if (!sorted.some((s) => s.is_departure === 1) || !sorted.some((s) => s.is_finish === 1)) {
    errors.delivery_stops = 'Jadwal harus memiliki Departure dan Finish.'
  }
  sorted.forEach((stop, i) => {
    if (!stop.stop_name?.trim()) {
      errors[`stop_name_${i}`] = 'Nama stop wajib diisi.'
    }
    if (!stop.estimated_arrival) {
      errors[`stop_time_${i}`] = 'Estimasi waktu wajib diisi.'
    }
  })
  updateStopOrderErrors()

  return Object.keys(errors).length === 0
}

const resetForm = () => {
  form.order_date = getTodayDate()
  form.delivery_date = ''
  form.arrival_date = ''
  form.id_warehouse = ''
  form.id_customer = ''
  form.id_subcont = ''
  form.no_surat_jalan = ''
  form.trip = ''
  form.truck = ''
  form.jenis_kendaraan = ''
  form.tonase = ''
  form.tujuan_pengiriman = ''
  form.driver = ''
  form.cost = '0'
  form.no_invoice = ''
  form.billing_customer = ''
  form.sales = '0'
  deliveryStops.value = makeDefaultStops()
  clearErrors()
}

const applyInitialData = (data: Partial<SubcontractorFormData>) => {
  form.order_date = data.order_date ? normalizeDate(data.order_date) : getTodayDate()
  form.delivery_date = normalizeDate(data.delivery_date)
  form.arrival_date = normalizeDate(data.arrival_date)
  form.id_warehouse = data.id_warehouse ? String(data.id_warehouse) : ''
  form.id_customer = data.id_customer ? String(data.id_customer) : ''
  form.id_subcont = data.id_subcont ? String(data.id_subcont) : ''
  form.no_surat_jalan = data.no_surat_jalan || ''
  form.trip = data.trip || ''
  form.truck = data.truck || ''
  form.jenis_kendaraan = data.jenis_kendaraan || ''
  form.tonase = data.tonase || ''
  form.tujuan_pengiriman = data.tujuan_pengiriman || ''
  form.driver = data.driver || ''
  form.cost = formatIndonesianNumber(parseIndonesianNumber(String(data.cost ?? '0')))
  form.no_invoice = data.no_invoice || ''
  form.billing_customer = data.billing_customer || ''
  form.sales = formatIndonesianNumber(parseIndonesianNumber(String(data.sales ?? '0')))

  // load DN items for edit/readOnly mode
  const recordId = (data as Record<string, unknown>).id_subcontractor
  if (recordId) {
    loadDnItems(Number(recordId))
  }

  const rawStops = (data as { delivery_stops?: DeliveryStop[] }).delivery_stops
  if (Array.isArray(rawStops) && rawStops.length > 0) {
    deliveryStops.value = rawStops.map((s) => ({
      id: s.id,
      stop_order: Number(s.stop_order) || 0,
      stop_name: s.stop_name || '',
      is_departure: Number(s.is_departure) === 1 ? 1 : 0,
      is_finish: Number(s.is_finish) === 1 ? 1 : 0,
      estimated_arrival: normalizeDateTime(s.estimated_arrival)
    }))
    renumberStops()
  } else {
    // Legacy: seed from header DATE fields
    const depTime = form.delivery_date ? `${form.delivery_date} 00:00` : ''
    const arrTime = form.arrival_date ? `${form.arrival_date} 00:00` : ''
    deliveryStops.value = [
      {
        stop_order: 0,
        stop_name: 'Departure',
        is_departure: 1,
        is_finish: 0,
        estimated_arrival: depTime
      },
      {
        stop_order: 99,
        stop_name: 'Finish',
        is_departure: 0,
        is_finish: 1,
        estimated_arrival: arrTime || depTime
      }
    ]
  }
}

const buildPayload = () => {
  renumberStops()
  const sorted = [...deliveryStops.value].sort((a, b) => a.stop_order - b.stop_order)
  const dep = sorted.find((s) => s.is_departure === 1)
  const fin = sorted.find((s) => s.is_finish === 1)
  const mids = sorted.filter((s) => s.is_departure === 0 && s.is_finish === 0)
  const lastMid = mids.length ? mids[mids.length - 1] : null

  // Covered by Jadwal Pengiriman — auto-fill DB column from Finish name (fallback middles)
  const tujuanAuto =
    (fin?.stop_name || '').trim() ||
    mids
      .map((m) => (m.stop_name || '').trim())
      .filter(Boolean)
      .join(', ') ||
    ''

  return {
    order_date: form.order_date || getTodayDate(),
    delivery_date: dateOnlyFromDt(dep?.estimated_arrival) || form.delivery_date || null,
    arrival_date:
      dateOnlyFromDt(lastMid?.estimated_arrival) ||
      dateOnlyFromDt(fin?.estimated_arrival) ||
      form.arrival_date ||
      null,
    id_warehouse: form.id_warehouse ? Number(form.id_warehouse) : null,
    id_customer: form.id_customer ? Number(form.id_customer) : null,
    id_subcont: form.id_subcont ? Number(form.id_subcont) : null,
    no_surat_jalan: form.no_surat_jalan || '',
    trip: form.trip,
    truck: form.truck || '',
    jenis_kendaraan: form.jenis_kendaraan || '',
    tonase: form.tonase || '',
    tujuan_pengiriman: tujuanAuto,
    driver: form.driver || '',
    cost: parseIndonesianNumber(form.cost || '0'),
    no_invoice: form.no_invoice,
    billing_customer: form.billing_customer,
    sales: parseIndonesianNumber(form.sales || '0'),
    delivery_stops: sorted.map((s) => ({
      id: s.id,
      stop_order: s.stop_order,
      stop_name: s.stop_name,
      is_departure: s.is_departure,
      is_finish: s.is_finish,
      estimated_arrival: s.estimated_arrival || null
    }))
  }
}

const handleSubmit = () => {
  if (!validateForm()) {
    toast.warning('Periksa input Anda')
    return
  }
  emit('submit', { ...buildPayload(), _dnItems: dnItems.value })
}

const loadOptions = async () => {
  const [warehouseData, customerData, subcontData] = await Promise.all([
    subcontractorService.fetchWarehouses(),
    subcontractorService.fetchCustomers(),
    subcontractorService.fetchSubconts()
  ])
  warehouses.value = warehouseData
  customers.value = customerData
  subconts.value = subcontData
}

watch(
  () => props.initialData,
  (value) => {
    if ((props.mode === 'edit' || props.readOnly) && value) {
      applyInitialData(value)
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.mode,
  (value) => {
    if (value === 'create') {
      resetForm()
    }
  }
)

watch(
  () => deliveryStops.value.map((s) => s.estimated_arrival),
  () => updateStopOrderErrors(),
  { deep: true }
)

onMounted(async () => {
  await loadOptions()
  if (props.mode === 'create') {
    resetForm()
  }
})
</script>
