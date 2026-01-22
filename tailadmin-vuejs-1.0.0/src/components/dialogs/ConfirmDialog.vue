<template>
  <BaseModal :open="open" :title="title" :variant="variant" @close="emit('cancel')">
    <p class="whitespace-pre-line">{{ message }}</p>
    <template #actions>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
        @click="emit('cancel')"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
        :class="confirmClass"
        @click="emit('confirm')"
      >
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '@/components/dialogs/BaseModal.vue'

type Props = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'info' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  confirmText: 'OK',
  cancelText: 'Batal',
  variant: 'warning'
})

const emit = defineEmits<{
  (event: 'confirm'): void
  (event: 'cancel'): void
}>()

const confirmClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-error-500 hover:bg-error-600 focus:ring-error-500'
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'
    case 'success':
      return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500'
    default:
      return 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-500'
  }
})
</script>
