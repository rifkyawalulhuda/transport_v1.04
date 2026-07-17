<template>
  <div class="relative">
    <!-- Date-only mode: native date input with text display overlay -->
    <template v-if="!enableTime">
      <input
        type="text"
        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        :value="textValue"
        :placeholder="placeholder"
        :disabled="disabled"
        inputmode="numeric"
        @click="openPicker"
        @keydown="onKeydown"
        @input="onTextInput"
        @blur="onTextBlur"
      />
      <input
        ref="dateRef"
        type="date"
        class="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
        tabindex="-1"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        @input="onDateInput"
        @change="onDateInput"
      />
    </template>

    <!-- Datetime mode: Flatpickr for superior UX -->
    <template v-else>
      <div class="relative">
        <flat-pickr
          :model-value="flatpickrValue"
          :config="flatpickrConfig"
          :disabled="disabled"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          :placeholder="placeholder"
          @update:model-value="onFlatpickrChange"
        />
        <!-- Calendar icon -->
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            class="h-4 w-4 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FlatPickr from 'vue-flatpickr-component'
import { Indonesian } from 'flatpickr/dist/l10n/id'

type Props = {
  modelValue: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  enableTime?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Pilih tanggal',
  required: false,
  disabled: false,
  enableTime: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

// ─── Date-only mode ───────────────────────────────────────────────────────────

const dateRef = ref<HTMLInputElement | null>(null)
const textValue = ref('')

const formatDisplayDate = (value: string) => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

const displayValue = computed(() => formatDisplayDate(props.modelValue))

const parseUserInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    return isValidIsoDate(iso) ? iso : null
  }
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return isValidIsoDate(iso) ? iso : null
}

const isValidIsoDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  )
}

const openPicker = () => {
  if (props.disabled) return
  const input = dateRef.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }
  input.focus()
  input.click()
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openPicker()
  }
}

const onTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  textValue.value = target.value
  const parsed = parseUserInput(target.value)
  if (parsed === null) return
  emit('update:modelValue', parsed)
}

const onTextBlur = () => {
  textValue.value = displayValue.value
}

const onDateInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const val = target.value
  if (!val) {
    emit('update:modelValue', '')
    return
  }
  emit('update:modelValue', val)
}

watch(
  () => props.modelValue,
  (value) => {
    if (!props.enableTime) {
      textValue.value = formatDisplayDate(value)
    }
  },
  { immediate: true }
)

// ─── Datetime mode (Flatpickr) ────────────────────────────────────────────────

// Flatpickr needs "YYYY-MM-DD HH:MM" format — same as our internal format
const flatpickrValue = computed(() => props.modelValue || '')

const flatpickrConfig = {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',       // internal value format: "YYYY-MM-DD HH:MM"
  altInput: false,
  time_24hr: true,
  locale: Indonesian,
  minuteIncrement: 5,             // 5-minute steps for easier selection
  allowInput: true,               // allow manual typing
  disableMobile: false,
  theme: 'light',
  // Nice UX: show month/year dropdowns
  showMonths: 1,
}

const onFlatpickrChange = (value: string) => {
  if (!value) {
    emit('update:modelValue', '')
    return
  }
  // Flatpickr returns "YYYY-MM-DD HH:MM" — normalize to remove seconds if present
  const normalized = String(value).slice(0, 16)
  emit('update:modelValue', normalized)
}
</script>


