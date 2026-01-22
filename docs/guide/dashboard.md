---
title: "Dashboard Overview"
outline: deep
---

# Dashboard Overview <Badge type="tip" text="^0.3" />

## Ringkasan Dashboard
Dashboard menampilkan ringkasan performa operasional dan finansial dalam satu layar. Informasi disusun agar pengguna dapat memantau tren, perbandingan biaya, serta aktivitas terbaru tanpa berpindah halaman.

## Sales Cost Summary
Ringkasan Sales Cost memberikan gambaran kinerja penjualan dan biaya operasional.

### Filter bulan & tahun
- Pilih bulan dan tahun untuk melihat ringkasan periode tertentu.
- Perubahan filter akan memperbarui nilai ringkasan secara otomatis.

### Indikator persentase perubahan
- Menampilkan perubahan Gross Profit dibanding periode sebelumnya.
- Warna indikator membantu membaca tren naik atau turun.

## Subcontractor Summary
Ringkasan Subcontractor menampilkan total transaksi subcontractor dan pola tren biaya terkait.

## Monthly Sales Transaction
Grafik transaksi bulanan menampilkan volume transaksi berdasarkan periode.

### Grafik bulanan
- Menunjukkan perbandingan Sales Cost dan Subcontractor per bulan.
- Membantu identifikasi tren naik atau turun.

### Filter tahun
- Tersedia filter tahun untuk menampilkan data historis.
- Pergantian tahun akan memperbarui data grafik.

## Detail Sales Cost (Monthly)
Detail Sales Cost (Monthly) menampilkan angka kunci untuk periode terpilih:
- Sales
- Total Cost
- Gross Profit

## Truck Transaction Average
Bagian ini menampilkan jumlah transaksi yang diterima atau di assign ke masing-masing truck dalam 1 bulan

### Persentase Chart
- Loading chart mengacu kepada persentase penggunaan truk dalam satu bulan
> 21/jumlah transaksi *100 = (menampilkan Persen)


## Calendar Event List
Daftar event kalender menampilkan aktivitas yang relevan dengan operasional.

### Informasi utama
- Event
- Date/Time
- Created by
- Ownership

### Filter & See All
- Filter periode untuk membatasi event yang tampil.
- Tombol See All menuju halaman kalender lengkap.

## Filter & Interaksi Dashboard
- Filter periode membantu fokus pada data yang relevan.
- Komponen grafik dapat dipantau tanpa reload halaman.
- Ringkasan dan statistik diperbarui mengikuti perubahan filter.

## Peran Pengguna
Dashboard digunakan oleh beberapa peran berikut:

### Admin
Mengelola data dan memantau keseluruhan performa.

### Manager
Memantau KPI, tren biaya, dan performa tim.

### Finance
Menganalisis biaya, margin, dan tren profit.

### Operation
Memantau transaksi harian dan status pengiriman.

## Tujuan Penggunaan Dashboard
- Memberikan ringkasan cepat untuk pengambilan keputusan.
- Menyajikan tren biaya dan pendapatan dalam satu tampilan.
- Mempermudah pemantauan aktivitas operasional.

## Catatan Pengembangan
- Pastikan data backend konsisten agar grafik tetap akurat.
- Tambahkan validasi jika ada perubahan skema data.
- Dokumentasikan perubahan indikator jika ada penyesuaian bisnis.
