<template>
  <div class="hidden lg:block" ref="searchRef">
    <form @submit.prevent>
      <div class="relative">
        <button
          type="button"
          class="absolute left-4 top-1/2 -translate-y-1/2"
          tabindex="-1"
          aria-hidden="true"
        >
          <svg
            class="fill-gray-500 dark:fill-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </button>
        <input
          v-model="query"
          type="text"
          placeholder="Search or type command..."
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
          @keydown="onKeydown"
          @focus="onFocus"
        />

        <button
          type="button"
          class="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
          tabindex="-1"
          aria-hidden="true"
        >
          <span> Search </span>
          <span> Item </span>
        </button>

        <div
          v-if="isOpen && results.length"
          class="absolute left-0 right-0 mt-2 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <ul class="py-1">
            <li
              v-for="(item, index) in results"
              :key="item.path"
            >
              <button
                type="button"
                class="flex w-full flex-col gap-0.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                :class="index === activeIndex ? 'bg-gray-50 dark:bg-gray-800' : ''"
                @mouseenter="activeIndex = index"
                @click="navigateTo(item)"
              >
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ item.breadcrumb }}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { flattenMenuGroups, getMenuGroups } from '@/config/navigation'

const router = useRouter()
const route = useRoute()
const searchRef = ref(null)
const query = ref('')
const isOpen = ref(false)
const activeIndex = ref(-1)

const user = ref(authService.getUser())
const menuGroups = computed(() => getMenuGroups(user.value?.level))
const routesFlat = computed(() => flattenMenuGroups(menuGroups.value))

const normalizeText = (text) => (text || '').toLowerCase().replace(/\s+/g, ' ').trim()

const normalizedQuery = computed(() => normalizeText(query.value))

const results = computed(() => {
  if (!normalizedQuery.value) {
    return []
  }
  const queryValue = normalizedQuery.value
  const matches = routesFlat.value.filter((item) => {
    const haystack = normalizeText(`${item.name} ${item.parentName || ''} ${item.groupTitle || ''}`)
    return haystack.includes(queryValue)
  })
  return matches.slice(0, 10).map((item) => {
    const groupTitle = item.groupTitle || 'Menu'
    const breadcrumb = item.parentName ? `${groupTitle} / ${item.parentName}` : groupTitle
    return { ...item, breadcrumb }
  })
})

const closeDropdown = () => {
  isOpen.value = false
  activeIndex.value = -1
}

const openDropdown = () => {
  if (results.value.length) {
    isOpen.value = true
  }
}

const navigateTo = async (item) => {
  if (!item?.path) {
    return
  }
  await router.push(item.path)
  query.value = ''
  closeDropdown()
}

const onKeydown = (event) => {
  if (!results.value.length) {
    if (event.key === 'Escape') {
      closeDropdown()
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isOpen.value) {
      isOpen.value = true
    }
    activeIndex.value = (activeIndex.value + 1) % results.value.length
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) {
      isOpen.value = true
    }
    activeIndex.value =
      activeIndex.value <= 0 ? results.value.length - 1 : activeIndex.value - 1
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const index = activeIndex.value >= 0 ? activeIndex.value : 0
    const target = results.value[index]
    if (target) {
      navigateTo(target)
    }
    return
  }

  if (event.key === 'Escape') {
    closeDropdown()
  }
}

const onFocus = () => {
  openDropdown()
}

const handleClickOutside = (event) => {
  if (!searchRef.value) {
    return
  }
  if (!searchRef.value.contains(event.target)) {
    closeDropdown()
  }
}

watch(normalizedQuery, () => {
  if (!normalizedQuery.value) {
    closeDropdown()
    return
  }
  isOpen.value = true
})

watch(results, (newResults) => {
  activeIndex.value = newResults.length ? 0 : -1
})

watch(
  () => route.fullPath,
  () => {
    query.value = ''
    closeDropdown()
  }
)

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>
