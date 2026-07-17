<template>
  <div class="relative">
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
      :type="enableTime ? 'datetime-local' : 'date'"
      class="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
      tabindex="-1"
      :value="pickerValue"
      :required="required"
      :disabled="disabled"
      @input="onDateInput"
      @change="onDateInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

const dateRef = ref<HTMLInputElement | null>(null)
const textValue = ref('')

// datetime-local input requires "YYYY-MM-DDTHH:MM" format (with T separator)
const pickerValue = computed(() => {
  if (!props.enableTime) return props.modelValue
  if (!props.modelValue) return ''
  // Convert "YYYY-MM-DD HH:MM" or "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM"
  return props.modelValue.slice(0, 16).replace(' ', 'T')
})

const formatDisplayDate = (value: string) => {
  if (!value) return ''
  if (props.enableTime) {
    // Display as "DD/MM/YYYY HH:MM"
    const normalized = value.slice(0, 16).replace('T', ' ')
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
    if (!match) return ''
    return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`
  }
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

const displayValue = computed(() => formatDisplayDate(props.modelValue))

const parseUserInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (props.enableTime) {
    // Accept "DD/MM/YYYY HH:MM" or "YYYY-MM-DD HH:MM"
    const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/)
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]} ${slashMatch[4]}:${slashMatch[5]}`
    }
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]} ${isoMatch[4]}:${isoMatch[5]}`
    }
    return null
  }

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
  const val = target.value // "YYYY-MM-DDTHH:MM" from datetime-local
  if (!val) {
    emit('update:modelValue', '')
    return
  }
  if (props.enableTime) {
    // Normalize to "YYYY-MM-DD HH:MM" (space separator, no seconds)
    emit('update:modelValue', val.slice(0, 16).replace('T', ' '))
  } else {
    emit('update:modelValue', val)
  }
}

watch(
  () => props.modelValue,
  (value) => {
    textValue.value = formatDisplayDate(value)
  },
  { immediate: true }
)
</script>
