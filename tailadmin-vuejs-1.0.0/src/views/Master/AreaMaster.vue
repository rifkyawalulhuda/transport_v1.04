<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Master Area">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              @click="openForm()"
            >
              Tambah Area
            </button>
            <MasterImportActions master-type="area" @imported="handleImported" />
            <SearchBar v-model="search" placeholder="Cari nama area" />
          </div>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total: {{ totalCount }} area
            </p>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">Rows</label>
              <select
                v-model.number="pageSize"
                class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @change="changePageSize"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div
          v-if="showForm && editingId === null"
          class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
        >
          <h3 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
            {{ formTitle }}
          </h3>
          <form class="space-y-4" @submit.prevent="submitForm">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama Area
              </label>
              <input
                v-model="form.nama_area"
                type="text"
                placeholder="Masukan Nama Area"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                required
              />
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                @click="cancelForm"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
        <div
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    No
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Nama Area
                  </th>
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <template v-for="(item, index) in pagedItems" :key="item.id_area">
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.nama_area }}
                    </td>
                    <td class="px-5 py-3 text-center sm:px-6">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          class="rounded-lg bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400"
                          @click="openForm(item)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          :disabled="deletingId === item.id_area"
                          class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-error-500/15 dark:text-error-400"
                          @click="remove(item)"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="showForm && editingId === item.id_area">
                    <td
                      colspan="3"
                      class="bg-gray-50 px-5 py-4 sm:px-6 dark:bg-gray-900/40"
                    >
                      <div
                        class="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
                      >
                        <form class="space-y-4" @submit.prevent="submitForm">
                          <div>
                            <label
                              class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                              Nama Area
                            </label>
                            <input
                              v-model="form.nama_area"
                              type="text"
                              placeholder="Masukan Nama Area"
                              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              required
                            />
                          </div>

                          <div class="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              @click="cancelForm"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              :disabled="isSubmitting"
                              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                            >
                              Simpan
                            </button>
                          </div>
                        </form>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!loading && totalCount === 0">
                  <td
                    colspan="3"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
                <tr v-if="loading">
                  <td
                    colspan="3"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @update:page="setPage"
          />
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { API_BASE } from '@/config/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import MasterImportActions from '@/components/master/MasterImportActions.vue'
import { filterItemsByQuery, useListQuery } from '@/composables/useListQuery'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { authFetch } from '@/services/auth'

type AreaItem = {
  id_area: number
  nama_area: string
}

type FormState = {
  id: number | null
  nama_area: string
}

const currentPageTitle = ref('Master Area')
const items = ref<AreaItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('Tambah Area')
const isSubmitting = ref(false)
const deletingId = ref<number | null>(null)
const form = reactive<FormState>({
  id: null,
  nama_area: ''
})

const apiBase = API_BASE
const { confirm } = useDialog()
const toast = useToast()

const { search, debouncedSearch, currentPage, pageSize, setPage } = useListQuery({
  pageSize: 15,
  debounceMs: 300
})
const pageSizeOptions = [15, 20, 50]

const changePageSize = () => {
  setPage(1)
}

// TODO: Move search + pagination to backend when list endpoints support q/page/limit.
const filteredItems = computed(() =>
  filterItemsByQuery(items.value, debouncedSearch.value, ['nama_area'])
)

const totalCount = computed(() => filteredItems.value.length)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  if (filteredItems.value.length === 0) {
    return 1
  }
  return Math.ceil(filteredItems.value.length / pageSize.value)
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await authFetch(`${apiBase}/areas`)
    const data = await res.json()
    items.value = data
    currentPage.value = 1
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleImported = async () => {
  await loadData()
  setPage(1)
}

const openForm = (item?: AreaItem) => {
  if (item) {
    formTitle.value = 'Edit Area'
    editingId.value = item.id_area
    form.id = item.id_area
    form.nama_area = item.nama_area
  } else {
    formTitle.value = 'Tambah Area'
    editingId.value = null
    form.id = null
    form.nama_area = ''
  }
  showForm.value = true
}

const cancelForm = () => {
  showForm.value = false
  editingId.value = null
}

const submitForm = async () => {
  if (isSubmitting.value) {
    return
  }
  const payload: Record<string, unknown> = {
    nama_area: form.nama_area
  }

  const isUpdate = Boolean(form.id)
  if (isUpdate) {
    const ok = await confirm({
      title: 'Konfirmasi Perubahan',
      message: 'Simpan perubahan pada data ini?',
      confirmText: 'Ya, simpan',
      cancelText: 'Batal',
      variant: 'warning'
    })
    if (!ok) {
      return
    }
  }

  isSubmitting.value = true
  try {
    if (isUpdate) {
      const res = await authFetch(`${apiBase}/areas/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const message = await res.text()
        if (res.status === 400 || res.status === 422) {
          toast.warning('Periksa input Anda')
        } else {
          toast.error(message || 'Gagal menyimpan perubahan.')
        }
        return
      }
      toast.success('Perubahan berhasil disimpan')
    } else {
      const res = await authFetch(`${apiBase}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const message = await res.text()
        if (res.status === 400 || res.status === 422) {
          toast.warning('Periksa input Anda')
        } else {
          toast.error(message || 'Gagal menyimpan data.')
        }
        return
      }
      toast.success('Data berhasil disimpan')
    }
    showForm.value = false
    editingId.value = null
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error(isUpdate ? 'Gagal menyimpan perubahan.' : 'Gagal menyimpan data.')
  } finally {
    isSubmitting.value = false
  }
}

const remove = async (item: AreaItem) => {
  if (deletingId.value) {
    return
  }
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message:
      'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger'
  })
  if (!ok) {
    return
  }
  try {
    deletingId.value = item.id_area
    const res = await authFetch(`${apiBase}/areas/${item.id_area}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      const message = await res.text()
      toast.error(message || 'Gagal menghapus data.')
      return
    }
    toast.success('Data berhasil dihapus')
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Gagal menghapus data.')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadData)
</script>
