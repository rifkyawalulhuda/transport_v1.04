<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="User Profile">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="h-20 w-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
              <img :src="avatarSrc" alt="User" class="h-full w-full object-cover" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {{ displayName }}
              </h3>
              <div class="mt-1 flex items-center gap-2">
                <span
                  class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
                >
                  {{ displayRole }}
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  NIK: {{ displayNik }}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            :disabled="loading"
            @click="openEdit"
          >
            Edit
          </button>
        </div>
        <p v-if="loading" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Memuat data profil...
        </p>
        <p
          v-else-if="errorMessage"
          class="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
        >
          {{ errorMessage }}
        </p>
      </ComponentCard>

      <ComponentCard title="Personal Information">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Nama Lengkap</p>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">
              {{ displayName }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">NIK</p>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ displayNik }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ displayRole }}</p>
          </div>
          <div v-if="displayId">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">ID</p>
            <p class="mt-1 text-sm text-gray-700 dark:text-gray-200">{{ displayId }}</p>
          </div>
        </div>
      </ComponentCard>
    </div>
    <BaseModal :open="isEditOpen" title="Edit Profile" @close="closeEdit">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
            <img :src="previewSrc" alt="Preview" class="h-full w-full object-cover" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Upload Foto</p>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="mt-2 block w-full text-sm text-gray-600 dark:text-gray-300"
              @change="handleFileChange"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Nama Lengkap
          </label>
          <input
            v-model="editName"
            type="text"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>
      </div>
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          @click="closeEdit"
        >
          Batal
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
          :disabled="isSaving"
          @click="saveProfile"
        >
          Simpan
        </button>
      </template>
    </BaseModal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import BaseModal from '@/components/dialogs/BaseModal.vue'
import { API_BASE, API_ORIGIN } from '@/config/api'
import { authFetch, authService, useAuthUser } from '@/services/auth'
import { useToast } from '@/composables/useToast'

type ProfileUser = {
  id_admin: number
  nik_admin: string
  nama_admin: string
  level: string
  gambar: string | null
}

const currentPageTitle = ref('User Profile')
const user = useAuthUser() as unknown as { value: ProfileUser | null }
const loading = ref(false)
const errorMessage = ref('')
const toast = useToast()
const baseUrl = API_ORIGIN
const isEditOpen = ref(false)
const editName = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const isSaving = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const displayName = computed(() => user.value?.nama_admin || '-')
const displayRole = computed(() => user.value?.level || '-')
const displayNik = computed(() => user.value?.nik_admin || '-')
const displayId = computed(() => (user.value?.id_admin ? String(user.value.id_admin) : ''))

const avatarSrc = computed(() => {
  const gambar = user.value?.gambar
  const trimmed = typeof gambar === 'string' ? gambar.trim() : ''
  return trimmed ? `${baseUrl}/img/${trimmed}` : `${baseUrl}/img/default.jpg`
})

const previewSrc = computed(() => previewUrl.value || avatarSrc.value)

const openEdit = () => {
  editName.value = user.value?.nama_admin || ''
  selectedFile.value = null
  previewUrl.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  isEditOpen.value = true
}

const closeEdit = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = ''
  selectedFile.value = null
  isEditOpen.value = false
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0] || null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = file
  previewUrl.value = file ? URL.createObjectURL(file) : ''
}

const saveProfile = async () => {
  if (isSaving.value) {
    return
  }
  const name = editName.value.trim()
  if (!name) {
    toast.warning('Nama wajib diisi')
    return
  }
  isSaving.value = true
  try {
    const formData = new FormData()
    formData.append('nama_admin', name)
    if (selectedFile.value) {
      formData.append('gambar', selectedFile.value)
    }
    const res = await authFetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      body: formData
    })
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memperbarui profil.')
    }
    const data = await res.json()
    if (!data?.user) {
      throw new Error('Gagal memperbarui profil.')
    }
    authService.setUser(data.user)
    toast.success('Profil berhasil diperbarui')
    closeEdit()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui profil.'
    toast.error(message)
  } finally {
    isSaving.value = false
  }
}

const loadProfile = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await authFetch(`${API_BASE}/auth/me`)
    if (!res.ok) {
      const message = await res.text()
      throw new Error(message || 'Gagal memuat profil.')
    }
    const data = await res.json()
    if (!data?.user) {
      throw new Error('Data profil tidak ditemukan.')
    }
    authService.setUser(data.user)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat profil.'
    errorMessage.value = message
    toast.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>
