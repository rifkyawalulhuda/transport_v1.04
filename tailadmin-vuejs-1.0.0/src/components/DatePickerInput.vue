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
      type="date"
      class="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
      tabindex="-1"
      :value="modelValue"
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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Pilih tanggal',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const dateRef = ref<HTMLInputElement | null>(null)
const textValue = ref('')

const formatDisplayDate = (value: string) => {
  if (!value) {
    return ''
  }
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return ''
  }
  return `${day}/${month}/${year}`
}

const displayValue = computed(() => formatDisplayDate(props.modelValue))

const parseUserInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    return isValidIsoDate(iso) ? iso : null
  }
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return null
  }
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  return isValidIsoDate(iso) ? iso : null
}

const isValidIsoDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return false
  }
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
  if (props.disabled) {
    return
  }
  const input = dateRef.value
  if (!input) {
    return
  }
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
  if (parsed === null) {
    return
  }
  emit('update:modelValue', parsed)
}

const onTextBlur = () => {
  textValue.value = displayValue.value
}

const onDateInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

watch(
  () => props.modelValue,
  (value) => {
    textValue.value = formatDisplayDate(value)
  },
  { immediate: true }
)
</script>
