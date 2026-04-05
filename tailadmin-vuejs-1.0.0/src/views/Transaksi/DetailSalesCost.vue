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

        <div v-else class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Dibuat oleh
              </label>
              <input
                type="text"
                :value="formatText(detail.created_by_name)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. SPK
              </label>
              <input
                type="text"
                :value="formatText(detail.id_sales_cost)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <!-- No DN Field Removed (Moved to DN List) -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Customer
              </label>
              <input
                type="text"
                :value="formatText(detail.nama_customer)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Rute
              </label>
              <input
                type="text"
                :value="formatText(detail.nama_area)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Driver
              </label>
              <input
                type="text"
                :value="formatText(detail.nama_driver)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <!-- Pickup & Drop Fields Removed (Moved to DN List) -->

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div class="lg:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Container Depot
              </label>
              <input
                type="text"
                :value="formatText(detail.container_depot)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div class="lg:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. PO
              </label>
              <input
                type="text"
                :value="formatText(detail.no_po)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div class="lg:col-span-2">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Bills
              </label>
              <input
                type="text"
                :value="formatText(detail.bills)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Lift On
              </label>
              <input
                type="text"
                :value="formatNumber(detail.lift_on)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Lift Off
              </label>
              <input
                type="text"
                :value="formatNumber(detail.lift_of)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. Police
              </label>
              <input
                type="text"
                :value="formatText(detail.no_police)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jenis Kendaraan
              </label>
              <input
                type="text"
                :value="formatText(detail.jenis_kendaraan)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Container Size
              </label>
              <input
                type="text"
                :value="formatText(detail.container_size)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Jenis Pengiriman
              </label>
              <input
                type="text"
                :value="formatText(detail.jenis_trip)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-900/30">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Timeline Pengiriman
            </p>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Delivery Order
                </label>
                <input
                  type="text"
                  :value="formatDate(detail.delivery_order)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Arrival
                </label>
                <input
                  type="text"
                  :value="formatDate(detail.arrival_order)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Finish Order
                </label>
                <input
                  type="text"
                  :value="formatDate(detail.finish_order)"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Waktu Pengiriman
                </label>
                <input
                  type="text"
                  :value="shippingDurationLabel"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  readonly
                />
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                No. Container
              </label>
              <input
                type="text"
                :value="formatText(detail.no_container)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Trip
              </label>
              <input
                type="text"
                :value="formatText(detail.trip)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Ops Cost
              </label>
              <input
                type="text"
                :value="formatNumber(detail.ops_cost)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Additional Cost
              </label>
              <input
                type="text"
                :value="formatNumber(detail.additional_cost)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Total Cost
              </label>
              <input
                type="text"
                :value="formatNumber(totalCost)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Sales
              </label>
              <input
                type="text"
                :value="formatNumber(detail.price)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Gross Profit
              </label>
              <input
                type="text"
                :value="formatNumber(grossProfit)"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                readonly
              />
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
