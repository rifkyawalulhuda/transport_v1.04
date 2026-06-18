# BBS Module — Project Context

## Overview

**BBS (Behavior-Based Safety) — Departemen Transportasi** adalah modul dalam `transport_v1.04` untuk pencatatan, pemantauan, dan pelaporan keselamatan kerja berbasis perilaku pada departemen transportasi.

Modul ini terintegrasi penuh dengan project existing — menggunakan stack yang sama, tabel `driver` dan `truck` yang sudah ada, serta sistem autentikasi JWT.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Vue 3 + TypeScript + Tailwind CSS (Tailadmin template) |
| Backend | Express.js (Node.js) |
| Database | MySQL via `mysql2` |
| Auth | JWT (middleware `authenticateToken`) |
| Charts | Chart.js v4 (npm) |
| Icons | SVG custom (matching existing Tabler-style pattern) |

## Role & Akses

Modul BBS dapat diakses oleh beberapa role dengan tingkat akses berbeda.

### Role: Patcher (terisolasi)
| Aspek | Detail |
|-------|--------|
| Level di DB | `ENUM('admin','user','mekanik','cs','patcher')` |
| Halaman yang bisa diakses | `/bbs` (semua tab) + `/profile` (User Profile + Edit Profile) |
| API yang diizinkan | `GET/POST/PUT/DELETE /api/bbs/*`, `GET/PUT /api/auth/me`, `GET /api/trucks`, `GET /api/drivers` |
| Redirect setelah login | `/bbs` |
| Navigasi sidebar | Hanya: BBS Transportasi + User Profile (menu lain disembunyikan) |
| Notifikasi header | Disembunyikan |

### Akses BBS per Role
| Role | Sidebar BBS | Tab yang bisa diakses | Detail Drawer |
|------|-------------|----------------------|---------------|
| **admin** | ✅ (di bawah Transaksi) | Semua tab (Dashboard, Observasi, Checklist, Insiden, Riwayat) | View + Edit + Hapus |
| **patcher** | ✅ (hanya BBS + Profile) | Semua tab | View + Edit + Hapus |
| **user** | ✅ visible | Hanya **Dashboard** & **Riwayat** | **View-only** (Edit & Hapus disembunyikan) |
| **mekanik** | ✅ visible | Semua tab | View + Edit + Hapus |
| **cs** | ❌ tidak ada | - | - |

- Icon sidebar BBS: `ShieldCheckIcon` (perisai + centang)
- Posisi sidebar: item langsung di bawah grup **Transaksi**
- Route `/bbs` meta: `allowCS: true, allowPatcher: true, allowUser: true`

## File Structure

### Backend (`node_backend/`)

| File | Deskripsi |
|------|-----------|
| `routes/bbs.js` | 18 endpoint REST API untuk BBS (CRUD + dashboard + history + export + today-plates) |
| `middleware/rbac.js` | `restrictPatcherAccess` — blok patcher dari API non-BBS |
| `server.js` | Register middleware + router BBS |
| `db/migrations/20260617000000_add_patcher_role.sql` | ALTER TABLE admin ENUM + patcher |
| `db/migrations/20260617010000_create_bbs_tables.sql` | CREATE 3 tabel BBS |
| `bbs_dummy_data.sql` | Dummy test data (27 observasi, 4 checklist, 4 insiden) |

### Frontend (`tailadmin-vuejs-1.0.0/`)

| File | Deskripsi |
|------|-----------|
| `src/views/BBS/BbsTransportasi.vue` | Main layout — 5 tab navigasi + drawer host |
| `src/views/BBS/BbsDashboardTab.vue` | 4 metric cards + 2 Chart.js charts + top risiko + filter bulan (month picker) |
| `src/views/BBS/BbsObservasiTab.vue` | Form observasi 8 parameter + SearchableSelect driver + DatePickerInput |
| `src/views/BBS/BbsChecklistTab.vue` | Form checklist 16 item (3 sub-tab) + skor progres bar + validasi wajib isi semua item + dropdown truck dengan highlight hijau (sudah dichecklist hari ini) + tab berubah hijau realtime saat grup lengkap |
| `src/views/BBS/BbsInsidenTab.vue` | Form laporan insiden + faktor toggle + autocomplete plat (master truck + input manual) |
| `src/views/BBS/BbsRiwayatTab.vue` | Filter search/bulan/status (default bulan = current month) + pagination (15/30/50/100 per page) + Export modal |
| `src/views/BBS/BbsDetailDrawer.vue` | Drawer slide-in kanan: detail view (card grouping) + edit mode + hapus; role `user` view-only |
| `src/services/bbsService.ts` | API wrapper typed |
| `src/router/index.ts` | Route `/bbs` + guard role |
| `src/config/navigation.js` | Menu BBS di sidebar utama + filter per role |
| `src/icons/EyeIcon.vue` | Icon mata (observasi) |
| `src/icons/ChecklistIcon.vue` | Icon checklist (checklist) |
| `src/icons/AlertTriangleIcon.vue` | Icon peringatan (insiden) |
| `src/icons/ShieldCheckIcon.vue` | Icon perisai+centang (sidebar BBS) |
| `src/components/common/ToastHost.vue` | Toast notification (bottom-right, icon per variant) — dipakai global |

### Edited existing files

| File | Perubahan |
|------|-----------|
| `views/Auth/Login.vue` | +patcher redirect ke `/bbs` |
| `components/layout/AppHeader.vue` | +hide notifikasi untuk patcher |
| `components/layout/header/HeaderLogo.vue` | +patcher home path `/bbs` |
| `components/layout/AppSidebar.vue` | +patcher home path `/bbs` |
| `views/Master/AdminMaster.vue` | +option "Patcher" di dropdown level |

## Database Tables

### `bbs_observations`
| Column | Type | Description |
|--------|------|-------------|
| `id_observation` | int(13) PK AUTO_INCREMENT | |
| `id_admin` | int(13) FK → admin | Observer (auto-filled dari auth) |
| `observer_name` | varchar(100) | Nama observer (dari `admin.nama_admin`) |
| `driver_id` | varchar(30) | ID pengemudi (string FK ke `driver.id_driver`) |
| `date` | date | Tanggal observasi |
| `location` | varchar(100) | Lokasi pengamatan |
| `vehicle_type` | varchar(30) | Jenis kendaraan |
| `scores` | longtext (JSON) | 8 parameter: o1..o8 → 'aman'/'berisiko'/'berbahaya' |
| `feedback` | text | Umpan balik |
| `follow_up` | varchar(50) | Tindak lanjut |
| `created_at` | datetime DEFAULT NOW() | |

### `bbs_checklists`
| Column | Type | Description |
|--------|------|-------------|
| `id_checklist` | int(13) PK AUTO_INCREMENT | |
| `id_admin` | int(13) FK → admin | |
| `driver_id` | varchar(30) | ID pengemudi |
| `date` | date | Tanggal |
| `plate_number` | varchar(20) | Plat kendaraan |
| `items` | longtext (JSON) | 16 item: m1..m5, s1..s6, e1..e5 → 'safe'/'unsafe'/'na' |
| `score` | decimal(5,2) | Persentase OK |
| `status` | enum('passed','needs_fix') | Lulus (≥80%) / Perlu Perbaikan |
| `created_at` | datetime DEFAULT NOW() | |

### `bbs_incidents`
| Column | Type | Description |
|--------|------|-------------|
| `id_incident` | int(13) PK AUTO_INCREMENT | |
| `id_admin` | int(13) FK → admin | |
| `reporter_name` | varchar(100) | Nama pelapor |
| `date` | date | Tanggal kejadian |
| `type` | enum('Near-Miss','Insiden Ringan','Insiden Sedang','Insiden Berat') | Jenis laporan |
| `location` | varchar(100) | Lokasi |
| `plate_number` | varchar(20) | Plat |
| `chronology` | text | Kronologi |
| `factors` | longtext (JSON array) | Faktor penyebab |
| `casualties` | text | Korban/kerugian |
| `recommendations` | text | Rekomendasi |
| `created_at` | datetime DEFAULT NOW() | |

## API Endpoints

Semua endpoint prefix: `/api/bbs`

### Dashboard
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/dashboard` | token | Metric cards + trend chart + risk chart + top risks. Query param: `month` (YYYY-MM, default bulan saat ini) |

### Observations
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/observations/:id` | token | Detail satu observasi (JOIN driver) |
| POST | `/observations` | token | Simpan observasi baru |
| PUT | `/observations/:id` | token | Update observasi |
| DELETE | `/observations/:id` | token | Hapus observasi |

### Checklists
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/checklists/today-plates` | token | List plat yang sudah dichecklist hari ini (untuk highlight hijau + blok duplikat) |
| GET | `/checklists/:id` | token | Detail satu checklist (JOIN driver) |
| POST | `/checklists` | token | Simpan checklist baru |
| PUT | `/checklists/:id` | token | Update checklist |
| DELETE | `/checklists/:id` | token | Hapus checklist |

### Incidents
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/incidents/:id` | token | Detail satu insiden |
| POST | `/incidents` | token | Simpan insiden baru |
| PUT | `/incidents/:id` | token | Update insiden |
| DELETE | `/incidents/:id` | token | Hapus insiden |

### History & Export
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/history` | token | Riwayat gabungan. Query params: `type` (all/observation/checklist/incident), `search`, `month`, `status`, `limit` |
| GET | `/export` | token | Export Excel (3 sheet: Observasi, Checklist, Insiden). Query params: `range` (month/year/all), `month` (YYYY-MM), `year` (YYYY) |

### Lookup (existing API reused)
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/drivers?status=active` | token (patcher) | List driver aktif |
| GET | `/api/trucks?status=active` | token (patcher) | List truck aktif |

## Key Flows

### Observasi Behavior
1. Patcher login → redirect ke `/bbs`
2. Tab Observasi → form auto-fill Observer dari `authUser.nama_admin`
3. Pilih Pengemudi dari SearchableSelect (data dari `/api/drivers`)
4. Isi tanggal via DatePickerInput, lokasi, jenis kendaraan
5. Nilai 8 parameter: Aman / Berisiko / Bahaya (radio button group)
6. Isi feedback + tindak lanjut → Simpan
7. Redirect ke tab Riwayat, data tersimpan

### Checklist Kendaraan
1. Tab Checklist → pilih Pengemudi + Plat
2. **Plat Kendaraan**: dropdown dari master truck. Truk yang **sudah dichecklist hari ini** ditandai hijau + badge "✓ Sudah" dan tidak bisa dipilih (toast error). Plat yang belum dichecklist tetap warna default.
3. 3 sub-tab: Mesin & Bahan Bakar (5), Keselamatan (6), Eksterior (5)
4. Setiap item: OK / NOK / N/A (button group) — **semua 16 item wajib diisi** sebelum submit
5. Tab sub-grup berubah **hijau secara realtime** saat semua item di grup tersebut sudah terisi (✓ prefix)
6. Jika ada item kosong saat submit → error toast + item merah highlight + auto-switch tab ke item kosong pertama
7. Skor otomatis dihitung: hijau ≥80%, kuning 50-79%, merah <50%
8. Submit guard: tolak jika plat sudah dichecklist hari ini → data masuk riwayat

### Detail & Edit
1. Tab Riwayat → klik baris → drawer slide-in dari kanan
2. View mode: field dikelompokkan dalam card (status badge, info utama, kronologi/penilaian, dll)
3. Tombol Edit (hanya admin/patcher/mekanik) → form inline:
   - **Pengemudi**: SearchableSelect dari master driver (observasi & checklist)
   - **Plat Checklist**: dropdown master truck + highlight hijau (sudah dichecklist hari ini); plat record sendiri dikecualikan agar tetap bisa dipilih
   - **Plat Insiden**: autocomplete master truck + bisa input manual
4. Tombol Hapus → ConfirmDialog → DELETE → drawer tertutup
5. Role `user`: view-only — tombol Edit & Hapus disembunyikan

### Export Excel (Riwayat)
1. Tombol Export → modal popup
2. 3 pilihan: Per Bulan, Per Tahun, Semua Data
3. Per Bulan → month picker; Per Tahun → year dropdown
4. Download → file `.xlsx` 3 sheet (Observasi, Checklist, Insiden)

### Filter & Pagination Riwayat
- Text search realtime (debounce 300ms, case-insensitive) — mencakup nama driver dari JOIN
- Month picker — default ke bulan saat ini, klik di mana saja buka picker
- Status dropdown — selektif per jenis (status `aman` hanya observasi, `passed` hanya checklist, `Near-Miss` hanya insiden)
- Pagination: 15/30/50/100 per page + navigasi angka halaman

## Data Flow

```
[Frontend: BBS Vue Components]
    ↕ authFetch() + JWT token
[Backend: routes/bbs.js]
    ↕ db.query() via mysql2 pool
[MySQL: bbs_observations, bbs_checklists, bbs_incidents]
    ↕ LEFT JOIN
[MySQL: driver, truck tables]
```

## SQL Mode Compatibility

Semua query menggunakan:
- `fmtDate()` wrapper untuk konversi ISO timestamp → `YYYY-MM-DD` sebelum INSERT/UPDATE — menggunakan local timezone, bukan `.toISOString()`
- `JSON_UNQUOTE(JSON_EXTRACT(...))` untuk membaca nilai dari kolom LONGTEXT JSON (MySQL `JSON_EXTRACT` return quoted string)
- `CAST(column AS CHAR)` untuk deteksi zero-date (`'0000-00-00'`) di query lain
- `DATE_FORMAT()` eksplisit di GROUP BY untuk kompatibilitas `only_full_group_by`
- Kompatibel dengan MySQL strict mode maupun relaxed mode

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `chart.js` (npm) | Dashboard charts (line + bar) |

## How To Run

Backend dan frontend sudah terintegrasi — tidak ada langkah tambahan. Cukup:

```bash
# Backend (restart untuk pick up perubahan)
cd node_backend
npm start

# Frontend
cd tailadmin-vuejs-1.0.0
npm run dev
```

Akses `http://localhost:5173/bbs` dengan role `patcher` atau `admin`.

## Bug Fixes (Session 2026-06-18)

### Dashboard Charts Tidak Muncul
- **Root cause:** `JSON_EXTRACT(scores, '$.oX')` di MySQL return nilai quoted (`"aman"` bukan `aman`). Semua `= 'aman'` comparison jadi false → data 0.
- **Fix:** Ganti semua `JSON_EXTRACT(...)` dengan `JSON_UNQUOTE(JSON_EXTRACT(...))` di 11 lokasi dashboard + 2 lokasi history filter.

### prev_safe_rate Selalu null
- **Root cause:** Hitungan safe rate bulan lalu pakai total count bukan safe count, ternary `0 || null`.
- **Fix:** Query terpisah `prevSafeObs` + `Math.round((prevSafeCount / prevObsCount) * 100)`.

### Risk Categories Selalu 100%
- **Root cause:** `COALESCE(JSON_EXTRACT(...), 'aman') <> 'aman'` — quoted JSON selalu `<> 'aman'`.
- **Fix:** `JSON_UNQUOTE(JSON_EXTRACT(...)) IN ('berisiko','berbahaya')`.

### Chart Rendering Race Condition
- **Root cause:** `nextTick()` dipanggil sebelum `loading=false`, canvas belum di-DOM → ref null.
- **Fix:** Pindah `finally { loading = false }` sebelum `await nextTick()`.

### toISOString UTC Bug
- **Root cause:** `new Date().toISOString().slice(0,10)` mengubah tanggal di GMT/UTC.
- **Fix:** Ganti ke `fmtDate()` helper (local timezone) di incidentFree query, form.date, resetForm.

### Checklist Mandatory Validation
- **Fix:** Tambah `submitAttempted` flag + `emptyMap` computed + `unselected.length > 0` check sebelum submit. Item kosong highlighted merah + auto-switch tab.

### History Filter Tidak Berfungsi di Tab "Semua"
- **Root cause:** Filter status diterapkan ke semua tabel tanpa seleksi jenis — `status=aman` juga filter tabel checklist.
- **Fix:** Kategorisasi status ke `obsStatuses`, `chkStatuses`, `incStatuses`. Masing-masing `build*Where()` hanya pakai status yang relevan.

### History Filter Search Checklist
- **Fix:** Tambah `d.nama_driver LIKE ?` ke search checklist query agar bisa cari driver by nama.

## Enhancements (Session 2026-06-19)

### Sidebar & Role Restructure
- BBS dipindah ke **sidebar utama** (di bawah grup Transaksi) dengan icon `ShieldCheckIcon`.
- **Patcher**: hanya lihat BBS + User Profile, bisa akses `/profile` (edit profile).
- **User**: BBS visible di sidebar, hanya tab Dashboard & Riwayat, detail drawer **view-only**.
- Route `/bbs` tambah `allowUser: true`.

### Dashboard Filter Bulan
- Tambah month picker di Dashboard — semua metric/chart di-bound ke range bulan terpilih (`?month=YYYY-MM`).

### Export Excel
- BBS Riwayat: tombol Export → modal (Per Bulan / Per Tahun / Semua Data) → endpoint `/api/bbs/export`.
- Pola modal yang sama diterapkan ke **Sales Cost**, **Subcontractor**, **Repair** (acuan tanggal: DO / Pengerjaan / Kerusakan). Format Excel tidak diubah.

### Pagination Riwayat
- 15/30/50/100 per page + navigasi angka halaman (client-side).

### Checklist Rules
- Dropdown truck: highlight hijau + badge "Sudah" untuk truk yang sudah dichecklist hari ini, blok duplikat (toast).
- Tab sub-grup berubah hijau realtime saat semua item grup terisi.
- Berlaku juga di edit drawer (plat record sendiri dikecualikan dari blokir).

### Detail Drawer Polish
- View mode redesign: card grouping + status badge + section icons.
- Edit Pengemudi → SearchableSelect; Edit Plat Insiden → autocomplete; Edit Plat Checklist → dropdown master truck + rule hijau.

### Toast Notification
- Dipindah ke **bottom-right**, redesign dengan icon per variant + judul kontekstual, animasi slide-in. Berlaku global (semua modul).

### Month Picker UX
- Semua input `type="month"` & `type="date"` di BBS: klik area mana saja buka picker via `showPicker()`.

## Testing Role Patcher

1. Buka Master Admin → Tambah Admin → pilih Level: **Patcher**
2. Login dengan NIK patcher tersebut
3. Harus redirect ke `/bbs` dan hanya lihat menu BBS + Profile
