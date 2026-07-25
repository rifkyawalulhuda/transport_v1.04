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

    <!-- Datetime mode: VueDatePicker with teleport for proper viewport positioning -->
    <template v-else>
      <VueDatePicker
        :model-value="dpValue"
        :disabled="disabled"
        :placeholder="placeholder"
        :enable-time-picker="true"
        :time-picker-inline="false"
        :is-24="true"
        :minutes-increment="5"
        :minutes-grid-increment="5"
        locale="id"
        :format="formatDisplay"
        teleport="body"
        :teleport-center="false"
        auto-apply
        :clearable="false"
        hide-input-icon
        :input-class-name="inputClass"
        @update:model-value="onDpChange"
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

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

// Format "YYYY-MM-DD" → display "DD/MM/YYYY"
const textValue = computed(() => {
  const v = props.modelValue
  if (!v) return ''
  const match = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return v
})

function openPicker() {
  dateRef.value?.showPicker?.()
  dateRef.value?.click()
}

function onDateInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:modelValue', v || '')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    openPicker()
  }
}

function onTextInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  // Accept DD/MM/YYYY or YYYY-MM-DD
  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (slash) {
    emit('update:modelValue', `${slash[3]}-${slash[2]}-${slash[1]}`)
    return
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    emit('update:modelValue', raw)
  }
}

function onTextBlur(e: FocusEvent) {
  // Re-emit to normalize value on blur
  const raw = (e.target as HTMLInputElement).value
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const dd = slash[1].padStart(2, '0')
    const mm = slash[2].padStart(2, '0')
    emit('update:modelValue', `${slash[3]}-${mm}-${dd}`)
  }
}

// ─── Datetime mode (VueDatePicker) ────────────────────────────────────────────

const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'

// Convert "YYYY-MM-DD HH:MM" string → Date object for VueDatePicker
const dpValue = computed<Date | null>(() => {
  const v = props.modelValue
  if (!v) return null
  const match = v.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]))
})

// Format Date → "YYYY-MM-DD HH:MM" for display in the input
function formatDisplay(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

// VueDatePicker emits Date | null
function onDpChange(value: Date | null) {
  if (!value) {
    emit('update:modelValue', '')
    return
  }
  const yyyy = value.getFullYear()
  const mm = String(value.getMonth() + 1).padStart(2, '0')
  const dd = String(value.getDate()).padStart(2, '0')
  const hh = String(value.getHours()).padStart(2, '0')
  const mi = String(value.getMinutes()).padStart(2, '0')
  emit('update:modelValue', `${yyyy}-${mm}-${dd} ${hh}:${mi}`)
}
</script>

<style>
/* Override VueDatePicker to match project design system */
.dp__theme_light {
  --dp-background-color: #ffffff;
  --dp-text-color: #374151;
  --dp-hover-color: #f9fafb;
  --dp-hover-text-color: #374151;
  --dp-hover-icon-color: #374151;
  --dp-primary-color: #465fff;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #f3f4f6;
  --dp-border-color: #e5e7eb;
  --dp-menu-border-color: #e5e7eb;
  --dp-border-color-hover: #465fff;
  --dp-disabled-color: #e5e7eb;
  --dp-input-icon-padding: 2rem;
  --dp-font-size: 0.875rem;
  --dp-border-radius: 0.75rem;
}
.dp__theme_dark {
  --dp-background-color: #111827;
  --dp-text-color: #e5e7eb;
  --dp-hover-color: #1f2937;
  --dp-hover-text-color: #e5e7eb;
  --dp-primary-color: #465fff;
  --dp-primary-text-color: #ffffff;
  --dp-secondary-color: #1f2937;
  --dp-border-color: #374151;
  --dp-menu-border-color: #374151;
  --dp-disabled-color: #374151;
  --dp-font-size: 0.875rem;
  --dp-border-radius: 0.75rem;
}
/* Hide the default VueDatePicker input icon since we have our own */
.dp__input_icon {
  display: none !important;
}
/* Remove default right padding for icon since we use our own */
.dp__input {
  padding-right: 2.25rem !important;
}
</style>
