<template>
  <div class="print-sales-cost">
    <div class="print-actions no-print">
      <button type="button" class="print-button no-print" @click="handlePrint">Print</button>
      <RouterLink to="/sales-cost" class="print-link no-print">Kembali</RouterLink>
    </div>

    <div v-if="loading" class="print-status no-print">Memuat data...</div>
    <div v-else-if="errorMessage" class="print-status print-error no-print">
      {{ errorMessage }}
    </div>

    <div v-else-if="details.length === 0" class="print-status no-print">Tidak ada data cetak.</div>

    <template v-else>
      <div v-for="detail in details" :key="detail.id_sales_cost" class="print-sheet">
        <img class="print-logo" src="/logo.jpg" alt="Logo" />

        <div class="print-header-line header-line-1">PT SANKYU INDONESIA INTERNATIONAL</div>
        <div class="print-header-line header-line-2">CIKARANG LOGISTICS CENTER</div>
        <div class="print-header-line header-line-3">
          Kawasan Industri Terpadu Indonesia Cina Kav.20 Ds.Nagasari
        </div>
        <div class="print-header-line header-line-4">Kecamatan Serang Baru - Bekasi 17330</div>

        <div class="print-date">Print Date: {{ printDate }}</div>
        <div class="print-divider"></div>
        <div class="print-document-title">Surat Perintah Kerja</div>
        <div class="print-document-underline">_________________________________</div>

        <div class="print-label label-nomor">Nomor</div>
        <div class="print-colon colon-nomor">:</div>
        <div class="print-value value-nomor">{{ getSpkCode(detail) }}</div>

        <div class="print-label label-tanggal">Tanggal</div>
        <div class="print-colon colon-tanggal">:</div>
        <div class="print-value value-tanggal">{{ formatLegacyDate(detail.departure_datetime) }}</div>

        <div class="print-label label-driver">Nama Driver</div>
        <div class="print-colon colon-driver">:</div>
        <div class="print-value value-driver">{{ detail.nama_driver || '-' }}</div>

        <div class="print-label label-nopol">Nomor Polisi Kendaraan</div>
        <div class="print-colon colon-nopol">:</div>
        <div class="print-value value-nopol">{{ detail.no_police || '-' }}</div>

        <div class="print-label label-customer">Konsumen</div>
        <div class="print-colon colon-customer">:</div>
        <div class="print-value value-customer">{{ detail.nama_customer || '-' }}</div>

        <!-- No. DN Removed -->

        <div class="print-label label-route">Rute</div>
        <div class="print-colon colon-route">:</div>
        <div class="print-value value-route">{{ detail.nama_area || '-' }}</div>

        <div class="print-label label-vehicle">Jenis Kendaraan</div>
        <div class="print-colon colon-vehicle">:</div>
        <div class="print-value value-vehicle">{{ detail.jenis_kendaraan || '-' }}</div>
        <div v-if="detail.container_size" class="print-value value-container">
          {{ detail.container_size }}
        </div>

        <div class="print-label label-trip">Total Trip</div>
        <div class="print-colon colon-trip">:</div>
        <div class="print-value value-trip">{{ detail.trip || '-' }}</div>

        <div class="print-label label-destination">Tiba di Tujuan</div>
        <div class="print-colon colon-destination">:</div>
        <div class="print-value value-destination">
          {{ formatIndonesianDateTime(getFirstDestination(detail)?.estimated_arrival) }}
        </div>

        <table class="cost-table">
          <colgroup>
            <col class="cost-col-label" />
            <col class="cost-col-colon" />
            <col class="cost-col-value" />
          </colgroup>
          <tbody>
            <tr>
              <td class="cost-label-cell">Ops Cost</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(detail.ops_cost) }}</td>
            </tr>
            <tr>
              <td class="cost-label-cell">Demurage</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(detail.demurrage_chargers) }}</td>
            </tr>
            <tr>
              <td class="cost-label-cell">Detention</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(detail.detention_chargers) }}</td>
            </tr>
            <tr>
              <td class="cost-label-cell">Container Repair</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(detail.container_repair) }}</td>
            </tr>
            <tr>
              <td class="cost-label-cell">Gate Pass Extend</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(detail.extend_gate_pass) }}</td>
            </tr>
            <tr>
              <td class="cost-label-cell">Additional Cost</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(detail.additional_cost) }}</td>
            </tr>
            <tr class="cost-separator">
              <td colspan="3"></td>
            </tr>
            <tr class="cost-total-row">
              <td class="cost-label-cell">Total</td>
              <td class="cost-colon-cell">: Rp.</td>
              <td class="cost-value-cell">{{ formatNumber(getTotalCost(detail)) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-divider"></div>
        <div class="signature-row signature-labels">
          <div>(PREPARED)</div>
          <div>(APPROVED)</div>
          <div>(DRIVER)</div>
        </div>
        <div class="signature-row signature-names">
          <div>(_________)</div>
          <div>(_________)</div>
          <div>(_________)</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { salesCostService } from '@/services/salesCostService'

type DeliveryStopPrint = {
  id: number
  stop_order: number
  stop_name: string | null
  is_departure: number
  is_finish: number
  estimated_arrival: string | null
}

type SalesCostPrintDetail = {
  id_sales_cost: number
  departure_datetime: string | null
  arrival_datetime: string | null
  no_police: string | null
  jenis_kendaraan: string | null
  container_size: string | null
  nama_driver: string | null
  nama_area: string | null
  nama_customer: string | null
  demurrage_chargers: number | null
  detention_chargers: number | null
  container_repair: number | null
  extend_gate_pass: number | null
  ops_cost: number | null
  trip: string | number | null
  additional_cost: number | null
  total: number | null
  almt_pickup?: string | null
  almt_drop?: string | null
  no_dn?: string | null
  delivery_stops?: DeliveryStopPrint[]
}

const route = useRoute()
const loading = ref(true)
const errorMessage = ref('')
const details = ref<SalesCostPrintDetail[]>([])

const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const getSpkCode = (detail: SalesCostPrintDetail) => {
  const deliveryYear = getYear(detail.departure_datetime) || new Date().getFullYear()
  const romanMonth = romanMonths[new Date().getMonth()]
  return `${detail.id_sales_cost} / SPK / CLC / ${romanMonth} / ${deliveryYear}`
}

const getTotalCost = (detail: SalesCostPrintDetail) => {
  if (detail.total !== null && detail.total !== undefined) {
    return Number(detail.total) || 0
  }
  return (
    toNumber(detail.ops_cost) +
    toNumber(detail.demurrage_chargers) +
    toNumber(detail.detention_chargers) +
    toNumber(detail.container_repair) +
    toNumber(detail.extend_gate_pass) +
    toNumber(detail.additional_cost)
  )
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const number = Number(value)
  return Number.isNaN(number) ? 0 : number
}

const formatNumber = (value: unknown) => {
  const number = toNumber(value)
  return number.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const formatLegacyDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const formatIndonesianDateTime = (value?: string | null): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const months = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember']
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}.${minutes} (${day} ${month} ${year})`
}

const getFirstDestination = (detail: SalesCostPrintDetail): DeliveryStopPrint | null => {
  const stops = detail.delivery_stops || []
  return stops.find(s => s.is_departure === 0 && s.is_finish === 0) ?? null
}

const formatShortDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const printDate = formatShortDate(new Date())

const getYear = (value?: string | null) => {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.getFullYear()
}

const handlePrint = () => {
  requestAnimationFrame(() => {
    window.print()
  })
}

const parseRequestedIds = () => {
  const queryIds = route.query.ids
  const rawQueryIds = Array.isArray(queryIds) ? queryIds.join(',') : queryIds
  const rawId = route.params.id
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId
  const source = rawQueryIds || idParam || ''
  const ids = String(source)
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)

  return Array.from(new Set(ids))
}

const loadDetails = async () => {
  const requestedIds = parseRequestedIds()
  if (requestedIds.length === 0) {
    errorMessage.value = 'ID transaksi tidak ditemukan.'
    loading.value = false
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await Promise.all(
      requestedIds.map((id) => salesCostService.fetchSalesCostById(id)),
    )
    details.value = data
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Gagal memuat data cetak. Silakan coba lagi.'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetails()
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
}

.print-sales-cost {
  background: #f5f5f5;
  padding: 12px;
  font-family: Arial, sans-serif;
  color: #000;
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
  filter: brightness(1.95);
}

.print-status {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.print-error {
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.print-sheet {
  position: relative;
  width: 297mm;
  height: 210mm;
  padding: 0;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.15;
  break-after: page;
  page-break-after: always;
  page-break-inside: avoid;
}

.print-sheet:last-child {
  break-after: auto;
  page-break-after: auto;
}

.print-logo {
  position: absolute;
  left: 25mm;
  top: 2mm;
  width: 30mm;
  height: 43mm;
  object-fit: contain;
}

.print-header-line {
  position: absolute;
  left: 0;
  width: 100%;
  text-align: center;
}

.header-line-1 {
  top: 10mm;
  font-size: 18pt;
  font-weight: 700;
}

.header-line-2 {
  top: 16mm;
  font-size: 18pt;
  font-weight: 700;
}

.header-line-3 {
  top: 24mm;
  font-size: 9pt;
  font-style: italic;
}

.header-line-4 {
  top: 28mm;
  font-size: 9pt;
  font-style: italic;
}

.print-date {
  position: absolute;
  right: 10mm;
  top: 33mm;
  font-size: 9pt;
}

.print-divider {
  position: absolute;
  left: 10mm;
  right: 10mm;
  top: 38mm;
  border-top: 1px solid #000;
}

.print-document-title {
  position: absolute;
  top: 43mm;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 18pt;
  font-weight: 700;
}

.print-document-underline {
  position: absolute;
  top: 48mm;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 12pt;
}

.print-label,
.print-colon,
.print-value {
  position: absolute;
  font-size: 16px;
  line-height: 5.15;
  page-break-inside: avoid;
}

.print-label {
  font-weight: 700;
  max-width: 60mm;
}

.print-colon {
  font-weight: 700;
}

.print-value {
  font-weight: 500;
  max-width: 200mm;
}

.label-nomor {
  left: 10mm;
  top: 55mm;
}

.colon-nomor {
  left: 30mm;
  top: 55mm;
}

.value-nomor {
  left: 32mm;
  top: 55mm;
}

.label-tanggal {
  left: 10mm;
  top: 61mm;
}

.colon-tanggal {
  left: 30mm;
  top: 61mm;
}

.value-tanggal {
  left: 32mm;
  top: 61mm;
}

.label-driver {
  left: 10mm;
  top: 70mm;
}

.colon-driver {
  left: 60mm;
  top: 70mm;
}

.value-driver {
  left: 65mm;
  top: 70mm;
}

.label-nopol {
  left: 10mm;
  top: 77mm;
}

.colon-nopol {
  left: 60mm;
  top: 77mm;
}

.value-nopol {
  left: 65mm;
  top: 77mm;
}

.label-customer {
  left: 10mm;
  top: 84mm;
}

.colon-customer {
  left: 60mm;
  top: 84mm;
}

.value-customer {
  left: 65mm;
  top: 84mm;
}

.label-route {
  left: 10mm;
  top: 91mm;
}

.colon-route {
  left: 60mm;
  top: 91mm;
}

.value-route {
  left: 65mm;
  top: 91mm;
}

.label-vehicle {
  left: 10mm;
  top: 98mm;
}

.colon-vehicle {
  left: 60mm;
  top: 98mm;
}

.value-vehicle {
  left: 65mm;
  top: 98mm;
}

.value-container {
  left: 75mm;
  top: 98mm;
}

.label-trip {
  left: 10mm;
  top: 105mm;
}

.colon-trip {
  left: 60mm;
  top: 105mm;
}

.value-trip {
  left: 65mm;
  top: 105mm;
}

.label-destination {
  left: 10mm;
  top: 112mm;
}

.colon-destination {
  left: 60mm;
  top: 112mm;
}

.value-destination {
  left: 65mm;
  top: 112mm;
}

.cost-table {
  position: absolute;
  left: 180mm;
  top: 60mm;
  width: 100mm;
  border-collapse: collapse;
  font-size: 16px;
  line-height: 1.9;
  font-weight: 700;
  page-break-inside: avoid;
}

.cost-col-label {
  width: 40mm;
}

.cost-col-colon {
  width: 20mm;
}

.cost-col-value {
  width: 20mm;
}

.cost-table td {
  padding: 0;
  height: 6mm;
}

.cost-label-cell {
  text-align: left;
}

.cost-colon-cell {
  text-align: left;
}

.cost-value-cell {
  text-align: right;
  font-weight: 400;
}

.cost-separator td {
  border-top: 1px solid #000;
  height: 6px;
  padding: 0;
}

.cost-total-row .cost-label-cell,
.cost-total-row .cost-value-cell {
  font-weight: 700;
}

.signature-divider {
  position: absolute;
  left: 10mm;
  right: 10mm;
  top: 145mm;
  border-top: 2px solid #000;
}

.signature-row {
  position: absolute;
  left: 0;
  width: 60%;
  display: flex;
  justify-content: space-between;
  padding: 0 25mm;
  font-size: 12pt;
  page-break-inside: avoid;
}

.signature-labels {
  font-size: 11pt;
  top: 155mm;
  font-weight: 700;
}

.signature-names {
  top: 185mm;
}

.print-debug {
  outline: 1px dashed #94a3b8;
}

@page {
  size: A4 landscape;
  margin: 0mm 0mm 0mm 0mm;
}

@media print {
  body {
    margin: 0;
    padding: 0;
    background: #fff;
  }

  #vue-devtools,
  [id^='vue-devtools'],
  [class^='vue-devtools'],
  [class*=' vue-devtools'] {
    display: none !important;
  }

  .print-sales-cost {
    padding: 0;
    background: #fff;
  }

  .no-print {
    display: none !important;
  }

  .print-sheet {
    box-shadow: none;
    margin: 0;
    padding-top: 20mm;
    break-after: page;
    page-break-after: always;
  }

  .print-sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
</style>
