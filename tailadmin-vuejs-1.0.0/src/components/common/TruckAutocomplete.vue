<template>
  <div class="relative z-20">
    <input class="sr-only" tabindex="-1" aria-hidden="true" :value="selected" :required="required" />
    <Combobox v-model="selected" @update:modelValue="onSelect">
      <div class="relative mt-1">
        <div
          class="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-200 bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <ComboboxInput
            class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 dark:text-white dark:bg-gray-700 h-10"
            :displayValue="(truck) => truck"
            @change="query = $event.target.value"
            :placeholder="placeholder"
          />
          <ComboboxButton
            class="absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <ChevronUpDownIcon
              class="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <TransitionRoot
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          @after-leave="query = ''"
        >
          <ComboboxOptions
            class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50 dark:bg-gray-700"
          >
            <div
              v-if="filteredTrucks.length === 0 && query !== '' && !loading"
              class="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-200"
            >
              Tidak ditemukan.
            </div>
            <div
              v-else-if="loading"
               class="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-200"
            >
              Loading...
            </div>

            <ComboboxOption
              v-for="truck in filteredTrucks"
              as="template"
              :key="truck.no_police"
              :value="truck.no_police"
              v-slot="{ selected, active }"
            >
              <li
                class="relative cursor-default select-none py-2 pl-10 pr-4"
                :class="{
                  'bg-brand-500 text-white': active,
                  'text-gray-900 dark:text-white': !active,
                }"
              >
                <span
                  class="block truncate"
                  :class="{ 'font-medium': selected, 'font-normal': !selected }"
                >
                  {{ truck.no_police }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3"
                  :class="{ 'text-white': active, 'text-brand-600': !active }"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </TransitionRoot>
      </div>
    </Combobox>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import { API_BASE } from '@/config/api'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Cari no polisi...',
  },
  minChars: {
    type: Number,
    default: 2,
  },
})

const emit = defineEmits(['update:modelValue'])

const selected = ref(props.modelValue)
const query = ref('')
const trucks = ref([])
const loading = ref(false)

watch(() => props.modelValue, (newVal) => {
  selected.value = newVal
})

const filteredTrucks = computed(() => {
  return trucks.value
})

const onSelect = (value) => {
  emit('update:modelValue', value)
}

watch(query, async (newQuery) => {
  if (newQuery === '' || newQuery.length < props.minChars) {
    trucks.value = []
    return
  }
  
  loading.value = true
  try {
     const response = await fetch(
      `${API_BASE}/data-trucks/search-mysql-trucks?q=${encodeURIComponent(newQuery)}`
    )
    if (response.ok) {
      trucks.value = await response.json()
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>
