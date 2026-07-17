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

        <!-- Section: Tanggal Transaksi -->
        <div class="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
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
              required
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
              required
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
              :required="props.mode === 'create'"
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

        <!-- Estimasi Tiba Per Stop (muncul jika rute punya steps) -->
        <div v-if="stepSchedules.length > 0" class="mt-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/30">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Estimasi Tiba Per Stop <span class="font-normal normal-case text-gray-400">(opsional)</span>
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(step, index) in stepSchedules" :key="step.id_area_route_step">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Stop {{ index + 1 }} — {{ step.step_name_snapshot }}
              </label>
              <DatePickerInput
                v-model="step.estimated_arrival"
                placeholder="Pilih tanggal & waktu (opsional)"
                :enable-time="true"
                :disabled="isDisabled"
              />
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
import { useToast } from '@/composables/useToast'

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

interface StepScheduleItem {
  id_area_route_step: number
  step_order_snapshot: number
  step_name_snapshot: string
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
const stepSchedules = ref<StepScheduleItem[]>([])

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
    errors.departure_datetime = 'Departure wajib diisi.'
  } else if (!isValidIsoDateTime(form.departure_datetime)) {
    errors.departure_datetime = 'Format Departure harus YYYY-MM-DD HH:MM.'
  }
  if (!form.arrival_datetime) {
    errors.arrival_datetime = 'Arrival wajib diisi.'
  } else if (!isValidIsoDateTime(form.arrival_datetime)) {
    errors.arrival_datetime = 'Format Arrival harus YYYY-MM-DD HH:MM.'
  }
  if (props.mode === 'create' && !form.finish_order_datetime) {
    errors.finish_order_datetime = 'Finish Order wajib diisi.'
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
  stepSchedules.value = []
}

const applyInitialData = (data: Partial<SalesCostFormData>) => {
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
  // Populate step schedules from existing data
  if (data.step_schedules && Array.isArray(data.step_schedules)) {
    stepSchedules.value = (data.step_schedules as StepScheduleItem[]).map((s: StepScheduleItem) => ({
      id_area_route_step: Number(s.id_area_route_step),
      step_order_snapshot: Number(s.step_order_snapshot),
      step_name_snapshot: s.step_name_snapshot || '',
      estimated_arrival: normalizeDateTime(s.estimated_arrival) || ''
    }))
  }

  // Cek jika ada nilai yang tidak kosong/0 untuk menampilkan opsi
  showOptionalCosts.value = false
}

const buildPayload = () => ({
  tgl_order: form.tgl_order,
  id_truck: form.id_truck ? Number(form.id_truck) : null,
  id_driver: form.id_driver ? Number(form.id_driver) : null,
  id_area: form.id_area ? Number(form.id_area) : null,
  id_customer: form.id_customer ? Number(form.id_customer) : null,
  nik_admin: form.nik_admin,
  departure_datetime: form.departure_datetime,
  arrival_datetime: form.arrival_datetime,
  finish_order_datetime: form.finish_order_datetime,
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
  step_schedules: stepSchedules.value
    .filter(s => s.estimated_arrival && s.estimated_arrival.trim() !== '')
    .map(s => ({
      id_area_route_step: s.id_area_route_step,
      step_order_snapshot: s.step_order_snapshot,
      step_name_snapshot: s.step_name_snapshot,
      estimated_arrival: s.estimated_arrival
    })),
})

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

// When route changes, rebuild stepSchedules preserving existing estimated_arrival values
const rebuildStepSchedules = (steps: Array<{ id_area_route_step: number; step_order: number; step_name: string }>) => {
  const existing = new Map(stepSchedules.value.map(s => [s.id_area_route_step, s.estimated_arrival]))
  stepSchedules.value = steps.map(step => ({
    id_area_route_step: step.id_area_route_step,
    step_order_snapshot: step.step_order,
    step_name_snapshot: step.step_name,
    estimated_arrival: existing.get(step.id_area_route_step) || ''
  }))
}

watch(
  () => form.id_area,
  async (newId) => {
    if (!newId) {
      stepSchedules.value = []
      return
    }
    try {
      const steps = await salesCostService.fetchAreaRouteSteps(newId)
      if (Array.isArray(steps) && steps.length > 0) {
        rebuildStepSchedules(steps)
      } else {
        stepSchedules.value = []
      }
    } catch {
      stepSchedules.value = []
    }
  },
  { immediate: true }
)

watch(
  () => [form.departure_datetime, form.arrival_datetime, form.finish_order_datetime],
  () => {
    updateDateOrderErrors()
  },
  { immediate: true },
)

onMounted(async () => {
  await loadOptions()
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
