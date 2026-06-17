<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">Form Observasi Perilaku</h4>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Catat dan nilai perilaku pengemudi di lapangan</p>

    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Observer</label>
          <input
            type="text"
            :value="authUser?.nama_admin || ''"
            disabled
            readonly
            class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">ID Pengemudi</label>
          <SearchableSelect
            v-model="form.driver_id"
            :options="drivers"
            value-key="id_driver"
            label-key="nama_driver"
            :search-keys="['nama_driver', 'id_driver']"
            placeholder="-Pilih-"
            search-placeholder="Cari nama driver"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tanggal</label>
          <DatePickerInput
            v-model="form.date"
            placeholder="Pilih tanggal"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Lokasi</label>
          <input
            v-model="form.location"
            type="text"
            placeholder="Rute / titik pengamatan"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Jenis Kendaraan</label>
        <select
          v-model="form.vehicle_type"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option value="">-- Pilih --</option>
          <option v-for="v in vehicleOptions" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>

      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Penilaian Perilaku</h5>
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="item in observationItems"
            :key="item.id"
            class="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-200">{{ item.label }}</p>
              <p class="text-xs text-gray-400">{{ item.category }}</p>
            </div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button
                v-for="opt in ratingOptions"
                :key="opt.value"
                type="button"
                :class="[
                  'rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors',
                  scores[item.id] === opt.value ? opt.activeClass : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                ]"
                @click="scores[item.id] = opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Umpan Balik / Catatan</label>
          <textarea
            v-model="form.feedback"
            rows="3"
            placeholder="Tuliskan catatan observasi..."
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 resize-y"
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tindak Lanjut</label>
          <select
            v-model="form.follow_up"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">-- Pilih --</option>
            <option v-for="f in followUpOptions" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
        <button
          type="button"
          :disabled="submitting"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="submit"
        >
          {{ submitting ? 'Menyimpan...' : 'Simpan Observasi' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'
import { bbsService, type BbsDriverOption } from '@/services/bbsService'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'

const emit = defineEmits<{ (e: 'saved', type: string): void }>()

const authUser = useAuthUser()
const toast = useToast()
const submitting = ref(false)
const drivers = ref<BbsDriverOption[]>([])

const vehicleOptions = ['Truk Besar', 'Truk Sedang', 'Minibus', 'Pick-up', 'Sepeda Motor']
const followUpOptions = ['Apresiasi langsung', 'Coaching on the spot', 'Pelaporan ke supervisor', 'Rencana pelatihan']

const ratingOptions = [
  { value: 'aman', label: 'Aman', activeClass: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' },
  { value: 'berisiko', label: 'Berisiko', activeClass: 'border-warning-500 bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400' },
  { value: 'berbahaya', label: 'Bahaya', activeClass: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400' },
]

const observationItems = [
  { id: 'o1', label: 'Memakai sabuk pengaman', category: 'APD' },
  { id: 'o2', label: 'Kecepatan sesuai batas', category: 'Kecepatan' },
  { id: 'o3', label: 'Menjaga jarak aman', category: 'Jarak' },
  { id: 'o4', label: 'Tidak menggunakan HP saat berkendara', category: 'Distraksi' },
  { id: 'o5', label: 'Mematuhi rambu lalu lintas', category: 'Kepatuhan' },
  { id: 'o6', label: 'Kondisi fisik & mental baik', category: 'Kondisi' },
  { id: 'o7', label: 'Teknik pengereman benar', category: 'Teknik' },
  { id: 'o8', label: 'Tidak merokok saat berkendara', category: 'Disiplin' },
]

const form = reactive({
  driver_id: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  vehicle_type: '',
  feedback: '',
  follow_up: '',
})

const scores = reactive<Record<string, string>>(
  Object.fromEntries(observationItems.map((item) => [item.id, '']))
)

function resetForm() {
  form.driver_id = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.location = ''
  form.vehicle_type = ''
  form.feedback = ''
  form.follow_up = ''
  observationItems.forEach((item) => { scores[item.id] = '' })
}

async function submit() {
  if (!form.driver_id.trim()) {
    toast.error('ID Pengemudi wajib diisi')
    return
  }
  if (!form.date) {
    toast.error('Tanggal wajib diisi')
    return
  }

  submitting.value = true
  try {
    await bbsService.createObservation({
      driver_id: form.driver_id.trim(),
      date: form.date,
      location: form.location || undefined,
      vehicle_type: form.vehicle_type || undefined,
      scores: { ...scores },
      feedback: form.feedback || undefined,
      follow_up: form.follow_up || undefined,
    })
    toast.success('Observasi berhasil disimpan')
    resetForm()
    emit('saved', 'observasi')
  } catch (err: any) {
    toast.error(err?.message || 'Gagal menyimpan observasi')
  } finally {
    submitting.value = false
  }
}

async function fetchDrivers() {
  try {
    drivers.value = await bbsService.fetchDrivers()
  } catch {
    drivers.value = []
  }
}

onMounted(() => {
  fetchDrivers()
})
</script>
