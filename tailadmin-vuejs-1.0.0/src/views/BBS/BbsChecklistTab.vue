<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">{{ t.chkTitle }}</h4>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ t.chkSub }}</p>

    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblChkDriver }}</label>
          <SearchableSelect
            v-model="form.driver_id"
            :options="drivers"
            value-key="id_driver"
            label-key="nama_driver"
            :search-keys="['nama_driver', 'id_driver']"
            :placeholder="t.placeholderSelectDriver"
            :search-placeholder="t.placeholderSearchDriver"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblChkPlat }}</label>
          <div class="relative" ref="truckDropdownRoot">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition hover:bg-gray-50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              @click="toggleTruckDrop"
            >
              <span class="truncate">{{ selectedTruckLabel || t.placeholderSelectDriver }}</span>
              <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>
            </button>
            <div v-if="truckDropOpen" class="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div class="border-b border-gray-200 p-2 dark:border-gray-700">
                <input
                  ref="truckSearchRef"
                  v-model="truckSearch"
                  type="text"
                  class="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  placeholder="Cari no polisi atau jenis kendaraan"
                  @keydown.escape="truckDropOpen = false"
                />
              </div>
              <ul class="max-h-60 overflow-auto py-1 text-sm text-gray-700 dark:text-gray-200">
                <li v-if="filteredTruckOptions.length === 0" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Data tidak ditemukan</li>
                <li
                  v-for="truck in filteredTruckOptions"
                  :key="truck.id_truck"
                  class="cursor-pointer px-3 py-2 flex items-center justify-between"
                  :class="[
                    checkedPlates.includes(truck.no_police)
                      ? 'bg-success-50 dark:bg-success-500/10'
                      : 'hover:bg-brand-50 dark:hover:bg-brand-500/10',
                    truckId === truck.id_truck ? 'font-semibold' : ''
                  ]"
                  @click="handleTruckSelect(truck)"
                >
                  <span>
                    <span :class="checkedPlates.includes(truck.no_police) ? 'text-success-700 dark:text-success-400' : ''">{{ truck.no_police }}</span>
                    <span class="ml-2 text-xs text-gray-400">{{ truck.jenis_kendaraan }}</span>
                  </span>
                  <span v-if="checkedPlates.includes(truck.no_police)" class="inline-flex items-center gap-1 rounded-md bg-success-100 px-1.5 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-500/20 dark:text-success-400">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Sudah
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-1.5">
        <button
          v-for="tab in chkTabs"
          :key="tab.key"
          type="button"
          :class="[
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border',
            tabComplete[tab.key]
              ? 'bg-success-50 text-success-700 border-success-300 dark:bg-success-500/15 dark:text-success-400 dark:border-success-500/40'
              : activeChkTab === tab.key
                ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-white/10 dark:text-white dark:border-gray-600'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700'
          ]"
          @click="activeChkTab = tab.key"
        >
          <span v-if="tabComplete[tab.key]" class="mr-1">✓</span>{{ tab.label }}
        </button>
      </div>

      <div class="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="item in currentTabItems"
          :key="item.id"
          class="flex items-center gap-3 px-4 py-3"
          :class="emptyMap[item.id] ? 'bg-error-50 dark:bg-error-500/10' : ''"
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
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ t.chkScoreLabel }}</span>
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
          {{ submitting ? t.btnSaving : t.btnSaveChk }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { useBbsLang } from '@/composables/useBbsLang'
import { bbsService, type BbsDriverOption, type BbsTruckOption } from '@/services/bbsService'
import SearchableSelect from '@/components/SearchableSelect.vue'

const emit = defineEmits<{ (e: 'saved', type: string): void }>()

const { t } = useBbsLang()
const toast = useToast()
const submitting = ref(false)
const drivers = ref<BbsDriverOption[]>([])
const trucks = ref<BbsTruckOption[]>([])
const truckId = ref('')
const activeChkTab = ref<'mesin' | 'keselamatan' | 'eksterior'>('mesin')

// Today's checked plates
const checkedPlates = ref<string[]>([])

// Truck dropdown state
const truckDropOpen = ref(false)
const truckSearch = ref('')
const truckSearchRef = ref<HTMLInputElement | null>(null)
const truckDropdownRoot = ref<HTMLElement | null>(null)

const selectedTruckLabel = computed(() => {
  const tr = trucks.value.find((trk) => trk.id_truck === truckId.value)
  return tr ? `${tr.no_police} - ${tr.jenis_kendaraan}` : ''
})

const filteredTruckOptions = computed(() => {
  const q = truckSearch.value.trim().toLowerCase()
  if (!q) return trucks.value
  return trucks.value.filter(
    (trk) => trk.no_police.toLowerCase().includes(q) || trk.jenis_kendaraan.toLowerCase().includes(q)
  )
})

function handleTruckSelect(truck: BbsTruckOption) {
  if (checkedPlates.value.includes(truck.no_police)) {
    toast.error(t.value.toastPlatAlready)
    return
  }
  truckId.value = truck.id_truck
  truckDropOpen.value = false
  truckSearch.value = ''
}

async function toggleTruckDrop() {
  truckDropOpen.value = !truckDropOpen.value
  if (truckDropOpen.value) {
    truckSearch.value = ''
    await nextTick()
    truckSearchRef.value?.focus()
  }
}

function handleTruckClickOutside(event: MouseEvent) {
  if (truckDropdownRoot.value && !truckDropdownRoot.value.contains(event.target as Node)) {
    truckDropOpen.value = false
  }
}

const chkTabs = computed(() => [
  { key: 'mesin' as const, label: t.value.tabMesin },
  { key: 'keselamatan' as const, label: t.value.tabKeselamatan },
  { key: 'eksterior' as const, label: t.value.tabEksterior },
])

const chkOptions = computed(() => [
  { value: 'safe', label: `✓ ${t.value.chkSafe}`, activeClass: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' },
  { value: 'unsafe', label: `✗ ${t.value.chkUnsafe}`, activeClass: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400' },
  { value: 'na', label: t.value.chkNa, activeClass: 'border-gray-300 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
])

const chkData = computed<Record<string, { id: string; label: string }[]>>(() => ({
  mesin: [
    { id: 'm1', label: t.value.m1 },
    { id: 'm2', label: t.value.m2 },
    { id: 'm3', label: t.value.m3 },
    { id: 'm4', label: t.value.m4 },
    { id: 'm5', label: t.value.m5 },
  ],
  keselamatan: [
    { id: 's1', label: t.value.s1 },
    { id: 's2', label: t.value.s2 },
    { id: 's3', label: t.value.s3 },
    { id: 's4', label: t.value.s4 },
    { id: 's5', label: t.value.s5 },
    { id: 's6', label: t.value.s6 },
  ],
  eksterior: [
    { id: 'e1', label: t.value.e1 },
    { id: 'e2', label: t.value.e2 },
    { id: 'e3', label: t.value.e3 },
    { id: 'e4', label: t.value.e4 },
    { id: 'e5', label: t.value.e5 },
  ],
}))

const allItemIds = ['m1','m2','m3','m4','m5','s1','s2','s3','s4','s5','s6','e1','e2','e3','e4','e5']

const checkItems = reactive<Record<string, string>>(
  Object.fromEntries(allItemIds.map((id) => [id, '']))
)

const tabComplete = computed(() => {
  const result: Record<string, boolean> = {}
  for (const [key, items] of Object.entries(chkData.value)) {
    result[key] = items.every((item) => checkItems[item.id] !== '')
  }
  return result
})

const form = reactive({
  driver_id: '',
  date: todayStr(),
})

const currentTabItems = computed(() => chkData.value[activeChkTab.value])

const allValues = computed(() => allItemIds.map((id) => checkItems[id]))

const safeCount = computed(() => allValues.value.filter((v) => v === 'safe').length)
const answeredCount = computed(() => allValues.value.filter((v) => v !== '').length)
const scorePct = computed(() => answeredCount.value > 0 ? Math.round((safeCount.value / answeredCount.value) * 100) : 0)

const emptyMap = computed(() => {
  const map: Record<string, boolean> = {}
  if (submitAttempted.value) {
    allItemIds.forEach((id) => {
      map[id] = checkItems[id] === ''
    })
  }
  return map
})

const submitAttempted = ref(false)

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function resetForm() {
  form.driver_id = ''
  truckId.value = ''
  form.date = todayStr()
  allItemIds.forEach((id) => { checkItems[id] = '' })
  activeChkTab.value = 'mesin'
  submitAttempted.value = false
}

async function submit() {
  submitAttempted.value = true

  if (!form.driver_id) {
    toast.error(t.value.toastDriverRequired)
    return
  }
  if (!truckId.value) {
    toast.error(t.value.toastPlatRequired)
    return
  }

  const selectedTruck = trucks.value.find((trk) => trk.id_truck === truckId.value)
  const plateNumber = selectedTruck?.no_police || ''

  if (checkedPlates.value.includes(plateNumber)) {
    toast.error(t.value.toastPlatAlready)
    return
  }

  const unselected = allItemIds.filter((id) => checkItems[id] === '')
  if (unselected.length > 0) {
    const firstEmpty = unselected[0]
    // Switch tab to where first empty item lives
    for (const [tabKey, items] of Object.entries(chkData.value)) {
      if (items.some((i) => i.id === firstEmpty)) {
        activeChkTab.value = tabKey as 'mesin' | 'keselamatan' | 'eksterior'
        break
      }
    }
    toast.error(t.value.toastAllItemsRequired)
    return
  }

  submitting.value = true
  try {
    await bbsService.createChecklist({
      driver_id: form.driver_id,
      plate_number: plateNumber,
      date: form.date || todayStr(),
      items: { ...checkItems },
    })
    toast.success(t.value.toastChkSaved)
    checkedPlates.value.push(plateNumber)
    resetForm()
    emit('saved', 'checklist')
  } catch (err: any) {
    toast.error(err?.message || t.value.toastError)
  } finally {
    submitting.value = false
  }
}

async function fetchOptions() {
  try {
    const [d, t, plates] = await Promise.all([
      bbsService.fetchDrivers(),
      bbsService.fetchTrucks(),
      bbsService.fetchTodayCheckedPlates(),
    ])
    drivers.value = d
    trucks.value = t
    checkedPlates.value = plates
  } catch {
    drivers.value = []
    trucks.value = []
    checkedPlates.value = []
  }
}

onMounted(() => {
  fetchOptions()
  document.addEventListener('mousedown', handleTruckClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleTruckClickOutside)
})
</script>
