<template>
  <th
    :class="[
      'px-5 py-3 text-xs font-medium text-gray-500 sm:px-6',
      align === 'center' ? 'text-center' : 'text-left',
    ]"
    :aria-sort="ariaSort"
  >
    <button
      type="button"
      class="inline-flex w-full items-center gap-1.5 rounded text-xs font-medium text-gray-500 transition hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
      :class="align === 'center' ? 'justify-center' : 'justify-start'"
      @click="$emit('sort', sortKey)"
    >
      <span>{{ label }}</span>
      <span class="relative flex h-3.5 w-3.5 shrink-0 flex-col items-center justify-center">
        <svg
          class="absolute h-3.5 w-3.5 transition"
          :class="
            isActive && direction === 'asc'
              ? 'text-brand-600 opacity-100 dark:text-brand-400'
              : 'opacity-35'
          "
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M10 5L6.5 9H13.5L10 5Z" fill="currentColor" />
        </svg>
        <svg
          class="absolute h-3.5 w-3.5 translate-y-1.5 transition"
          :class="
            isActive && direction === 'desc'
              ? 'text-brand-600 opacity-100 dark:text-brand-400'
              : 'opacity-35'
          "
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M10 15L13.5 11H6.5L10 15Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  </th>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SortDirection } from '@/composables/useSortableItems'

const props = withDefaults(
  defineProps<{
    label: string
    sortKey: string
    activeKey: string
    direction: SortDirection
    align?: 'left' | 'center'
  }>(),
  {
    align: 'left',
  },
)

defineEmits<{
  sort: [key: string]
}>()

const isActive = computed(() => props.activeKey === props.sortKey)
const ariaSort = computed(() => {
  if (!isActive.value) {
    return 'none'
  }
  return props.direction === 'asc' ? 'ascending' : 'descending'
})
</script>
