import { computed, ref, type ComputedRef, type Ref } from 'vue'

export type SortDirection = 'asc' | 'desc'
export type SortAccessors<T> = Record<string, (item: T) => unknown>

const collator = new Intl.Collator('id-ID', {
  numeric: true,
  sensitivity: 'base',
})

const normalizeSortValue = (value: unknown): string | number => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }
  if (value instanceof Date) {
    return value.getTime()
  }
  return String(value).trim()
}

export const useSortableItems = <T extends object>(
  source: Ref<T[]> | ComputedRef<T[]>,
  initialKey: string,
  accessors: SortAccessors<T> = {},
) => {
  const sortKey = ref(initialKey)
  const sortDirection = ref<SortDirection>('asc')

  const setSort = (key: string) => {
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      return
    }
    sortKey.value = key
    sortDirection.value = 'asc'
  }

  const getValue = (item: T, key: string) =>
    normalizeSortValue(
      accessors[key] ? accessors[key](item) : (item as Record<string, unknown>)[key],
    )

  const sortedItems = computed(() => {
    const direction = sortDirection.value === 'asc' ? 1 : -1

    return [...source.value].sort((left, right) => {
      const leftValue = getValue(left, sortKey.value)
      const rightValue = getValue(right, sortKey.value)

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction
      }

      return collator.compare(String(leftValue), String(rightValue)) * direction
    })
  })

  return {
    sortKey,
    sortDirection,
    setSort,
    sortedItems,
  }
}
