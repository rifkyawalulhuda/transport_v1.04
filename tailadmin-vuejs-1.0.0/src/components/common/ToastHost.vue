<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-5 right-5 z-[9999] w-full max-w-sm">
      <TransitionGroup name="toast" tag="div" class="flex flex-col-reverse gap-3">
        <div
          v-for="toast in toastState.items"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl dark:bg-gray-900"
          :class="containerClass(toast.variant)"
          role="status"
          aria-live="polite"
        >
          <!-- Icon -->
          <div
            class="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
            :class="iconBgClass(toast.variant)"
          >
            <!-- Success -->
            <svg v-if="toast.variant === 'success'" class="h-4 w-4 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <!-- Error -->
            <svg v-else-if="toast.variant === 'error'" class="h-4 w-4 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <!-- Warning -->
            <svg v-else-if="toast.variant === 'warning'" class="h-4 w-4 text-warning-600 dark:text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-2.97L13.73 4.99c-.77-1.33-2.69-1.33-3.46 0L3.34 16.03c-.77 1.3.19 2.97 1.73 2.97z" />
            </svg>
            <!-- Info -->
            <svg v-else class="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pt-0.5">
            <p class="text-xs font-semibold" :class="titleClass(toast.variant)">{{ titleText(toast.variant) }}</p>
            <p class="mt-0.5 text-sm text-gray-600 dark:text-gray-300 leading-snug">{{ toast.message }}</p>
          </div>

          <!-- Close -->
          <button
            type="button"
            class="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
            @click="dismiss(toast.id)"
            aria-label="Tutup notifikasi"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { toastState, removeToast } from '@/composables/useToast'

const dismiss = (id: number) => {
  removeToast(id)
}

const containerClass = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'border-success-200 dark:border-success-500/30'
    case 'error':
      return 'border-error-200 dark:border-error-500/30'
    case 'warning':
      return 'border-warning-200 dark:border-warning-500/30'
    default:
      return 'border-brand-200 dark:border-brand-500/30'
  }
}

const iconBgClass = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'bg-success-50 dark:bg-success-500/15'
    case 'error':
      return 'bg-error-50 dark:bg-error-500/15'
    case 'warning':
      return 'bg-warning-50 dark:bg-warning-500/15'
    default:
      return 'bg-brand-50 dark:bg-brand-500/15'
  }
}

const titleClass = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'text-success-700 dark:text-success-400'
    case 'error':
      return 'text-error-700 dark:text-error-400'
    case 'warning':
      return 'text-warning-700 dark:text-orange-400'
    default:
      return 'text-brand-700 dark:text-brand-400'
  }
}

const titleText = (variant: string) => {
  switch (variant) {
    case 'success':
      return 'Berhasil'
    case 'error':
      return 'Gagal'
    case 'warning':
      return 'Perhatian'
    default:
      return 'Info'
  }
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}
</style>
