# PRD: BBS (Behavior-Based Safety) — Departemen Transportasi

## 1. Ikhtisar Produk

**Nama Aplikasi:** BBS — Departemen Transportasi (*Behavior-Based Safety System*)  
**Jenis:** Aplikasi web single-page (SPA) untuk pencatatan, pemantauan, dan pelaporan keselamatan kerja berbasis perilaku pada departemen transportasi.  
**Target Pengguna:** Korlap / Patcher (input data), Customer (melihat laporan online).  

> **Catatan Penting:**
> - Semua input data dilakukan **manual** oleh Korlap/Patcher.
> - Aplikasi harus **online** agar dapat ditampilkan ke Customer.
> - Perlu dipertimbangkan integrasi dengan `transport_app` yang sudah ada, khususnya untuk mengambil data supir dari database yang sudah tersedia.

---

## 2. Arsitektur & Teknologi (berdasarkan mockup)

| Aspek | Detail |
|-------|--------|
| **Arsitektur** | Single-file HTML dengan CSS & JS inline |
| **CSS Framework** | Custom CSS dengan CSS Custom Properties (variabel tema dari container induk) |
| **Ikon** | Tabler Icons (class `ti ti-*`) |
| **Chart** | Chart.js v4.4.1 (CDN) |
| **Lokalisasi** | Dua bahasa: Indonesia (default) & Inggris |
| **Penyimpanan Data** | Saat ini in-memory (`history_data` array), perlu diganti dengan backend + database |
| **Responsivitas** | Mobile-friendly dengan CSS Grid `auto-fit` dan `minmax` |

---

## 3. Modul & Fitur Rinci

### 3.1 Modul Dashboard

Halaman ringkasan yang menampilkan metrik keselamatan secara sekilas.

#### 3.1.1 Metric Cards (4 kartu)

| Metrik | Sumber Data | Visual |
|--------|------------|--------|
| **Safe Behavior Rate** | Persentase observasi berstatus "Aman" dari total observasi bulan berjalan | Angka besar + tren vs bulan lalu (▲/▼) |
| **Observasi Bulan Ini** | Jumlah total observasi yang tercatat bulan berjalan vs target (60) | Angka + target |
| **Near-Miss Dilaporkan** | Jumlah laporan near-miss bulan berjalan vs bulan lalu | Angka + tren |
| **Hari Tanpa Insiden** | Streak hari berturut-turut tanpa insiden | Angka + status streak |

#### 3.1.2 Grafik Tren Safe Behavior (6 Bulan)

- **Jenis:** Line chart (Chart.js)
- **Data:** Persentase safe behavior per bulan (Jan–Jun)
- **Target line:** Garis putus-putus horizontal di 85%
- **Warna:** Biru (#378ADD) untuk data aktual, Merah (#E24B4A) untuk target

#### 3.1.3 Grafik Kategori Perilaku Berisiko

- **Jenis:** Bar chart horizontal/vertikal (Chart.js)
- **Kategori:** Kecepatan, Sabuk Pengaman, HP/Distraksi, Jarak Aman, Lainnya
- **Nilai:** Persentase kontribusi terhadap total perilaku berisiko

#### 3.1.4 Top Risiko Perilaku

- **Jenis:** List dengan progress bar
- **Item:** 
  - Melebihi batas kecepatan (35%)
  - Tidak pakai sabuk (25%)
  - Penggunaan HP saat berkendara (20%)
  - Jarak aman tidak terjaga (15%)
- **Visual:** Nama risiko + badge persentase + bar progres horizontal

---

### 3.2 Modul Observasi Perilaku

Form untuk mencatat dan menilai perilaku pengemudi di lapangan.

#### 3.2.1 Form Header

| Field | Tipe | Validasi |
|-------|------|----------|
| Nama Observer | Text input | Required |
| ID Pengemudi | Text input (placeholder: `DRV-0001`) | Required |
| Tanggal | Date input | - |
| Lokasi | Text input | - |
| Jenis Kendaraan | Dropdown select | - |

**Opsi Jenis Kendaraan:** Truk Besar, Truk Sedang, Minibus, Pick-up, Sepeda Motor

#### 3.2.2 Parameter Penilaian Perilaku (8 item)

Setiap item dinilai dengan skala 3 tingkat: **Aman** / **Berisiko** / **Berbahaya** (radio button group).

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

#### 3.2.3 Tindak Lanjut & Catatan

| Field | Tipe |
|-------|------|
| Umpan Balik / Catatan | Textarea |
| Tindak Lanjut | Dropdown select |

**Opsi Tindak Lanjut:** Apresiasi langsung, Coaching on the spot, Pelaporan ke supervisor, Rencana pelatihan

#### 3.2.4 Submit Behavior

- Tombol "Simpan Observasi"
- Validasi: Nama Observer & ID Pengemudi wajib diisi
- On success: Data masuk ke riwayat, form di-reset, toast notifikasi muncul

---

### 3.3 Modul Checklist Kendaraan

Pemeriksaan pra-perjalanan kendaraan (wajib setiap hari).

#### 3.3.1 Form Header

| Field | Tipe | Validasi |
|-------|------|----------|
| ID Pengemudi | Text input (placeholder: `DRV-0001`) | Required |
| Plat Kendaraan | Text input (placeholder: `B 1234 XY`) | Required |

#### 3.3.2 Tab Kategori Pemeriksaan (3 tab)

Setiap item memiliki 3 opsi: **OK (✓)** / **NOK (✗)** / **N/A**

##### Tab 1: Mesin & Bahan Bakar (5 poin)
1. Level oli mesin cukup
2. Level air radiator cukup
3. Bahan bakar cukup untuk rute
4. Tidak ada kebocoran oli/cairan
5. Belt / fan belt dalam kondisi baik

##### Tab 2: Keselamatan (6 poin)
1. Rem utama berfungsi normal
2. Rem tangan berfungsi
3. Semua lampu berfungsi (depan, belakang, sein)
4. APAR tersedia & tidak kadaluarsa
5. Sabuk pengaman berfungsi
6. Klakson berfungsi

##### Tab 3: Eksterior (5 poin)
1. Kaca depan bersih & tidak retak
2. Wiper berfungsi
3. Tekanan ban sesuai standar
4. Kondisi ban tidak aus berlebihan
5. Spion lengkap & dapat diatur

**Total: 16 poin pemeriksaan**

#### 3.3.3 Perhitungan Skor Otomatis

- Skor = `jumlah OK / total item terjawab × 100%`
- Progress bar berubah warna:
  - **Hijau (#3B6D11)**: ≥ 80%
  - **Kuning (#EF9F27)**: 50–79%
  - **Merah (#E24B4A)**: < 50%
- Status: **Lulus** (≥80%) atau **Perlu Perbaikan** (<80%)

---

### 3.4 Modul Pelaporan Insiden & Near-Miss

Form untuk melaporkan insiden atau kejadian hampir celaka.

#### 3.4.1 Form Header

| Field | Tipe | Validasi |
|-------|------|----------|
| Nama Pelapor | Text input | Required |
| Tanggal Kejadian | Date input | - |
| Jenis Laporan | Dropdown select | Required |
| Lokasi Kejadian | Text input | Required |
| Plat Kendaraan Terlibat | Text input | - |

**Opsi Jenis Laporan:** Near-Miss, Insiden Ringan, Insiden Sedang, Insiden Berat

#### 3.4.2 Detail Kejadian

| Field | Tipe |
|-------|------|
| Kronologi Kejadian | Textarea |
| Korban / Kerugian | Textarea |
| Rekomendasi Tindakan | Textarea |

#### 3.4.3 Faktor Penyebab (multi-select button group)

Pengguna dapat memilih satu atau lebih faktor:

- Kecepatan
- Kelelahan
- Cuaca
- Jalan Rusak
- Perilaku Pengendara Lain
- Kendaraan
- HP / Distraksi
- Lainnya

#### 3.4.4 Submit Behavior

- Tombol "Kirim Laporan"
- Validasi: Nama Pelapor, Jenis Laporan, dan Lokasi wajib diisi
- On success: Data masuk ke riwayat, form di-reset, toast notifikasi muncul

---

### 3.5 Modul Riwayat

Menampilkan seluruh laporan yang pernah dicatat.

#### 3.5.1 Filter Tab

| Tab | Konten |
|-----|--------|
| Semua | Seluruh riwayat (default) |
| Observasi | Hanya laporan observasi |
| Checklist | Hanya laporan checklist |
| Insiden | Hanya laporan insiden |

#### 3.5.2 Tampilan Item Riwayat

Setiap item menampilkan:
- **Ikon** (dalam lingkaran berwarna)
- **Judul** (misal: "Observasi — DRV-0023")
- **Metadata** (waktu, lokasi, detail)
- **Badge status** (Aman/Perlu Perhatian, Lulus/Perlu Perbaikan, Near-Miss/Insiden)

#### 3.5.3 Data Awal (mockup)

| Tipe | Judul | Waktu | Status |
|------|-------|-------|--------|
| Observasi | DRV-0023 | Hari ini | Aman |
| Checklist | B 8821 KL | Kemarin | Lulus (16 poin OK) |
| Insiden | Jl. Gatot Subroto | 2 hari lalu | Near-Miss |

---

## 4. Fitur Lintas-Modul

### 4.1 Multi-Bahasa (i18n)

- Dua bahasa: **Indonesia** (default) & **Inggris**
- Toggle button di header (label: EN/ID)
- Semua label, placeholder, dan teks UI diterjemahkan
- Parameter penilaian dan checklist item memiliki versi bilingual

### 4.2 Notifikasi Toast

- Muncul di pojok kanan bawah
- Durasi tampil: 2.8 detik
- Digunakan untuk: sukses submit, validasi error

### 4.3 Navigasi

- 5 tab navigasi utama: Dashboard, Observasi, Checklist, Insiden, Riwayat
- Active state ditandai dengan highlight pada tombol nav
- Sub-navigasi tab untuk Checklist (3 tab kategori) dan Riwayat (4 tab filter)

---

## 5. Alur Data (State Management)

### 5.1 State Saat Ini (mockup — in-memory JavaScript)

```
obsState      : Object { o1..o8 → '' | 'aman' | 'berisiko' | 'berbahaya' }
chkState      : Object { m1..m5, s1..s6, e1..e5 → '' | 'safe' | 'unsafe' | 'na' }
history_data  : Array of history objects
lang          : 'id' | 'en'
```

### 5.2 Kebutuhan Backend (target produksi)

| Entitas | Field Utama |
|---------|------------|
| **observations** | id, observer_name, driver_id, date, location, vehicle_type, scores (JSON: 8 items), feedback, follow_up, created_at |
| **checklists** | id, driver_id, plate_number, date, items (JSON: 16 items), score, status, created_at |
| **incidents** | id, reporter_name, date, type, location, plate_number, chronology, factors (JSON array), casualties, recommendations, created_at |
| **drivers** (dari `transport_app`) | id, name, employee_id, license, etc. |

---

## 6. Kebutuhan Integrasi

### 6.1 Integrasi dengan `transport_app`

- **Data Supir:** Ambil dari database supir yang sudah ada di `transport_app`
- **Validasi ID Pengemudi:** Autocomplete/validasi terhadap data supir existing
- **Plat Kendaraan:** Bisa dihubungkan dengan data kendaraan di `transport_app`

### 6.2 Konektivitas

- Aplikasi harus **online** (web-based) agar bisa diakses Customer
- Korlap/Patcher menginput data secara **manual**

---

## 7. Batasan & Asumsi Mockup

| Item | Status di Mockup | Kebutuhan Produksi |
|------|-----------------|-------------------|
| CSS Variables | Bergantung pada container induk | Perlu stylesheet mandiri/theme lengkap |
| Tabler Icons | Tidak ada link CDN | Harus ditambahkan: `@tabler/icons-webfont` |
| Penyimpanan data | In-memory (hilang saat refresh) | Perlu database + API backend |
| Autentikasi | Tidak ada | Perlu login & role (Korlap vs Customer) |
| Validasi input | Minimal (hanya required check) | Perlu validasi lengkap (format, tipe data) |
| Error handling | Tidak ada fallback Chart.js | Perlu graceful degradation |
| State persistence | Tidak ada | Perlu localStorage atau backend |
| `substr()` | Metode deprecated | Ganti ke `substring()` |
| `sr-only` class | Tidak didefinisikan | Tambahkan definisi CSS |
| `<html>` / `<head>` | Tidak ada (fragment) | Perlu wrapper HTML lengkap |

---

## 8. Rekomendasi Pengembangan

1. **Pisahkan CSS** menjadi file terpisah dengan definisi variabel CSS lengkap.
2. **Tambahkan Tabler Icons CDN** atau bundle secara lokal.
3. **Ganti `substr()`** menjadi `substring()` pada fungsi `showPage()`.
4. **Tambahkan definisi `.sr-only`** untuk aksesibilitas screen reader.
5. **Bangun backend API** (REST) dengan endpoint CRUD untuk observations, checklists, incidents.
6. **Integrasikan autentikasi** berbasis role (Korlap/Patcher = input, Customer = view-only).
7. **Hubungkan dengan `transport_app`** untuk mengambil data supir dan kendaraan.
8. **Tambahkan validasi form** yang lebih ketat (format tanggal, ID driver exists, dll).
9. **Implementasi penyimpanan persisten** — ganti array in-memory dengan database.
10. **Tambahkan fitur ekspor** laporan (PDF/Excel) untuk kebutuhan Customer.

---

## 9. Ringkasan Total Fitur

| Kategori | Jumlah |
|----------|--------|
| Halaman/Modul Utama | 5 |
| Metric Cards (Dashboard) | 4 |
| Grafik (Chart.js) | 2 |
| Parameter Observasi | 8 |
| Poin Checklist | 16 (3 tab) |
| Jenis Insiden | 4 |
| Faktor Penyebab Insiden | 8 |
| Filter Riwayat | 4 tab |
| Bahasa | 2 (ID, EN) |
| Opsi Kendaraan | 5 |
| Opsi Tindak Lanjut | 4 |
| Notifikasi Toast | 1 |
