---
title: "User Guide"
outline: deep
---

# User Guide

Panduan penggunaan Transport Management System (TMS) untuk semua role pengguna.

## Login

1. Buka aplikasi di browser
2. Masukkan username dan password
3. Klik **Login**

Setelah login, pengguna diarahkan ke halaman sesuai role:
- **Admin/User/Mekanik** → Dashboard
- **CS** → Schedule Pengiriman

## Navigasi Menu

### Menu Utama (Admin/User)

| Menu | Sub-menu | Fungsi |
|------|----------|--------|
| Dashboard | Home | Ringkasan performa |
| | Schedule Pengiriman | Jadwal pengiriman |
| | Monitoring Kendaraan | Status armada |
| | Lokasi Truk | Peta GPS live |
| | KM Bulanan Truk | Rekap mileage bulanan |
| Calendar | — | Kalender event |
| Master | Truck, Driver, Customer, Area, Warehouse, Subcont, Admin | Data master |
| Data Transport | Data Truck, Data Chasis, Data Supir | Data historis kendaraan & supir |
| Transaksi | Sales Cost, Subcontractor, Repair | Transaksi operasional |

### Menu CS

CS hanya bisa mengakses:
- Schedule Pengiriman
- User Profile

### Menu Mekanik

Mekanik bisa mengakses semua kecuali:
- Master Data (tidak tersedia)
- Sales Cost & Subcontractor (tidak tersedia)
- Hanya bisa akses **Repair** di menu Transaksi

## Dashboard (Home)

Halaman utama setelah login menampilkan:

### Ringkasan Dashboard
- **Sales Cost & Subcontractor Metrics** — jumlah transaksi per bulan dengan indikator naik/turun
- **Detail Sales Cost (Monthly)** — Sales, Total Cost, Gross Profit bulan terpilih
- **Monthly Sales Transaction** — grafik bar transaksi per bulan
- **Truck Transaction Average** — persentase penggunaan truck per bulan
- **Calendar Event List** — daftar event terbaru

### Expiry Alerts
Peringatan dokumen kendaraan/supir yang mendekati atau sudah expired.

### Statistics Sales Cost
Grafik area chart (Sales, Total Cost, Gross Profit) dengan filter Monthly/Quarterly/Annually.

### Statistics Subcontractor Cost
Grafik area chart sama seperti Sales Cost tapi untuk data Subcontractor.

## Schedule Pengiriman

Halaman untuk melihat jadwal pengiriman yang sedang berjalan.

### Filter

- **Tanggal Delivery Order** — filter berdasarkan tanggal kirim
- **Tanggal Arrival Order** — filter berdasarkan tanggal tiba
- **Kata Kunci** — cari berdasarkan No Police, Customer, Driver, atau No DN

### Informasi yang Ditampilkan

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

### Detail DN

Klik baris untuk expand dan melihat detail DN:
- No. DN, Pickup, Drop, Qty, PKG, G.W, No. Container, No. Aju, Remarks

## Monitoring Kendaraan

Halaman untuk memantau status seluruh armada berdasarkan aktivitas operasional.

### Summary Cards

| Card | Deskripsi |
|------|-----------|
| Total Kendaraan | Jumlah seluruh armada aktif |
| Transaksi | Kendaraan sedang dalam pengiriman |
| Repair | Kendaraan sedang dalam perbaikan |
| Idle | Kendaraan tidak sedang digunakan |

Klik card untuk filter tampilan ke kategori tersebut.

### Informasi per Kendaraan

- Plat nomor dan jenis kendaraan
- Nama driver yang ditugaskan
- Rute pengiriman (jika sedang transaksi)
- Tanggal delivery dan arrival
- Durasi pengiriman

### Pencarian

Cari berdasarkan plat nomor, jenis kendaraan, atau nama driver.

## Lokasi Truk (GPS Map)

Peta live yang menampilkan posisi seluruh armada secara real-time.

### Layout 3 Panel

| Panel | Fungsi |
|-------|--------|
| Kiri (Peta) | Leaflet map dengan marker per truck |
| Tengah (Vehicle Detail) | Detail truck yang dipilih |
| Kanan (Fleet List) | Daftar armada dengan search & filter |

### Fitur Peta

- **Auto-refresh** setiap 30 detik
- **Marker clustering** — truck yang berdekatan dikelompokkan
- **Klik marker** untuk melihat detail truck
- **Refresh Sekarang** — refresh manual

### Filter GPS Status

| Status | Warna | Arti |
|--------|-------|------|
| Moving | Hijau | Kendaraan bergerak |
| Idle | Kuning | Kendaraan diam tapi GPS aktif |
| Offline | Abu-abu | GPS tidak mengirim data |
| Belum Terhubung | — | Belum ada mapping Wialon |

### Vehicle Detail (Panel Tengah)

Muncul saat truck dipilih, menampilkan:
- Nama driver
- Wialon Unit ID
- Kecepatan saat ini
- Update GPS terakhir
- Lokasi (alamat hasil reverse geocoding)
- Transaksi aktif (jika ada)
- Repair aktif (jika ada)
- Transaksi terakhir

### Fleet List (Panel Kanan)

- Daftar semua truck dengan status GPS
- Search berdasarkan plat, driver, unit ID, atau rute
- Klik item untuk fokus di peta

## KM Bulanan Truk

Rekap jarak tempuh bulanan per truck berdasarkan data trip Wialon.

### Filter

- **Bulan** — pilih periode YYYY-MM
- **Pencarian** — cari berdasarkan plat, kendaraan, atau unit Wialon

### Summary Cards

| Card | Deskripsi |
|------|-----------|
| Total KM | Total jarak tempuh semua truck |
| Truk Berjalan | Jumlah truck yang punya trip |
| Total Trip | Total jumlah trip semua truck |
| Truk Ditampilkan | Jumlah truck di tabel |

### Tabel Mileage

| Kolom | Deskripsi |
|-------|-----------|
| No Truck | Plat nomor |
| Kendaraan | Jenis kendaraan |
| Total KM | Jarak tempuh bulan itu |
| Trip | Jumlah trip |
| Trip Pertama | Waktu trip pertama |
| Trip Terakhir | Waktu trip terakhir |
| Status | has_trip / no_trip / unlinked / error |

### Export Excel

Klik **Export Excel** untuk download data mileage dalam format `.xlsx`.

## Transaksi — Sales Cost

Halaman utama untuk mengelola transaksi pengiriman.

### Filter & Pencarian

- Filter tanggal (mulai — akhir)
- Pilih kolom pencarian (No SPK, Customer, Driver, dll)
- Kata kunci pencarian
- Filter tahun

### Aksi Tersedia

| Aksi | Fungsi |
|------|--------|
| Tambah Transaksi | Input sales cost baru |
| Import Excel | Import bulk dari file Excel |
| Export Excel | Download data ke Excel |
| Cetak Terpilih | Print SPK untuk transaksi yang dicentang |

### Kolom Tabel

No. SPK, Tanggal Kirim, Customer, Sales, Ops Cost, Gross Profit

### Detail Transaksi

Klik baris untuk melihat detail lengkap termasuk:
- Data pengiriman (truck, driver, customer, area)
- Data biaya (price, ops cost, margin)
- Riwayat geofence pengiriman (jika ada route tracking)

## Transaksi — Subcontractor

Mengelola transaksi yang dikerjakan oleh subcontractor.

### Kolom Tabel

Delivery Date, Nama Subcont, Nama Customer, Warehouse, Nomor Surat Jalan, Sales, Gross Profit

### Aksi

- Tambah Transaksi
- Export Excel
- Edit / Detail / Hapus (admin only untuk hapus)

## Transaksi — Repair

Mengelola data perbaikan kendaraan.

### Akses Role

| Role | Akses |
|------|-------|
| Admin | Full CRUD |
| User | View + Create (tidak bisa edit) |
| Mekanik | Full CRUD |

## Data Transport

Halaman untuk mengelola data historis kendaraan dan supir.

### Data Truck

Data administratif kendaraan: dokumen, masa berlaku, foto.

### Data Chasis

Data chasis/trailer: dokumen, spesifikasi.

### Data Supir

Data administratif supir: dokumen SIM, KTP, foto, masa berlaku.

### Fitur Umum

- Filter tanggal dan pencarian
- Import/Export Excel
- CRUD (Create, Read, Update, Delete)
- Upload dokumen pendukung

## User Profile

- Lihat informasi akun
- Update password
- Update foto profil

## Tips Penggunaan

1. **Gunakan filter** untuk mempersempit data yang ditampilkan
2. **Export Excel** untuk analisis data lebih lanjut
3. **Bookmark halaman** yang sering diakses
4. **Hard refresh** (`Ctrl+Shift+R`) jika tampilan tidak update
5. **Cek Monitoring Kendaraan** untuk overview cepat status armada
