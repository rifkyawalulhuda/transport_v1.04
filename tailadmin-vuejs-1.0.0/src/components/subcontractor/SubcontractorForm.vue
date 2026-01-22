<template>
  <div class="space-y-4">
    <p
      v-if="submitError"
      class="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-sm text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
    >
      {{ submitError }}
    </p>
    <p v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
      Memuat data transaksi...
    </p>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <fieldset :disabled="isDisabled" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Warehouse
            </label>
            <SearchableSelect
              v-model="form.id_warehouse"
              :options="warehouses"
              value-key="id_warehouse"
              :label-formatter="formatWarehouseLabel"
              :search-keys="['kode_warehouse', 'nm_warehouse']"
              placeholder="-Pilih-"
              search-placeholder="Cari warehouse"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_warehouse" class="mt-1 text-xs text-error-600">
              {{ errors.id_warehouse }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Customer
            </label>
            <SearchableSelect
              v-model="form.id_customer"
              :options="customers"
              value-key="id_customer"
              :label-formatter="formatCustomerLabel"
              :search-keys="['id_customer', 'nama_customer']"
              placeholder="-Pilih-"
              search-placeholder="Cari customer"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_customer" class="mt-1 text-xs text-error-600">
              {{ errors.id_customer }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              SubCont
            </label>
            <SearchableSelect
              v-model="form.id_subcont"
              :options="subconts"
              value-key="id_subcont"
              label-key="nama_subcont"
              :search-keys="['nama_subcont']"
              placeholder="-Pilih-"
              search-placeholder="Cari subcont"
              :disabled="isDisabled"
            />
            <p v-if="errors.id_subcont" class="mt-1 text-xs text-error-600">
              {{ errors.id_subcont }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              No. Polisi
            </label>
            <input
              v-model="form.truck"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="No. Polisi Kendaraan"
              :disabled="isDisabled"
            />
            <p v-if="errors.truck" class="mt-1 text-xs text-error-600">
              {{ errors.truck }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Jenis Kendaraan
            </label>
            <input
              v-model="form.jenis_kendaraan"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Jenis Kendaraan"
              :disabled="isDisabled"
            />
            <p v-if="errors.jenis_kendaraan" class="mt-1 text-xs text-error-600">
              {{ errors.jenis_kendaraan }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tonase
            </label>
            <input
              v-model="form.tonase"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Tonase"
              :disabled="isDisabled"
            />
            <p v-if="errors.tonase" class="mt-1 text-xs text-error-600">
              {{ errors.tonase }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Tujuan Pengiriman
            </label>
            <input
              v-model="form.tujuan_pengiriman"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Tujuan Pengiriman"
              :disabled="isDisabled"
            />
            <p v-if="errors.tujuan_pengiriman" class="mt-1 text-xs text-error-600">
              {{ errors.tujuan_pengiriman }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Driver
            </label>
            <input
              v-model="form.driver"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan Nama Driver"
              :disabled="isDisabled"
            />
            <p v-if="errors.driver" class="mt-1 text-xs text-error-600">
              {{ errors.driver }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              No. Surat Jalan
            </label>
            <input
              v-model="form.no_surat_jalan"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan no. surat jalan"
              :disabled="isDisabled"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Delivery Date
            </label>
            <DatePickerInput
              v-model="form.delivery_date"
              placeholder="Pilih tanggal"
              :disabled="isDisabled"
            />
            <p v-if="errors.delivery_date" class="mt-1 text-xs text-error-600">
              {{ errors.delivery_date }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Arrival
            </label>
            <DatePickerInput
              v-model="form.arrival_date"
              placeholder="Pilih tanggal"
              :disabled="isDisabled"
            />
            <p v-if="errors.arrival_date" class="mt-1 text-xs text-error-600">
              {{ errors.arrival_date }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Cost
            </label>
            <input
              v-model="form.cost"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="isDisabled"
              @input="formatNumeric('cost')"
            />
            <p v-if="errors.cost" class="mt-1 text-xs text-error-600">
              {{ errors.cost }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Invoice
            </label>
            <input
              v-model="form.no_invoice"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan nomor Invoice"
              :disabled="isDisabled"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Billing Customer
            </label>
            <input
              v-model="form.billing_customer"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Masukan No. Billing"
              :disabled="isDisabled"
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Sales
            </label>
            <input
              v-model="form.sales"
              type="text"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              :disabled="isDisabled"
              @input="formatNumeric('sales')"
            />
            <p v-if="errors.sales" class="mt-1 text-xs text-error-600">
              {{ errors.sales }}
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Trip
            </label>
            <input
              v-model="form.trip"
              type="number"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              placeholder="Jumlah Trip"
              :disabled="isDisabled"
            />
            <p v-if="errors.trip" class="mt-1 text-xs text-error-600">
              {{ errors.trip }}
            </p>
          </div>
        </div>
      </fieldset>

      <button
        v-if="!readOnly"
        type="submit"
        class="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
        :disabled="isDisabled"
      >
        {{ submitLabel }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import SearchableSelect from '@/components/SearchableSelect.vue'
import DatePickerInput from '@/components/DatePickerInput.vue'
import { subcontractorService } from '@/services/subcontractorService'
import { useToast } from '@/composables/useToast'

type WarehouseOption = {
  id_warehouse: number
  kode_warehouse: string
  nm_warehouse: string
}

type CustomerOption = {
  id_customer: number
  nama_customer: string
}

type SubcontOption = {
  id_subcont: number
  nama_subcont: string
}

type SubcontractorFormData = {
  order_date: string
  delivery_date: string
  arrival_date: string
  id_warehouse: string
  id_customer: string
  id_subcont: string
  no_surat_jalan: string
  trip: string
  truck: string
  jenis_kendaraan: string
  tonase: string
  tujuan_pengiriman: string
  driver: string
  cost: string
  no_invoice: string
  billing_customer: string
  sales: string
}

type Props = {
  mode?: 'create' | 'edit'
  initialData?: Partial<SubcontractorFormData>
  submitLabel?: string
  submitting?: boolean
  submitError?: string
  loading?: boolean
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  initialData: () => ({}),
  submitLabel: 'Simpan',
  submitting: false,
  submitError: '',
  loading: false,
  readOnly: false
})

const emit = defineEmits<{
  (event: 'submit', payload: Record<string, unknown>): void
}>()

const toast = useToast()
const warehouses = ref<WarehouseOption[]>([])
const customers = ref<CustomerOption[]>([])
const subconts = ref<SubcontOption[]>([])
const errors = reactive<Record<string, string>>({})

const form = reactive<SubcontractorFormData>({
  order_date: '',
  delivery_date: '',
  arrival_date: '',
  id_warehouse: '',
  id_customer: '',
  id_subcont: '',
  no_surat_jalan: '',
  trip: '',
  truck: '',
  jenis_kendaraan: '',
  tonase: '',
  tujuan_pengiriman: '',
  driver: '',
  cost: '0',
  no_invoice: '',
  billing_customer: '',
  sales: '0'
})

const isDisabled = computed(() => props.submitting || props.loading || props.readOnly)

const formatWarehouseLabel = (warehouse: WarehouseOption) =>
  `${warehouse.kode_warehouse} - ${warehouse.nm_warehouse}`

const formatCustomerLabel = (customer: CustomerOption) =>
  `${customer.id_customer} - ${customer.nama_customer}`

const parseIndonesianNumber = (input: string) => {
  if (!input) {
    return 0
  }
  const normalized = input.replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatIndonesianNumber = (value: number) =>
  value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

const formatNumeric = (field: string) => {
  const value = (form as Record<string, string>)[field] ?? ''
  const parsed = parseIndonesianNumber(value)
  ;(form as Record<string, string>)[field] = formatIndonesianNumber(parsed)
}

const normalizeDate = (value?: string | null) => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    delete errors[key]
  })
}

const validateForm = () => {
  clearErrors()
  if (!form.id_warehouse) {
    errors.id_warehouse = 'Warehouse wajib dipilih.'
  }
  if (!form.id_customer) {
    errors.id_customer = 'Customer wajib dipilih.'
  }
  if (!form.id_subcont) {
    errors.id_subcont = 'Subcont wajib dipilih.'
  }
  if (!form.truck) {
    errors.truck = 'No. Polisi wajib diisi.'
  }
  if (!form.jenis_kendaraan) {
    errors.jenis_kendaraan = 'Jenis Kendaraan wajib diisi.'
  }
  if (!form.tonase) {
    errors.tonase = 'Tonase wajib diisi.'
  }
  if (!form.tujuan_pengiriman) {
    errors.tujuan_pengiriman = 'Tujuan Pengiriman wajib diisi.'
  }
  if (!form.driver) {
    errors.driver = 'Driver wajib diisi.'
  }
  if (!form.delivery_date) {
    errors.delivery_date = 'Delivery Date wajib diisi.'
  }
  if (!form.arrival_date) {
    errors.arrival_date = 'Arrival wajib diisi.'
  }
  if (!form.cost) {
    errors.cost = 'Cost wajib diisi.'
  }
  if (!form.sales) {
    errors.sales = 'Sales wajib diisi.'
  }
  if (!form.trip) {
    errors.trip = 'Trip wajib diisi.'
  }
  return Object.keys(errors).length === 0
}

const resetForm = () => {
  form.order_date = getTodayDate()
  form.delivery_date = ''
  form.arrival_date = ''
  form.id_warehouse = ''
  form.id_customer = ''
  form.id_subcont = ''
  form.no_surat_jalan = ''
  form.trip = ''
  form.truck = ''
  form.jenis_kendaraan = ''
  form.tonase = ''
  form.tujuan_pengiriman = ''
  form.driver = ''
  form.cost = '0'
  form.no_invoice = ''
  form.billing_customer = ''
  form.sales = '0'
}

const applyInitialData = (data: Partial<SubcontractorFormData>) => {
  form.order_date = data.order_date ? normalizeDate(data.order_date) : getTodayDate()
  form.delivery_date = normalizeDate(data.delivery_date)
  form.arrival_date = normalizeDate(data.arrival_date)
  form.id_warehouse = data.id_warehouse ? String(data.id_warehouse) : ''
  form.id_customer = data.id_customer ? String(data.id_customer) : ''
  form.id_subcont = data.id_subcont ? String(data.id_subcont) : ''
  form.no_surat_jalan = data.no_surat_jalan || ''
  form.trip = data.trip || ''
  form.truck = data.truck || ''
  form.jenis_kendaraan = data.jenis_kendaraan || ''
  form.tonase = data.tonase || ''
  form.tujuan_pengiriman = data.tujuan_pengiriman || ''
  form.driver = data.driver || ''
  form.cost = formatIndonesianNumber(parseIndonesianNumber(String(data.cost ?? '0')))
  form.no_invoice = data.no_invoice || ''
  form.billing_customer = data.billing_customer || ''
  form.sales = formatIndonesianNumber(parseIndonesianNumber(String(data.sales ?? '0')))
}

const buildPayload = () => ({
  order_date: form.order_date || getTodayDate(),
  delivery_date: form.delivery_date,
  arrival_date: form.arrival_date,
  id_warehouse: form.id_warehouse ? Number(form.id_warehouse) : null,
  id_customer: form.id_customer ? Number(form.id_customer) : null,
  id_subcont: form.id_subcont ? Number(form.id_subcont) : null,
  no_surat_jalan: form.no_surat_jalan,
  trip: form.trip,
  truck: form.truck,
  jenis_kendaraan: form.jenis_kendaraan,
  tonase: form.tonase,
  tujuan_pengiriman: form.tujuan_pengiriman,
  driver: form.driver,
  cost: parseIndonesianNumber(form.cost || '0'),
  no_invoice: form.no_invoice,
  billing_customer: form.billing_customer,
  sales: parseIndonesianNumber(form.sales || '0')
})

const handleSubmit = () => {
  if (!validateForm()) {
    toast.warning('Periksa input Anda')
    return
  }
  emit('submit', buildPayload())
}

const loadOptions = async () => {
  const [warehouseData, customerData, subcontData] = await Promise.all([
    subcontractorService.fetchWarehouses(),
    subcontractorService.fetchCustomers(),
    subcontractorService.fetchSubconts()
  ])
  warehouses.value = warehouseData
  customers.value = customerData
  subconts.value = subcontData
}

watch(
  () => props.initialData,
  (value) => {
    if ((props.mode === 'edit' || props.readOnly) && value) {
      applyInitialData(value)
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.mode,
  (value) => {
    if (value === 'create') {
      resetForm()
    }
  }
)

onMounted(async () => {
  await loadOptions()
  if (props.mode === 'create') {
    resetForm()
  }
})
</script>
