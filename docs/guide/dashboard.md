---
title: "Dashboard Overview"
outline: deep
---

# Dashboard & Monitoring

Dokumentasi untuk semua halaman di menu Dashboard: Home, Schedule Pengiriman, Monitoring Kendaraan, Lokasi Truk, dan KM Bulanan Truk.

---

## Home (Dashboard Utama)

**Path:** `/`

Halaman utama setelah login. Menampilkan ringkasan performa operasional dan finansial.

### Layout

Dashboard terdiri dari 3 section collapsible + 1 section tetap:

| Section | Collapsible | Deskripsi |
|---------|:-----------:|-----------|
| Ringkasan Dashboard | ✅ | Metrik utama, grafik, dan event |
| Expiry Alerts | ❌ | Peringatan dokumen expired |
| Statistics Sales Cost | ✅ | Grafik tren Sales Cost |
| Statistics Subcontractor Cost | ✅ | Grafik tren Subcontractor |

### Ringkasan Dashboard

Berisi komponen-komponen berikut:

#### Sales Cost & Subcontractor Metrics

Dua card metrik yang menampilkan jumlah transaksi bulan terpilih:
- **Sales Cost** — jumlah transaksi Sales Cost + indikator naik/turun vs bulan lalu
- **Subcontractor** — jumlah transaksi Subcontractor + indikator naik/turun vs bulan lalu

Masing-masing punya filter bulan/tahun sendiri.

#### Detail Sales Cost (Monthly)

Ringkasan angka kunci bulan terpilih:
- **Sales** — total pendapatan
- **Total Cost** — total biaya operasional
- **Gross Profit** — selisih Sales − Total Cost
- Indikator persentase perubahan vs bulan sebelumnya

Filter: bulan + tahun.

#### Monthly Sales Transaction

Grafik bar chart menampilkan volume transaksi Sales Cost dan Subcontractor per bulan dalam satu tahun.

Filter: tahun.

#### Truck Transaction Average

Menampilkan rata-rata penggunaan truck berdasarkan Delivery Order per bulan:
- Persentase loading per truck (rumus: `transaksi / 21 hari kerja × 100`)
- Tabel truck dengan jumlah transaksi dan persentase
- Filter: bulan + tahun

#### Calendar Event List

Daftar event kalender terbaru:
- Kolom: Event, Date/Time, Created by
- Filter periode tanggal
- Tombol **See All** → halaman Calendar

### Expiry Alerts

Peringatan dokumen kendaraan/supir yang mendekati atau sudah expired:
- Badge **Expired** (merah) — sudah lewat masa berlaku
- Badge **Warning** (kuning) — mendekati expired (H-30)
- Tabel: nama dokumen, kendaraan/supir, tanggal expired

### Statistics Sales Cost

Grafik area chart dengan 3 series:
- **Sales** (biru)
- **Total Cost** (orange)
- **Gross Profit** (hijau)

Filter periode: **Monthly** | **Quarterly** | **Annually** + filter tahun.

### Statistics Subcontractor Cost

Format identik dengan Statistics Sales Cost, tapi data dari transaksi Subcontractor.

### Interaksi

| Aksi | Fungsi |
|------|--------|
| Collapse/Expand | Klik panah di header section |
| Collapse All / Expand All | Tombol di header Ringkasan |
| Print Ringkasan | Cetak section Ringkasan (filter bulan/tahun) |

State collapse/expand tersimpan di localStorage.

---

## Schedule Pengiriman

**Path:** `/schedule-pengiriman`

Halaman jadwal pengiriman. Satu-satunya halaman yang bisa diakses oleh role **CS**.

### Filter

| Field | Deskripsi |
|-------|-----------|
| Tanggal Delivery Order | Filter berdasarkan tanggal kirim |
| Tanggal Arrival Order | Filter berdasarkan tanggal tiba |
| Kata Kunci | Cari: No Police, Customer, Driver, atau No DN |

Tombol: **Tampilkan** (apply filter), **Reset** (clear filter).

### Tabel Utama

Kolom (semua sortable):

| Kolom | Deskripsi |
|-------|-----------|
| Delivery Order | Tanggal pengiriman |
| No. Police | Plat nomor kendaraan |
| Driver | Nama supir |
| Customer | Nama pelanggan |
| Rute | Area/rute pengiriman |
| Arrival Order | Tanggal tiba |
| No. PO | Nomor Purchase Order |
| Jenis Pengiriman | Tipe pengiriman |
| DN | Jumlah Delivery Note |
| Trip | Nomor trip |

### Detail DN (Expandable Row)

Klik baris atau tombol expand untuk melihat detail DN:

| Kolom | Deskripsi |
|-------|-----------|
| No. DN | Nomor Delivery Note |
| Pickup | Alamat pickup |
| Drop | Alamat drop |
| Qty | Jumlah barang |
| PKG | Packaging |
| G.W | Gross Weight |
| No. Container | Nomor container |
| No. Aju | Nomor AJU |
| Remarks | Catatan |

### Fitur Lain

- Expand All / Collapse All (tombol di header tabel)
- Pagination dengan pilihan rows per page
- Total transaksi ditampilkan

---

## Monitoring Kendaraan

**Path:** `/monitoring-kendaraan`

Halaman untuk memantau status seluruh armada berdasarkan aktivitas operasional (transaksi/repair/idle).

### Header

- Judul: "Pantau status kendaraan berdasarkan transaksi aktif dan repair"
- Tombol **Buka Peta** → link ke Lokasi Truk (`/truck-locations`)
- Search: plat / kendaraan / driver
- Tombol: **Tampilkan**, **Reset**

### Summary Cards (Clickable Filter)

| Card | Deskripsi |
|------|-----------|
| Total Kendaraan | Jumlah seluruh armada aktif |
| Transaksi | Kendaraan sedang dalam pengiriman |
| Repair | Kendaraan sedang dalam perbaikan |
| Idle | Kendaraan tidak sedang digunakan |

Klik card untuk filter tampilan ke kategori tersebut.

### Daftar Kendaraan

Ditampilkan dalam format card per kendaraan:
- Plat nomor dan jenis kendaraan
- Nama driver
- Rute pengiriman (jika transaksi)
- Tanggal delivery dan arrival
- Durasi pengiriman

Dikelompokkan berdasarkan status: Transaksi, Repair, Idle.

---

## Lokasi Truk (GPS Map)

**Path:** `/truck-locations`

Peta live yang menampilkan posisi seluruh armada secara real-time menggunakan data Wialon GPS.

### Header

- Judul: "Lokasi Truk"
- Subtitle: "Peta live Wialon dengan inspector kendaraan dan daftar armada yang selalu sinkron"
- Info: jumlah armada + waktu sinkron terakhir
- Tombol **Monitoring** → link ke Monitoring Kendaraan
- Tombol **Refresh Sekarang** → refresh manual data GPS
- Auto-refresh setiap **30 detik**

### Layout 3 Panel

| Panel | Posisi | Fungsi |
|-------|--------|--------|
| Peta (Leaflet) | Kiri | Map dengan marker per truck + clustering |
| Vehicle Detail | Tengah | Detail truck yang dipilih (hidden sampai dipilih) |
| Fleet List | Kanan | Daftar armada dengan search & filter |

### GPS Status Filter Chips

| Filter | Warna | Arti |
|--------|-------|------|
| All | — | Semua truck |
| Moving | Hijau | Kendaraan bergerak |
| Idle | Biru | Kendaraan diam tapi GPS aktif |
| Offline | Abu-abu | GPS tidak mengirim data |
| Belum Terhubung | Amber | Belum ada mapping Wialon atau belum ada posisi |

### Vehicle Detail (Panel Tengah)

Muncul saat truck dipilih (klik marker atau klik di Fleet List):

| Info | Deskripsi |
|------|-----------|
| Driver | Nama supir yang ditugaskan |
| Wialon Unit | ID unit di Wialon |
| Speed | Kecepatan saat ini |
| Last Update | Waktu GPS terakhir kirim data |
| Lokasi | Alamat (reverse geocoding via Geoapify) |
| Transaksi Aktif | Info pengiriman yang sedang berjalan |
| Repair Aktif | Info repair jika sedang dalam perbaikan |
| Transaksi Terakhir | Info pengiriman terakhir yang selesai |

### Fleet List (Panel Kanan)

- Daftar semua truck dengan badge status GPS
- Search: plat, driver, unit ID, rute
- Klik item → fokus marker di peta + buka Vehicle Detail
- Scrollable dengan fixed height

### Marker Clustering

Truck yang berdekatan dikelompokkan dalam cluster:
- Warna cluster mengikuti status dominan (moving/idle/offline)
- Klik cluster → zoom in
- Popup cluster menampilkan summary status

---

## KM Bulanan Truk

**Path:** `/truck-monthly-mileage`

Rekap jarak tempuh bulanan per truck berdasarkan data trip Wialon.

### Header

- Judul: "Rekap KM bulanan per truk"
- Subtitle: "Data dihitung dari trip mileage Wialon pada bulan kalender yang dipilih"
- Badge: "Cache aktif" atau "Data terbaru"

### Filter

| Field | Deskripsi |
|-------|-----------|
| Bulan | Pilih periode (format YYYY-MM) |
| Pencarian | Cari: plat / kendaraan / unit Wialon |

Tombol: **Export Excel**, **Tampilkan**, link **Lokasi Truk**.

### Summary Cards

| Card | Deskripsi |
|------|-----------|
| Total KM | Akumulasi kilometer trip pada periode terpilih |
| Truk Berjalan | Truk yang punya minimal 1 trip pada bulan ini |
| Total Trip | Jumlah trip Wialon yang terdeteksi |
| Truk Ditampilkan | Jumlah truck di tabel (+ info error data) |

### Tabel Mileage

| Kolom | Deskripsi |
|-------|-----------|
| No Truck | Plat nomor |
| Kendaraan | Jenis kendaraan |
| Total KM | Jarak tempuh bulan itu |
| Trip | Jumlah trip |
| Trip Pertama | Waktu trip pertama dalam bulan |
| Trip Terakhir | Waktu trip terakhir dalam bulan |
| Status | has_trip / no_trip / unlinked / invalid_mapping / error |

### Status Mileage

| Status | Arti |
|--------|------|
| has_trip | Ada data trip, KM terhitung |
| no_trip | GPS terhubung tapi tidak ada trip di bulan ini |
| unlinked | Truck belum punya mapping Wialon |
| invalid_mapping | Wialon unit ID tidak valid di Wialon |
| error | Gagal mengambil data dari Wialon |

### Export Excel

Klik **Export Excel** untuk download data mileage dalam format `.xlsx` sesuai filter aktif.

### Pagination

Pilihan rows per page + navigasi halaman.

---

## Akses Berdasarkan Role

| Halaman | Admin | User | Mekanik | CS |
|---------|:-----:|:----:|:-------:|:--:|
| Home (Dashboard) | ✅ | ✅ | ✅ | ❌ |
| Schedule Pengiriman | ✅ | ✅ | ✅ | ✅ |
| Monitoring Kendaraan | ✅ | ✅ | ✅ | ❌ |
| Lokasi Truk | ✅ | ✅ | ✅ | ❌ |
| KM Bulanan Truk | ✅ | ✅ | ✅ | ❌ |
