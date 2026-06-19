<template>
  <div class="space-y-2">
    <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
      {{ label }}
    </label>

    <!-- Search + My Location bar -->
    <div class="flex gap-2 relative z-[1000]">
      <div class="relative flex-1" ref="searchWrapRef">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="searchPlaceholder"
          autocomplete="off"
          class="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          @input="onSearchInput"
          @keydown.enter.prevent="handleEnter"
          @keydown.arrow-down.prevent="moveSuggestion(1)"
          @keydown.arrow-up.prevent="moveSuggestion(-1)"
          @keydown.escape="closeSuggestions"
          @focus="showSuggestionsIfAvailable"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>

        <!-- Loading indicator -->
        <svg v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>

        <!-- Suggestions dropdown -->
        <div
          v-if="suggestionsOpen && suggestions.length > 0"
          class="absolute z-[1100] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 max-h-56 overflow-auto py-1"
        >
          <div
            v-for="(item, idx) in suggestions"
            :key="idx"
            class="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
            :class="idx === activeIdx ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'"
            @mousedown.prevent="selectSuggestion(item)"
            @mousemove="activeIdx = idx"
          >
            <svg class="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-800 dark:text-gray-100 truncate">{{ item.name }}</p>
              <p v-if="item.secondary" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{{ item.secondary }}</p>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        :disabled="geolocating"
        @click="useMyLocation"
      >
        <svg class="h-4 w-4" :class="geolocating ? 'animate-pulse' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-4.93-7.07l-1.41 1.41m-7.32 7.32l-1.41 1.41m0-10.14l1.41 1.41m7.32 7.32l1.41 1.41M12 8a4 4 0 100 8 4 4 0 000-8z"/>
        </svg>
        <span class="hidden sm:inline">{{ myLocationLabel }}</span>
      </button>
    </div>

    <!-- Map container -->
    <!-- Map container with expand toggle -->
    <div class="relative">
      <div
        ref="mapContainer"
        class="w-full rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-[height] duration-300 ease-out"
        :style="{ height: mapExpanded ? '460px' : '240px' }"
      ></div>

      <!-- Expand/Collapse button -->
      <button
        type="button"
        class="absolute bottom-2 right-2 z-[500] inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300 dark:hover:bg-gray-800"
        @click="toggleMapSize"
      >
        <svg
          class="h-3.5 w-3.5 transition-transform duration-200"
          :class="mapExpanded ? 'rotate-180' : ''"
          fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        >
          <path v-if="!mapExpanded" stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" d="M9 4v4m0 0H5m4 0L4 3m11 5h4m0 0V4m0 4l5-5M9 16v4m0 0H5m4 0l-5 5m15-5h4m0 0v4m0-4l5 5"/>
        </svg>
        {{ mapExpanded ? 'Perkecil' : 'Perbesar' }}
      </button>
    </div>

    <!-- Selected address preview -->
    <div v-if="reverseGeocoding" class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
      <svg class="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="text-xs text-gray-500 dark:text-gray-400">Mengambil alamat lokasi...</p>
    </div>
    <div v-else-if="selectedAddress" class="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
      <svg class="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{{ selectedAddress }}</p>
    </div>
    <p v-else class="text-xs text-gray-400 dark:text-gray-500">{{ hintText }}</p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as L from 'leaflet'
import { authFetch } from '@/services/auth'
import { API_BASE } from '@/config/api'

interface SuggestionItem {
  name: string
  secondary: string
  lat: number
  lng: number
  displayName: string
}

const props = withDefaults(defineProps<{
  modelValue?: string
  latitude?: number | null
  longitude?: number | null
  label?: string
  searchPlaceholder?: string
  myLocationLabel?: string
  hintText?: string
}>(), {
  modelValue: '',
  latitude: null,
  longitude: null,
  label: 'Lokasi Kejadian',
  searchPlaceholder: 'Cari alamat atau ketik lokasi...',
  myLocationLabel: 'Lokasi Saya',
  hintText: 'Klik pada peta atau cari alamat untuk menandai lokasi kejadian',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:latitude', value: number | null): void
  (e: 'update:longitude', value: number | null): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const searchWrapRef = ref<HTMLDivElement | null>(null)
const searchQuery = ref('')
const selectedAddress = ref(props.modelValue || '')
const geolocating = ref(false)
const searching = ref(false)
const mapExpanded = ref(false)

// Suggestions state
const suggestions = ref<SuggestionItem[]>([])
const suggestionsOpen = ref(false)
const activeIdx = ref(-1)

let map: L.Map | null = null
let marker: L.Marker | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Custom marker icon (inline SVG) to avoid Leaflet default icon bundling issues with Vite
const pinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" fill="none">
    <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill="#3B82F6"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
})

// Default center: Cikarang area (company location)
const defaultCenter: [number, number] = [-6.3105, 107.1731]
const defaultZoom = 13

function initMap() {
  if (!mapContainer.value || map) return

  map = L.map(mapContainer.value, {
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: false,
  }).setView(
    props.latitude && props.longitude
      ? [props.latitude, props.longitude]
      : defaultCenter,
    props.latitude && props.longitude ? 16 : defaultZoom
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map)

  L.control.attribution({ position: 'bottomright', prefix: '© OSM' }).addTo(map)

  if (props.latitude && props.longitude) {
    placeMarker(props.latitude, props.longitude)
    selectedAddress.value = props.modelValue || ''
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    placeMarker(lat, lng)
    reverseGeocode(lat, lng)
    closeSuggestions()
  })
}

function placeMarker(lat: number, lng: number) {
  if (!map) return

  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker!.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })
  }

  emit('update:latitude', lat)
  emit('update:longitude', lng)
}

const reverseGeocoding = ref(false)

async function reverseGeocode(lat: number, lng: number) {
  reverseGeocoding.value = true
  selectedAddress.value = ''

  // Try backend Geoapify first
  try {
    const res = await authFetch(`${API_BASE}/wialon/reverse-geocode?lat=${lat}&lon=${lng}`)
    if (res.ok) {
      const data = await res.json()
      const address = data.formatted || data.address || ''
      if (address && !looksLikeCoordinates(address)) {
        selectedAddress.value = address
        searchQuery.value = ''
        emit('update:modelValue', address)
        emit('update:latitude', lat)
        emit('update:longitude', lng)
        reverseGeocoding.value = false
        return
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  // Fallback: Nominatim reverse geocode
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
    if (res.ok) {
      const data = await res.json()
      const address = data.display_name || ''
      if (address) {
        selectedAddress.value = address
        searchQuery.value = ''
        emit('update:modelValue', address)
        emit('update:latitude', lat)
        emit('update:longitude', lng)
        reverseGeocoding.value = false
        return
      }
    }
  } catch {
    // Final fallback
  }

  // Last resort: coordinates (should rarely happen)
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  selectedAddress.value = fallback
  emit('update:modelValue', fallback)
  emit('update:latitude', lat)
  emit('update:longitude', lng)
  reverseGeocoding.value = false
}

function looksLikeCoordinates(value: string): boolean {
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(value.trim())
}

// --- Autocomplete suggestions ---

function onSearchInput() {
  const q = searchQuery.value.trim()
  activeIdx.value = -1

  if (q.length < 3) {
    closeSuggestions()
    return
  }

  // Debounce 350ms
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchSuggestions(q)
  }, 350)
}

async function fetchSuggestions(query: string) {
  searching.value = true
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id&addressdetails=1`
    )
    const data = await res.json()
    if (data && data.length > 0) {
      suggestions.value = data.map((item: any) => {
        const parts = (item.display_name || '').split(', ')
        const name = parts.slice(0, 2).join(', ')
        const secondary = parts.slice(2, 5).join(', ')
        return {
          name,
          secondary,
          lat: Number(item.lat),
          lng: Number(item.lon),
          displayName: item.display_name,
        }
      })
      suggestionsOpen.value = true
    } else {
      suggestions.value = []
      suggestionsOpen.value = false
    }
  } catch {
    suggestions.value = []
    suggestionsOpen.value = false
  } finally {
    searching.value = false
  }
}

function selectSuggestion(item: SuggestionItem) {
  map?.flyTo([item.lat, item.lng], 16, { duration: 0.8 })
  placeMarker(item.lat, item.lng)
  selectedAddress.value = item.displayName
  searchQuery.value = ''
  emit('update:modelValue', item.displayName)
  emit('update:latitude', item.lat)
  emit('update:longitude', item.lng)
  closeSuggestions()
}

function handleEnter() {
  if (activeIdx.value >= 0 && suggestions.value[activeIdx.value]) {
    selectSuggestion(suggestions.value[activeIdx.value])
  } else if (suggestions.value.length > 0) {
    selectSuggestion(suggestions.value[0])
  } else {
    // Fallback: search with current query
    handleDirectSearch()
  }
}

function moveSuggestion(dir: number) {
  if (suggestions.value.length === 0) return
  let next = activeIdx.value + dir
  if (next < 0) next = suggestions.value.length - 1
  if (next >= suggestions.value.length) next = 0
  activeIdx.value = next
}

function closeSuggestions() {
  suggestionsOpen.value = false
  activeIdx.value = -1
}

function showSuggestionsIfAvailable() {
  if (suggestions.value.length > 0 && searchQuery.value.trim().length >= 3) {
    suggestionsOpen.value = true
  }
}

async function handleDirectSearch() {
  const q = searchQuery.value.trim()
  if (!q) return

  searching.value = true
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=id`
    )
    const data = await res.json()
    if (data && data.length > 0) {
      const { lat, lon, display_name } = data[0]
      const numLat = Number(lat)
      const numLng = Number(lon)
      map?.flyTo([numLat, numLng], 16, { duration: 0.8 })
      placeMarker(numLat, numLng)
      selectedAddress.value = display_name || q
      searchQuery.value = ''
      emit('update:modelValue', display_name || q)
      emit('update:latitude', numLat)
      emit('update:longitude', numLng)
    }
  } catch {
    // Silent fail
  } finally {
    searching.value = false
    closeSuggestions()
  }
}

// Click outside to close suggestions
function handleClickOutside(event: MouseEvent) {
  if (searchWrapRef.value && !searchWrapRef.value.contains(event.target as Node)) {
    closeSuggestions()
  }
}

function toggleMapSize() {
  mapExpanded.value = !mapExpanded.value
  // Leaflet needs invalidateSize after container resize
  setTimeout(() => {
    map?.invalidateSize()
  }, 320) // Wait for CSS transition to finish
}

function useMyLocation() {
  if (!navigator.geolocation) return

  geolocating.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      map?.flyTo([lat, lng], 16, { duration: 0.8 })
      placeMarker(lat, lng)
      reverseGeocode(lat, lng)
      geolocating.value = false
    },
    () => {
      geolocating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (lat && lng && map) {
      map.setView([lat, lng], 16)
      placeMarker(lat, lng)
    }
  }
)

onMounted(() => {
  nextTick(() => {
    initMap()
  })
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  document.removeEventListener('mousedown', handleClickOutside)
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>
