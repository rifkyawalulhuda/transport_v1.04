<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[9999] w-full max-w-sm">
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-3">
      <div
        v-for="toast in toastState.items"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        :class="borderClass(toast.variant)"
        role="status"
        aria-live="polite"
      >
        <span
          class="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full"
          :class="dotClass(toast.variant)"
        ></span>
        <p class="text-sm text-gray-700 dark:text-gray-200">
          {{ toast.message }}
        </p>
        <button
          type="button"
          class="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
          @click="dismiss(toast.id)"
        >
          <span class="sr-only">Close</span>
          <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M4.646 4.646a.75.75 0 0 1 1.061 0L10 8.939l4.293-4.293a.75.75 0 0 1 1.061 1.061L11.061 10l4.293 4.293a.75.75 0 0 1-1.061 1.061L10 11.061l-4.293 4.293a.75.75 0 0 1-1.061-1.061L8.939 10 4.646 5.707a.75.75 0 0 1 0-1.061Z"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { toastState, removeToast } from '@/composables/useToast'

const dismiss = (id: number) => {
  removeToast(id)
}

const borderClass = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'border-l-4 border-emerald-500'
    case 'error':
      return 'border-l-4 border-error-500'
    case 'warning':
      return 'border-l-4 border-amber-500'
    default:
      return 'border-l-4 border-brand-500'
  }
}

const dotClass = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'bg-emerald-500'
    case 'error':
      return 'bg-error-500'
    case 'warning':
      return 'bg-amber-500'
    default:
      return 'bg-brand-500'
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
