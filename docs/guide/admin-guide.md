---
title: "Admin Guide"
outline: deep
---

# Admin Guide

Panduan khusus untuk administrator sistem TMS. Admin memiliki akses penuh ke semua modul termasuk Master Data dan manajemen pengguna.

## Peran Admin

- Mengelola seluruh master data (truck, driver, customer, area, warehouse, subcont, admin)
- Mengelola transaksi (Sales Cost, Subcontractor, Repair)
- Mengelola user dan hak akses
- Monitoring armada dan GPS
- Import/export data bulk
- Aktivasi/deaktivasi truck dan driver
- Akses penuh ke modul BBS (semua tab + edit + hapus)
- Membuat akun Patcher untuk petugas BBS lapangan

## Master Data

### Master Truck

**Path:** `/master/trucks`

#### Fitur

| Aksi | Deskripsi |
|------|-----------|
| Tambah Truck | Input data truck baru |
| Edit | Ubah data truck existing |
| Import Excel | Import bulk dari template |
| Auto Mapping Wialon | Otomatis mapping truck ke unit GPS Wialon |
| Aktifkan/Nonaktifkan | Soft disable truck dari operasional |
| Hapus | Hard delete (permanen) |

#### Field Data

- Jenis Kendaraan
- No Police (plat nomor)
- Wialon Unit ID (mapping GPS)
- Merk Mobil
- Model
- Type Truck

#### Status Aktif/Nonaktif

- **Aktif**: Muncul di dropdown operasional, GPS map, dan bisa digunakan transaksi baru
- **Nonaktif**: Tetap muncul di Master Truck, tetap muncul di historical records, tapi tidak muncul di dropdown operasional dan GPS

> **Penting:** Gunakan Nonaktifkan (bukan Hapus) jika truck masih punya historical records yang perlu ditampilkan.

### Master Driver

**Path:** `/master/drivers`

Sama seperti Master Truck dengan field:
- Nama Supir
- Alamat
- No HP
- Status aktif/nonaktif

#### Status Aktif/Nonaktif Driver

- **Aktif**: Muncul di dropdown Sales Cost, template import, Data Supir
- **Nonaktif**: Tetap di Master Driver, tetap di historical records, tidak muncul di operasional

### Master Customer

**Path:** `/master/customers`

Field: Nama Customer, Alamat, Kontak.

### Master Area

**Path:** `/master/areas`

Field:
- Kode Area
- Nama Area (auto-generated dari route steps)
- Route Steps (urutan geofence Wialon untuk tracking)
- Finish Geofence (geofence akhir untuk menandai selesai)

#### Route Step Configuration

Area bisa dikonfigurasi dengan route steps yang di-mapping ke geofence Wialon. Ini memungkinkan tracking otomatis progress pengiriman.

### Master Warehouse

**Path:** `/master/warehouses`

Field: Nama Warehouse, Alamat.

### Master Subcont

**Path:** `/master/subconts`

Field: Nama Subcontractor, Alamat, Kontak.

### Master Admin

**Path:** `/master/admins`

Mengelola akun pengguna sistem.

Field:
- Username
- Password
- Level (admin / user / mekanik / cs)
- Nama
- Foto profil

#### Level Pengguna

| Level | Akses |
|-------|-------|
| `admin` | Semua fitur |
| `user` | Semua kecuali Master Data dan edit Repair |
| `mekanik` | Dashboard, Data Transport, Repair only |
| `cs` | Schedule Pengiriman dan Profile only |

## Import & Export Data

### Import Excel

Tersedia di: Master Truck, Master Driver, Sales Cost

1. Klik **Import Excel**
2. Download template terlebih dahulu (jika belum punya)
3. Isi data sesuai format template
4. Upload file Excel
5. Sistem akan validasi dan import data

> **Catatan:** Import Sales Cost akan reject truck/driver yang nonaktif.

### Export Excel

Tersedia di: Sales Cost, Subcontractor, Data Truck, Data Chasis, Data Supir, KM Bulanan Truk

Klik **Export Excel** untuk download data yang sedang ditampilkan (sesuai filter aktif).

## Manajemen Transaksi

### Sales Cost

#### Membuat Transaksi Baru

1. Klik **Tambah Transaksi** atau buka `/sales-cost/new`
2. Isi data: Truck, Driver, Customer, Area, tanggal delivery/arrival
3. Isi data biaya: Price, Ops Cost, dll
4. Simpan

#### Edit Transaksi

- Bisa mengubah semua field
- Truck/driver nonaktif yang sudah ter-assign tetap bisa dipertahankan
- Tapi tidak bisa ganti ke truck/driver nonaktif lain

#### Print SPK

- **Single**: Klik aksi Print pada baris transaksi
- **Bulk**: Centang beberapa transaksi → klik **Cetak Terpilih**

#### Detail dengan Route History

Jika area punya route steps dan truck punya GPS mapping, detail Sales Cost menampilkan:
- Planned route steps
- Visited steps (dengan timestamp)
- Pending steps
- Badge untuk kunjungan out-of-order

### Subcontractor

CRUD transaksi subcontractor. Hanya admin yang bisa menghapus.

### Repair

Semua role (admin, user, mekanik) bisa membuat repair. Hanya admin dan mekanik yang bisa edit.

## GPS & Monitoring

### Auto Mapping Wialon

Di Master Truck, klik **Auto Mapping Wialon** untuk otomatis mengisi `wialon_unit_id` berdasarkan pencocokan plat nomor dengan unit di Wialon.

### Geofence Tracking

Tracking otomatis berjalan di background:
- Sistem polling Wialon setiap 60 detik
- Jika truck masuk geofence yang di-mapping ke route step, dicatat otomatis
- Setelah semua step selesai dan truck masuk finish geofence, dicatat "Finish Order"

### Troubleshooting GPS

| Masalah | Solusi |
|---------|--------|
| Truck tidak muncul di peta | Cek apakah truck aktif dan punya `wialon_unit_id` |
| Semua truck offline | Cek token Wialon di backend `.env` |
| Alamat tidak muncul | Cek quota Geoapify atau clear localStorage |
| Mileage "Invalid GPS Mapping" | Jalankan Auto Mapping ulang |

## Keamanan & Best Practices

### Password

- Gunakan password kuat untuk semua akun
- Rotasi password secara berkala
- Jangan share akun antar pengguna

### Data Integrity

- Validasi data sebelum import
- Gunakan Nonaktifkan (bukan Hapus) untuk truck/driver yang masih punya history
- Backup database secara rutin

### Audit

- Perhatikan siapa yang membuat/mengubah transaksi
- Cek notifikasi untuk aktivitas penting
- Review data secara berkala untuk konsistensi

## Troubleshooting Admin

| Masalah | Solusi |
|---------|--------|
| User tidak bisa login | Verifikasi username/password, cek status akun |
| User tidak bisa akses menu | Cek level/role user di Master Admin |
| Data tidak tersimpan | Cek validasi input, pastikan field wajib terisi |
| Import gagal | Cek format Excel sesuai template, pastikan referensi valid |
| Grafik dashboard kosong | Pastikan ada data di periode yang dipilih |
| Truck tidak muncul di dropdown | Cek apakah truck berstatus Aktif |
| Driver tidak muncul di dropdown | Cek apakah driver berstatus Aktif |
