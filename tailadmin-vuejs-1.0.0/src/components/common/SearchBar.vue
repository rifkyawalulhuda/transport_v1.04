<template>
  <div class="flex w-full items-center gap-2 sm:w-auto">
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:w-64"
      @input="onInput"
    />
    <button
      v-if="modelValue"
      type="button"
      class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
      @click="clear"
    >
      Reset
    </button>
  </div>
</template>

<script setup lang="ts">
type Props = {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Cari data...',
  disabled: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const clear = () => {
  emit('update:modelValue', '')
}
</script>
