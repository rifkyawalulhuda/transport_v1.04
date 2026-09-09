<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Template Jadwal Pengiriman">

        <!-- Toolbar — matches TruckMaster/AreaMaster pattern -->
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              @click="openCreate"
            >Buat Template</button>
            <SearchBar v-model="search" placeholder="Cari nama atau deskripsi template" />
          </div>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total: {{ totalCount }} template</p>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
              <select
                v-model.number="pageSize"
                class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @change="currentPage = 1"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">#</th>
                  <SortableTableHeader
                    label="Nama Template"
                    sort-key="template_name"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="setSort"
                  />
                  <SortableTableHeader
                    label="Deskripsi"
                    sort-key="description"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="setSort"
                  />
                  <SortableTableHeader
                    label="Jumlah Stop"
                    sort-key="stop_count"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    align="center"
                    @sort="setSort"
                  />
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <!-- Loading -->
                <tr v-if="loading">
                  <td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400">
                    Memuat...
                  </td>
                </tr>
                <!-- Empty -->
                <tr v-else-if="pagedItems.length === 0">
                  <td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400">
                    {{ search ? 'Tidak ada template yang cocok dengan pencarian.' : 'Belum ada template. Klik "Buat Template" untuk memulai.' }}
                  </td>
                </tr>
                <!-- Data rows -->
                <tr v-for="(t, index) in pagedItems" :key="t.id">
                  <td class="px-5 py-3 text-sm text-gray-500 sm:px-6 dark:text-gray-400">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="px-5 py-3 text-sm font-medium text-gray-800 sm:px-6 dark:text-gray-100">
                    {{ t.template_name }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-500 sm:px-6 dark:text-gray-400">
                    {{ t.description || '-' }}
                  </td>
                  <td class="px-5 py-3 text-center sm:px-6">
                    <span class="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {{ t.stops?.length || 0 }} stop
                    </span>
                  </td>
                  <td class="px-5 py-3 text-center sm:px-6">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400"
                        @click="openEdit(t)"
                      >Edit</button>
                      <button
                        type="button"
                        class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400"
                        @click="handleDelete(t)"
                      >Hapus</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pagination :current-page="currentPage" :total-pages="totalPages" @update:page="setPage" />
        </div>

      </ComponentCard>
    </div>

    <!-- Create/Edit Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 z-[9999] overflow-y-auto bg-black/50"
      @click.self="showForm = false"
    >
      <div class="flex min-h-full items-center justify-center px-4 py-8">
        <div class="w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900" @click.stop>

        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
              {{ editId ? 'Edit Template Jadwal' : 'Buat Template Jadwal Baru' }}
            </h3>
            <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Tentukan nama, geofence setiap stop, dan jam estimasi. User cukup pilih tanggal saat memakai template.
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            @click="showForm = false"
          >Tutup</button>
        </div>

        <!-- Form Info Fields: Nama + Deskripsi -->
        <div class="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Nama Template <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.template_name"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
              placeholder="Contoh: KIIC 6 Stop"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Deskripsi</label>
            <input
              v-model="formData.description"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
              placeholder="Opsional — misal: Shuttle KIIC-GIIC 6 tujuan"
            />
          </div>
        </div>

        <!-- Stops Section Header -->
        <div class="flex items-center justify-between border-t border-gray-100 px-6 py-3 dark:border-gray-800">
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Jadwal Stop</p>
            <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {{ formData.stops.length }} stop &mdash; Departure, {{ formData.stops.filter(s => !s.is_departure && !s.is_finish).length }} Tujuan, Finish
            </p>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-400"
            @click="addMiddleStop"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Tujuan
          </button>
        </div>

        <!-- Stops List -->
        <div class="px-6 pb-2">
          <div class="space-y-2 py-2">
            <div
              v-for="(stop, idx) in formData.stops"
              :key="idx"
              class="flex items-start gap-3 rounded-lg border bg-gray-50/70 px-3 py-2.5 dark:bg-gray-800/30"
              :class="{
                'border-l-4 border-l-purple-300 border-gray-100 dark:border-l-purple-600 dark:border-gray-800': stop.is_departure,
                'border-l-4 border-l-gray-300 border-gray-100 dark:border-l-gray-600 dark:border-gray-800': stop.is_finish,
                'border-l-4 border-l-orange-300 border-gray-100 dark:border-l-orange-500 dark:border-gray-800': !stop.is_departure && !stop.is_finish
              }"
            >
              <!-- Badge: jenis stop -->
              <div class="w-[88px] shrink-0 pt-5">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                  :class="{
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300': stop.is_departure,
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300': stop.is_finish,
                    'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300': !stop.is_departure && !stop.is_finish
                  }"
                >
                  {{ stop.is_departure ? 'Departure' : stop.is_finish ? 'Finish' : `T${getMiddleIndex(idx)}` }}
                </span>
              </div>

              <!-- Col 1: Nama Stop -->
              <div class="w-32 shrink-0">
                <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">Nama Stop</label>
                <input
                  v-model="stop.stop_name"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  :placeholder="stop.is_departure ? 'Departure' : stop.is_finish ? 'Finish' : 'Nama Tujuan'"
                />
              </div>

              <!-- Col 2: Geofence (paling lebar) -->
              <div class="min-w-0 flex-1">
                <label class="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">
                  <span class="mr-1">📍</span>Geofence / Lokasi
                </label>
                <SearchableSelect
                  :model-value="getStopGeofenceValue(stop)"
                  :options="geofenceSelectOptions"
                  value-key="value"
                  :placeholder="geofenceLoading ? 'Memuat geofence...' : 'Pilih zona geofence...'"
                  :disabled="geofenceLoading"
                  @update:model-value="(v: string) => onStopGeofenceChange(stop, v)"
                />
              </div>

              <!-- Col 3: Jam Estimasi -->
              <div class="w-40 shrink-0">
                <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  <span class="mr-1">🕐</span>Jam Estimasi
                </label>
                <DatePickerInput
                  :model-value="getStopTimeValue(stop)"
                  placeholder="Pilih jam..."
                  :enable-time="true"
                  @update:model-value="(v: string) => onStopTimeChange(stop, v)"
                />
              </div>

              <!-- Aksi: hapus (hanya middle stops) -->
              <div class="shrink-0 pt-5">
                <button
                  v-if="!stop.is_departure && !stop.is_finish"
                  type="button"
                  class="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Hapus stop ini"
                  @click="removeStop(idx)"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div v-else class="h-7 w-7"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hint -->
        <p class="border-t border-gray-100 px-6 py-2.5 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
          Jam estimasi di atas akan digabungkan dengan tanggal yang dipilih user saat memakai template (misal: tanggal 28 Juli + jam 07:00 = 28 Juli 2026 07:00).
        </p>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            @click="showForm = false"
          >Batal</button>
          <button
            type="button"
            :disabled="saving"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            @click="handleSave"
          >{{ saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Buat Template' }}</button>
        </div>

      </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import SortableTableHeader from '@/components/common/SortableTableHeader.vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import { filterItemsByQuery, useListQuery } from '@/composables/useListQuery'
import { useSortableItems } from '@/composables/useSortableItems'
import { deliveryTemplateService, type DeliveryTemplate } from '@/services/deliveryTemplateService'
import { useToast } from '@/composables/useToast'
import { useDialog } from '@/composables/useDialog'
import { authFetch } from '@/services/auth'
import { API_BASE } from '@/config/api'

const pageTitle = ref('Template Jadwal')
const toast = useToast()
const { confirm } = useDialog()

// --- Geofence loading (identical to SalesCostForm) ---
const geofenceRows = ref<Array<{ resource_id: number; resource_name: string; zone_id: number; zone_name: string }>>([])
const geofenceLoading = ref(false)

const geofenceSelectOptions = computed(() =>
  geofenceRows.value.map((row) => ({
    value: `${row.resource_id}:${row.zone_id}`,
    label: row.zone_name,
    resource_name: row.resource_name,
    zone_name: row.zone_name
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

const getStopGeofenceValue = (stop: FormStop): string => {
  if (!stop.wialon_resource_id || !stop.wialon_zone_id) return ''
  return `${stop.wialon_resource_id}:${stop.wialon_zone_id}`
}

const onStopGeofenceChange = (stop: FormStop, value: string) => {
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

// --- Time picker helpers ---
const DUMMY_DATE = '2000-01-01'

const getStopTimeValue = (stop: FormStop): string => {
  if (!stop.time_hhmm) return ''
  return `${DUMMY_DATE} ${stop.time_hhmm}`
}

const onStopTimeChange = (stop: FormStop, value: string) => {
  if (!value) {
    stop.time_hhmm = null
    return
  }
  const match = value.match(/(\d{2}:\d{2})$/)
  stop.time_hhmm = match ? match[1] : null
}

// --- Template data & CRUD state ---
const loading = ref(false)
const saving = ref(false)
const templates = ref<DeliveryTemplate[]>([])
const showForm = ref(false)
const editId = ref<number | null>(null)

// --- Search / Sort / Pagination (mirrors TruckMaster pattern) ---
const search = ref('')
const pageSizeOptions = [15, 20, 50]
const { currentPage, pageSize, setPage } = useListQuery({ pageSize: 15, debounceMs: 300 })

// Enrich templates with stop_count for sorting
const enrichedTemplates = computed(() =>
  templates.value.map(t => ({ ...t, stop_count: t.stops?.length || 0 }))
)

const filteredItems = computed(() =>
  filterItemsByQuery(enrichedTemplates.value, search.value, ['template_name', 'description'])
)

const totalCount = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const { sortKey, sortDirection, setSort, sortedItems } = useSortableItems(
  filteredItems,
  'template_name'
)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

type FormStop = {
  stop_order: number
  stop_name: string
  wialon_zone_name: string | null
  time_hhmm: string | null
  is_departure: number
  is_finish: number
  wialon_resource_id: number | null
  wialon_zone_id: number | null
}

type FormData = {
  template_name: string
  description: string
  stops: FormStop[]
}

const defaultStops = (): FormStop[] => [
  {
    stop_order: 0,
    stop_name: 'Departure',
    wialon_zone_name: null,
    time_hhmm: null,
    is_departure: 1,
    is_finish: 0,
    wialon_resource_id: null,
    wialon_zone_id: null
  },
  {
    stop_order: 99,
    stop_name: 'Finish',
    wialon_zone_name: null,
    time_hhmm: null,
    is_departure: 0,
    is_finish: 1,
    wialon_resource_id: null,
    wialon_zone_id: null
  }
]

const formData = ref<FormData>({
  template_name: '',
  description: '',
  stops: defaultStops()
})

const getMiddleIndex = (idx: number): number => {
  // Count how many middle stops precede this index
  let count = 0
  for (let i = 0; i < idx; i++) {
    if (!formData.value.stops[i].is_departure && !formData.value.stops[i].is_finish) count++
  }
  return count + 1
}

const loadTemplates = async () => {
  loading.value = true
  try {
    templates.value = await deliveryTemplateService.fetchTemplates()
  } catch {
    toast.error('Gagal memuat template.')
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editId.value = null
  formData.value = { template_name: '', description: '', stops: defaultStops() }
  showForm.value = true
}

const openEdit = (t: DeliveryTemplate) => {
  editId.value = t.id
  formData.value = {
    template_name: t.template_name,
    description: t.description || '',
    stops: t.stops.map((s) => ({
      stop_order: Number(s.stop_order),
      stop_name: s.stop_name,
      wialon_zone_name: s.wialon_zone_name || null,
      time_hhmm: s.time_hhmm || null,
      is_departure: Number(s.is_departure),
      is_finish: Number(s.is_finish),
      wialon_resource_id: s.wialon_resource_id ?? null,
      wialon_zone_id: s.wialon_zone_id ?? null
    }))
  }
  showForm.value = true
}

const addMiddleStop = () => {
  const mids = formData.value.stops.filter(s => !s.is_departure && !s.is_finish)
  const finIdx = formData.value.stops.findIndex(s => s.is_finish)
  const newStop: FormStop = {
    stop_order: mids.length + 1,
    stop_name: `Tujuan ${mids.length + 1}`,
    wialon_zone_name: null,
    time_hhmm: null,
    is_departure: 0,
    is_finish: 0,
    wialon_resource_id: null,
    wialon_zone_id: null
  }
  if (finIdx >= 0) {
    formData.value.stops.splice(finIdx, 0, newStop)
  } else {
    formData.value.stops.push(newStop)
  }
  // renumber middle stops
  let midIdx = 1
  formData.value.stops.forEach(s => {
    if (!s.is_departure && !s.is_finish) s.stop_order = midIdx++
  })
}

const removeStop = (idx: number) => {
  formData.value.stops.splice(idx, 1)
  let midIdx = 1
  formData.value.stops.forEach(s => {
    if (!s.is_departure && !s.is_finish) s.stop_order = midIdx++
  })
}

const handleSave = async () => {
  if (!formData.value.template_name.trim()) {
    toast.warning('Nama template wajib diisi.')
    return
  }
  if (!formData.value.stops.some(s => s.is_departure)) {
    toast.warning('Template harus memiliki stop Departure.')
    return
  }
  if (!formData.value.stops.some(s => s.is_finish)) {
    toast.warning('Template harus memiliki stop Finish.')
    return
  }

  saving.value = true
  try {
    const payload = {
      template_name: formData.value.template_name.trim(),
      description: formData.value.description.trim() || null,
      stops: formData.value.stops.map(s => ({
        stop_order: s.stop_order,
        stop_name: s.stop_name,
        wialon_zone_name: s.wialon_zone_name || null,
        wialon_resource_id: s.wialon_resource_id,
        wialon_zone_id: s.wialon_zone_id,
        is_departure: s.is_departure,
        is_finish: s.is_finish,
        time_hhmm: s.time_hhmm || null
      }))
    }
    if (editId.value) {
      await deliveryTemplateService.updateTemplate(editId.value, payload)
      toast.success('Template berhasil diperbarui.')
    } else {
      await deliveryTemplateService.createTemplate(payload)
      toast.success('Template berhasil dibuat.')
    }
    showForm.value = false
    await loadTemplates()
  } catch {
    toast.error('Gagal menyimpan template.')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (t: DeliveryTemplate) => {
  const ok = await confirm({
    title: 'Hapus Template',
    message: `Hapus template "${t.template_name}"? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) return
  try {
    await deliveryTemplateService.deleteTemplate(t.id)
    toast.success('Template dihapus.')
    await loadTemplates()
  } catch {
    toast.error('Gagal menghapus template.')
  }
}

onMounted(() => {
  loadTemplates()
  loadGeofences()
})
</script>
