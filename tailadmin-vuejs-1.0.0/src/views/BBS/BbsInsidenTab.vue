<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">Pelaporan Insiden & Near-Miss</h4>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Laporkan setiap kejadian, baik insiden maupun hampir terjadi</p>

    <div class="space-y-4">
      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Nama Pelapor</label>
            <input
              v-model="form.reporter_name"
              type="text"
              placeholder="Nama lengkap"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Tanggal Kejadian</label>
            <DatePickerInput
              v-model="form.date"
              placeholder="Pilih tanggal"
            />
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Jenis Laporan</label>
            <select
              v-model="form.type"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">-- Pilih --</option>
              <option v-for="t in incidentTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Lokasi Kejadian</label>
            <input
              v-model="form.location"
              type="text"
              placeholder="Nama jalan / area"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Plat Kendaraan Terlibat</label>
          <div class="relative" ref="plateRoot">
            <input
              v-model="form.plate_number"
              type="text"
              placeholder="Pilih atau ketik plat kendaraan"
              autocomplete="off"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 uppercase outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              @focus="plateSuggestOpen = true"
              @input="onPlateInput"
              @keydown.escape="plateSuggestOpen = false"
              @keydown.arrow-down.prevent="movePlateSuggestion(1)"
              @keydown.arrow-up.prevent="movePlateSuggestion(-1)"
              @keydown.enter.prevent="selectPlateSuggestion"
            />
            <div
              v-if="plateSuggestOpen && filteredTrucks.length > 0"
              class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 max-h-48 overflow-auto py-1"
            >
              <div
                v-for="(truck, idx) in filteredTrucks"
                :key="truck.id_truck"
                class="cursor-pointer px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                :class="idx === plateActiveIdx ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200' : ''"
                @mousedown.prevent="pickTruck(truck)"
                @mousemove="plateActiveIdx = idx"
              >
                <span class="font-medium">{{ truck.no_police }}</span>
                <span class="ml-2 text-xs text-gray-400">{{ truck.jenis_kendaraan }}</span>
              </div>
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Pilih dari daftar atau ketik manual</p>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 space-y-4">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Kronologi Kejadian</label>
          <textarea
            v-model="form.chronology"
            rows="4"
            placeholder="Jelaskan secara runtut apa yang terjadi..."
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 resize-y"
          ></textarea>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Faktor Penyebab</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <button
              v-for="factor in factorOptions"
              :key="factor"
              type="button"
              :class="[
                'rounded-md px-3 py-1.5 text-xs font-medium border transition-colors',
                selectedFactors.includes(factor)
                  ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-white/10 dark:text-white dark:border-gray-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
              ]"
              @click="toggleFactor(factor)"
            >{{ factor }}</button>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Korban / Kerugian</label>
          <textarea
            v-model="form.casualties"
            rows="2"
            placeholder="Jelaskan korban atau kerugian material..."
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 resize-y"
          ></textarea>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Rekomendasi Tindakan</label>
          <textarea
            v-model="form.recommendations"
            rows="2"
            placeholder="Apa yang sebaiknya dilakukan untuk mencegah kejadian serupa?"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 resize-y"
          ></textarea>
        </div>

        <button
          type="button"
          :disabled="submitting"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="submit"
        >
          {{ submitting ? 'Mengirim...' : 'Kirim Laporan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'
import { bbsService, type BbsTruckOption } from '@/services/bbsService'
import DatePickerInput from '@/components/DatePickerInput.vue'

const emit = defineEmits<{ (e: 'saved', type: string): void }>()

const authUser = useAuthUser()
const toast = useToast()
const submitting = ref(false)

const incidentTypes = ['Near-Miss', 'Insiden Ringan', 'Insiden Sedang', 'Insiden Berat']
const factorOptions = [
  'Kecepatan', 'Kelelahan', 'Cuaca', 'Jalan Rusak',
  'Perilaku Pengendara Lain', 'Kendaraan', 'HP / Distraksi', 'Lainnya'
]

const form = reactive({
  reporter_name: authUser.value?.nama_admin || '',
  date: new Date().toISOString().slice(0, 10),
  type: '',
  location: '',
  plate_number: '',
  chronology: '',
  casualties: '',
  recommendations: '',
})

const selectedFactors = ref<string[]>([])

// Truck plate suggestion
const trucks = ref<BbsTruckOption[]>([])
const plateSuggestOpen = ref(false)
const plateActiveIdx = ref(-1)
const plateRoot = ref<HTMLElement | null>(null)

const filteredTrucks = computed(() => {
  const q = form.plate_number.trim().toLowerCase()
  if (!q) return trucks.value.slice(0, 20)
  return trucks.value.filter(
    (t) => t.no_police.toLowerCase().includes(q) || t.jenis_kendaraan.toLowerCase().includes(q)
  ).slice(0, 20)
})

function onPlateInput() {
  plateSuggestOpen.value = true
  plateActiveIdx.value = -1
}

function movePlateSuggestion(dir: number) {
  if (filteredTrucks.value.length === 0) return
  let next = plateActiveIdx.value + dir
  if (next < 0) next = filteredTrucks.value.length - 1
  if (next >= filteredTrucks.value.length) next = 0
  plateActiveIdx.value = next
}

function selectPlateSuggestion() {
  if (plateActiveIdx.value >= 0 && filteredTrucks.value[plateActiveIdx.value]) {
    pickTruck(filteredTrucks.value[plateActiveIdx.value])
  } else {
    plateSuggestOpen.value = false
  }
}

function pickTruck(truck: BbsTruckOption) {
  form.plate_number = truck.no_police
  plateSuggestOpen.value = false
  plateActiveIdx.value = -1
}

function handlePlateClickOutside(event: MouseEvent) {
  if (plateRoot.value && !plateRoot.value.contains(event.target as Node)) {
    plateSuggestOpen.value = false
  }
}

async function fetchTrucks() {
  try {
    trucks.value = await bbsService.fetchTrucks()
  } catch {
    trucks.value = []
  }
}

onMounted(() => {
  fetchTrucks()
  document.addEventListener('mousedown', handlePlateClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handlePlateClickOutside)
})

function toggleFactor(factor: string) {
  const idx = selectedFactors.value.indexOf(factor)
  if (idx >= 0) {
    selectedFactors.value.splice(idx, 1)
  } else {
    selectedFactors.value.push(factor)
  }
}

function resetForm() {
  form.reporter_name = authUser.value?.nama_admin || ''
  form.date = new Date().toISOString().slice(0, 10)
  form.type = ''
  form.location = ''
  form.plate_number = ''
  form.chronology = ''
  form.casualties = ''
  form.recommendations = ''
  selectedFactors.value = []
}

async function submit() {
  if (!form.reporter_name.trim()) {
    toast.error('Nama Pelapor wajib diisi')
    return
  }
  if (!form.type) {
    toast.error('Jenis Laporan wajib dipilih')
    return
  }
  if (!form.location.trim()) {
    toast.error('Lokasi Kejadian wajib diisi')
    return
  }

  submitting.value = true
  try {
    await bbsService.createIncident({
      reporter_name: form.reporter_name.trim(),
      date: form.date || new Date().toISOString().slice(0, 10),
      type: form.type,
      location: form.location.trim(),
      plate_number: form.plate_number || undefined,
      chronology: form.chronology || undefined,
      factors: selectedFactors.value.length > 0 ? [...selectedFactors.value] : undefined,
      casualties: form.casualties || undefined,
      recommendations: form.recommendations || undefined,
    })
    toast.success('Laporan insiden terkirim')
    resetForm()
    emit('saved', 'insiden')
  } catch (err: any) {
    toast.error(err?.message || 'Gagal mengirim laporan')
  } finally {
    submitting.value = false
  }
}
</script>
