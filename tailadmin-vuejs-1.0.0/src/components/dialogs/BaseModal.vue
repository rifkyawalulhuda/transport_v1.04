<template>
  <Modal v-if="open" :full-screen-backdrop="true" @close="handleClose">
    <template #body>
      <div
        class="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex items-start justify-between gap-4">
          <h3 class="text-lg font-semibold" :class="titleClass">
            {{ title }}
          </h3>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
            @click="handleClose"
          >
            <span class="sr-only">Close</span>
            <svg
              class="h-4 w-4 fill-current"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.646 4.646a.75.75 0 0 1 1.061 0L10 8.939l4.293-4.293a.75.75 0 0 1 1.061 1.061L11.061 10l4.293 4.293a.75.75 0 0 1-1.061 1.061L10 11.061l-4.293 4.293a.75.75 0 0 1-1.061-1.061L8.939 10 4.646 5.707a.75.75 0 0 1 0-1.061Z"
              />
            </svg>
          </button>
        </div>
        <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          <slot />
        </div>
        <div class="mt-6 flex items-center justify-end gap-2">
          <slot name="actions" />
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'

type Props = {
  open: boolean
  title: string
  variant?: 'info' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  variant: 'info'
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

const handleClose = () => emit('close')

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    handleClose()
  }
}

watch(
  () => props.open,
  (value) => {
    if (value) {
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const titleClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-emerald-600 dark:text-emerald-300'
    case 'warning':
      return 'text-amber-600 dark:text-amber-300'
    case 'danger':
      return 'text-error-600 dark:text-error-300'
    default:
      return 'text-gray-800 dark:text-white/90'
  }
})
</script>
