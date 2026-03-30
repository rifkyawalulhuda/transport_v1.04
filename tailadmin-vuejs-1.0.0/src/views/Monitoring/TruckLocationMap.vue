<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-6">
      <section class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-brand-900 px-6 py-7 text-white">
          <div class="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl"></div>
          <div class="absolute -bottom-16 left-1/2 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"></div>
          <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl space-y-3">
              <p class="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                Live Tracking
              </p>
              <div>
                <h1 class="text-2xl font-semibold sm:text-3xl">
                  Lokasi Truk
                </h1>
                <p class="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                  Peta interaktif truk yang terhubung ke Wialon, ditampilkan lewat Leaflet dan tile OpenStreetMap.
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-3">
              <RouterLink
                to="/monitoring-kendaraan"
                class="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
              >
                Monitoring
              </RouterLink>
              <button
                type="button"
                :disabled="loading"
                class="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                @click="refreshLocations"
              >
                {{ loading ? 'Menyegarkan...' : 'Refresh Sekarang' }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-4 border-t border-gray-200 p-4 sm:grid-cols-2 xl:grid-cols-4 xl:p-6">
          <article
            v-for="card in summaryCards"
            :key="card.key"
            class="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm transition hover:border-brand-500/30 hover:bg-brand-50/50 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-brand-500/10"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</span>
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-xl" :class="card.iconClass">
                <component :is="card.icon" class="h-5 w-5" />
              </span>
            </div>
            <div class="mt-3 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {{ card.value }}
            </div>
          </article>
        </div>
      </section>

      <div v-if="errorMessage" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        {{ errorMessage }}
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <section class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                Peta Lokasi
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Marker diperbarui otomatis setiap 30 detik.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                Moving
              </span>
              <span class="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                Idle
              </span>
              <span class="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Belum Terhubung
              </span>
            </div>
          </div>

          <div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-950">
            <div ref="mapRef" class="h-[62vh] min-h-[520px] w-full"></div>
            <div
              v-if="loading && !hasInitialized"
              class="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-gray-600 backdrop-blur dark:bg-gray-950/70 dark:text-gray-200"
            >
              Memuat peta...
            </div>
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cari truk
            </label>
            <div class="relative">
              <input
                v-model="searchInput"
                type="text"
                placeholder="Plat, unit ID, merk, model"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <svg class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </section>

          <section class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Daftar Truk
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ visibleTrucks.length }} dari {{ trackingData.trucks.length }} truk ditampilkan
                </p>
              </div>
            </div>

            <div class="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
              <button
                v-for="truck in visibleTrucks"
                :key="truck.id_truck"
                type="button"
                class="w-full rounded-2xl border p-4 text-left transition"
                :class="selectedTruckId === truck.id_truck
                  ? 'border-brand-500 bg-brand-50 shadow-sm dark:border-brand-400/40 dark:bg-brand-500/10'
                  : 'border-gray-200 bg-white hover:border-brand-400/40 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:bg-brand-500/10'"
                @click="focusTruck(truck)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                      {{ truck.no_police || `Truck ${truck.id_truck}` }}
                    </h3>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {{ resolveVehicleName(truck) }}
                    </p>
                  </div>
                  <span
                    class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                    :class="statusBadgeClass(truck.status)"
                  >
                    {{ statusLabel(truck.status) }}
                  </span>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <p class="text-gray-400 dark:text-gray-500">Unit ID</p>
                    <p class="break-all font-medium">{{ truck.wialon_unit_id || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 dark:text-gray-500">Kecepatan</p>
                    <p class="font-medium">{{ formatSpeed(truck.gps?.speed) }}</p>
                  </div>
                  <div class="col-span-2">
                    <p class="text-gray-400 dark:text-gray-500">Update</p>
                    <p class="font-medium">{{ formatDateTime(truck.synced_at) }}</p>
                  </div>
                </div>
              </button>

              <div
                v-if="!visibleTrucks.length && !loading"
                class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
              >
                Tidak ada truk yang cocok dengan pencarian.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { BoxCubeIcon, DocsIcon, InfoCircleIcon, WarningIcon } from '@/icons'
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

type TruckLocation = {
  id_truck: number
  no_police: string | null
  jenis_kendaraan: string | null
  merk_mobil: string | null
  model: string | null
  type_truck: string | null
  wialon_unit_id: string | null
  wialon_unit_name: string | null
  status: string
  gps: TruckGps
  synced_at: string
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

const pageTitle = 'Lokasi Truk'
const toast = useToast()
const mapRef = ref<HTMLDivElement | null>(null)
const mapInstance = ref<L.Map | null>(null)
const markerClusterLayer = ref<L.MarkerClusterGroup | null>(null)
const hasInitialized = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const searchInput = ref('')
const selectedTruckId = ref<number | null>(null)
const trackingData = ref<TruckLocationPayload>({
  summary: {
    total: 0,
    linked: 0,
    unlinked: 0,
    moving: 0,
    idle: 0,
    offline: 0,
    no_position: 0
  },
  trucks: [],
  meta: {
    fetched_at: '',
    wialon_available: true,
    wialon_error: null
  }
})

const defaultCenter: [number, number] = [-2.5489, 118.0149]
const defaultZoom = 5
let refreshTimer: number | null = null
let markerIndex = new Map<number, L.Marker>()

const summaryCards = computed(() => {
  const summary = trackingData.value.summary
  return [
    {
      key: 'total',
      label: 'Total Truk',
      value: summary.total,
      icon: BoxCubeIcon,
      iconClass: 'bg-slate-950 text-white dark:bg-slate-800'
    },
    {
      key: 'linked',
      label: 'Terhubung',
      value: summary.linked,
      icon: DocsIcon,
      iconClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    },
    {
      key: 'moving',
      label: 'Moving',
      value: summary.moving,
      icon: InfoCircleIcon,
      iconClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
    },
    {
      key: 'unlinked',
      label: 'Belum Terhubung',
      value: summary.unlinked,
      icon: WarningIcon,
      iconClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
    }
  ].map((card) => ({
    ...card,
    value: new Intl.NumberFormat('id-ID').format(Number(card.value) || 0)
  }))
})

const visibleTrucks = computed(() => {
  const keyword = searchInput.value.trim().toLowerCase()
  const trucks = trackingData.value.trucks || []
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
      truck.status
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(keyword)
  })
})

const withCoordinates = computed(() =>
  visibleTrucks.value.filter((truck) => hasCoordinates(truck))
)

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
    minute: '2-digit'
  }).format(date)
}

const resolveVehicleName = (truck: TruckLocation) => {
  const parts = [truck.merk_mobil, truck.model, truck.type_truck, truck.jenis_kendaraan].filter(Boolean)
  return parts.length ? parts.join(' ') : '-'
}

const statusLabel = (status: string) => {
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
      return 'No Pos'
    default:
      return 'Unknown'
  }
}

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'moving':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'idle':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
    case 'unlinked':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
    case 'offline':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    case 'no_position':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

const hasCoordinates = (truck: TruckLocation) =>
  typeof truck.gps?.lat === 'number' &&
  Number.isFinite(truck.gps.lat) &&
  typeof truck.gps?.lon === 'number' &&
  Number.isFinite(truck.gps.lon)

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const buildPopupContent = (truck: TruckLocation) => {
  const status = statusLabel(truck.status)
  return `
    <div class="space-y-2 min-w-[220px]">
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Truk</div>
        <div class="text-sm font-semibold text-slate-900">${escapeHtml(truck.no_police || `Truck ${truck.id_truck}`)}</div>
        <div class="text-xs text-slate-500">${escapeHtml(resolveVehicleName(truck))}</div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <div class="text-slate-400">Status</div>
          <div class="font-semibold">${escapeHtml(status)}</div>
        </div>
        <div>
          <div class="text-slate-400">Unit ID</div>
          <div class="font-semibold break-all">${escapeHtml(truck.wialon_unit_id || '-')}</div>
        </div>
        <div>
          <div class="text-slate-400">Speed</div>
          <div class="font-semibold">${escapeHtml(formatSpeed(truck.gps?.speed))}</div>
        </div>
        <div>
          <div class="text-slate-400">Update</div>
          <div class="font-semibold">${escapeHtml(formatDateTime(truck.synced_at))}</div>
        </div>
      </div>
    </div>
  `
}

type ClusterStatusSummary = {
  moving: number
  idle: number
  offline: number
  unlinked: number
  no_position: number
  total: number
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
      total: 0
    }
  )
}

const getClusterPrimaryStatus = (summary: ClusterStatusSummary) => {
  const ranked = [
    { status: 'moving', count: summary.moving },
    { status: 'idle', count: summary.idle },
    { status: 'offline', count: summary.offline },
    { status: 'unlinked', count: summary.unlinked },
    { status: 'no_position', count: summary.no_position }
  ].sort((left, right) => right.count - left.count)

  const primary = ranked[0]
  if (!primary || primary.count === 0) {
    return 'unknown'
  }
  return primary.status
}

const clusterStatusLabel = (summary: ClusterStatusSummary) => {
  const pieces = [
    summary.moving ? `Moving ${summary.moving}` : null,
    summary.idle ? `Idle ${summary.idle}` : null,
    summary.offline ? `Offline ${summary.offline}` : null,
    summary.unlinked ? `Belum Terhubung ${summary.unlinked}` : null,
    summary.no_position ? `No Pos ${summary.no_position}` : null
  ].filter(Boolean)

  return pieces.length ? pieces.join(' · ') : 'Tidak ada data'
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
      <div class="grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>
          <div class="text-slate-400">Moving</div>
          <div class="font-semibold">${escapeHtml(summary.moving)}</div>
        </div>
        <div>
          <div class="text-slate-400">Idle</div>
          <div class="font-semibold">${escapeHtml(summary.idle)}</div>
        </div>
        <div>
          <div class="text-slate-400">Offline</div>
          <div class="font-semibold">${escapeHtml(summary.offline)}</div>
        </div>
        <div>
          <div class="text-slate-400">Belum Terhubung</div>
          <div class="font-semibold">${escapeHtml(summary.unlinked + summary.no_position)}</div>
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Isi Cluster</div>
        <div class="max-h-44 space-y-1 overflow-y-auto pr-1 text-xs text-slate-600">
          ${sampleTrucks
            .map(
              (truck) => `
                <div class="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div class="font-semibold text-slate-900">${escapeHtml(truck.no_police || `Truck ${truck.id_truck}`)}</div>
                  <div class="text-slate-500">${escapeHtml(resolveVehicleName(truck))}</div>
                  <div class="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span>${escapeHtml(statusLabel(truck.status))}</span>
                    <span>${escapeHtml(truck.wialon_unit_id || '-')}</span>
                  </div>
                </div>
              `
            )
            .join('')}
          ${
            summary.total > sampleTrucks.length
              ? `<div class="text-[11px] text-slate-400">+${summary.total - sampleTrucks.length} truk lainnya</div>`
              : ''
          }
        </div>
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
    iconAnchor: [22, 22]
  })
}

const createTruckIcon = (status: string) =>
  L.divIcon({
    className: '',
    html: `
      <div class="truck-pin truck-pin--${escapeHtml(status)}">
        <span class="truck-pin__inner"></span>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40]
  })

const initMap = () => {
  if (!mapRef.value || mapInstance.value) {
    return
  }

  const map = L.map(mapRef.value, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView(defaultCenter, defaultZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  markerClusterLayer.value = L.markerClusterGroup({
    chunkedLoading: true,
    disableClusteringAtZoom: 16,
    zoomToBoundsOnClick: false,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    maxClusterRadius: 58,
    iconCreateFunction: (cluster) => createClusterIcon(cluster)
  }).addTo(map)

  markerClusterLayer.value.on('clusterclick', (event) => {
    const cluster = event.layer
    cluster.bindPopup(buildClusterPopupContent(cluster))
    cluster.openPopup()
  })

  mapInstance.value = map
}

const syncMarkers = () => {
  if (!mapInstance.value || !markerClusterLayer.value) {
    return
  }

  markerClusterLayer.value.clearLayers()
  markerIndex = new Map<number, L.Marker>()

  const trucks = withCoordinates.value
  const bounds = L.latLngBounds([])

  trucks.forEach((truck) => {
    if (!hasCoordinates(truck)) {
      return
    }

    const lat = Number(truck.gps.lat)
    const lon = Number(truck.gps.lon)
    const marker = L.marker([lat, lon], {
      icon: createTruckIcon(truck.status),
      truck
    })

    marker.bindPopup(buildPopupContent(truck), {
      closeButton: true,
      autoPanPadding: [24, 24]
    })

    marker.on('click', () => {
      selectedTruckId.value = truck.id_truck
    })

    marker.addTo(markerClusterLayer.value as L.MarkerClusterGroup)
    markerIndex.set(truck.id_truck, marker)
    bounds.extend([lat, lon])
  })

  if (bounds.isValid()) {
    mapInstance.value.fitBounds(bounds.pad(0.18))
  } else {
    mapInstance.value.setView(defaultCenter, defaultZoom)
  }

  if (selectedTruckId.value && markerIndex.has(selectedTruckId.value)) {
    const marker = markerIndex.get(selectedTruckId.value)
    if (marker) {
      marker.openPopup()
    }
  }
}

const refreshLocations = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = (await truckLocationService.fetchTruckLocations()) as TruckLocationPayload
    trackingData.value = response
    await nextTick()
    syncMarkers()
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
  if (!mapInstance.value || !hasCoordinates(truck)) {
    return
  }

  const marker = markerIndex.get(truck.id_truck)
  if (marker) {
    mapInstance.value.flyTo([Number(truck.gps.lat), Number(truck.gps.lon)], 14, {
      animate: true,
      duration: 0.8
    })
    marker.openPopup()
  }
}

onMounted(async () => {
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
  width: 32px;
  height: 42px;
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 10px 16px rgba(15, 23, 42, 0.22));
}

.truck-pin::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px 999px 999px 0;
  transform: rotate(-45deg);
  background: currentColor;
}

.truck-pin__inner {
  position: absolute;
  inset: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  transform: rotate(45deg);
}

.truck-pin--moving {
  color: #059669;
}

.truck-pin--idle {
  color: #2563eb;
}

.truck-pin--unlinked {
  color: #d97706;
}

.truck-pin--offline {
  color: #64748b;
}

.truck-pin--no_position {
  color: #e11d48;
}

.truck-pin--unknown {
  color: #64748b;
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
  background: linear-gradient(135deg, #f43f5e, #e11d48);
}

.cluster-pin--unknown {
  background: linear-gradient(135deg, #64748b, #334155);
}
</style>
