---
title: "Changelog"
outline: deep
---

# Changelog V_1.04 <Badge type="info" text="Latest" />

## 19 Juni 2026

### BBS Module — Multi-Language Support (ID/EN)

- Ditambahkan toggle bahasa Indonesia / English di modul BBS
- Tombol toggle (🌐 EN/ID) di header BBS
- Semua teks UI reactive: labels, placeholders, status badges, chart titles, toast messages
- Lightweight composable approach (tanpa library i18n eksternal)
- File baru: `src/composables/useBbsLang.ts`

### BBS Module — Enhancements

- BBS dipindah ke sidebar utama (di bawah grup Transaksi)
- Role User: akses terbatas ke Dashboard & Riwayat (view-only)
- Dashboard: filter bulan untuk semua metric/chart
- Riwayat: pagination (15/30/50/100), export Excel modal
- Checklist: dropdown truck dengan highlight hijau (sudah dichecklist hari ini)
- Detail Drawer: redesign card grouping + status badge
- Toast notification: dipindah bottom-right, redesign dengan icon per variant

### Export Excel Modal (Global)

- Sales Cost, Subcontractor, Repair: modal popup (Per Bulan / Per Tahun / Semua Data)
- Acuan tanggal: Sales Cost → DO, Subcontractor → Pengerjaan, Repair → Kerusakan

### Detail Sales Cost Redesign

- Replaced input readonly dengan structured card sections
- Ditambahkan Print button

### Production Build & Cloudflared

- Backend serve frontend build dari `dist/`
- Cloudflared tunnel: `sankyu-transport.fun` → `localhost:3000`

---

# Changelog V_1.03 <Badge type="tip" text="Production" />

## fungsi input data di halaman
- $nik_admin = $_POST['nik_admin']; tapi nama kolom di DB Mysql adalah nik_admin, karena scriptnya sudah berubah seharusnya diganti ke 'id_admin'

- tolong ubah nama kolom di Mysql menjadi 'id_admin' di aplikasi versi 0.02

## Menambahkan satu kolom baru di Halaman Sales Cost, yaitu Ketika Jenis Kendaraan = HB then muncul kolom baru Container Size
- Menambahkan satu kolom baru di Database 'trucking/sales_cost'
- Masuk ke 'Structure' > Add '1' column(s) 'after jenis_trip' / GO
- Name = 'container_size' > Type = 'VARCHAR' > Length/Values = '20' > Default = 'None' > Null = 'Checked' > Save

<br><br>

# Migrasi ke Node.JS dan Vue.JS, DB (phpMyAdmin) jadi masih dibutuhkan running fitur MySQL di XAMPP

## Running Node. JS dan Vue.JS di Local
- cd c:\xampp\htdocs\transport_v1.03\tailadmin-vuejs-1.0.0 
> npm run dev
- cd C:\xampp\htdocs\transport_v1.03\node_backend 
> npm start

## Install Mongodb Windows 11
- [Youtube Tutorial.](https://www.youtube.com/watch?v=rCGpx_qb1y0)

## Install Mongodb at Node Backend
C:\xampp\htdocs\transport_v1.03\node_backend
> npm list mongoose <br>
> npm install mongoose

## Pastikan ubah alamat IP Host di Front End folder : C:\xampp\htdocs\transport_v1.03\tailadmin-vuejs-1.0.0
- .env.local (*pastikan type 'LOCAL File')
- VITE_API_URL=http://192.168.60.29:3000 (ganti host 192.168... dengan IP Host Server)

## untuk running baru di Production (Host Server) 
- cd c:\xampp\htdocs\transport_v1.03\tailadmin-vuejs-1.0.0 
> npm run dev -- --host 0.0.0.0

## Halaman Repair, ubah ke DB trucking.repair kolom pada table :
- MODIFY tgl_kerusakan DATE NULL;
- MODIFY jadwal_berkala DATE NULL;

## Jalankan Vitepress di
cd C:\xampp\htdocs\transport_v1.03\docs
- Localhost 
> npm run dev

- Network in Local
> npm run dev -- --host 0.0.0.0

## ganti script 'lastUpdated:' di C:\xampp\htdocs\transport_v1.03\docs\.vitepress
ubah dari 'true' menjadi 'false'

## Ubah policy powershell ke Administrator
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned