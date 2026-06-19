<template>
  <div>
    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90 mb-1">{{ t.obsTitle }}</h4>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ t.obsSub }}</p>

    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblObserver }}</label>
          <input
            type="text"
            :value="authUser?.nama_admin || ''"
            disabled
            readonly
            class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblDriver }}</label>
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
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblDate }}</label>
          <DatePickerInput
            v-model="form.date"
            :placeholder="t.placeholderDate"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblLocation }}</label>
          <input
            v-model="form.location"
            type="text"
            :placeholder="t.placeholderRoute"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblVehicleType }}</label>
        <select
          v-model="form.vehicle_type"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <option value="">{{ t.placeholderSelect }}</option>
          <option v-for="v in vehicleOptions" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>

      <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">{{ t.obsRatingTitle }}</h5>
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
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblFeedback }}</label>
          <textarea
            v-model="form.feedback"
            rows="3"
            :placeholder="t.placeholderFeedback"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 resize-y"
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">{{ t.lblFollowUp }}</label>
          <select
            v-model="form.follow_up"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">{{ t.placeholderSelect }}</option>
            <option v-for="f in followUpOptions" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
        <button
          type="button"
          :disabled="submitting"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="submit"
        >
          {{ submitting ? t.btnSaving : t.btnSaveObs }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'
import { useBbsLang } from '@/composables/useBbsLang'
import { bbsService, type BbsDriverOption } from '@/services/bbsService'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'

const emit = defineEmits<{ (e: 'saved', type: string): void }>()

const { t } = useBbsLang()
const authUser = useAuthUser()
const toast = useToast()
const submitting = ref(false)
const drivers = ref<BbsDriverOption[]>([])

const vehicleOptions = computed(() => [
  t.value.vehTrukBesar,
  t.value.vehTrukSedang,
  t.value.vehMinibus,
  t.value.vehPickup,
  t.value.vehMotor,
])

const followUpOptions = computed(() => [
  t.value.fuApresiasi,
  t.value.fuCoaching,
  t.value.fuLaporan,
  t.value.fuPelatihan,
])

const ratingOptions = computed(() => [
  { value: 'aman', label: t.value.ratingAman, activeClass: 'border-success-500 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' },
  { value: 'berisiko', label: t.value.ratingBerisiko, activeClass: 'border-warning-500 bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400' },
  { value: 'berbahaya', label: t.value.ratingBerbahaya, activeClass: 'border-error-500 bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400' },
])

const observationItems = computed(() => [
  { id: 'o1', label: t.value.o1, category: t.value.catO1 },
  { id: 'o2', label: t.value.o2, category: t.value.catO2 },
  { id: 'o3', label: t.value.o3, category: t.value.catO3 },
  { id: 'o4', label: t.value.o4, category: t.value.catO4 },
  { id: 'o5', label: t.value.o5, category: t.value.catO5 },
  { id: 'o6', label: t.value.o6, category: t.value.catO6 },
  { id: 'o7', label: t.value.o7, category: t.value.catO7 },
  { id: 'o8', label: t.value.o8, category: t.value.catO8 },
])

const form = reactive({
  driver_id: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  vehicle_type: '',
  feedback: '',
  follow_up: '',
})

const scores = reactive<Record<string, string>>(
  Object.fromEntries(['o1','o2','o3','o4','o5','o6','o7','o8'].map((id) => [id, '']))
)

function resetForm() {
  form.driver_id = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.location = ''
  form.vehicle_type = ''
  form.feedback = ''
  form.follow_up = ''
  ;['o1','o2','o3','o4','o5','o6','o7','o8'].forEach((id) => { scores[id] = '' })
}

async function submit() {
  if (!form.driver_id.trim()) {
    toast.error(t.value.toastDriverRequired)
    return
  }
  if (!form.date) {
    toast.error(t.value.toastDateRequired)
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
    toast.success(t.value.toastObsSaved)
    resetForm()
    emit('saved', 'observasi')
  } catch (err: any) {
    toast.error(err?.message || t.value.toastError)
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
