---
title: "BBS (Behavior-Based Safety)"
outline: deep
---

# BBS — Behavior-Based Safety

Modul BBS digunakan untuk pencatatan, pemantauan, dan pelaporan keselamatan kerja berbasis perilaku pada departemen transportasi.

## Akses Modul

| Role | Akses | Tab yang Tersedia | Detail Drawer |
|------|-------|-------------------|---------------|
| **Admin** | ✅ Full | Semua (Dashboard, Observasi, Checklist, Insiden, Riwayat, Alarm ADAS, Kecepatan) | View + Edit + Hapus |
| **Patcher** | ✅ Full | Semua | View + Edit + Hapus |
| **User** | ✅ Terbatas | Dashboard & Riwayat saja | View-only |
| **Mekanik** | ✅ Full | Semua | View + Edit + Hapus |
| **CS** | ❌ | Tidak bisa akses | — |

| Tab | Fungsi Singkat |
|-----|----------------|
| Dashboard | Ringkasan keselamatan bulan terpilih |
| Observasi | Input observasi perilaku berkendara |
| Checklist | Pemeriksaan pra-perjalanan kendaraan |
| Insiden | Pelaporan insiden & near-miss |
| Riwayat | Daftar gabungan observasi manual, checklist, insiden |
| Alarm ADAS | Import & analisis alarm ADAS (dari CSV/XLSX) |
| Kecepatan | Import & analisis pelanggaran kecepatan (dari CSV/XLSX) |

::: warning Riwayat tidak menampilkan data hasil upload
Tab **Riwayat** sengaja **tidak** menampilkan data hasil upload ADAS & Kecepatan agar daftar tetap ringkas —
kedua jenis data itu punya tab sendiri (**Alarm ADAS** dan **Kecepatan**). Export Excel dari Riwayat juga
tidak menyertakan keduanya.

Konsekuensi lain: baris alarm ADAS tidak bisa dibuka/diedit/dihapus lewat endpoint observasi (dijawab `404`),
karena data hasil upload bersifat *read-only* di luar tabnya.
:::

::: tip Patcher
Role Patcher hanya melihat menu BBS + User Profile di sidebar. Setelah login langsung diarahkan ke `/bbs`.
:::

## Pemilihan Bahasa (ID / EN)

Modul BBS mendukung dua bahasa: **Indonesia** dan **English**.

### Cara Menggunakan

1. Klik tombol 🌐 **EN** di pojok kanan atas header BBS
2. Seluruh teks di modul BBS berubah ke bahasa Inggris
3. Klik tombol 🌐 **ID** untuk kembali ke Indonesia

### Yang Berubah

- Semua label form, placeholder, dan validasi
- Tab navigasi (Observasi → Observation, Insiden → Incident, dll)
- Item observasi (8 parameter) dan checklist (16 item)
- Status badge (Lulus → Passed, Perlu Perbaikan → Needs Fix, dll)
- Dashboard metric cards, judul chart, label risiko
- Detail drawer: semua label, tombol aksi
- Export modal, filter dropdown, pagination

### Yang Tidak Berubah

- Data yang tersimpan di database (tetap menggunakan key asli)
- Nama driver, plat kendaraan, dan data master lainnya
- Format tanggal

::: info
Pilihan bahasa bersifat per-sesi. Refresh halaman akan kembali ke bahasa default (Indonesia).
:::

## Dashboard

Halaman ringkasan keselamatan bulan terpilih.

### Metric Cards

| Metric | Deskripsi |
|--------|-----------|
| Safe Behavior Rate | Persentase observasi yang semua parameter "Aman" |
| Observasi Bulan Ini | Total observasi yang tercatat bulan ini |
| Near-Miss Dilaporkan | Jumlah laporan Near-Miss bulan ini |
| Hari Tanpa Insiden | Streak hari tanpa insiden non Near-Miss |

### Charts

- **Tren Safe Behavior (6 bulan)** — line chart persentase aman per bulan + target 85%
- **Kategori Perilaku Berisiko** — bar chart distribusi risiko per kategori

### Top Risiko Perilaku

Daftar 4 perilaku berisiko teratas berdasarkan frekuensi observasi:
- Melebihi batas kecepatan
- Tidak pakai sabuk
- Penggunaan HP saat berkendara
- Jarak aman tidak terjaga

### Filter Bulan

Gunakan month picker untuk melihat data bulan lain. Semua metric dan chart terupdate otomatis.

## Observasi

Form untuk mencatat dan menilai perilaku pengemudi di lapangan.

### Field Form

| Field | Deskripsi |
|-------|-----------|
| Observer | Auto-filled dari nama admin yang login |
| ID Pengemudi | Pilih dari dropdown master driver (searchable) |
| Tanggal | Date picker |
| Lokasi | **Peta interaktif** (map picker) — lihat [Map Picker](#map-picker-lokasi) |
| Jenis Kendaraan | Dropdown: Truk Besar, Truk Sedang, Minibus, Pick-up, Sepeda Motor |

### Penilaian Perilaku (8 Parameter)

Setiap parameter dinilai: **Aman** / **Berisiko** / **Bahaya**

| # | Parameter | Kategori |
|---|-----------|----------|
| 1 | Memakai sabuk pengaman | APD |
| 2 | Kecepatan sesuai batas | Kecepatan |
| 3 | Menjaga jarak aman | Jarak |
| 4 | Tidak menggunakan HP saat berkendara | Distraksi |
| 5 | Mematuhi rambu lalu lintas | Kepatuhan |
| 6 | Kondisi fisik & mental baik | Kondisi |
| 7 | Teknik pengereman benar | Teknik |
| 8 | Tidak merokok saat berkendara | Disiplin |

### Field Tambahan

- **Umpan Balik / Catatan** — textarea
- **Tindak Lanjut** — dropdown: Apresiasi langsung, Coaching on the spot, Pelaporan ke supervisor, Rencana pelatihan

## Checklist Kendaraan

Form pemeriksaan pra-perjalanan harian.

### Field Form

| Field | Deskripsi |
|-------|-----------|
| ID Pengemudi | Searchable dropdown |
| Plat Kendaraan | Dropdown master truck (dengan highlight hijau untuk yang sudah dichecklist hari ini) |

::: warning Satu checklist per plat per hari
Plat yang sudah dichecklist hari ini akan ditandai hijau + badge "Sudah" dan tidak bisa dipilih kembali.
:::

### Item Pemeriksaan (16 item, 3 sub-tab)

#### Mesin & Bahan Bakar (5 item)
- Level oli mesin cukup
- Level air radiator cukup
- Bahan bakar cukup untuk rute
- Tidak ada kebocoran oli/cairan
- Belt / fan belt dalam kondisi baik

#### Keselamatan (6 item)
- Rem utama berfungsi normal
- Rem tangan berfungsi
- Semua lampu berfungsi (depan, belakang, sein)
- APAR tersedia & tidak kadaluarsa
- Sabuk pengaman berfungsi
- Klakson berfungsi

#### Eksterior (5 item)
- Kaca depan bersih & tidak retak
- Ban dalam kondisi baik (termasuk ban serep)
- Spion lengkap & dalam posisi benar
- Body kendaraan tidak ada kerusakan baru
- Wiper berfungsi normal

### Penilaian

Setiap item: **OK** / **NOK** / **N/A**

- Semua 16 item **wajib diisi** sebelum submit
- Skor otomatis dihitung: ≥80% = Lulus (hijau), 50-79% = Perlu Perbaikan (kuning), <50% = merah
- Tab sub-grup berubah hijau secara realtime saat semua item di grup terisi

## Insiden & Near-Miss

Form pelaporan insiden atau kejadian hampir celaka.

### Field Form

| Field | Deskripsi |
|-------|-----------|
| Nama Pelapor | Auto-filled dari nama admin |
| Tanggal Kejadian | Date picker |
| Jenis Laporan | Near-Miss, Insiden Ringan, Insiden Sedang, Insiden Berat |
| Lokasi Kejadian | **Peta interaktif** (map picker) — lihat [Map Picker](#map-picker-lokasi) |
| Plat Kendaraan | Autocomplete dari master truck + bisa input manual |

### Field Kronologi & Analisis

| Field | Deskripsi |
|-------|-----------|
| Kronologi Kejadian | Textarea uraian kronologis |
| Faktor Penyebab | Toggle buttons: Kecepatan, Kelelahan, Cuaca, Jalan Rusak, Perilaku Pengendara Lain, Kendaraan, HP/Distraksi, Lainnya |
| Korban / Kerugian | Textarea |
| Rekomendasi Tindakan | Textarea |

## Riwayat

Halaman gabungan semua data observasi, checklist, dan insiden.

### Filter

| Filter | Fungsi |
|--------|--------|
| Tab jenis | Semua / Observasi / Checklist / Insiden |
| Pencarian | Debounce 300ms, mencari di nama driver, plat, observer |
| Bulan | Month picker (default bulan ini) |
| Status | Dropdown per-jenis (Aman, Lulus, Near-Miss, dll) |

### Pagination

- 15 / 30 / 50 / 100 per halaman
- Navigasi halaman angka

### Export Excel

Klik **Export** → modal popup dengan 3 pilihan:

| Opsi | Deskripsi |
|------|-----------|
| Per Bulan | Export data satu bulan tertentu |
| Per Tahun | Export data satu tahun penuh |
| Semua Data | Export seluruh riwayat BBS |

File `.xlsx` yang dihasilkan berisi 3 sheet: Observasi, Checklist, Insiden.

## Detail & Edit (Drawer)

Klik baris di Riwayat untuk membuka drawer slide-in dari kanan.

### Mode View

- Status badge (Aman/Perlu Perhatian/Lulus/dll)
- Info utama dikelompokkan dalam card
- Penilaian per item ditampilkan

### Mode Edit

- Klik **Edit** untuk mengubah data
- Field berubah menjadi input form
- **Simpan** / **Batal** untuk konfirmasi

### Hapus

- Klik **Hapus** → dialog konfirmasi → data dihapus permanen
- Role `user` tidak melihat tombol Edit & Hapus (view-only)

## Map Picker (Lokasi) {#map-picker-lokasi}

Halaman Observasi dan Insiden menggunakan peta interaktif untuk menandai lokasi kejadian/pengamatan.

### Cara Menggunakan

#### 1. Klik di Peta

Klik langsung pada titik di peta → pin akan muncul → sistem otomatis mengambil alamat lokasi tersebut.

#### 2. Cari Alamat

1. Ketik nama tempat di kolom pencarian (minimal 3 karakter)
2. Tunggu saran lokasi muncul (max 5 hasil)
3. Pilih dari daftar saran (klik atau gunakan ↑↓ + Enter)
4. Peta akan fly ke lokasi tersebut dan pin otomatis terpasang

#### 3. Gunakan Lokasi Saya

Klik tombol **Lokasi Saya** → browser akan minta izin GPS → peta fly ke posisi Anda.

#### 4. Geser Pin

Pin marker bisa di-drag ke posisi lain → alamat akan di-update otomatis.

### Memperbesar Peta

Klik tombol **Perbesar** di pojok kanan bawah peta untuk memperluas area peta (240px → 460px). Klik **Perkecil** untuk kembali ke ukuran compact.

### Data yang Tersimpan

| Data | Keterangan |
|------|-----------|
| Alamat | Teks alamat hasil reverse geocode |
| Latitude | Koordinat lintang |
| Longitude | Koordinat bujur |

::: tip
Alamat diperoleh otomatis dari koordinat. Jika layanan geocode tidak tersedia, koordinat akan tetap tersimpan dan bisa di-resolve kemudian.
:::

::: warning
Pastikan browser mengizinkan akses lokasi jika ingin menggunakan tombol "Lokasi Saya".
:::

## Tab Alarm ADAS

Tab untuk mengimpor dan menganalisis alarm ADAS/DMS yang berasal dari perangkat kamera
kendaraan (mengantuk, distraksi, pelanggaran lajur, risiko tabrakan, dsb.).

### Import Alarm

| Field | Keterangan |
|-------|-----------|
| Format file | `.csv` atau `.xlsx` (maksimal **10 MB**) |
| Kolom wajib | `Device ID`, `Device Name`, `Alarm Type`, `Begin Time`, `Start Position` |

- **Device Name** dipakai sebagai **nomor plat** kendaraan.
- Baris dengan kombinasi `Device ID + Begin Time + Alarm Type` yang sama dianggap **duplikat** dan dilewati.
- Alarm yang beruntun dengan tipe sama dalam **≤ 60 detik** dihitung sebagai satu burst (`dedup_burst`).
- Hasil import menampilkan: berhasil diimpor, beruntun (dedup), duplikat, driver belum terdaftar, gagal.

### Daftar Alarm

Kolom yang ditampilkan: **Waktu, Plat, Tipe Alarm, Driver, Lokasi**.

| Filter | Fungsi |
|--------|--------|
| Plat kendaraan | Pencarian sebagian (ketik lalu Enter) |
| Tanggal | Date picker `date_from` |
| Tipe Alarm | Dropdown 8 tipe standar |

### Chart Breakdown Alarm per Tipe (dengan filter kendaraan)

Diagram batang jumlah alarm per tipe untuk bulan terpilih.

**Filter kendaraan (multi-pilih):**
1. Klik tombol **Kendaraan** → muncul daftar plat yang **benar-benar punya data ADAS** beserta jumlah alarmnya
2. Centang kendaraan yang ingin dibandingkan — **maksimal 6 kendaraan**
3. Chart berubah menjadi *grouped bar*: satu batang berwarna per kendaraan, plus legenda
4. Klik **Semua Kendaraan** atau **Hapus filter kendaraan** untuk kembali ke tampilan agregat

::: tip Filter terpadu
Pilihan kendaraan mengendalikan **chart dan daftar alarm sekaligus** — jadi angka di chart dan baris
di tabel selalu konsisten. Bila memilih lebih dari 6 kendaraan, sistem menampilkan peringatan dan
menolak pilihan ke-7.
:::

## Tab Kecepatan

Tab untuk mengimpor dan menganalisis pelanggaran kecepatan (`overspeed`) dari file GPS tracker.

### Import Data Kecepatan

| Field | Keterangan |
|-------|-----------|
| Format file | `.csv` atau `.xlsx` (maksimal **10 MB**) |
| Kolom wajib | `Device ID`, `Device Name`, `Creation Time`, `Speed` |

Setelah import, kartu hasil menampilkan jumlah baris tersimpan, event beruntun, duplikat, driver belum
terdaftar, dan **persentase penghematan penyimpanan** (lihat [Penyimpanan Data](#penyimpanan-data) di bawah).

### Filter Bulan (satu filter untuk seluruh tab)

Kartu **Ringkasan Kecepatan** memiliki **satu** month picker yang mengendalikan:
ringkasan, chart Tren, chart Pelanggaran per Kendaraan, **dan** daftar pelanggaran. Mengubah bulan
sekali akan menyegarkan semuanya.

### Ringkasan Kecepatan

| Kartu | Arti |
|-------|------|
| Total Pelanggaran | Jumlah event overspeed pada bulan terpilih |
| Kendaraan Terlibat | Jumlah kendaraan yang punya event |
| Rata-rata Kelebihan | Rata-rata `kecepatan maks − batas` (km/j) |
| Maks. Kelebihan | Kelebihan tertinggi (km/j) |
| Pelanggar Terbanyak | Plat dengan event terbanyak |

### Chart Tren Pelanggaran Kecepatan

Diagram batang jumlah pelanggaran **per tanggal** dalam bulan terpilih. Bila Anda memilih beberapa
kendaraan pada filter, chart berubah menjadi *grouped bar* per kendaraan.

### Chart Pelanggaran per Kendaraan

Diagram batang jumlah pelanggaran **per kendaraan** (sumbu X = plat, urut terbanyak). Arahkan kursor
ke batang untuk melihat jumlah pelanggaran dan **jumlah hari** kendaraan tersebut melanggar.

::: info Perbandingan & batas
Filter kendaraan pada tab ini juga **terpadu**: pilihan yang sama mengendalikan chart Tren,
chart Pelanggaran per Kendaraan, dan daftar pelanggaran. Maksimal **6 kendaraan**.
:::

### Daftar Pelanggaran Kecepatan

Kolom: Waktu, Plat, Driver, Kecepatan (km/j), Batas (km/j), Kelebihan, Lokasi. Baris dengan
kelebihan > 20 km/j ditandai badge merah.

## Pengaturan Kecepatan <Badge type="warning" text="Admin" />

Kartu *Pengaturan Kecepatan* di tab Kecepatan mengatur ambang batas overspeed global.

| Item | Keterangan |
|------|-----------|
| Batas Kecepatan Default | Ambang overspeed dalam **km/j** — rentang **20–200** |
| Tombol Simpan | Menyimpan ambang baru |

- Perubahan yang belum disimpan ditandai badge **"Belum disimpan"** pada judul kartu.
- Bila nilai di luar rentang, muncul pesan merah dan penyimpanan dibatalkan (**validasi di klien**, tanpa perlu menunggu server).
- Setelah tersimpan, muncul notifikasi sukses.

::: warning Ambang batas memengaruhi penyimpanan data
Ambang batas dipakai saat **import** untuk menentukan baris mana yang disimpan pada resolusi penuh.
Mengubah ambang batas **tidak otomatis** menghitung ulang data lama — ada proses *recompute* terpisah
yang hanya akurat pada detail yang masih tersimpan.
:::

## Retensi Data <Badge type="warning" text="Admin" />

Kartu *Retensi Data* untuk menghapus data lama secara terkendali. **Hanya admin** yang melihat kartu ini.

| Kolom | Arti |
|-------|------|
| ADAS (hari) | Umur maksimum data alarm ADAS |
| Speed (hari) | Umur maksimum data kecepatan |
| Pratinjau | Menghitung **berapa baris** yang akan terhapus (tidak mengubah apa pun) |
| Hapus Data | Menjalankan penghapusan untuk modul tersebut |

### Cara Kerja

1. Isi jumlah hari pada modul yang diinginkan (**0 = nonaktif**, tidak ada yang dihapus)
2. Klik **Pratinjau** untuk melihat dampaknya — angka yang ditampilkan memakai nilai di kotak input
3. Klik **Hapus Data** → sistem menampilkan **modal konfirmasi** berisi jumlah nyata yang akan terhapus
   dan peringatan bahwa tindakan ini **permanen**
4. Tekan **Konfirmasi** untuk mengeksekusi, atau **Batal** untuk membatalkan tanpa efek apa pun

::: info Pratinjau "0" itu normal
Retensi menghapus data yang **lebih tua dari N hari**. Bila data tertua Anda belum melewati N hari,
hasilnya **0 baris** — bukan error. Pesan pratinjau akan menyebutkan total data dan umur data tertua
supaya jelas.
:::

### Dampak

- **ADAS** — menghapus baris alarm; observasi manual di tabel yang sama **tidak pernah** tersentuh
- **Speed** — menghapus telemetry, event, dan agregat harian di luar rentang
- Setiap penghapusan **dicatat di audit log** (`bbs_retention_purge`) berisi admin, modul, dan jumlah baris
- Nilai retensi yang dipakai saat menghapus **otomatis tersimpan** sebagai kebijakan baru

::: danger Penghapusan bersifat permanen
Data yang terhapus tidak bisa dikembalikan dari dalam aplikasi. Data Speed masih dapat dipulihkan
dengan meng-import ulang file sumber aslinya; data ADAS dengan meng-import ulang file alarm.
Pastikan Anda sudah memeriksa **Pratinjau** sebelum mengonfirmasi.
:::

## Penyimpanan Data

Agar database tidak membengkak, sistem **tidak menyimpan seluruh titik GPS**. Ringkasannya:

| Aturan | Penjelasan |
|--------|-----------|
| Baris di atas ambang batas | Selalu disimpan pada resolusi penuh (setiap titik) |
| Baris bergerak di bawah ambang | Disimpan **satu sampel per 3 menit** (dapat diatur admin) |
| Baris idle (ACC mati / kecepatan ~0) | Tidak disimpan sama sekali |

Hasil pada data nyata: **±87% lebih sedikit baris** (contoh: 12.378 → 1.562 baris untuk satu truk
selama 14 hari) **tanpa mengubah** total durasi pelanggaran, kecepatan maksimum, maupun jumlah event
yang dipakai untuk skor.

::: tip Ukuran file tidak menyusut otomatis
`DELETE` di MySQL hanya menandai ruang sebagai dapat dipakai ulang — file tabel baru benar-benar
menyusut setelah tabel dibangun ulang (`OPTIMIZE TABLE`). Operasi ini dijalankan otomatis sebagai
bagian dari pembersihan besar, bukan setiap import.
:::
