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
        <div class="grid gap-4 sm:grid-cols-1">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tanggal Input
            </label>
            <input
              v-model="form.tgl_input"
              type="date"
              readonly
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-1">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Kategori Perbaikan
            </label>
            <select
              v-model="form.kategori_repair"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="isDisabled"
            >
              <option value="">--</option>
              <option value="Electrical Repair">Electrical</option>
              <option value="Mechanical Repair">Mechanical</option>
              <option value="Tire Repair">Tire</option>
              <option value="Engine Overhaul">Engine Overhaul</option>
            </select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-1">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Truck
            </label>
            <SearchableSelect
              v-model="form.id_truck"
              :options="trucks"
              value-key="id_truck"
              :label-formatter="formatTruckLabel"
              :search-keys="['no_police', 'jenis_kendaraan', 'merk_mobil', 'model']"
              placeholder="-Pilih-"
              search-placeholder="Cari truck"
              :disabled="isDisabled"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tanggal Kerusakan
            </label>
            <input
              v-model="form.tgl_kerusakan"
              type="date"
              @click="openDatePicker"
              @keydown.prevent
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="isDisabled"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              No. SPK Perbaikan
            </label>
            <input
              v-model="form.no_spk_perbaikan"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan No. SPK"
              :disabled="isDisabled"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Kilometer Kendaraan
            </label>
            <input
              v-model="form.kilometer"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan No. Kilometer Kendaraan"
              :disabled="isDisabled"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Jenis Kerusakan
            </label>
            <input
              v-model="form.jenis_kerusakan"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Jenis Kerusakan"
              :disabled="isDisabled"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Spare Part
            </label>
            <input
              v-model="form.spare_part"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Pergantian Spare Part"
              :disabled="isDisabled"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Jadwal Berkala Perbaikan
            </label>
            <input
              v-model="form.jadwal_berkala"
              type="date"
              @click="openDatePicker"
              @keydown.prevent
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="isDisabled"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Biaya Perbaikan
            </label>
            <input
              v-model="form.biaya_perbaikan"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="isDisabled"
              @input="formatNumeric('biaya_perbaikan')"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-1">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Keterangan
            </label>
            <textarea
              v-model="form.keterangan"
              rows="3"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Keterangan Perbaikan"
              :disabled="isDisabled"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-center gap-2">
          <slot name="actions">
            <br>
            <div class="mt-5 flex items-center justify-center">
            <button
              type="submit"
              :disabled="isDisabled"
              class="inline-flex w-80 items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
            >
              {{ submitLabel }}
            </button>
            </div>
          </slot>
        </div>
      </fieldset>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import { repairService } from '@/services/repair'

type RepairFormData = {
  kategori_repair: string
  id_truck: string
  tgl_kerusakan: string
  no_spk_perbaikan: string
  kilometer: string
  jenis_kerusakan: string
  spare_part: string
  jadwal_berkala: string
  keterangan: string
  biaya_perbaikan: string
  tgl_input?: string
}

const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit'
    submitLabel?: string
    initialData?: Partial<RepairFormData>
    loading?: boolean
    submitting?: boolean
    submitError?: string
  }>(),
  {
    submitLabel: 'Simpan',
    initialData: () => ({}),
    loading: false,
    submitting: false,
    submitError: ''
  }
)

const emit = defineEmits<{
  (event: 'submit', payload: RepairFormData): void
}>()

const trucks = ref<Array<Record<string, unknown>>>([])

const form = reactive<RepairFormData>({
  kategori_repair: '',
  id_truck: '',
  tgl_kerusakan: '',
  no_spk_perbaikan: '',
  kilometer: '',
  jenis_kerusakan: '',
  spare_part: '',
  jadwal_berkala: '',
  keterangan: '',
  biaya_perbaikan: '',
  tgl_input: ''
})

const isDisabled = computed(() => props.loading || props.submitting)

const formatTruckLabel = (truck: Record<string, unknown>) => {
  const noPolice = truck.no_police ? String(truck.no_police) : ''
  const jenis = truck.jenis_kendaraan ? String(truck.jenis_kendaraan) : ''
  return jenis ? `${noPolice} - ${jenis}` : noPolice
}

const normalizeNumeric = (value: string) => value.replace(/[^\d]/g, '')

const formatNumeric = (field: keyof RepairFormData) => {
  const raw = normalizeNumeric(form[field] || '')
  form[field] = raw ? Number(raw).toLocaleString('en-US') : ''
}

const normalizeDateInput = (value?: string | null) => {
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

const applyInitialData = (data: Partial<RepairFormData>) => {
  form.kategori_repair = data.kategori_repair ?? ''
  form.id_truck = data.id_truck ? String(data.id_truck) : ''
  form.tgl_kerusakan = normalizeDateInput(data.tgl_kerusakan)
  form.no_spk_perbaikan = data.no_spk_perbaikan ?? ''
  form.kilometer = data.kilometer ?? ''
  form.jenis_kerusakan = data.jenis_kerusakan ?? ''
  form.spare_part = data.spare_part ?? ''
  form.jadwal_berkala = normalizeDateInput(data.jadwal_berkala)
  form.keterangan = data.keterangan ?? ''
  form.biaya_perbaikan = data.biaya_perbaikan
    ? Number(String(data.biaya_perbaikan).replace(/[^\d]/g, '')).toLocaleString('en-US')
    : ''
  form.tgl_input = normalizeDateInput(data.tgl_input)
}

const loadTrucks = async () => {
  try {
    trucks.value = await repairService.fetchTrucks()
  } catch (error) {
    console.error(error)
  }
}

const handleSubmit = () => {
  emit('submit', { ...form })
}

const getLocalDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const openDatePicker = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target || typeof target.showPicker !== 'function') {
    return
  }
  if (event.isTrusted !== true) {
    return
  }
  try {
    target.showPicker()
  } catch (error) {
    // Ignore gesture-related errors from the browser.
  }
}

watch(
  () => props.initialData,
  (value) => {
    applyInitialData(value || {})
  },
  { immediate: true }
)

onMounted(() => {
  if (props.mode === 'create' && !form.tgl_input) {
    form.tgl_input = getLocalDateString()
  }
  loadTrucks()
})
</script>
