<template>
  <div ref="rootRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition hover:bg-gray-50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      :disabled="disabled"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="truncate">
        {{ selectedLabel || placeholder }}
      </span>
      <svg
        class="h-4 w-4 text-gray-400"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="border-b border-gray-200 p-2 dark:border-gray-700">
        <input
          ref="searchRef"
          v-model="search"
          type="text"
          class="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          :placeholder="searchPlaceholder"
          @keydown="onSearchKeydown"
        />
      </div>
      <ul
        :id="listboxId"
        role="listbox"
        class="max-h-60 overflow-auto py-1 text-sm text-gray-700 dark:text-gray-200"
      >
        <li
          v-if="isSearching"
          class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
        >
          Memuat data...
        </li>
        <li
          v-else-if="filteredOptions.length === 0"
          class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
        >
          Data tidak ditemukan
        </li>
        <li
          v-for="(option, index) in filteredOptions"
          :key="getOptionKey(option, index)"
          role="option"
          class="cursor-pointer px-3 py-2"
          :class="{
            'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200':
              index === activeIndex,
            'font-semibold': isSelected(option)
          }"
          @mousemove="setActiveIndex(index)"
          @click="selectOption(option)"
        >
          {{ getOptionLabel(option) }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type OptionItem = Record<string, unknown>

type Props = {
  modelValue: string
  options: OptionItem[]
  valueKey: string
  labelKey?: string
  labelFormatter?: (option: OptionItem) => string
  searchKeys?: string[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  asyncSearch?: (query: string) => Promise<OptionItem[]>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  labelKey: 'label',
  placeholder: '-Pilih-',
  searchPlaceholder: 'Cari data...',
  disabled: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const search = ref('')
const debouncedQuery = ref('')
const activeIndex = ref(-1)
const isSearching = ref(false)
const asyncOptions = ref<OptionItem[]>([])
const listboxId = `searchable-list-${Math.random().toString(36).slice(2, 9)}`

const normalizeValue = (value: unknown) => (value === null || value === undefined ? '' : String(value))

const getOptionValue = (option: OptionItem) => normalizeValue(option[props.valueKey])

const getOptionLabel = (option: OptionItem) => {
  if (props.labelFormatter) {
    return props.labelFormatter(option)
  }
  const key = props.labelKey || 'label'
  const value = option[key]
  return value === null || value === undefined ? '' : String(value)
}

const getOptionSearchText = (option: OptionItem) => {
  const keys = props.searchKeys && props.searchKeys.length > 0 ? props.searchKeys : [props.labelKey || 'label']
  return keys
    .map((key) => {
      const value = option[key]
      return value === null || value === undefined ? '' : String(value)
    })
    .join(' ')
}

const getOptionKey = (option: OptionItem, index: number) => {
  const value = getOptionValue(option)
  return value ? `option-${value}` : `option-index-${index}`
}

const baseOptions = computed(() => (props.asyncSearch ? asyncOptions.value : props.options))

const filteredOptions = computed(() => {
  if (props.asyncSearch) {
    return baseOptions.value
  }
  const query = debouncedQuery.value.trim().toLowerCase()
  if (!query) {
    return baseOptions.value
  }
  return baseOptions.value.filter((option) => getOptionSearchText(option).toLowerCase().includes(query))
})

const selectedLabel = computed(() => {
  const selected = baseOptions.value.find(
    (option) => getOptionValue(option) === normalizeValue(props.modelValue)
  )
  return selected ? getOptionLabel(selected) : ''
})

const setActiveIndex = (index: number) => {
  activeIndex.value = index
}

const setActiveIndexFromSelection = () => {
  if (filteredOptions.value.length === 0) {
    activeIndex.value = -1
    return
  }
  const index = filteredOptions.value.findIndex(
    (option) => getOptionValue(option) === normalizeValue(props.modelValue)
  )
  activeIndex.value = index >= 0 ? index : 0
}

const open = async () => {
  if (props.disabled) {
    return
  }
  isOpen.value = true
  search.value = ''
  debouncedQuery.value = ''
  setActiveIndexFromSelection()
  await nextTick()
  searchRef.value?.focus()
  if (props.asyncSearch) {
    isSearching.value = true
    try {
      const result = await props.asyncSearch('')
      asyncOptions.value = Array.isArray(result) ? result : []
    } catch (error) {
      console.error(error)
      asyncOptions.value = []
    } finally {
      isSearching.value = false
      setActiveIndexFromSelection()
    }
  }
}

const close = () => {
  isOpen.value = false
  activeIndex.value = -1
}

const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

const isSelected = (option: OptionItem) =>
  getOptionValue(option) === normalizeValue(props.modelValue)

const selectOption = (option: OptionItem) => {
  emit('update:modelValue', getOptionValue(option))
  close()
  nextTick(() => {
    triggerRef.value?.focus()
  })
}

const moveActive = (direction: number) => {
  if (filteredOptions.value.length === 0) {
    return
  }
  let nextIndex = activeIndex.value + direction
  if (nextIndex < 0) {
    nextIndex = filteredOptions.value.length - 1
  }
  if (nextIndex >= filteredOptions.value.length) {
    nextIndex = 0
  }
  activeIndex.value = nextIndex
}

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isOpen.value) {
      open()
    } else {
      moveActive(1)
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) {
      open()
    } else {
      moveActive(-1)
    }
  } else if (event.key === 'Enter') {
    if (!isOpen.value) {
      event.preventDefault()
      open()
      return
    }
    if (activeIndex.value >= 0) {
      event.preventDefault()
      const option = filteredOptions.value[activeIndex.value]
      if (option) {
        selectOption(option)
      }
    }
  } else if (event.key === 'Escape') {
    if (isOpen.value) {
      event.preventDefault()
      close()
    }
  }
}

const onSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (activeIndex.value >= 0) {
      const option = filteredOptions.value[activeIndex.value]
      if (option) {
        selectOption(option)
      }
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
    nextTick(() => {
      triggerRef.value?.focus()
    })
  }
}

let debounceHandle: number | undefined
watch(search, (value) => {
  window.clearTimeout(debounceHandle)
  debounceHandle = window.setTimeout(() => {
    debouncedQuery.value = value
  }, 300)
})

watch(
  () => props.options,
  (value) => {
    if (!props.asyncSearch || !debouncedQuery.value) {
      asyncOptions.value = value
    }
  },
  { immediate: true }
)

watch(
  debouncedQuery,
  async (value) => {
    if (!props.asyncSearch) {
      return
    }
    // TODO: Provide asyncSearch prop for remote filtering when options are large.
    isSearching.value = true
    try {
      const result = await props.asyncSearch(value)
      asyncOptions.value = Array.isArray(result) ? result : []
    } catch (error) {
      console.error(error)
      asyncOptions.value = []
    } finally {
      isSearching.value = false
      setActiveIndexFromSelection()
    }
  },
  { flush: 'post' }
)

watch([filteredOptions, isOpen], () => {
  if (isOpen.value) {
    setActiveIndexFromSelection()
  }
})

const handleClickOutside = (event: MouseEvent) => {
  if (!rootRef.value) {
    return
  }
  if (!rootRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>
