---
title: "Dashboard Overview"
outline: deep
---

# Dashboard Overview

## Ringkasan Dashboard

Dashboard adalah halaman utama setelah login. Menampilkan ringkasan performa operasional dan finansial dalam satu layar, termasuk metrik penjualan, biaya, dan aktivitas terbaru.

### Komponen Utama

Dashboard terdiri dari beberapa section yang bisa di-collapse/expand:

1. **Ringkasan Dashboard** — Metrik utama dan grafik ringkasan
2. **Expiry Alerts** — Peringatan dokumen/lisensi yang akan expired
3. **Statistics Sales Cost** — Grafik tren Sales Cost
4. **Statistics Subcontractor Cost** — Grafik tren Subcontractor

## Ringkasan Metrik (Sales Cost Summary)

### Filter Bulan & Tahun

- Pilih bulan dan tahun menggunakan dropdown di bagian atas
- Perubahan filter memperbarui semua metrik dan grafik secara otomatis
- Tersedia tombol **Print Ringkasan** untuk mencetak laporan bulan terpilih

### Metrik yang Ditampilkan

| Metrik | Deskripsi |
|--------|-----------|
| Sales | Total pendapatan periode terpilih |
| Total Cost | Total biaya operasional |
| Gross Profit | Selisih antara Sales dan Total Cost |

### Indikator Perubahan

- Menampilkan persentase perubahan dibanding periode sebelumnya
- Warna hijau = naik, merah = turun

## Monthly Target

Grafik target bulanan menampilkan perbandingan realisasi vs target per bulan dalam satu tahun.

## Monthly Sale

Grafik penjualan bulanan menampilkan volume transaksi Sales Cost dan Subcontractor per bulan.

## Customer Demographic

Menampilkan sebaran pelanggan berdasarkan lokasi/area untuk memahami fokus pasar.

## Recent Orders

Daftar transaksi terbaru yang masuk ke sistem.

## Expiry Alerts

Peringatan otomatis untuk dokumen kendaraan atau lisensi yang mendekati masa berlaku habis. Membantu admin mengambil tindakan sebelum expired.

## Statistics Sales Cost

Grafik area yang menampilkan tren:
- **Sales** (pendapatan)
- **Total Cost** (biaya)
- **Gross Profit** (margin)

Filter tersedia: Monthly, Quarterly, Annually.

## Statistics Subcontractor Cost

Grafik serupa untuk transaksi subcontractor dengan format yang sama.

## Interaksi Dashboard

- **Collapse/Expand**: Klik tombol panah untuk menyembunyikan/menampilkan section
- **Collapse All / Expand All**: Tombol cepat untuk semua section sekaligus
- **Print Ringkasan**: Mencetak section ringkasan dengan format yang rapi
- State collapse/expand tersimpan di browser (localStorage)

## Akses Berdasarkan Role

| Role | Akses Dashboard |
|------|----------------|
| Admin | Full access — semua section dan metrik |
| User | Full access — semua section dan metrik |
| Mekanik | Full access — semua section dan metrik |
| CS | Tidak bisa akses Dashboard, redirect ke Schedule Pengiriman |
