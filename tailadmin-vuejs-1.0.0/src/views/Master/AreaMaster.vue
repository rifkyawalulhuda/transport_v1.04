<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Master Area">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              @click="openForm()"
            >
              Tambah Area
            </button>
            <MasterImportActions master-type="area" @imported="handleImported" />
            <SearchBar v-model="search" placeholder="Cari kode area atau nama area" />
          </div>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total: {{ totalCount }} area
            </p>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
              <select
                v-model.number="pageSize"
                class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @change="changePageSize"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <Modal v-if="showForm" :full-screen-backdrop="true" @close="cancelForm">
          <template #body>
            <div class="relative z-10 w-[calc(100vw-2rem)] max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div>
                  <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
                    {{ formTitle }}
                  </h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Susun langkah rute dan pilih geofence Wialon untuk setiap titik pengiriman.
                  </p>
                </div>
                <button
                  type="button"
                  class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  @click="cancelForm"
                >
                  Tutup
                </button>
              </div>

              <div class="max-h-[85vh] overflow-y-auto px-6 py-5 custom-scrollbar">
                <form class="space-y-5" @submit.prevent="submitForm">
                  <div class="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/10 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Preview Rute
                      </h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Nama area tetap dibentuk dari kode area dan langkah rute saja.
                      </p>
                    </div>
                    <div class="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
                      <span class="font-semibold">{{ areaNamePreview || '-' }}</span>
                    </div>
                  </div>

                  <div class="grid gap-4 lg:grid-cols-3">
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Kode Area
                      </label>
                      <input
                        v-model="form.kode_area"
                        type="text"
                        placeholder="Contoh: 117"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      />
                    </div>
                    <div class="lg:col-span-2">
                      <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Nama Area
                      </label>
                      <input
                        :value="areaNamePreview"
                        type="text"
                        class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        readonly
                      />
                    </div>
                  </div>

                  <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                    <div class="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          Langkah Rute
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Setiap langkah mewakili satu titik route yang akan dicatat timestamp-nya.
                        </p>
                      </div>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white shadow-theme-xs hover:bg-brand-600"
                        @click="addRouteStep"
                      >
                        Tambah Langkah
                      </button>
                    </div>

                    <div class="space-y-4">
                      <div
                        v-for="(step, index) in form.route_steps"
                        :key="`route-step-${index}`"
                        class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div class="mb-4 flex flex-col gap-2 border-b border-gray-200 pb-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                          <div class="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Langkah {{ index + 1 }}
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                              :disabled="index === 0"
                              @click="moveRouteStep(index, -1)"
                            >
                              Naik
                            </button>
                            <button
                              type="button"
                              class="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                              :disabled="index === form.route_steps.length - 1"
                              @click="moveRouteStep(index, 1)"
                            >
                              Turun
                            </button>
                            <button
                              type="button"
                              class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 disabled:opacity-50 dark:bg-error-500/15 dark:text-error-300"
                              :disabled="form.route_steps.length === 1"
                              @click="removeRouteStep(index)"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>

                        <div class="grid gap-4 lg:grid-cols-2">
                          <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                              Nama Langkah
                            </label>
                            <input
                              v-model="step.step_name"
                              type="text"
                              placeholder="Contoh: CLC"
                              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            />
                          </div>
                          <div>
                            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                              Geofence Wialon
                            </label>
                            <SearchableSelect
                              :model-value="getStepGeofenceValue(step)"
                              :options="geofenceSelectOptions"
                              value-key="value"
                              label-key="label"
                              :search-keys="['label', 'resource_name', 'zone_name']"
                              placeholder="-Pilih geofence-"
                              search-placeholder="Cari resource atau geofence"
                              :disabled="isSubmitting || geofenceLoading"
                              @update:model-value="updateStepGeofence(index, $event)"
                            />
                          </div>
                        </div>

                        <div
                          v-if="step.wialon_zone_name"
                          class="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300"
                        >
                          Geofence terpilih: {{ step.wialon_zone_name }}
                          <span class="text-gray-400 dark:text-gray-500">
                            (Resource ID {{ step.wialon_resource_id }}, Zone ID {{ step.wialon_zone_id }})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="mt-5 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                      <div class="mb-3">
                        <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          Finish Order Geofence
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Pilih geofence yang dipakai saat sistem mencatat Finish Order. Nilai ini tidak masuk ke Nama Area.
                        </p>
                      </div>

                      <div class="grid gap-4 lg:grid-cols-2">
                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                            Geofence Finish Order
                          </label>
                          <SearchableSelect
                            :model-value="getFinishGeofenceValue()"
                            :options="geofenceSelectOptions"
                            value-key="value"
                            label-key="label"
                            :search-keys="['label', 'resource_name', 'zone_name']"
                            placeholder="-Pilih finish geofence-"
                            search-placeholder="Cari resource atau geofence"
                            :disabled="isSubmitting || geofenceLoading"
                            @update:model-value="updateFinishGeofence"
                          />
                        </div>
                      </div>

                      <div
                        v-if="form.finish_geofence_zone_name"
                        class="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300"
                      >
                        Finish Order terpilih: {{ form.finish_geofence_zone_name }}
                        <span class="text-gray-400 dark:text-gray-500">
                          (Resource ID {{ form.finish_geofence_resource_id }}, Zone ID {{ form.finish_geofence_zone_id }})
                        </span>
                      </div>
                    </div>

                    <p
                      v-if="geofenceError"
                      class="mt-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200"
                    >
                      {{ geofenceError }}
                    </p>
                  </div>

                  <div class="flex items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      @click="cancelForm"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      :disabled="isSubmitting"
                      class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </template>
        </Modal>

        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    No
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Kode Area
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Nama Area
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Langkah
                  </th>
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <tr
                  v-for="(item, index) in pagedItems"
                  :key="item.id_area"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    {{ item.kode_area || '-' }}
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    <div class="font-medium">{{ item.nama_area }}</div>
                  </td>
                  <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="step in displayRouteSteps(item)"
                        :key="`${item.id_area}-${step.step_order}-${step.step_name}`"
                        class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      >
                        {{ step.step_order }}. {{ step.step_name }}
                      </span>
                      <span
                        v-if="displayRouteSteps(item).length === 0"
                        class="text-xs text-gray-500 dark:text-gray-400"
                      >
                        Belum ada langkah terdaftar
                      </span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-center sm:px-6">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        class="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400"
                        @click="openForm(item)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        :disabled="deletingId === item.id_area"
                        class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-error-500/15 dark:text-error-400"
                        @click="remove(item)"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && totalCount === 0">
                  <td
                    colspan="5"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
                <tr v-if="loading">
                  <td
                    colspan="5"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @update:page="setPage"
          />
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE } from '@/config/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import Modal from '@/components/ui/Modal.vue'
import MasterImportActions from '@/components/master/MasterImportActions.vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import { filterItemsByQuery, useListQuery } from '@/composables/useListQuery'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { authFetch } from '@/services/auth'

type RouteStep = {
  id_area_route_step: number | null
  step_order: number
  step_name: string
  wialon_resource_id: string
  wialon_zone_id: string
  wialon_zone_name: string
}

type AreaItem = {
  id_area: number
  kode_area: string | null
  nama_area: string
  finish_geofence_resource_id?: number | null
  finish_geofence_zone_id?: number | null
  finish_geofence_zone_name?: string | null
  route_steps: Array<{
    id_area_route_step: number
    step_order: number
    step_name: string
    wialon_resource_id: number
    wialon_zone_id: number
    wialon_zone_name: string
  }>
  draft_route_steps?: Array<{
    id_area_route_step: number | null
    step_order: number
    step_name: string
    wialon_resource_id: number | null
    wialon_zone_id: number | null
    wialon_zone_name: string
  }>
}

type FormState = {
  id: number | null
  kode_area: string
  route_steps: RouteStep[]
  finish_geofence_resource_id: string
  finish_geofence_zone_id: string
  finish_geofence_zone_name: string
}

type WialonGeofenceRow = {
  resource_id: number
  resource_name: string
  zone_id: number
  zone_name: string
}

const currentPageTitle = ref('Master Area')
const items = ref<AreaItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('Tambah Area')
const isSubmitting = ref(false)
const deletingId = ref<number | null>(null)
const geofenceRows = ref<WialonGeofenceRow[]>([])
const geofenceLoading = ref(false)
const geofenceError = ref('')
const form = reactive<FormState>({
  id: null,
  kode_area: '',
  route_steps: [],
  finish_geofence_resource_id: '',
  finish_geofence_zone_id: '',
  finish_geofence_zone_name: ''
})

const apiBase = API_BASE
const { confirm } = useDialog()
const toast = useToast()

const { search, debouncedSearch, currentPage, pageSize, setPage } = useListQuery({
  pageSize: 15,
  debounceMs: 300
})
const pageSizeOptions = [15, 20, 50]

const createEmptyRouteStep = (stepOrder: number): RouteStep => ({
  id_area_route_step: null,
  step_order: stepOrder,
  step_name: '',
  wialon_resource_id: '',
  wialon_zone_id: '',
  wialon_zone_name: ''
})

const createEmptyFinishGeofence = () => ({
  finish_geofence_resource_id: '',
  finish_geofence_zone_id: '',
  finish_geofence_zone_name: ''
})

const normalizeDraftRouteSteps = (item?: AreaItem | null) => {
  const baseSteps =
    item?.route_steps && item.route_steps.length > 0 ? item.route_steps : item?.draft_route_steps || []

  if (baseSteps.length === 0) {
    return [createEmptyRouteStep(1)]
  }

  return baseSteps.map((step, index) => ({
    id_area_route_step: step.id_area_route_step ?? null,
    step_order: index + 1,
    step_name: step.step_name || '',
    wialon_resource_id:
      step.wialon_resource_id === null || step.wialon_resource_id === undefined
        ? ''
        : String(step.wialon_resource_id),
    wialon_zone_id:
      step.wialon_zone_id === null || step.wialon_zone_id === undefined ? '' : String(step.wialon_zone_id),
    wialon_zone_name: step.wialon_zone_name || ''
  }))
}

const normalizeDraftFinishGeofence = (item?: AreaItem | null) => ({
  finish_geofence_resource_id:
    item?.finish_geofence_resource_id === null || item?.finish_geofence_resource_id === undefined
      ? ''
      : String(item.finish_geofence_resource_id),
  finish_geofence_zone_id:
    item?.finish_geofence_zone_id === null || item?.finish_geofence_zone_id === undefined
      ? ''
      : String(item.finish_geofence_zone_id),
  finish_geofence_zone_name: item?.finish_geofence_zone_name || ''
})

const geofenceSelectOptions = computed(() =>
  geofenceRows.value.map((row) => ({
    value: `${row.resource_id}:${row.zone_id}`,
    label: `${row.zone_name} (${row.resource_name})`,
    resource_name: row.resource_name,
    zone_name: row.zone_name
  }))
)

const areaNamePreview = computed(() => {
  const parts = []
  const kodeArea = form.kode_area.trim()
  if (kodeArea) {
    parts.push(kodeArea)
  }

  form.route_steps
    .map((step) => step.step_name.trim())
    .filter(Boolean)
    .forEach((stepName) => parts.push(stepName))

  return parts.join('-')
})

const displayRouteSteps = (item: AreaItem) =>
  (item.route_steps && item.route_steps.length > 0 ? item.route_steps : item.draft_route_steps || []).slice()

const changePageSize = () => {
  setPage(1)
}

const filteredItems = computed(() =>
  filterItemsByQuery(items.value, debouncedSearch.value, ['nama_area', 'kode_area'])
)

const totalCount = computed(() => filteredItems.value.length)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  if (filteredItems.value.length === 0) {
    return 1
  }
  return Math.ceil(filteredItems.value.length / pageSize.value)
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await authFetch(`${apiBase}/areas`)
    const data = await res.json()
    items.value = Array.isArray(data) ? data : []
    currentPage.value = 1
  } catch (error) {
    console.error(error)
    toast.error('Gagal memuat data area.')
  } finally {
    loading.value = false
  }
}

const loadGeofences = async () => {
  if (geofenceRows.value.length > 0 || geofenceLoading.value) {
    return
  }

  geofenceLoading.value = true
  geofenceError.value = ''
  try {
    const res = await authFetch(`${apiBase}/wialon/geofences`)
    const data = await res.json()
    geofenceRows.value = Array.isArray(data?.rows) ? data.rows : []
    if (geofenceRows.value.length === 0) {
      geofenceError.value = 'Belum ada geofence yang tersedia pada resource Wialon akun ini.'
    }
  } catch (error) {
    console.error(error)
    geofenceError.value = 'Gagal mengambil daftar geofence Wialon.'
  } finally {
    geofenceLoading.value = false
  }
}

const handleImported = async () => {
  await loadData()
  setPage(1)
}

const reindexRouteSteps = () => {
  form.route_steps = form.route_steps.map((step, index) => ({
    ...step,
    step_order: index + 1
  }))
}

const addRouteStep = () => {
  form.route_steps.push(createEmptyRouteStep(form.route_steps.length + 1))
}

const removeRouteStep = (index: number) => {
  if (form.route_steps.length === 1) {
    return
  }
  form.route_steps.splice(index, 1)
  reindexRouteSteps()
}

const moveRouteStep = (index: number, direction: number) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= form.route_steps.length) {
    return
  }
  const cloned = [...form.route_steps]
  const [moved] = cloned.splice(index, 1)
  cloned.splice(targetIndex, 0, moved)
  form.route_steps = cloned
  reindexRouteSteps()
}

const getStepGeofenceValue = (step: RouteStep) => {
  if (!step.wialon_resource_id || !step.wialon_zone_id) {
    return ''
  }
  return `${step.wialon_resource_id}:${step.wialon_zone_id}`
}

const updateStepGeofence = (index: number, value: string) => {
  const selected = geofenceRows.value.find(
    (row) => `${row.resource_id}:${row.zone_id}` === value
  )
  if (!selected) {
    form.route_steps[index].wialon_resource_id = ''
    form.route_steps[index].wialon_zone_id = ''
    form.route_steps[index].wialon_zone_name = ''
    return
  }

  form.route_steps[index].wialon_resource_id = String(selected.resource_id)
  form.route_steps[index].wialon_zone_id = String(selected.zone_id)
  form.route_steps[index].wialon_zone_name = selected.zone_name
}

const getFinishGeofenceValue = () => {
  if (!form.finish_geofence_resource_id || !form.finish_geofence_zone_id) {
    return ''
  }
  return `${form.finish_geofence_resource_id}:${form.finish_geofence_zone_id}`
}

const updateFinishGeofence = (value: string) => {
  const selected = geofenceRows.value.find(
    (row) => `${row.resource_id}:${row.zone_id}` === value
  )
  if (!selected) {
    form.finish_geofence_resource_id = ''
    form.finish_geofence_zone_id = ''
    form.finish_geofence_zone_name = ''
    return
  }

  form.finish_geofence_resource_id = String(selected.resource_id)
  form.finish_geofence_zone_id = String(selected.zone_id)
  form.finish_geofence_zone_name = selected.zone_name
}

const openForm = async (item?: AreaItem) => {
  if (item) {
    formTitle.value = 'Edit Area'
    editingId.value = item.id_area
    form.id = item.id_area
    form.kode_area = item.kode_area || ''
    form.route_steps = normalizeDraftRouteSteps(item)
    Object.assign(form, normalizeDraftFinishGeofence(item))
  } else {
    formTitle.value = 'Tambah Area'
    editingId.value = null
    form.id = null
    form.kode_area = ''
    form.route_steps = [createEmptyRouteStep(1)]
    Object.assign(form, createEmptyFinishGeofence())
  }
  showForm.value = true
  await loadGeofences()
}

const cancelForm = () => {
  showForm.value = false
  editingId.value = null
}

const submitForm = async () => {
  if (isSubmitting.value) {
    return
  }

  const payload = {
    kode_area: form.kode_area.trim(),
    finish_geofence_resource_id: form.finish_geofence_resource_id
      ? Number(form.finish_geofence_resource_id)
      : null,
    finish_geofence_zone_id: form.finish_geofence_zone_id
      ? Number(form.finish_geofence_zone_id)
      : null,
    finish_geofence_zone_name: form.finish_geofence_zone_name.trim(),
    route_steps: form.route_steps.map((step, index) => ({
      id_area_route_step: step.id_area_route_step,
      step_order: index + 1,
      step_name: step.step_name.trim(),
      wialon_resource_id: step.wialon_resource_id ? Number(step.wialon_resource_id) : null,
      wialon_zone_id: step.wialon_zone_id ? Number(step.wialon_zone_id) : null,
      wialon_zone_name: step.wialon_zone_name.trim()
    }))
  }

  const isUpdate = Boolean(form.id)
  if (isUpdate) {
    const ok = await confirm({
      title: 'Konfirmasi Perubahan',
      message: 'Simpan perubahan pada data area ini?',
      confirmText: 'Ya, simpan',
      cancelText: 'Batal',
      variant: 'warning'
    })
    if (!ok) {
      return
    }
  }

  isSubmitting.value = true
  try {
    const res = await authFetch(
      isUpdate ? `${apiBase}/areas/${form.id}` : `${apiBase}/areas`,
      {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    )

    if (!res.ok) {
      const body = await res.json().catch(async () => ({ message: await res.text() }))
      const message = body?.message || 'Gagal menyimpan data area.'
      if (res.status === 400 || res.status === 422) {
        toast.warning(message)
      } else {
        toast.error(message)
      }
      return
    }

    toast.success(isUpdate ? 'Perubahan area berhasil disimpan' : 'Area berhasil ditambahkan')
    showForm.value = false
    editingId.value = null
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error(isUpdate ? 'Gagal menyimpan perubahan area.' : 'Gagal menyimpan area.')
  } finally {
    isSubmitting.value = false
  }
}

const remove = async (item: AreaItem) => {
  if (deletingId.value) {
    return
  }
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message:
      'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) {
    return
  }
  try {
    deletingId.value = item.id_area
    const res = await authFetch(`${apiBase}/areas/${item.id_area}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const message = await res.text()
      toast.error(message || 'Gagal menghapus data.')
      return
    }
    toast.success('Data berhasil dihapus')
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Gagal menghapus data.')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadData)
</script>
