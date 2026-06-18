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

## Role: Patcher

Modul BBS memperkenalkan role baru **`patcher`** — role terisolasi yang hanya bisa mengakses modul BBS.

| Aspek | Detail |
|-------|--------|
| Level di DB | `ENUM('admin','user','mekanik','cs','patcher')` |
| Halaman yang bisa diakses | `/bbs` (Dashboard, Observasi, Checklist, Insiden, Riwayat) + `/profile` |
| API yang diizinkan | `GET/POST/PUT/DELETE /api/bbs/*`, `GET/PUT /api/auth/me`, `GET /api/trucks`, `GET /api/drivers` |
| Redirect setelah login | `/bbs` |
| Navigasi sidebar | Hanya: Dashboard BBS + User Profile |
| Notifikasi header | Disembunyikan |
| Admin (role lain) | Admin bisa akses semua halaman termasuk BBS. User, mekanik, cs tidak terpengaruh |

## File Structure

### Backend (`node_backend/`)

| File | Deskripsi |
|------|-----------|
| `routes/bbs.js` | 16 endpoint REST API untuk BBS |
| `middleware/rbac.js` | `restrictPatcherAccess` — blok patcher dari API non-BBS |
| `server.js` | Register middleware + router BBS |
| `db/migrations/20260617000000_add_patcher_role.sql` | ALTER TABLE admin ENUM + patcher |
| `db/migrations/20260617010000_create_bbs_tables.sql` | CREATE 3 tabel BBS |

### Frontend (`tailadmin-vuejs-1.0.0/`)

| File | Deskripsi |
|------|-----------|
| `src/views/BBS/BbsTransportasi.vue` | Main layout — 5 tab navigasi + drawer host |
| `src/views/BBS/BbsDashboardTab.vue` | 4 metric cards + 2 Chart.js charts + top risiko |
| `src/views/BBS/BbsObservasiTab.vue` | Form observasi 8 parameter + SearchableSelect driver + DatePickerInput |
| `src/views/BBS/BbsChecklistTab.vue` | Form checklist 16 item (3 sub-tab) + skor progres bar |
| `src/views/BBS/BbsInsidenTab.vue` | Form laporan insiden + faktor toggle |
| `src/views/BBS/BbsRiwayatTab.vue` | Filter + list riwayat dengan filter search/bulan/status |
| `src/views/BBS/BbsDetailDrawer.vue` | Drawer slide-in kanan: detail view + edit mode + tombol hapus |
| `src/services/bbsService.ts` | API wrapper typed |
| `src/router/index.ts` | Route `/bbs` + patcher guard |
| `src/config/navigation.js` | Patcher menu group |
| `src/icons/EyeIcon.vue` | Icon mata (observasi) |
| `src/icons/ChecklistIcon.vue` | Icon checklist (checklist) |
| `src/icons/AlertTriangleIcon.vue` | Icon peringatan (insiden) |

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
| GET | `/dashboard` | token | Metric cards + trend chart + risk chart + top risks |

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

### History
| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/history` | token | Riwayat gabungan. Query params: `type` (all/observation/checklist/incident), `search`, `month`, `status` |

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
1. Tab Checklist → pilih Pengemudi + Plat (SearchableSelect)
2. 3 sub-tab: Mesin & Bahan Bakar (5), Keselamatan (6), Eksterior (5)
3. Setiap item: OK / NOK / N/A (button group)
4. Skor otomatis dihitung: hijau ≥80%, kuning 50-79%, merah <50%
5. Simpan → data masuk riwayat

### Detail & Edit
1. Tab Riwayat → klik baris → drawer slide-in dari kanan
2. View mode: semua field ditampilkan (Observer, Driver, Tanggal, Lokasi, Skor, dll)
3. Tombol Edit → form inline dalam drawer → Simpan → PUT ke backend
4. Tombol Hapus → ConfirmDialog → DELETE → drawer tertutup

### Filter Riwayat
- Text search (cari di nama, lokasi, plat)
- Month picker (filter bulan)
- Status dropdown (Aman, Perlu Perhatian, Lulus, Perlu Perbaikan, Near-Miss, Insiden)

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
- `fmtDate()` wrapper untuk konversi ISO timestamp → `YYYY-MM-DD` sebelum INSERT/UPDATE
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

## Testing Role Patcher

1. Buka Master Admin → Tambah Admin → pilih Level: **Patcher**
2. Login dengan NIK patcher tersebut
3. Harus redirect ke `/bbs` dan hanya lihat menu BBS + Profile
