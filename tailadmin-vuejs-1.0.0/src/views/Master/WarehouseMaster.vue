<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Master Warehouse">
        <div class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              @click="openForm()"
            >
              Tambah Warehouse
            </button>
            <MasterImportActions master-type="warehouse" @imported="handleImported" />
            <SearchBar v-model="search" placeholder="Cari kode / nama / PIC" />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Total: {{ totalCount }} warehouse
          </p>
        </div>
        <div
          v-if="showForm && editingId === null"
          class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
        >
          <h3 class="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
            {{ formTitle }}
          </h3>
          <form class="space-y-4" @submit.prevent="submitForm">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Kode Warehouse
                </label>
                <input
                  v-model="form.kode_warehouse"
                  type="text"
                  placeholder="Masukan Kode Inisial Warehouse"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nama Warehouse
                </label>
                <input
                  v-model="form.nm_warehouse"
                  type="text"
                  placeholder="Masukan Nama Warehouse"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  PIC
                </label>
                <input
                  v-model="form.pic_warehouse"
                  type="text"
                  placeholder="Masukan Nama Warehouse"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Alamat
                </label>
                <textarea
                  v-model="form.alamat"
                  rows="3"
                  placeholder="Masukan Alamat"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                ></textarea>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Kontak
                </label>
                <input
                  v-model="form.kontak"
                  type="text"
                  placeholder="Masukan Kontak Telepon"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
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
                    Kode
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Nama Warehouse
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    PIC
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Alamat
                  </th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">
                    Kontak
                  </th>
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <template v-for="(item, index) in pagedItems" :key="item.id_warehouse">
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.kode_warehouse }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.nm_warehouse }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.pic_warehouse }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.alamat }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.kontak }}
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
                          :disabled="deletingId === item.id_warehouse"
                          class="rounded-lg bg-error-50 px-3 py-1 text-xs font-medium text-error-600 hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-error-500/15 dark:text-error-400"
                          @click="remove(item)"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="showForm && editingId === item.id_warehouse">
                    <td
                      colspan="7"
                      class="bg-gray-50 px-5 py-4 sm:px-6 dark:bg-gray-900/40"
                    >
                      <div
                        class="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
                      >
                        <form class="space-y-4" @submit.prevent="submitForm">
                          <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Kode Warehouse
                              </label>
                              <input
                                v-model="form.kode_warehouse"
                                type="text"
                                placeholder="Masukan Kode Inisial Warehouse"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Nama Warehouse
                              </label>
                              <input
                                v-model="form.nm_warehouse"
                                type="text"
                                placeholder="Masukan Nama Warehouse"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                          </div>

                          <div class="grid gap-4 sm:grid-cols-3">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                PIC
                              </label>
                              <input
                                v-model="form.pic_warehouse"
                                type="text"
                                placeholder="Masukan Nama Warehouse"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Alamat
                              </label>
                              <textarea
                                v-model="form.alamat"
                                rows="3"
                                placeholder="Masukan Alamat"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              ></textarea>
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Kontak
                              </label>
                              <input
                                v-model="form.kontak"
                                type="text"
                                placeholder="Masukan Kontak Telepon"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              />
                            </div>
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
                    colspan="7"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
                <tr v-if="loading">
                  <td
                    colspan="7"
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

type WarehouseItem = {
  id_warehouse: number
  kode_warehouse: string
  nm_warehouse: string
  pic_warehouse: string
  alamat: string
  kontak: string
}

type FormState = {
  id: number | null
  kode_warehouse: string
  nm_warehouse: string
  pic_warehouse: string
  alamat: string
  kontak: string
}

const currentPageTitle = ref('Master Warehouse')
const items = ref<WarehouseItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('Tambah Warehouse')
const isSubmitting = ref(false)
const deletingId = ref<number | null>(null)
const form = reactive<FormState>({
  id: null,
  kode_warehouse: '',
  nm_warehouse: '',
  pic_warehouse: '',
  alamat: '',
  kontak: ''
})

const apiBase = API_BASE
const { confirm } = useDialog()
const toast = useToast()

const { search, debouncedSearch, currentPage, pageSize, setPage } = useListQuery({
  pageSize: 15,
  debounceMs: 300
})

// TODO: Move search + pagination to backend when list endpoints support q/page/limit.
const filteredItems = computed(() =>
  filterItemsByQuery(items.value, debouncedSearch.value, [
    'kode_warehouse',
    'nm_warehouse',
    'pic_warehouse',
    'alamat',
    'kontak'
  ])
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
    const res = await authFetch(`${apiBase}/warehouses`)
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

const openForm = (item?: WarehouseItem) => {
  if (item) {
    formTitle.value = 'Edit Warehouse'
    editingId.value = item.id_warehouse
    form.id = item.id_warehouse
    form.kode_warehouse = item.kode_warehouse
    form.nm_warehouse = item.nm_warehouse
    form.pic_warehouse = item.pic_warehouse
    form.alamat = item.alamat
    form.kontak = item.kontak
  } else {
    formTitle.value = 'Tambah Warehouse'
    editingId.value = null
    form.id = null
    form.kode_warehouse = ''
    form.nm_warehouse = ''
    form.pic_warehouse = ''
    form.alamat = ''
    form.kontak = ''
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
    kode_warehouse: form.kode_warehouse,
    nm_warehouse: form.nm_warehouse,
    pic_warehouse: form.pic_warehouse,
    alamat: form.alamat,
    kontak: form.kontak
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
      const res = await authFetch(`${apiBase}/warehouses/${form.id}`, {
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
      const res = await authFetch(`${apiBase}/warehouses`, {
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

const remove = async (item: WarehouseItem) => {
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
    deletingId.value = item.id_warehouse
    const res = await authFetch(`${apiBase}/warehouses/${item.id_warehouse}`, {
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
