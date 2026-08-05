<template>
  <div class="print-subcontractor">
    <div class="print-actions no-print">
      <button type="button" class="print-button" @click="handlePrint">Print</button>
      <RouterLink to="/subcontractor" class="print-link">Kembali</RouterLink>
    </div>

    <div v-if="loading" class="print-status no-print">Memuat data...</div>
    <div v-else-if="errorMessage" class="print-status print-error no-print">
      {{ errorMessage }}
    </div>
    <div v-else-if="!detail" class="print-status no-print">Tidak ada data cetak.</div>

    <div v-else class="print-sheet">
      <header class="sheet-header">
        <img class="print-logo" src="/logo.jpg" alt="Logo" />
        <div class="header-text">
          <div class="company-name">PT SANKYU INDONESIA INTERNATIONAL</div>
          <div class="company-line">CIKARANG LOGISTICS CENTER</div>
          <div class="company-line">
            Kawasan Industri Terpadu Indonesia Cina Kav.20 Ds.Nagasari
          </div>
          <div class="company-line">Kecamatan Serang Baru - Bekasi 17330</div>
        </div>
      </header>

      <div class="meta-row">
        <span>Print Date: {{ printDate }}</span>
      </div>
      <div class="sheet-divider" />

      <h1 class="doc-title">Laporan Subcontractor</h1>
      <div class="doc-title-line" />

      <section class="info-block">
        <div class="info-row">
          <span class="info-label">Nomor</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ documentNumber }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Order</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ formatDate(detail.order_date) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Warehouse</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ formatWarehouse(detail) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Customer</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.nama_customer) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">SubCont</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.nama_subcont) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Dibuat Oleh</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ formatCreatedBy(detail) }}</span>
        </div>
      </section>

      <section class="info-block">
        <div class="section-heading">Kendaraan &amp; Dokumen</div>
        <div class="info-row">
          <span class="info-label">No. Polisi</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.truck) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Jenis Kendaraan</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.jenis_kendaraan) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tonase</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.tonase) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Driver</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.driver) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">No. Surat Jalan</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.no_surat_jalan) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trip</span>
          <span class="info-colon">:</span>
          <span class="info-value">{{ dash(detail.trip) }}</span>
        </div>
      </section>

      <section class="schedule-block">
        <div class="section-heading">Jadwal Pengiriman</div>
        <table v-if="stops.length" class="schedule-table">
          <thead>
            <tr>
              <th style="width: 12%">#</th>
              <th style="width: 28%">Tipe</th>
              <th style="width: 30%">Nama Stop</th>
              <th style="width: 30%">Estimasi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stop, idx) in stops" :key="stop.id || idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ stopType(stop) }}</td>
              <td>{{ dash(stop.stop_name) }}</td>
              <td>{{ formatDateTime(stop.estimated_arrival) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="empty-schedule">
          Tidak ada jadwal stop.
          <template v-if="detail.tujuan_pengiriman">
            Tujuan: {{ detail.tujuan_pengiriman }}
          </template>
        </p>
      </section>

      <section class="dn-block">
        <div class="section-heading">Delivery Note (DN)</div>
        <p v-if="dnItems.length === 0" class="empty-schedule">Tidak ada data DN.</p>
        <table v-else class="dn-table">
          <thead>
            <tr>
              <th style="width: 5%">#</th>
              <th style="width: 12%">No. DN</th>
              <th style="width: 18%">Pickup</th>
              <th style="width: 18%">Drop</th>
              <th style="width: 6%">Qty</th>
              <th style="width: 7%">Pkg</th>
              <th style="width: 10%">GW (kg)</th>
              <th style="width: 12%">No. Container</th>
              <th style="width: 12%">No. AJU</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(dn, idx) in dnItems" :key="dn.id || idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ dash(dn.no_dn) }}</td>
              <td>{{ dash(dn.pickup_alamat) }}</td>
              <td>{{ dash(dn.drop_alamat) }}</td>
              <td style="text-align: center">{{ dn.qty ?? '-' }}</td>
              <td style="text-align: center">{{ dash(dn.pkg) }}</td>
              <td style="text-align: right">{{ dn.gw != null ? Number(dn.gw).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-' }}</td>
              <td>{{ dash(dn.no_container) }}</td>
              <td>{{ dash(dn.no_aju) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer class="sheet-footer">Dokumen internal — PT Sankyu Indonesia International</footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { subcontractorService } from '@/services/subcontractorService'

type DNItem = {
  id?: number
  no_dn: string
  pickup_alamat: string
  drop_alamat: string
  qty: number | null
  pkg: string
  gw: number | null
  no_container: string
  no_aju: string
  remarks: string
}

type DeliveryStop = {
  id?: number
  stop_order?: number
  stop_name?: string
  is_departure?: number
  is_finish?: number
  estimated_arrival?: string | null
}

type SubcontractorPrintDetail = {
  id_subcontractor?: number
  order_date?: string | null
  delivery_date?: string | null
  arrival_date?: string | null
  nama_customer?: string | null
  nama_subcont?: string | null
  kode_warehouse?: string | null
  nm_warehouse?: string | null
  truck?: string | null
  jenis_kendaraan?: string | null
  tonase?: string | null
  driver?: string | null
  no_surat_jalan?: string | null
  trip?: string | null
  tujuan_pengiriman?: string | null
  created_by_name?: string | null
  created_by_nik?: string | null
  delivery_stops?: DeliveryStop[]
}

const route = useRoute()
const loading = ref(true)
const errorMessage = ref('')
const detail = ref<SubcontractorPrintDetail | null>(null)
const dnItems = ref<DNItem[]>([])

const printDate = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
})

const documentNumber = computed(() => {
  const id = detail.value?.id_subcontractor
  return id != null ? `SC-${id}` : '-'
})

const stops = computed(() => {
  const list = detail.value?.delivery_stops
  if (!Array.isArray(list)) return [] as DeliveryStop[]
  return [...list].sort((a, b) => Number(a.stop_order || 0) - Number(b.stop_order || 0))
})

const dash = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const formatWarehouse = (data: SubcontractorPrintDetail) => {
  if (!data.kode_warehouse && !data.nm_warehouse) return '-'
  return `${data.kode_warehouse || ''} - ${data.nm_warehouse || ''}`.replace(/^ - | - $/g, '').trim() || '-'
}

const formatCreatedBy = (data: SubcontractorPrintDetail) => {
  const name = (data.created_by_name || '').trim()
  const nik = (data.created_by_nik || '').trim()
  if (name && nik) return `${name} (${nik})`
  if (name) return name
  if (nik) return nik
  return '-'
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parts = String(value).split('T')[0].split('-')
  if (parts.length !== 3) return String(value)
  const [y, m, d] = parts.map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const s = String(value).trim().replace('T', ' ')
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    const [datePart, timePart] = s.split(' ')
    return `${formatDate(datePart)} ${timePart.slice(0, 5)}`
  }
  return formatDate(value)
}

const stopType = (stop: DeliveryStop) => {
  if (Number(stop.is_departure) === 1) return 'Departure'
  if (Number(stop.is_finish) === 1) return 'Finish'
  return 'Tujuan'
}

const handlePrint = () => {
  requestAnimationFrame(() => {
    window.print()
  })
}

const resolveId = () => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] : raw
}

const loadDetail = async () => {
  const idParam = resolveId()
  if (!idParam) {
    errorMessage.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    detail.value = await subcontractorService.fetchSubcontractorById(idParam)
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Gagal memuat data cetak. Silakan coba lagi.'
    detail.value = null
  } finally {
    loading.value = false
  }
}

const loadDN = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const data = await subcontractorService.fetchDNList(id)
    dnItems.value = Array.isArray(data?.items) ? data.items : []
  } catch {
    // DN gagal load — tampilkan kosong saja, tidak perlu error fatal di print
  }
}

onMounted(() => {
  loadDetail()
  loadDN()
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

.print-subcontractor {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 16px;
  font-family: Arial, Helvetica, sans-serif;
  color: #111;
}

.print-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.print-button,
.print-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 14px;
  text-decoration: none;
  color: #fff;
  cursor: pointer;
}

.print-button {
  background: #16a34a;
}

.print-link {
  background: #2563eb;
}

.print-button:hover,
.print-link:hover {
  filter: brightness(1.05);
}

.print-status {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  max-width: 210mm;
  margin: 0 auto;
}

.print-error {
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.print-sheet {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  padding: 14mm 16mm;
  font-size: 11.5px;
  line-height: 1.35;
  color: #000;
}

.sheet-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.print-logo {
  width: 52px;
  height: auto;
  object-fit: contain;
}

.header-text {
  flex: 1;
}

.company-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.company-line {
  font-size: 10.5px;
  color: #222;
}

.meta-row {
  margin-top: 10px;
  font-size: 10.5px;
  text-align: right;
}

.sheet-divider {
  margin: 8px 0 12px;
  border-bottom: 1.5px solid #111;
}

.doc-title {
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.doc-title-line {
  width: 180px;
  margin: 4px auto 16px;
  border-bottom: 1px solid #333;
}

.section-heading {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ddd;
}

.info-block {
  margin-bottom: 14px;
}

.info-row {
  display: grid;
  grid-template-columns: 120px 12px 1fr;
  gap: 4px;
  margin-bottom: 3px;
}

.info-label {
  font-weight: 600;
}

.info-colon {
  text-align: center;
}

.info-value {
  word-break: break-word;
}

.schedule-block {
  margin-top: 8px;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #333;
  padding: 5px 6px;
  text-align: left;
  vertical-align: top;
}

.schedule-table th {
  background: #f0f0f0;
  font-weight: 700;
}

.empty-schedule {
  margin: 0;
  font-size: 11px;
  color: #444;
}

.dn-block {
  margin-top: 18px;
}

.dn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-top: 6px;
}

.dn-table th,
.dn-table td {
  border: 1px solid #333;
  padding: 4px 5px;
  text-align: left;
  vertical-align: top;
}

.dn-table th {
  background: #f0f0f0;
  font-weight: 700;
}

.sheet-footer {
  margin-top: 28px;
  padding-top: 8px;
  border-top: 1px solid #ccc;
  font-size: 9.5px;
  color: #555;
  text-align: center;
}

@page {
  size: A4 portrait;
  margin: 10mm;
}

@media print {
  body {
    background: #fff !important;
  }

  .no-print {
    display: none !important;
  }

  .print-subcontractor {
    background: #fff;
    padding: 0;
    min-height: auto;
  }

  .print-sheet {
    width: 100%;
    min-height: auto;
    margin: 0;
    box-shadow: none;
    padding: 0;
  }
}
</style>
