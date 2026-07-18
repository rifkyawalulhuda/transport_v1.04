<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />
    <div class="space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pantau status kendaraan berdasarkan transaksi aktif dan repair.
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Monitoring Kendaraan
            </p>
          </div>
          <form
            class="flex flex-wrap items-end gap-3"
            @submit.prevent="applyFilter"
          >
            <RouterLink
              to="/truck-locations"
              class="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 shadow-theme-xs transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Buka Peta
            </RouterLink>
            <div class="w-full sm:w-64">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                Pencarian
              </label>
              <input
                v-model="searchInput"
                type="text"
                placeholder="Plat / kendaraan / driver"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
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
            <div class="flex items-center gap-2">
              <select
                v-model="filterMonth"
                class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option :value="undefined">Semua Bulan</option>
                <option v-for="m in 12" :key="m" :value="m">
                  {{ new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' }) }}
                </option>
              </select>
              <select
                v-model="filterYear"
                class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option :value="undefined">Semua Tahun</option>
                <option v-for="y in [new Date().getFullYear()-1, new Date().getFullYear(), new Date().getFullYear()+1]" :key="y" :value="y">
                  {{ y }}
                </option>
              </select>
              <span v-if="lastRefreshedAt" class="text-xs text-gray-400 dark:text-gray-500">
                {{ formatLastRefreshed(lastRefreshedAt) }}
              </span>
              <button
                type="button"
                @click="void fetchMonitoring()"
                :disabled="loading"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          v-for="card in summaryCards"
          :key="card.key"
          type="button"
          :class="[
            'flex w-full flex-col rounded-2xl border bg-white p-8 text-left transition hover:border-brand-500/40 hover:bg-brand-50 hover:shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-brand-500/10',
            activeFilter === card.key || (card.key === 'total' && activeFilter === 'all')
              ? 'border-brand-500/60 bg-brand-100 shadow-theme-xs dark:bg-brand-500/25'
              : 'border-gray-200'
          ]"
          @click="focusSection(card.key)"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</span>
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/20"
            >
              <component :is="card.icon" class="h-5 w-5" />
            </span>
          </div>
          <h4 class="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {{ card.value }}
          </h4>
        </button>
      </div>

      <div
        ref="sectionOnTrip"
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        v-show="activeFilter === 'all' || activeFilter === 'on_trip'"
      >
        <div
          class="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Kendaraan Dalam Perjalanan
              </h3>
              <Badge color="warning" size="sm">{{ monitoringData.on_trip.length }}</Badge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Kendaraan yang sedang dalam perjalanan pengiriman.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-expanded="sections.on_trip"
            @click="toggleSection('on_trip')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="sections.on_trip ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 8l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-show="sections.on_trip" class="px-5 pb-5 pt-4 sm:px-6">
          <div v-if="loading" class="text-sm text-gray-500">Memuat data...</div>
          <div v-else-if="!monitoringData.on_trip.length" class="text-sm text-gray-500">
            Tidak ada kendaraan dalam perjalanan.
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="item in monitoringData.on_trip"
              :key="`on_trip-${item.id_truck}`"
              class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs text-gray-500">Plat Nomor</p>
                  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">
                    {{ item.no_police || `Truck ${item.id_truck}` }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ resolveVehicleName(item) }}
                  </p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <Badge color="warning" size="sm">Dalam Perjalanan</Badge>
                  <span
                    v-if="item.is_overdue === true"
                    class="text-xs font-medium text-error-500"
                  >⚠ Terlambat</span>
                </div>
              </div>
              <div class="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Driver:</span>
                  {{ item.transaksi?.driver_name || item.driver_name || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Rute:</span>
                  {{ item.transaksi?.route || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Keberangkatan:</span>
                  {{ formatDateTime(item.transaksi?.departure_datetime) }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Est. Tiba:</span>
                  {{ formatDateTime(item.transaksi?.arrival_datetime) }}
                </p>
                <!-- Nomor SC -->
                <div v-if="item.transaksi?.id_sales_cost" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">SC:</span>
                  <span class="font-mono">#{{ item.transaksi.id_sales_cost }}</span>
                </div>
                <!-- Durasi status -->
                <div v-if="item.status_duration_minutes != null" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">Durasi:</span>
                  <span>{{ formatDuration(item.status_duration_minutes) }}</span>
                </div>
                <!-- GPS terakhir -->
                <div v-if="item.last_gps?.lat" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">GPS:</span>
                  <span class="font-mono">{{ formatGps(item.last_gps) }}</span>
                  <span v-if="item.last_gps.gps_time" class="text-gray-400">({{ item.last_gps.gps_time }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        v-show="activeFilter === 'all' || activeFilter === 'transaksi'"
      >
        <div
          class="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Kendaraan Sedang Terpakai
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Kendaraan dengan transaksi aktif saat ini.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-expanded="sections.transaksi"
            @click="toggleSection('transaksi')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="sections.transaksi ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 8l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-show="sections.transaksi" class="px-5 pb-5 pt-4 sm:px-6">
          <div v-if="loading" class="text-sm text-gray-500">Memuat data...</div>
          <div
            v-else-if="!monitoringData.transaksi.length"
            class="text-sm text-gray-500"
          >
            Tidak ada kendaraan sedang transaksi.
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="item in monitoringData.transaksi"
              :key="`trx-${item.id_truck}`"
              class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs text-gray-500">Plat Nomor</p>
                  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">
                    {{ item.no_police || `Truck ${item.id_truck}` }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ resolveVehicleName(item) }}
                  </p>
                </div>
                <Badge color="success" size="sm">Transaksi</Badge>
              </div>
              <div class="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Driver:</span>
                  {{ item.driver_name || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">No. DO:</span>
                  {{ item.transaksi?.no_spk || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Rute:</span>
                  {{ item.transaksi?.route || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Delivery Order:</span>
                  {{ formatDateTime(item.transaksi?.departure_datetime) }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Finish Order:</span>
                  {{ formatDateTime(item.transaksi?.finish_order_datetime || item.transaksi?.arrival_datetime) }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Waktu Kirim:</span>
                  {{
                    resolveShippingDurationLabel(
                      item.transaksi?.departure_datetime,
                      item.transaksi?.arrival_datetime
                    )
                  }}
                </p>
                <!-- Nomor SC -->
                <div v-if="item.transaksi?.id_sales_cost" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">SC:</span>
                  <span class="font-mono">#{{ item.transaksi.id_sales_cost }}</span>
                </div>
                <!-- Durasi status -->
                <div v-if="item.status_duration_minutes != null" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">Durasi:</span>
                  <span>{{ formatDuration(item.status_duration_minutes) }}</span>
                </div>
                <!-- GPS terakhir -->
                <div v-if="item.last_gps?.lat" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">GPS:</span>
                  <span class="font-mono">{{ formatGps(item.last_gps) }}</span>
                  <span v-if="item.last_gps.gps_time" class="text-gray-400">({{ item.last_gps.gps_time }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref="sectionRepair"
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        v-show="activeFilter === 'all' || activeFilter === 'repair'"
      >
        <div
          class="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Kendaraan Repair
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Kendaraan yang sedang dalam proses perbaikan.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-expanded="sections.repair"
            @click="toggleSection('repair')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="sections.repair ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 8l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-show="sections.repair" class="px-5 pb-5 pt-4 sm:px-6">
          <div v-if="loading" class="text-sm text-gray-500">Memuat data...</div>
          <div v-else-if="!monitoringData.repair.length" class="text-sm text-gray-500">
            Tidak ada kendaraan repair.
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="item in monitoringData.repair"
              :key="`repair-${item.id_truck}`"
              class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs text-gray-500">Plat Nomor</p>
                  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">
                    {{ item.no_police || `Truck ${item.id_truck}` }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ resolveVehicleName(item) }}
                  </p>
                </div>
                <Badge color="warning" size="sm">Repair</Badge>
              </div>
              <div class="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Driver:</span>
                  {{ item.driver_name || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Keluhan:</span>
                  {{ item.repair?.jenis_kerusakan || item.repair?.kategori_repair || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">No. SPK:</span>
                  {{ item.repair?.no_spk_perbaikan || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">
                    Tanggal Kerusakan:
                  </span>
                  {{ formatDate(item.repair?.tgl_kerusakan) }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Est. Selesai:</span>
                  {{ formatDate(item.repair?.tgl_proses) }}
                </p>
                <!-- GPS terakhir -->
                <div v-if="item.last_gps?.lat" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">GPS:</span>
                  <span class="font-mono">{{ formatGps(item.last_gps) }}</span>
                  <span v-if="item.last_gps.gps_time" class="text-gray-400">({{ item.last_gps.gps_time }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref="sectionIdle"
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        v-show="activeFilter === 'all' || activeFilter === 'idle'"
      >
        <div
          class="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Kendaraan Idle
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Kendaraan tanpa transaksi aktif dan tanpa repair aktif.
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-expanded="sections.idle"
            @click="toggleSection('idle')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-200"
              :class="sections.idle ? 'rotate-180' : ''"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 8l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div v-show="sections.idle" class="px-5 pb-5 pt-4 sm:px-6">
          <div v-if="loading" class="text-sm text-gray-500">Memuat data...</div>
          <div v-else-if="!monitoringData.idle.length" class="text-sm text-gray-500">
            Tidak ada kendaraan idle.
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="item in monitoringData.idle"
              :key="`idle-${item.id_truck}`"
              class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs text-gray-500">Plat Nomor</p>
                  <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">
                    {{ item.no_police || `Truck ${item.id_truck}` }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ resolveVehicleName(item) }}
                  </p>
                </div>
                <Badge color="light" size="sm">Idle</Badge>
              </div>
              <div class="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Driver Terakhir:</span>
                  {{ item.driver_name || '-' }}
                </p>
                <p>
                   <span class="font-medium text-gray-700 dark:text-gray-200">Transaksi Terakhir:</span>
                   {{ formatDateTime(item.last_transaction?.departure_datetime) }}
                 </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200">Rute Terakhir:</span>
                  {{ item.last_transaction?.route || '-' }}
                </p>
                <p>
                  <span class="font-medium text-gray-700 dark:text-gray-200"
                    >Waktu Kirim Terakhir:</span
                  >
                  {{
                    resolveShippingDurationLabel(
                      item.last_transaction?.departure_datetime,
                      item.last_transaction?.arrival_datetime
                    )
                  }}
                </p>
                <!-- GPS terakhir -->
                <div v-if="item.last_gps?.lat" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span class="font-medium">GPS:</span>
                  <span class="font-mono">{{ formatGps(item.last_gps) }}</span>
                  <span v-if="item.last_gps.gps_time" class="text-gray-400">({{ item.last_gps.gps_time }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Badge from '@/components/ui/Badge.vue'
import { BoxCubeIcon, DocsIcon, WarningIcon, InfoCircleIcon, TaskIcon } from '@/icons'
import { monitoringKendaraanService } from '@/services/monitoringKendaraanService'
import { useToast } from '@/composables/useToast'

const pageTitle = 'Monitoring Kendaraan'
const toast = useToast()

const monitoringData = ref({
  summary: {
    total: 0,
    on_trip: 0,
    transaksi: 0,
    repair: 0,
    idle: 0
  },
  on_trip: [] as any[],
  transaksi: [] as any[],
  repair: [] as any[],
  idle: [] as any[]
})

const loading = ref(false)
const searchInput = ref('')
const filterMonth = ref<number | undefined>(undefined)
const filterYear = ref<number | undefined>(undefined)
let refreshInterval: ReturnType<typeof setInterval> | null = null
const lastRefreshedAt = ref<Date | null>(null)
const sections = reactive({
  on_trip: true,
  transaksi: true,
  repair: true,
  idle: true
})

const toggleSection = (key: 'on_trip' | 'transaksi' | 'repair' | 'idle') => {
  sections[key] = !sections[key]
}

const sectionOnTrip = ref<HTMLElement | null>(null)
const sectionTransaksi = ref<HTMLElement | null>(null)
const sectionRepair = ref<HTMLElement | null>(null)
const sectionIdle = ref<HTMLElement | null>(null)
const activeFilter = ref<'all' | 'on_trip' | 'transaksi' | 'repair' | 'idle'>('all')

const focusSection = (key: 'total' | 'on_trip' | 'transaksi' | 'repair' | 'idle') => {
  if (key === 'total') {
    activeFilter.value = 'all'
    sections.on_trip = true
    sections.transaksi = true
    sections.repair = true
    sections.idle = true
    return
  }

  activeFilter.value = key
  sections.on_trip = key === 'on_trip'
  sections.transaksi = key === 'transaksi'
  sections.repair = key === 'repair'
  sections.idle = key === 'idle'

  const target =
    key === 'on_trip'
      ? sectionOnTrip.value
      : key === 'transaksi'
        ? sectionTransaksi.value
        : key === 'repair'
          ? sectionRepair.value
          : sectionIdle.value

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const numberFormatter = new Intl.NumberFormat('id-ID')

const formatNumber = (value: number) => numberFormatter.format(Number(value) || 0)

const summaryCards = computed(() => {
  const summary = monitoringData.value.summary || {}
  return [
    {
      key: 'total',
      label: 'Total Kendaraan',
      value: formatNumber(summary.total || 0),
      icon: BoxCubeIcon
    },
    {
      key: 'on_trip',
      label: 'Dalam Perjalanan',
      value: formatNumber(summary.on_trip || 0),
      icon: TaskIcon
    },
    {
      key: 'transaksi',
      label: 'Transaksi',
      value: formatNumber(summary.transaksi || 0),
      icon: DocsIcon
    },
    {
      key: 'repair',
      label: 'Repair',
      value: formatNumber(summary.repair || 0),
      icon: WarningIcon
    },
    {
      key: 'idle',
      label: 'Idle',
      value: formatNumber(summary.idle || 0),
      icon: InfoCircleIcon
    }
  ]
})

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const parseDateOnly = (value?: string | null) => {
  if (!value) {
    return null
  }
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const resolveShippingDurationLabel = (
  deliveryOrder?: string | null,
  arrivalOrder?: string | null
) => {
  const delivery = parseDateOnly(deliveryOrder)
  const arrival = parseDateOnly(arrivalOrder)
  if (!delivery || !arrival) {
    return '-'
  }
  const diffDays = Math.floor((arrival.getTime() - delivery.getTime()) / 86400000)
  if (diffDays < 0) {
    return '-'
  }
  return `${diffDays + 1} Hari`
}

const resolveVehicleName = (item: any) => {
  const parts = [item.merk_mobil, item.model, item.type_truck, item.jenis_kendaraan].filter(Boolean)
  return parts.length ? parts.join(' ') : '-'
}

const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes == null) return '-'
  if (minutes < 60) return `${minutes} mnt`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`
}

const formatGps = (gps: { lat: number; lng: number; gps_time?: string | null; address?: string | null } | null | undefined): string => {
  if (!gps?.lat || !gps?.lng) return '-'
  if (gps.address) return gps.address
  return `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`
}

const formatLastRefreshed = (date: Date): string => {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Baru saja'
  if (diffMins === 1) return '1 menit lalu'
  return `${diffMins} menit lalu`
}

const fetchMonitoring = async () => {
  loading.value = true
  try {
    const params = {
      search: searchInput.value.trim() || undefined,
      limit: 24,
      month: filterMonth.value || undefined,
      year: filterYear.value || undefined,
    }
    const response = await monitoringKendaraanService.fetchMonitoring(params)
    monitoringData.value = response
    lastRefreshedAt.value = new Date()
  } catch (error: any) {
    toast.error(error?.message || 'Gagal memuat monitoring kendaraan.')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  void fetchMonitoring()
}

const resetFilter = () => {
  searchInput.value = ''
  void fetchMonitoring()
}

onMounted(() => {
  void fetchMonitoring()
  refreshInterval = setInterval(() => void fetchMonitoring(), 60_000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>
