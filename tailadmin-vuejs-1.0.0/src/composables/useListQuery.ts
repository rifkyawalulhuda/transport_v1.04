import { ref, watch } from 'vue'

type ListQueryOptions = {
  pageSize?: number
  debounceMs?: number
}

export const useListQuery = (options: ListQueryOptions = {}) => {
  const search = ref('')
  const debouncedSearch = ref('')
  const currentPage = ref(1)
  const pageSize = ref(options.pageSize ?? 15)
  const debounceMs = options.debounceMs ?? 300

  watch(
    search,
    (value, _, onInvalidate) => {
      currentPage.value = 1
      const handler = window.setTimeout(() => {
        debouncedSearch.value = value.trim()
      }, debounceMs)
      onInvalidate(() => {
        window.clearTimeout(handler)
      })
    }
  )

  const setPage = (page: number) => {
    currentPage.value = page
  }

  const resetSearch = () => {
    search.value = ''
  }

  return {
    search,
    debouncedSearch,
    currentPage,
    pageSize,
    setPage,
    resetSearch
  }
}

export const filterItemsByQuery = <T extends Record<string, unknown>>(
  items: T[],
  query: string,
  keys: Array<keyof T | string>
) => {
  if (!query) {
    return items
  }
  const normalized = query.toLowerCase()
  return items.filter((item) =>
    keys.some((key) => String(item[key as keyof T] ?? '').toLowerCase().includes(normalized))
  )
}
