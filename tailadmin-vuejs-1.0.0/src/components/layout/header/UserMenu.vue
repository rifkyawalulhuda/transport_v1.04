<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11">
        <img :src="avatarUrl" alt="User" @error="handleAvatarError" />
      </span>

      <span class="block mr-1 font-medium text-theme-sm">{{ displayName }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2x1 border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ displayName }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ displayRole }}
        </span>
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <component
            :is="isExternalLink(item.href) ? 'a' : 'router-link'"
            :to="isExternalLink(item.href) ? undefined : item.href"
            :href="isExternalLink(item.href) ? item.href : undefined"
            :target="isExternalLink(item.href) ? '_blank' : undefined"
            :rel="isExternalLink(item.href) ? 'noopener' : undefined"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </component>
        </li>
      </ul>
    <button
      type="button"
      @click="openLogoutConfirm"
      class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
    >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Logout
      </button>
    </div>
    <!-- Dropdown End -->
  </div>
  <ConfirmDialog
    v-if="showLogoutConfirm"
    :open="showLogoutConfirm"
    title="Konfirmasi Logout"
    message="Apakah Anda yakin ingin logout?"
    confirm-text="Ya, logout"
    cancel-text="Batal"
    variant="danger"
    @confirm="confirmLogout"
    @cancel="closeLogoutConfirm"
  />

</template>

<script setup lang="ts">
import { API_ORIGIN } from '@/config/api'
import { ChevronDownIcon, InfoCircleIcon, LogoutIcon, SettingsIcon, UserCircleIcon } from '@/icons'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue'
import { authService, useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const router = useRouter()
const user = useAuthUser()
const baseUrl = API_ORIGIN
const avatarFallback = ref(false)
const showLogoutConfirm = ref(false)
const toast = useToast()

const displayName = computed(() => user.value?.nama_admin || 'User')
const displayRole = computed(() => user.value?.level || '')
const avatarUrl = computed(() => {
  if (avatarFallback.value) {
    return `${baseUrl}/img/default.jpg`
  }
  const gambar = user.value?.gambar
  const trimmed = typeof gambar === 'string' ? gambar.trim() : ''
  return trimmed ? `${baseUrl}/img/${trimmed}` : `${baseUrl}/img/default.jpg`
})

const menuItems = [
  { href: '/profile', icon: UserCircleIcon, text: 'Edit profile' },
  { href: '', icon: SettingsIcon, text: 'Account settings' },
  { href: 'http://192.168.1.7:5174/', icon: InfoCircleIcon, text: 'Support' },
]

const isExternalLink = (href: string) => /^https?:\/\//i.test(href)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const openLogoutConfirm = () => {
  closeDropdown()
  showLogoutConfirm.value = true
}

const closeLogoutConfirm = () => {
  showLogoutConfirm.value = false
}

const confirmLogout = async () => {
  showLogoutConfirm.value = false
  authService.logout()
  toast.success('Berhasil logout')
  await router.push('/login')
}

const handleAvatarError = (event: Event) => {
  const target = event.target as HTMLImageElement | null
  if (!target) {
    return
  }
  const fallback = `${baseUrl}/img/default.jpg`
  if (target.src !== fallback) {
    avatarFallback.value = true
    target.src = fallback
  }
}

watch(
  () => user.value?.gambar,
  () => {
    avatarFallback.value = false
  }
)

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
