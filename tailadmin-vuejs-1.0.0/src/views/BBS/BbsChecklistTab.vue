<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">Checklist Keselamatan Kendaraan</h4>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Pemeriksaan pra-perjalanan wajib dilakukan setiap hari</p>

    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Plat Kendaraan</label>
          <SearchableSelect
            v-model="truckId"
            :options="trucks"
            value-key="id_truck"
            :label-formatter="formatTruckLabel"
            :search-keys="['no_police', 'jenis_kendaraan']"
            placeholder="-Pilih-"
            search-placeholder="Cari no polisi atau jenis kendaraan"
          />
        </div>
      </div>

      <div class="flex gap-1.5">
        <button
          v-for="tab in chkTabs"
          :key="tab.key"
          type="button"
          :class="[
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
            activeChkTab === tab.key
              ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-white/10 dark:text-white dark:border-gray-600'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
          ]"
          @click="activeChkTab = tab.key"
        >{{ tab.label }}</button>
      </div>

      <div class="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="item in currentTabItems"
          :key="item.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <span class="flex-1 text-sm text-gray-700 dark:text-gray-200">{{ item.label }}</span>
          <div class="flex gap-1.5">
            <button
              v-for="opt in chkOptions"
              :key="opt.value"
              type="button"
              :class="[
                'rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors',
                checkItems[item.id] === opt.value ? opt.activeClass : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
              ]"
              @click="checkItems[item.id] = opt.value"
            >{{ opt.label }}</button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Skor Checklist</span>
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">
            {{ safeCount }} / {{ answeredCount }}
          </span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            class="h-2 rounded-full transition-all"
            :style="{ width: scorePct + '%', background: scorePct >= 80 ? '#3B6D11' : scorePct >= 50 ? '#EF9F27' : '#E24B4A' }"
          ></div>
        </div>
        <p v-if="answeredCount > 0" class="mt-1.5 text-xs" :class="scorePct >= 80 ? 'text-success-600' : 'text-warning-600'">
          {{ scorePct >= 80 ? 'Lulus' : 'Perlu Perbaikan' }}
        </p>
        <button
          type="button"
          :disabled="submitting"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="submit"
        >
          {{ submitting ? 'Menyimpan...' : 'Simpan Checklist' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { bbsService, type BbsDriverOption, type BbsTruckOption } from '@/services/bbsService'
import SearchableSelect from '@/components/SearchableSelect.vue'

const emit = defineEmits<{ (e: 'saved', type: string): void }>()

const toast = useToast()
const submitting = ref(false)
const drivers = ref<BbsDriverOption[]>([])
const trucks = ref<BbsTruckOption[]>([])
const truckId = ref('')
const activeChkTab = ref<'mesin' | 'keselamatan' | 'eksterior'>('mesin')

const formatTruckLabel = (truck: BbsTruckOption) => `${truck.no_police} - ${truck.jenis_kendaraan}`

const chkTabs = [
  { key: 'mesin' as const, label: 'Mesin & Bahan Bakar' },
  { key: 'keselamatan' as const, label: 'Keselamatan' },
  { key: 'eksterior' as const, label: 'Eksterior' },
]

const chkOptions = [
  { value: 'safe', label: '✓ OK', activeClass: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' },
  { value: 'unsafe', label: '✗ NOK', activeClass: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400' },
  { value: 'na', label: 'N/A', activeClass: 'border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
]

const chkData: Record<string, { id: string; label: string }[]> = {
  mesin: [
    { id: 'm1', label: 'Level oli mesin cukup' },
    { id: 'm2', label: 'Level air radiator cukup' },
    { id: 'm3', label: 'Bahan bakar cukup untuk rute' },
    { id: 'm4', label: 'Tidak ada kebocoran oli/cairan' },
    { id: 'm5', label: 'Belt / fan belt dalam kondisi baik' },
  ],
  keselamatan: [
    { id: 's1', label: 'Rem utama berfungsi normal' },
    { id: 's2', label: 'Rem tangan berfungsi' },
    { id: 's3', label: 'Semua lampu berfungsi (depan, belakang, sein)' },
    { id: 's4', label: 'APAR tersedia & tidak kadaluarsa' },
    { id: 's5', label: 'Sabuk pengaman berfungsi' },
    { id: 's6', label: 'Klakson berfungsi' },
  ],
  eksterior: [
    { id: 'e1', label: 'Kaca depan bersih & tidak retak' },
    { id: 'e2', label: 'Wiper berfungsi' },
    { id: 'e3', label: 'Tekanan ban sesuai standar' },
    { id: 'e4', label: 'Kondisi ban tidak aus berlebihan' },
    { id: 'e5', label: 'Spion lengkap & dapat diatur' },
  ],
}

const allItemIds = Object.values(chkData).flat().map((i) => i.id)

const checkItems = reactive<Record<string, string>>(
  Object.fromEntries(allItemIds.map((id) => [id, '']))
)

const form = reactive({
  driver_id: '',
  date: new Date().toISOString().slice(0, 10),
})

const currentTabItems = computed(() => chkData[activeChkTab.value])

const allValues = computed(() => allItemIds.map((id) => checkItems[id]))

const safeCount = computed(() => allValues.value.filter((v) => v === 'safe').length)
const answeredCount = computed(() => allValues.value.filter((v) => v !== '').length)
const scorePct = computed(() => answeredCount.value > 0 ? Math.round((safeCount.value / answeredCount.value) * 100) : 0)

function resetForm() {
  form.driver_id = ''
  truckId.value = ''
  form.date = new Date().toISOString().slice(0, 10)
  allItemIds.forEach((id) => { checkItems[id] = '' })
  activeChkTab.value = 'mesin'
}

async function submit() {
  if (!form.driver_id) {
    toast.error('ID Pengemudi wajib diisi')
    return
  }
  if (!truckId.value) {
    toast.error('Plat Kendaraan wajib diisi')
    return
  }

  const selectedTruck = trucks.value.find((t) => t.id_truck === truckId.value)
  const plateNumber = selectedTruck?.no_police || ''

  submitting.value = true
  try {
    await bbsService.createChecklist({
      driver_id: form.driver_id,
      plate_number: plateNumber,
      date: form.date || new Date().toISOString().slice(0, 10),
      items: { ...checkItems },
    })
    toast.success(`Checklist disimpan — ${scorePct.value}% OK`)
    resetForm()
    emit('saved', 'checklist')
  } catch (err: any) {
    toast.error(err?.message || 'Gagal menyimpan checklist')
  } finally {
    submitting.value = false
  }
}

async function fetchOptions() {
  try {
    const [d, t] = await Promise.all([
      bbsService.fetchDrivers(),
      bbsService.fetchTrucks(),
    ])
    drivers.value = d
    trucks.value = t
  } catch {
    drivers.value = []
    trucks.value = []
  }
}

onMounted(() => {
  fetchOptions()
})
</script>
