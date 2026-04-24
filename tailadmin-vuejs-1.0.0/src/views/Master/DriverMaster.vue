<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Master Driver">
        <div
          class="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
        >
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              @click="openForm()"
            >
              Tambah Driver
            </button>
            <MasterImportActions master-type="driver" @imported="handleImported" />
            <SearchBar v-model="search" placeholder="Cari no polisi / nama driver / telp" />
          </div>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total: {{ totalCount }} driver</p>
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
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No Polisi
                </label>
                <input
                  v-model="form.no_polisi"
                  type="text"
                  placeholder="Masukan No. Polisi"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nama Driver
                </label>
                <input
                  v-model="form.nama_driver"
                  type="text"
                  placeholder="Masukan Nama Driver"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  required
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No Telp
                </label>
                <input
                  v-model="form.no_telp"
                  type="text"
                  placeholder="Masukan No Telp"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  No KTP
                </label>
                <input
                  v-model="form.no_ktp"
                  type="text"
                  placeholder="Masukan No. KTP"
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
                  placeholder="Alamat"
                  class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                ></textarea>
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
                  <SortableTableHeader
                    label="No"
                    sort-key="id_driver"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <SortableTableHeader
                    label="No Polisi"
                    sort-key="no_polisi"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <SortableTableHeader
                    label="Nama Driver"
                    sort-key="nama_driver"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <SortableTableHeader
                    label="No Telp"
                    sort-key="no_telp"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <SortableTableHeader
                    label="No KTP"
                    sort-key="no_ktp"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <SortableTableHeader
                    label="Alamat"
                    sort-key="alamat"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <SortableTableHeader
                    label="Status"
                    sort-key="is_active"
                    :active-key="sortKey"
                    :direction="sortDirection"
                    @sort="handleSort"
                  />
                  <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                <template v-for="(item, index) in pagedItems" :key="item.id_driver">
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ (currentPage - 1) * pageSize + index + 1 }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.no_polisi }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.nama_driver }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.no_telp }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.no_ktp }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-700 sm:px-6 dark:text-gray-200">
                      {{ item.alamat }}
                    </td>
                    <td class="px-5 py-3 text-sm sm:px-6">
                      <span
                        class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                        :class="
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        "
                      >
                        {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-center sm:px-6">
                      <div class="relative inline-flex justify-center">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                          @click.stop="toggleActionMenu(item.id_driver, $event)"
                        >
                          <svg
                            class="h-3.5 w-3.5"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="m5 8 5 5 5-5" />
                          </svg>
                        </button>
                        <Teleport to="body">
                          <div
                            v-if="openActionId === item.id_driver"
                            ref="actionMenuRef"
                            class="fixed z-[9999] w-40 -translate-x-full rounded-lg border border-gray-200 bg-white py-1 text-left shadow-theme-sm dark:border-gray-700 dark:bg-gray-900"
                            :style="actionMenuStyle"
                            @click.stop
                          >
                            <button
                              type="button"
                              class="block w-full px-3 py-2 text-left text-xs font-medium text-brand-600 hover:bg-gray-50 dark:text-brand-400 dark:hover:bg-white/[0.03]"
                              @click="handleEdit(item)"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              :disabled="statusUpdatingId === item.id_driver"
                              class="block w-full px-3 py-2 text-left text-xs font-medium text-amber-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-400 dark:hover:bg-white/[0.03]"
                              @click="toggleStatus(item)"
                            >
                              {{ item.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
                            </button>
                            <button
                              type="button"
                              :disabled="deletingId === item.id_driver"
                              class="block w-full px-3 py-2 text-left text-xs font-medium text-error-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-error-400 dark:hover:bg-white/[0.03]"
                              @click="handleDelete(item)"
                            >
                              Hapus
                            </button>
                          </div>
                        </Teleport>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="showForm && editingId === item.id_driver">
                    <td colspan="8" class="bg-gray-50 px-5 py-4 sm:px-6 dark:bg-gray-900/40">
                      <div
                        class="rounded-lg border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900"
                      >
                        <form class="space-y-4" @submit.prevent="submitForm">
                          <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                No Polisi
                              </label>
                              <input
                                v-model="form.no_polisi"
                                type="text"
                                placeholder="Masukan No. Polisi"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                                required
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                Nama Driver
                              </label>
                              <input
                                v-model="form.nama_driver"
                                type="text"
                                placeholder="Masukan Nama Driver"
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
                                No Telp
                              </label>
                              <input
                                v-model="form.no_telp"
                                type="text"
                                placeholder="Masukan No Telp"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              />
                            </div>
                            <div>
                              <label
                                class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                              >
                                No KTP
                              </label>
                              <input
                                v-model="form.no_ktp"
                                type="text"
                                placeholder="Masukan No. KTP"
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
                                placeholder="Alamat"
                                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                              ></textarea>
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
                    colspan="8"
                    class="px-5 py-6 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400"
                  >
                    Tidak ada data
                  </td>
                </tr>
                <tr v-if="loading">
                  <td
                    colspan="8"
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { API_BASE } from '@/config/api'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import SortableTableHeader from '@/components/common/SortableTableHeader.vue'
import MasterImportActions from '@/components/master/MasterImportActions.vue'
import { filterItemsByQuery, useListQuery } from '@/composables/useListQuery'
import { useSortableItems } from '@/composables/useSortableItems'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'
import { authFetch } from '@/services/auth'

type DriverItem = {
  id_driver: number
  no_polisi: string
  nama_driver: string
  no_telp: string
  no_ktp: string
  alamat: string
  is_active: boolean | number
}

type FormState = {
  id: number | null
  no_polisi: string
  nama_driver: string
  no_telp: string
  no_ktp: string
  alamat: string
}

const currentPageTitle = ref('Master Driver')
const items = ref<DriverItem[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formTitle = ref('Tambah Driver')
const isSubmitting = ref(false)
const deletingId = ref<number | null>(null)
const statusUpdatingId = ref<number | null>(null)
const form = reactive<FormState>({
  id: null,
  no_polisi: '',
  nama_driver: '',
  no_telp: '',
  no_ktp: '',
  alamat: '',
})

const apiBase = API_BASE
const { confirm } = useDialog()
const toast = useToast()

const { search, debouncedSearch, currentPage, pageSize, setPage } = useListQuery({
  pageSize: 15,
  debounceMs: 300,
})
const pageSizeOptions = [15, 20, 50]

const changePageSize = () => {
  setPage(1)
}

// TODO: Move search + pagination to backend when list endpoints support q/page/limit.
const filteredItems = computed(() =>
  filterItemsByQuery(items.value, debouncedSearch.value, [
    'no_polisi',
    'nama_driver',
    'no_telp',
    'no_ktp',
    'alamat',
    'is_active',
  ]),
)

const totalCount = computed(() => filteredItems.value.length)

const { sortKey, sortDirection, setSort, sortedItems } = useSortableItems(
  filteredItems,
  'id_driver',
  {
    is_active: (item) => (item.is_active ? 'Aktif' : 'Nonaktif'),
  },
)

const handleSort = (key: string) => {
  setSort(key)
  setPage(1)
}

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
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
    const res = await authFetch(`${apiBase}/drivers?include_inactive=1`)
    const data = await res.json()
    items.value = Array.isArray(data)
      ? data.map((item) => ({
          ...item,
          is_active: Number(item.is_active) === 1 || item.is_active === true,
        }))
      : []
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

const openForm = (item?: DriverItem) => {
  if (item) {
    formTitle.value = 'Edit Driver'
    editingId.value = item.id_driver
    form.id = item.id_driver
    form.no_polisi = item.no_polisi
    form.nama_driver = item.nama_driver
    form.no_telp = item.no_telp
    form.no_ktp = item.no_ktp
    form.alamat = item.alamat
  } else {
    formTitle.value = 'Tambah Driver'
    editingId.value = null
    form.id = null
    form.no_polisi = ''
    form.nama_driver = ''
    form.no_telp = ''
    form.no_ktp = ''
    form.alamat = ''
  }
  showForm.value = true
}

const cancelForm = () => {
  showForm.value = false
  editingId.value = null
}

const openActionId = ref<number | null>(null)
const actionMenuRef = ref<HTMLElement | HTMLElement[] | null>(null)
const actionMenuPosition = ref({ top: 0, left: 0 })

const setActionMenuPosition = (event: MouseEvent) => {
  const trigger = event.currentTarget as HTMLElement | null
  if (!trigger) {
    return
  }
  const rect = trigger.getBoundingClientRect()
  const top = rect.bottom + 8
  const left = rect.right
  actionMenuPosition.value = { top, left }

  nextTick(() => {
    const menuEl = actionMenuRef.value
    const element = Array.isArray(menuEl) ? menuEl[0] : menuEl
    if (!element) return
    const menuHeight = element.offsetHeight || 0
    if (top + menuHeight > window.innerHeight - 8) {
      actionMenuPosition.value = {
        top: Math.max(8, rect.top - menuHeight - 8),
        left,
      }
    }
  })
}

const actionMenuStyle = computed(() => ({
  top: `${actionMenuPosition.value.top}px`,
  left: `${actionMenuPosition.value.left}px`,
}))

const toggleActionMenu = (id: number, event: MouseEvent) => {
  if (openActionId.value === id) {
    closeActionMenu()
    return
  }
  openActionId.value = id
  setActionMenuPosition(event)
}

const closeActionMenu = () => {
  openActionId.value = null
}

const handleEdit = (item: DriverItem) => {
  closeActionMenu()
  openForm(item)
}

const handleDelete = (item: DriverItem) => {
  closeActionMenu()
  remove(item)
}

const submitForm = async () => {
  if (isSubmitting.value) {
    return
  }
  const payload: Record<string, unknown> = {
    no_polisi: form.no_polisi,
    nama_driver: form.nama_driver,
    no_telp: form.no_telp,
    no_ktp: form.no_ktp,
    alamat: form.alamat,
  }

  const isUpdate = Boolean(form.id)
  if (isUpdate) {
    const ok = await confirm({
      title: 'Konfirmasi Perubahan',
      message: 'Simpan perubahan pada data ini?',
      confirmText: 'Ya, simpan',
      cancelText: 'Batal',
      variant: 'warning',
    })
    if (!ok) {
      return
    }
  }

  isSubmitting.value = true
  try {
    if (isUpdate) {
      const res = await authFetch(`${apiBase}/drivers/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
      const res = await authFetch(`${apiBase}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

const remove = async (item: DriverItem) => {
  if (deletingId.value) {
    return
  }
  const ok = await confirm({
    title: 'Konfirmasi Hapus',
    message: 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, hapus',
    cancelText: 'Batal',
    variant: 'danger',
  })
  if (!ok) {
    return
  }
  try {
    deletingId.value = item.id_driver
    const res = await authFetch(`${apiBase}/drivers/${item.id_driver}`, {
      method: 'DELETE',
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

const toggleStatus = async (item: DriverItem) => {
  closeActionMenu()
  if (statusUpdatingId.value) {
    return
  }
  const nextActive = !item.is_active
  const ok = await confirm({
    title: nextActive ? 'Aktifkan Driver' : 'Nonaktifkan Driver',
    message: nextActive
      ? `Aktifkan kembali driver ${item.nama_driver}?`
      : `Nonaktifkan driver ${item.nama_driver}? Driver ini tidak akan muncul di pilihan Sales Cost dan Data Transport.`,
    confirmText: nextActive ? 'Ya, aktifkan' : 'Ya, nonaktifkan',
    cancelText: 'Batal',
    variant: 'warning',
  })
  if (!ok) {
    return
  }
  try {
    statusUpdatingId.value = item.id_driver
    const res = await authFetch(`${apiBase}/drivers/${item.id_driver}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: nextActive }),
    })
    if (!res.ok) {
      const message = await res.text()
      toast.error(message || 'Gagal mengubah status driver.')
      return
    }
    toast.success(nextActive ? 'Driver berhasil diaktifkan' : 'Driver berhasil dinonaktifkan')
    await loadData()
  } catch (error) {
    console.error(error)
    toast.error('Gagal mengubah status driver.')
  } finally {
    statusUpdatingId.value = null
  }
}

const handleDocumentClick = () => {
  closeActionMenu()
}

const handleWindowChange = () => {
  closeActionMenu()
}

onMounted(() => {
  loadData()
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('scroll', handleWindowChange, true)
  window.addEventListener('resize', handleWindowChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('scroll', handleWindowChange, true)
  window.removeEventListener('resize', handleWindowChange)
})
</script>
