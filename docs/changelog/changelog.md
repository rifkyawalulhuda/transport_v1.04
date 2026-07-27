---
title: "Changelog"
outline: deep
---

# Changelog V_1.04 <Badge type="info" text="Latest" />

## 27 Juli 2026

### GPS Trail Playback — Phase 2B: Time Scrubber

Fitur playback animasi posisi truck di peta GPS trail.

- Tombol **Play/Pause** + speed selector 1× / 2× / 4×
- **Range slider** untuk scrub ke waktu tertentu (per index titik GPS)
- Marker truck bergerak sepanjang trail + **progress polyline** biru
- Full trail tetap tampil (opacity redup) untuk referensi
- Auto-pause di akhir trail
- Timer dibersihkan saat destroy/reload map

---

### Geofence Guards — Fix #44442 & #44415

Dua guard baru di `assignStopHits` untuk mencegah false positive:

**Fix #44442 — Departure Pre-Window Guard**
- **Masalah:** Truk kembali ke base dari trip sebelumnya 11.8 jam sebelum planned departure SPK baru. Re-entry tersebut ter-assign sebagai Departure → memicu false finish.
- **Fix:** Entry Departure yang terjadi lebih dari 8 jam sebelum planned departure ditolak.
- **Env:** `GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC` (default 28800 = 8 jam)

**Fix #44415 — Same-Zone Inter-Stop Gap Guard**
- **Masalah:** Rute shuttle KIIC→GIIC→KIIC. Tujuan 3 (zone KIIC) hit jam 09:37:31. Tujuan 5 (zone sama) ter-assign 67 detik kemudian — truk belum pindah ke GIIC.
- **Fix:** Hit ke-2 di zone yang sama ditolak jika gap < 10 menit dari hit sebelumnya.
- **Env:** `GEOFENCE_SAME_ZONE_MIN_INTER_STOP_GAP_SEC` (default 600 = 10 menit)

Unit tests: 29 test cases di `node_backend/scripts/test-geofence-assign.js`.

---

### Fitur Backfill Geofence

Ketika geofence stop diubah di tengah perjalanan, sistem menawarkan pencarian hit GPS retroaktif.

**Cara kerja:**
1. User edit SPK dan ganti `wialon_zone_id` sebuah tujuan
2. Setelah save, dialog muncul: "Ingin mencari hit GPS untuk zone baru?"
3. User pilih **Cek GPS & Backfill** → sistem fetch data GPS Wialon → insert hit jika ditemukan
4. Jika GPS tidak ada, user bisa input waktu manual

**Endpoint baru:** `POST /api/sales-costs/:id/backfill-stop`
- GPS-based: `{ id_sc_stop }` → fetch Wialon messages → `assignStopHits` → INSERT
- Manual: `{ id_sc_stop, manual: true, manual_gps_time }` → INSERT dengan `is_manual=1`
- Idempotent: skip jika stop sudah ter-hit

**PUT response:** Sekarang menyertakan `geofence_changed_stops[]` jika zone_id berubah.

**UI:**
- Dialog post-save di `EditSalesCost.vue` (6 state: idle/loading/found/not_found/already_hit/error)
- Tombol "Cari Hit GPS" di `DetailSalesCost.vue` per middle stop yang belum ter-hit

---

### Perbaikan: Double Alamat di Peta Lokasi Truk

Panel **Lokasi** di halaman Peta Lokasi Truk tidak lagi menampilkan alamat yang sama dua kali. Root cause: template merender `selectedTruckLocationValue` dan `selectedTruckAddress` secara terpisah padahal keduanya berisi nilai yang sama.

---

## 25 Juli 2026

### GPS Trail Playback — Phase 1 & 2A

**Phase 1 — Trail Dasar:**
- Section **Rute GPS Aktual** di halaman Detail Sales Cost
- Polyline trail biru dari GPS Wialon + hit geofence aktual
- Window: `departure − 2 jam` hingga finish/sekarang
- Downsample hingga 800 titik (env `GPS_TRAIL_MAX_POINTS`)
- Expand/collapse height (300px / 520px)

**Phase 2A — Polygon + Layer Toggle:**
- Polygon fill geofence per stop (oranye = Tujuan, ungu = Departure, abu = Finish)
- Pin badge bernomor: D / 1 / 2 / 3 / F
- 4 chip toggle: **Trail GPS** / **Tujuan** / **Polygon** / **Hit aktual**
- Polygon di-simplify (max 80 vertex, env `GPS_TRAIL_POLYGON_MAX_POINTS`)
- `fitBounds` mencakup semua layer

File baru: `node_backend/services/gpsTrailGeometry.js`

---

### Subcontractor — Jadwal Manual, CS Access, Export, Print

- **Jadwal pengiriman manual** per stop (Departure / Tujuan / Finish) dengan datetime estimasi — tanpa GPS/geofence
- **Akses CS:** list, create, edit, detail, print Subcontractor
- **Export Excel:** satu baris per transaksi, kolom per stop (Departure/Tujuan 1..N/Finish: Nama + Waktu)
- **Print A4 Portrait:** Laporan Subcontractor — ringkasan operasional + tabel jadwal; tanpa data keuangan
- **Detail page:** tampil Dibuat Oleh (nama + NIK)

---

### Schedule Export — Kolom Durasi

Export jadwal pengiriman (Excel) mendapatkan kolom baru:
- **Jumlah Hari (Aktual):** durasi actual departure → finish dalam format "X hari Y jam Z mnt"
- **Selisih Waktu (Est vs Aktual)** per stop: signed duration, positif = terlambat dari estimasi



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

## 20 Juni 2026

### BBS Location Map Picker (Observasi & Insiden)

- Kolom "Lokasi" di halaman Observasi dan Insiden diganti dengan **peta interaktif** (Leaflet + OpenStreetMap)
- Komponen reusable baru: `BbsLocationPicker.vue`
- Fitur:
  - Klik peta → pin + reverse geocode → alamat lengkap
  - Search autocomplete (debounce 350ms, max 5 saran, keyboard navigation)
  - Tombol "Lokasi Saya" (GPS browser)
  - Marker bisa di-drag → re-geocode otomatis
  - Expand/collapse ukuran peta (240px ↔ 460px)
  - Double fallback geocode: Geoapify → Nominatim → koordinat
  - Custom inline SVG pin icon (tidak bergantung pada file external)
- Database: `latitude` + `longitude` ditambahkan ke `bbs_observations` dan `bbs_incidents`
- `location` column diperbesar ke VARCHAR(500)
- Detail Drawer: lokasi insiden di-resolve via reverse geocode

### Detail Subcontractor Redesign

- Layout diubah dari `<input readonly>` ke structured card sections
- Sections: Info Utama, Kendaraan, Timeline, Rincian Biaya + Gross Profit indicator

### Detail Repair Redesign

- Layout diubah dari `<input readonly>` ke structured card sections
- Sections: Info Utama, Timeline, Detail Kerusakan, Biaya Perbaikan
- Status badge: compact dot indicator (Selesai/Proses)

### Bug Fixes

- Fix: tombol Edit Observasi tidak merespon (computed ref tanpa `.value`)
- Fix: dropdown driver tertutup map frame (z-index stacking context)
- Fix: autocomplete suggestions tertutup map (z-index hierarchy)
- Fix: error "Data too long" saat simpan insiden (VARCHAR(100) → 500)
- Fix: marker icon rusak di production build (inline SVG, bukan external PNG)

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