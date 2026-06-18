<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Rincian Transaksi Sales Cost">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">Detail Transaksi</div>
          <RouterLink
            to="/sales-cost"
            class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >
            Kembali
          </RouterLink>
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
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Delivery Order</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDate(detail.delivery_order) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Arrival</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDate(detail.arrival_order) }}</p>
              </div>
              <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Finish Order</p>
                <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{{ formatDate(detail.finish_order) }}</p>
              </div>
              <div class="rounded-lg border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
                <p class="text-[11px] text-brand-600 dark:text-brand-400">Waktu Pengiriman</p>
                <p class="mt-1 text-sm font-bold text-brand-700 dark:text-brand-300">{{ shippingDurationLabel }}</p>
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

          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Riwayat Geofence Pengiriman
              </h3>
            </div>

            <div v-if="plannedRouteSteps.length === 0" class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
              Rute ini belum memiliki langkah geofence yang terdaftar.
            </div>

            <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,360px),minmax(0,1fr)]">
              <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Rencana Langkah Rute
                </p>
                <div class="space-y-3">
                  <div
                    v-for="step in plannedRouteSteps"
                    :key="step.step_key"
                    class="rounded-lg border px-3 py-3"
                    :class="
                      routeHistoryByStepKey.has(step.step_key)
                        ? 'border-brand-200 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/10'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                    "
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {{ step.step_order }}. {{ step.step_name }}
                        </div>
                        <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {{ step.wialon_zone_name || '-' }}
                        </div>
                      </div>
                      <span
                        class="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        :class="
                          routeHistoryByStepKey.has(step.step_key)
                            ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                        "
                      >
                        {{ routeHistoryByStepKey.has(step.step_key) ? 'Visited' : 'Pending' }}
                      </span>
                    </div>
                  </div>
                </div>
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
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
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
  delivery_order: string | null
  arrival_order: string | null
  finish_order: string | null
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
const loading = ref(true)
const dnLoading = ref(false)
const formError = ref('')
const dnItems = ref<DnItem[]>([])
const currentPage = ref(1)
const itemsPerPage = 5

const detail = ref<DetailData>({
  id_sales_cost: null,
  nama_customer: '',
  nama_area: '',
  created_by_name: '',
  no_police: '',
  jenis_kendaraan: '',
  container_size: null,
  nama_driver: '',
  delivery_order: null,
  arrival_order: null,
  finish_order: null,
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
  const delivery = parseDateOnly(detail.value.delivery_order)
  const arrival = parseDateOnly(detail.value.arrival_order)
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

const plannedRouteSteps = computed<PlannedStepItem[]>(() => {
  const routeSteps = (detail.value.route_steps || []).map((step) => ({
    id_area_route_step: step.id_area_route_step,
    step_order: step.step_order,
    step_name: step.step_name,
    step_key: step.step_key || `route:${step.id_area_route_step}`,
    system_step_code: step.system_step_code || null,
    wialon_resource_id: step.wialon_resource_id,
    wialon_zone_id: step.wialon_zone_id,
    wialon_zone_name: step.wialon_zone_name
  }))

  if (detail.value.finish_step) {
    routeSteps.push(detail.value.finish_step)
  }

  return routeSteps
})

const routeHistory = computed(() => detail.value.route_history || [])

const routeHistoryByStepKey = computed(() => {
  const mapped = new Map<string, RouteHistoryItem>()
  routeHistory.value.forEach((history) => {
    mapped.set(history.step_key, history)
  })
  return mapped
})

const totalPages = computed(() => Math.ceil(dnItems.value.length / itemsPerPage))

const paginatedDnItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return dnItems.value.slice(start, end)
})

const loadDetail = async () => {
  const idParam = resolveIdParam()
  if (!idParam) {
    formError.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  dnLoading.value = true
  
  try {
    const [data, dnResponse] = await Promise.all([
      salesCostService.fetchSalesCostById(idParam),
      salesCostService.fetchDNList(idParam).catch(() => ({ items: [] }))
    ])
    detail.value = data
    dnItems.value = dnResponse.items || []
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
  const date = new Date(value)
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
</script>
