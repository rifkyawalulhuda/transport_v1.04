<template>
  <div class="relative" ref="wrapperRef">
    <textarea
      v-model="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      rows="2"
      class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:disabled:bg-gray-800"
      @input="handleInput"
      @focus="handleFocus"
      @keydown="handleKeydown"
    ></textarea>
    <div
      v-if="dropdownOpen && suggestions.length"
      class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <ul class="max-h-60 overflow-y-auto py-1">
        <li
          v-for="(item, index) in suggestions"
          :key="item._id"
          :class="[
            'cursor-pointer px-3 py-2',
            index === highlightedIndex
              ? 'bg-gray-50 text-gray-900 dark:bg-white/[0.03] dark:text-gray-100'
              : 'text-gray-700 dark:text-gray-200'
          ]"
          @mousedown.prevent="selectSuggestion(item)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="item.label"
              class="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
            >
              {{ item.label }}
            </span>
          </div>
          <div
            class="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-200"
            style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
          >
            {{ item.address }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { addressBookService } from '@/services/addressBookService'

type AddressItem = {
  _id: string
  label?: string
  address: string
  usageCount?: number
}

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'selected', 'manual'])

const wrapperRef = ref<HTMLElement | null>(null)
const inputValue = ref(props.modelValue)
const suggestions = ref<AddressItem[]>([])
const dropdownOpen = ref(false)
const highlightedIndex = ref(-1)
const debounceId = ref<number | null>(null)
const abortController = ref<AbortController | null>(null)

const closeDropdown = () => {
  dropdownOpen.value = false
  highlightedIndex.value = -1
}

const handleDocumentClick = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

const fetchSuggestions = async (query: string, limit = 10) => {
  if (props.disabled) {
    suggestions.value = []
    dropdownOpen.value = false
    return
  }
  if (abortController.value) {
    abortController.value.abort()
  }
  abortController.value = new AbortController()

  try {
    const data = await addressBookService.suggest(query, {
      limit,
      signal: abortController.value.signal
    })
    suggestions.value = Array.isArray(data.items) ? data.items : []
    dropdownOpen.value = suggestions.value.length > 0
    highlightedIndex.value = suggestions.value.length > 0 ? 0 : -1
  } catch (error: unknown) {
    const err = error as { name?: string }
    if (err?.name === 'AbortError') {
      return
    }
    suggestions.value = []
    dropdownOpen.value = false
  }
}

const scheduleFetch = (query: string, limit = 10) => {
  if (debounceId.value) {
    window.clearTimeout(debounceId.value)
  }
  debounceId.value = window.setTimeout(() => {
    fetchSuggestions(query, limit)
  }, 300)
}

const handleInput = () => {
  emit('update:modelValue', inputValue.value)
  emit('manual', inputValue.value)
  if (inputValue.value.trim().length < 2) {
    suggestions.value = []
    dropdownOpen.value = false
    return
  }
  scheduleFetch(inputValue.value, 20)
}

const handleFocus = () => {
  if (inputValue.value.trim().length === 0) {
    scheduleFetch('', 5)
    return
  }
  if (inputValue.value.trim().length >= 2) {
    scheduleFetch(inputValue.value, 20)
  }
}

const selectSuggestion = (item: AddressItem) => {
  inputValue.value = item.address || ''
  emit('update:modelValue', inputValue.value)
  emit('selected', item)
  closeDropdown()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!dropdownOpen.value || suggestions.value.length === 0) {
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value =
      highlightedIndex.value < suggestions.value.length - 1
        ? highlightedIndex.value + 1
        : 0
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value =
      highlightedIndex.value > 0 ? highlightedIndex.value - 1 : suggestions.value.length - 1
  } else if (event.key === 'Enter') {
    if (highlightedIndex.value >= 0) {
      event.preventDefault()
      selectSuggestion(suggestions.value[highlightedIndex.value])
    }
  } else if (event.key === 'Escape') {
    closeDropdown()
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== inputValue.value) {
      inputValue.value = value || ''
    }
  }
)

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (debounceId.value) {
    window.clearTimeout(debounceId.value)
  }
  if (abortController.value) {
    abortController.value.abort()
  }
})
</script>
