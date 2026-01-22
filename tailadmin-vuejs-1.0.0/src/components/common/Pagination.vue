<template>
  <div
    class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 sm:px-6 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400"
  >
    <div>
      Halaman
      <span class="font-medium text-gray-700 dark:text-gray-200">{{ currentPage }}</span>
      dari
      <span class="font-medium text-gray-700 dark:text-gray-200">{{ safeTotalPages }}</span>
    </div>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        Sebelumnya
      </button>
      <div class="flex items-center gap-1">
        <template v-for="(item, index) in paginationItems" :key="item.key ?? index">
          <button
            v-if="item.type === 'page'"
            type="button"
            class="rounded-md border px-3 py-1 text-xs font-medium"
            :class="
              item.value === currentPage
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            "
            @click="goToPage(item.value)"
          >
            {{ item.value }}
          </button>
          <span v-else class="px-2 text-xs text-gray-400">...</span>
        </template>
      </div>
      <button
        type="button"
        class="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        :disabled="currentPage >= safeTotalPages"
        @click="goToPage(currentPage + 1)"
      >
        Berikutnya
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PaginationItem =
  | { type: 'page'; value: number; key: string }
  | { type: 'ellipsis'; key: string }

type Props = {
  currentPage: number
  totalPages: number
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5
})

const emit = defineEmits<{
  (event: 'update:page', value: number): void
}>()

const safeTotalPages = computed(() => Math.max(props.totalPages, 1))

const paginationItems = computed<PaginationItem[]>(() => {
  const total = safeTotalPages.value
  const current = Math.min(Math.max(props.currentPage, 1), total)
  const maxVisible = props.maxVisible

  if (total <= maxVisible + 2) {
    return Array.from({ length: total }, (_, index) => ({
      type: 'page',
      value: index + 1,
      key: `page-${index + 1}`
    }))
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  let end = start + maxVisible - 1

  if (end > total) {
    end = total
    start = end - maxVisible + 1
  }

  const items: PaginationItem[] = []

  if (start > 1) {
    items.push({ type: 'page', value: 1, key: 'page-1' })
    if (start > 2) {
      items.push({ type: 'ellipsis', key: 'ellipsis-start' })
    }
  }

  for (let page = start; page <= end; page += 1) {
    items.push({ type: 'page', value: page, key: `page-${page}` })
  }

  if (end < total) {
    if (end < total - 1) {
      items.push({ type: 'ellipsis', key: 'ellipsis-end' })
    }
    items.push({ type: 'page', value: total, key: `page-${total}` })
  }

  return items
})

const goToPage = (page: number) => {
  const total = safeTotalPages.value
  if (page < 1 || page > total || page === props.currentPage) {
    return
  }
  emit('update:page', page)
}
</script>
