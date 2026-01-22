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

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <fieldset :disabled="isDisabled" class="space-y-4">
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

        <div class="grid gap-4 sm:grid-cols-2">
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

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Delivery Order</label
            >
            <DatePickerInput
              v-model="form.delivery_order"
              placeholder="Pilih tanggal"
              required
              :disabled="isDisabled"
            />
            <p v-if="errors.delivery_order" class="mt-1 text-xs text-error-600">
              {{ errors.delivery_order }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
              >Arrival</label
            >
            <DatePickerInput
              v-model="form.arrival_order"
              placeholder="Pilih tanggal"
              required
              :disabled="isDisabled"
            />
            <p v-if="errors.arrival_order" class="mt-1 text-xs text-error-600">
              {{ errors.arrival_order }}
            </p>
          </div>
        </div>

        <!-- Main Fields: No DN, Pickup, Drop Removed -->
        <!-- Divider -->
        <div class="my-6 border-t border-gray-200 dark:border-gray-800"></div>

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
        
        <div class="flex items-center justify-between mb-4 mt-6">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">DN LIST / RINCIAN DN</h4>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            @click="addDnItem"
          >
            + Add DN
          </button>
        </div>

        <div class="space-y-6">
          <div
            v-for="(item, index) in dnList"
            :key="index"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          >
            <div class="mb-4 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Item #{{ index + 1 }}</span>
              <button
                v-if="dnList.length > 1"
                type="button"
                class="text-error-500 hover:text-error-700 text-xs"
                @click="removeDnItem(index)"
              >
                Hapus
              </button>
            </div>

            <div class="space-y-4">
              <!-- No DN -->
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">No. DN</label>
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
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Pickup Alamat</label>
                  <textarea
                    v-model="item.pickup_alamat"
                    rows="2"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="Alamat Pickup"
                  ></textarea>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Drop Alamat</label>
                  <textarea
                    v-model="item.drop_alamat"
                    rows="2"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="Alamat Drop"
                  ></textarea>
                </div>
              </div>

              <!-- Qty, PKG, GW -->
              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Qty</label>
                  <input
                    v-model="item.qty"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="Qty"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">PKG</label>
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
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">G.W</label>
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
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">No. Container</label>
                  <input
                    v-model="item.no_container"
                    type="text"
                    class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    placeholder="No. Container"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">No. Aju</label>
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
                <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200">Remarks</label>
                <textarea
                  v-model="item.remarks"
                  rows="1"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  placeholder="Catatan..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-6 border-t border-gray-200 dark:border-gray-800"></div>
        <h4 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">BIAYA OPSIONAL & DETAIL</h4>

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

          <div class="grid gap-4 sm:grid-cols-2">
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
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="lg:col-span-2">
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
            <div class="lg:col-span-1">
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
            <div class="lg:col-span-1">
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
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >Allowance Cost</label
              >
              <input
                v-model="form.materai"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                placeholder="Masukan Materai"
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

        <div class="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
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
      </fieldset>

      <div v-if="$slots['pre-submit']" class="flex items-center gap-4">
        <slot name="pre-submit" />
      </div>

      <button
        v-if="!readOnly"
        type="submit"
        class="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
        :disabled="isDisabled"
      >
        {{ submitLabel }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import { salesCostService } from '@/services/salesCostService'
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
  delivery_order: string
  arrival_order: string
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
  readOnly: false
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
const toast = useToast()

const form = reactive<SalesCostFormData>({
  id_truck: '',
  id_driver: '',
  id_customer: '',
  id_area: '',
  container_size: '',
  bills: '',
  lift_on: '0',
  lift_of: '0',
  delivery_order: '',
  arrival_order: '',
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
  id_print: ''
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
    remarks: ''
  }
])

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
    remarks: ''
  })
}

const removeDnItem = (index: number) => {
  if (dnList.value.length > 1) {
    dnList.value.splice(index, 1)
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
  'ops_cost'
]

const selectedTruck = computed(() =>
  trucks.value.find((truck) => String(truck.id_truck) === form.id_truck)
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
  // Jika value sudah format YYYY-MM-DD, kembalikan langsung
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  // Gunakan local time untuk mendapatkan tanggal yang benar sesuai timezone user
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    delete errors[key]
  })
}

const isValidIsoDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return false
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  )
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
  if (!form.delivery_order) {
    errors.delivery_order = 'Delivery Order wajib diisi.'
  } else if (!isValidIsoDate(form.delivery_order)) {
    errors.delivery_order = 'Delivery Order tidak valid.'
  }
  if (!form.arrival_order) {
    errors.arrival_order = 'Arrival wajib diisi.'
  } else if (!isValidIsoDate(form.arrival_order)) {
    errors.arrival_order = 'Arrival tidak valid.'
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
  form.delivery_order = ''
  form.arrival_order = ''
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
      remarks: ''
    }
  ]
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
  form.delivery_order = normalizeDate(data.delivery_order)
  form.arrival_order = normalizeDate(data.arrival_order)
  form.container_depot = data.container_depot ?? '0'
  form.no_po = data.no_po ?? '0'
  form.tax = data.tax ?? '0'
  form.admin_charge = formatIndonesianNumber(parseIndonesianNumber(String(data.admin_charge ?? '0')))
  form.materai = formatIndonesianNumber(parseIndonesianNumber(String(data.materai ?? '0')))
  form.container_repair = formatIndonesianNumber(
    parseIndonesianNumber(String(data.container_repair ?? '0'))
  )
  form.demurrage_chargers = formatIndonesianNumber(
    parseIndonesianNumber(String(data.demurrage_chargers ?? '0'))
  )
  form.detention_chargers = formatIndonesianNumber(
    parseIndonesianNumber(String(data.detention_chargers ?? '0'))
  )
  form.extend_gate_pass = formatIndonesianNumber(
    parseIndonesianNumber(String(data.extend_gate_pass ?? '0'))
  )
  form.trip = data.trip ?? ''
  form.jenis_trip = data.jenis_trip ?? 'Trip'
  form.price = formatIndonesianNumber(parseIndonesianNumber(String(data.price ?? '0')))
  form.additional_cost = formatIndonesianNumber(
    parseIndonesianNumber(String(data.additional_cost ?? '0'))
  )
  form.ops_cost = formatIndonesianNumber(parseIndonesianNumber(String(data.ops_cost ?? '0')))
  form.tgl_order = data.tgl_order || getDefaultOrderDate()
  form.nik_admin =
    data.nik_admin || data.id_admin || localStorage.getItem('nik_admin') || ''
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
      remarks: item.remarks || ''
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
          remarks: ''
        }
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
    form.lift_of
  ]
  // Cek jika ada nilai yang tidak kosong/0 untuk menampilkan opsi
  showOptionalCosts.value = props.mode === 'edit' || optionalValues.some((value) => value !== '0' && value !== '')
}

const buildPayload = () => ({
  tgl_order: form.tgl_order,
  id_truck: form.id_truck ? Number(form.id_truck) : null,
  id_driver: form.id_driver ? Number(form.id_driver) : null,
  id_area: form.id_area ? Number(form.id_area) : null,
  id_customer: form.id_customer ? Number(form.id_customer) : null,
  nik_admin: form.nik_admin,
  delivery_order: form.delivery_order,
  arrival_order: form.arrival_order,
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
  dnItems: dnList.value
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

const loadOptions = async () => {
  const [truckData, driverData, customerData, areaData] = await Promise.all([
    salesCostService.fetchTrucks(),
    salesCostService.fetchDrivers(),
    salesCostService.fetchCustomers(),
    salesCostService.fetchAreas()
  ])
  trucks.value = truckData
  drivers.value = driverData
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
  { deep: true, immediate: true }
  
)

watch(
  () => props.mode,
  (value) => {
    if (value === 'create') {
      resetForm()
      applyInitialData({})
    }
  }
)

onMounted(async () => {
  await loadOptions()
  if (props.mode === 'create') {
    resetForm()
    applyInitialData({})
  }
})
</script>
