# Dokumentasi Project — Sankyu Transport Management System

> Dokumentasi lengkap untuk developer: tech stack, arsitektur, development, deployment, troubleshooting, dan coding conventions.

---

## Daftar Isi

- [1. Tech Stack](#1-tech-stack)
- [2. Architecture](#2-architecture)
- [3. Development Setup](#3-development-setup)
- [4. Database & Migrations](#4-database--migrations)
- [5. API Reference](#5-api-reference)
- [6. Deployment](#6-deployment)
- [7. Troubleshooting](#7-troubleshooting)
- [8. Coding Conventions](#8-coding-conventions)

---

## 1. Tech Stack

### Backend — `node_backend/`

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | Node.js | — |
| Framework | Express.js | ^4.18 |
| Bahasa | JavaScript (CommonJS) | — |
| Database Utama | MySQL | via `mysql2` ^3.9 |
| Database Sekunder | MongoDB | via `mongoose` ^9.1 (legacy) |
| Autentikasi | JWT | `jsonwebtoken` ^9.0 |
| Upload File | Multer | ^2.0 |
| Excel Import/Export | `xlsx` ^0.18, `exceljs` ^4.4 | — |
| Migrasi DB | dbmate | ^2.32 (dev) |
| GPS Integration | Wialon API | — |
| Reverse Geocoding | Geoapify API | — |

#### Dependency Utama Backend

```json
{
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "exceljs": "^4.4.0",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^9.1.4",
  "multer": "^2.0.2",
  "mysql2": "^3.9.7",
  "xlsx": "^0.18.5"
}
```

### Frontend — `tailadmin-vuejs-1.0.0/`

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Vue 3 | ^3.5 |
| Bahasa | TypeScript | ~5.7 |
| Build Tool | Vite | ^6.0 |
| CSS Framework | Tailwind CSS | ^4.0 |
| UI Template | TailAdmin Vue Pro | 2.0.1 |
| Router | Vue Router | ^4.5 |
| Maps | Leaflet + MarkerCluster | ^1.9 |
| Icons | Lucide Vue Next, Heroicons | — |
| Charts | ApexCharts (vue3-apexcharts) | ^1.8 |
| Date Picker | Vue Datepicker, Flatpickr | — |
| Linting | ESLint + Prettier | — |
| Type Check | vue-tsc | ^2.2 |

#### Dependency Utama Frontend

```json
{
  "vue": "^3.5.13",
  "vue-router": "^4.5.0",
  "leaflet": "^1.9.4",
  "leaflet.markercluster": "^1.5.3",
  "tailwindcss": "^4.0.0",
  "apexcharts": "^4.4.0",
  "lucide-vue-next": "^0.474.0"
}
```

### Documentation — `docs/`

| Kategori | Teknologi |
|----------|-----------|
| Static Site Generator | VitePress ^1.0 |
| Port Development | 5174 |

### External Services

| Service | Fungsi | Catatan |
|---------|--------|---------|
| Wialon | GPS tracking, geofence, trip history | Token di backend `.env` |
| Geoapify | Reverse geocoding (koordinat → alamat) | API key di backend `.env` |
| MySQL | Database utama (data operasional) | Local atau remote |
| MongoDB | Database sekunder (fitur legacy) | Opsional |

### Ports Default

| Service | Port |
|---------|------|
| Backend (Express) | 3000 |
| Frontend (Vite dev) | 5173 |
| Docs (VitePress) | 5174 |
| MySQL | 3306 |

---

## 2. Architecture

### Gambaran Umum

Sistem ini menggunakan arsitektur **monorepo** dengan dua aplikasi utama:

```
┌─────────────────────┐     HTTP/JSON      ┌──────────────────────┐
│   Vue 3 Frontend    │ ◄────────────────► │   Express Backend    │
│  (SPA + Vite)       │     /api/*          │   (Node.js)          │
└─────────────────────┘                     └──────────┬───────────┘
                                                       │
                                            ┌──────────┼───────────┐
                                            │          │           │
                                       ┌────▼───┐ ┌───▼────┐ ┌───▼────────┐
                                       │ MySQL  │ │MongoDB │ │ Wialon API │
                                       │(utama) │ │(legacy)│ │ (GPS)      │
                                       └────────┘ └────────┘ └────────────┘
```

### Backend Architecture

#### Layer Pattern

Backend mengikuti pola **Route → Service → Database**:

```
Request
  │
  ▼
middleware/auth.js        ← JWT verification
middleware/rbac.js        ← Role-based access control
  │
  ▼
routes/<domain>.js        ← HTTP handling, validation, response
  │
  ▼
services/<domain>.js      ← Business logic, external API calls
  │
  ▼
db.js (MySQL pool)        ← Direct SQL queries via mysql2/promise
models/<model>.js         ← Mongoose models (MongoDB, legacy)
```

#### Route Registration

Semua route didaftarkan di `server.js` dengan prefix `/api/`:

```javascript
app.use("/api/trucks", truckRouter);
app.use("/api/sales-costs", salesCostRouter);
app.use("/api/wialon", wialonRouter);
// ...
```

#### Authentication Flow

1. User login via `POST /api/auth/login`
2. Backend memverifikasi kredensial dan mengembalikan JWT token
3. Frontend menyimpan token dan mengirimnya di header `Authorization: Bearer <token>`
4. Middleware `authenticateToken` memverifikasi token di setiap request
5. Middleware `restrictCsAccess` membatasi akses role CS ke route tertentu

#### Role-Based Access Control

| Role | Akses |
|------|-------|
| `admin` | Semua endpoint |
| `cs` | Hanya `GET /schedule-pengiriman`, `GET /auth/me`, `PUT /auth/me` |

#### Database Connection

MySQL menggunakan connection pool (`mysql2/promise`):

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "trucking",
  connectionLimit: 10
});
```

Query dilakukan langsung tanpa ORM:

```javascript
const [rows] = await pool.query("SELECT * FROM truck WHERE is_active = 1");
```

#### External Integration: Wialon

```
Backend                          Wialon API
  │                                  │
  ├── Login (token) ────────────────►│
  │◄──── Session ID ────────────────┤
  │                                  │
  ├── search_items (units) ─────────►│
  │◄──── Unit positions ────────────┤
  │                                  │
  ├── get_zones_by_unit ────────────►│
  │◄──── Geofence membership ──────┤
  │                                  │
  ├── unit/get_trips ───────────────►│
  │◄──── Trip history ─────────────┤
```

- Session di-reuse selama TTL belum habis
- Semua komunikasi Wialon hanya dari backend (token tidak pernah ke frontend)
- Response Wialon bisa nested — selalu gunakan normalizer

#### Geofence Tracking (Background Service)

```
geofenceTrackingService.js
  │
  ├── Load active Sales Cost candidates
  ├── Load route-step → geofence mappings
  ├── Poll Wialon zone membership (interval)
  │
  └── If truck in mapped zone & not yet recorded:
      └── INSERT into sales_cost_route_history
```

- Berjalan otomatis saat server start
- Interval dikonfigurasi via `GEOFENCE_TRACKING_INTERVAL_MS`
- Hanya mencatat first-entry per step (no duplicates)

### Frontend Architecture

#### Component Hierarchy

```
App.vue
  └── Router View
       ├── views/Master/*        ← CRUD pages
       ├── views/Transaksi/*     ← Transaction pages
       ├── views/Monitoring/*    ← GPS & mileage
       ├── views/DataTransport/* ← Reports
       └── views/Auth/*          ← Login
```

#### API Communication

Frontend berkomunikasi dengan backend melalui:

1. **Development**: Vite proxy (`/api` → `http://127.0.0.1:3000`)
2. **Production**: Direct ke `VITE_API_URL` (e.g., `https://sankyu-transport.fun`)

```typescript
// src/config/api.js
export const API_ORIGIN = import.meta.env.VITE_API_URL || window.location.origin
export const API_BASE = `${API_ORIGIN}/api`
```

#### State Management

- Tidak menggunakan Vuex/Pinia global store
- State dikelola per-component atau via composables
- Data dari API di-fetch langsung di views menggunakan service wrappers

#### Map Architecture (Monitoring)

```
TruckLocationMap.vue
  ├── Left Panel: Leaflet Map (markers, clusters)
  ├── Middle Panel: Vehicle Detail (shown on selection)
  └── Right Panel: Fleet List (scrollable, searchable)
```

- Auto-refresh setiap 30 detik
- Reverse geocode hanya untuk truck yang dipilih (bukan semua)
- Cache di localStorage dengan TTL 24 jam

### Data Flow Patterns

#### Soft Delete Pattern

Trucks dan drivers menggunakan `is_active` flag:

```
Active (is_active = 1):
  ✓ Muncul di dropdown operasional
  ✓ Muncul di GPS/map views
  ✓ Bisa digunakan untuk transaksi baru

Inactive (is_active = 0):
  ✓ Tetap muncul di Master Data (admin)
  ✓ Tetap muncul di historical records
  ✗ Tidak muncul di dropdown operasional
  ✗ Tidak muncul di GPS/map views
  ✗ Tidak bisa digunakan untuk transaksi baru
```

#### Date Handling

> **⚠️ Penting:** MySQL `DATE` values harus diperlakukan sebagai local date.

Jangan gunakan:
- `new Date('YYYY-MM-DD')` (akan di-parse sebagai UTC)
- `toISOString().slice(0, 10)` (bisa bergeser 1 hari)

Gunakan:
```javascript
// Backend: preserve local calendar parts
const [year, month, day] = dateString.split('-');

// Frontend: parse to local Date
new Date(year, month - 1, day);
```

#### File Upload Pattern

```
Frontend (multipart/form-data)
  │
  ▼
multer middleware (disk storage)
  │
  ▼
node_backend/upload/<category>/
```

Kategori upload: `doc-data-truck`, `doc-data-chasis`, `doc-supir`

---

## 3. Development Setup

### Prerequisites

| Software | Versi Minimum | Catatan |
|----------|---------------|---------|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Bundled with Node.js |
| MySQL | 8.0+ | Atau MariaDB 10.6+ |
| Git | 2.30+ | — |
| MongoDB | 6.0+ | Opsional (fitur legacy) |

### Langkah 1: Clone Repository

```powershell
git clone <repo-url> transport_v1.04
cd transport_v1.04
```

### Langkah 2: Setup Backend

#### Install Dependencies

```powershell
cd node_backend
npm install
```

#### Konfigurasi Environment

```powershell
Copy-Item .env.example .env
```

Edit `node_backend/.env` dan isi nilai yang sesuai:

```
# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=trucking

# Authentication
JWT_SECRET=your_random_secret_string

# Server
PORT=3000

# Wialon GPS (minta ke admin)
WIALON_BASE_URL=https://hst-api.wialon.com/wialon/ajax.html
WIALON_TOKEN=your_wialon_token
WIALON_LOGIN_FLAGS=13
WIALON_SESSION_TTL_MS=2700000
WIALON_TIMEOUT_MS=20000

# Geoapify Reverse Geocoding
GEOAPIFY_API_KEY=your_geoapify_api_key
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1/geocode/reverse
GEOAPIFY_TIMEOUT_MS=6000

# Cache TTL
REVERSE_GEOCODE_CACHE_TTL_MS=86400000
WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS=600000

# Geofence Tracking
GEOFENCE_TRACKING_INTERVAL_MS=60000
DEFAULT_FINISH_GEOFENCE_NAME=Sankyu
```

> **💡 Tip:** Untuk development lokal tanpa GPS, cukup isi `DB_*`, `JWT_SECRET`, dan `PORT`. Fitur Wialon dan Geoapify akan gagal gracefully tanpa crash.

#### Setup Database

**Perangkat Baru (Database Kosong):**

```powershell
npm run migrate
```

Perintah ini akan:
- Membuat database `trucking` jika belum ada
- Menjalankan semua migration files di `db/migrations/`

**Database Existing (Sudah Ada Data):**

```powershell
npm run migrate:adopt-existing
```

Perintah ini akan:
- Melengkapi schema yang kurang (tabel tracking baru)
- Menandai semua migration sebagai sudah diterapkan
- Tidak menghapus data yang sudah ada

#### Jalankan Backend

```powershell
npm start
```

Backend akan berjalan di `http://localhost:3000`.

### Langkah 3: Setup Frontend

#### Install Dependencies

```powershell
cd tailadmin-vuejs-1.0.0
npm install
```

#### Jalankan Frontend

```powershell
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

> **ℹ️ Info:** Vite dev server otomatis mem-proxy request `/api/*` ke backend di port 3000. Pastikan backend sudah berjalan sebelum mengakses frontend.

### Langkah 4: Setup Documentation (Opsional)

```powershell
cd docs
npm install
npm run dev
```

Docs akan berjalan di `http://localhost:5174`.

### Verifikasi Setup

Checklist untuk memastikan setup berhasil:

- [ ] Backend berjalan tanpa error di terminal
- [ ] `http://localhost:3000/api/auth/login` merespons (POST)
- [ ] Frontend bisa diakses di `http://localhost:5173`
- [ ] Login berhasil dengan kredensial yang valid
- [ ] Dashboard menampilkan data

### Development Workflow

Buka 2 terminal terpisah:

**Terminal 1 — Backend:**
```powershell
cd node_backend
npm start
```

**Terminal 2 — Frontend:**
```powershell
cd tailadmin-vuejs-1.0.0
npm run dev
```

#### Hot Reload

- **Frontend**: Vite HMR otomatis reload saat file berubah
- **Backend**: Tidak ada hot reload bawaan. Restart manual dengan `Ctrl+C` lalu `npm start`

> **💡 Tip:** Untuk auto-restart backend, install `nodemon`:
> ```powershell
> npm install -g nodemon
> nodemon server.js
> ```

#### Akses dari Device Lain di LAN

Frontend Vite sudah dikonfigurasi listen di `0.0.0.0:5173`. Akses dari device lain:

```
http://<IP-HOST>:5173
```

#### Build Check (Frontend)

Sebelum commit, pastikan build tidak error:

```powershell
cd tailadmin-vuejs-1.0.0
npm run build-only
```

#### Linting & Formatting

```powershell
cd tailadmin-vuejs-1.0.0
npm run lint       # ESLint auto-fix
npm run format     # Prettier format
```

---

## 4. Database & Migrations

### Overview

Sistem menggunakan **MySQL** sebagai database utama dan **MongoDB** untuk fitur legacy. Schema MySQL dikelola menggunakan **dbmate** yang dibungkus dalam custom Node.js scripts.

### Struktur File

```
node_backend/
├── db.js                  # MySQL connection pool
├── db/
│   ├── migrations/        # SQL migration files (timestamp-ordered)
│   │   ├── 20260401010000_baseline_from_trucking_dump.sql
│   │   ├── 20260401011000_add_tracking_foreign_keys.sql
│   │   ├── 20260401012000_add_area_finish_geofence.sql
│   │   ├── 20260424010000_add_truck_is_active.sql
│   │   └── 20260424011000_add_driver_is_active.sql
│   ├── schema.sql         # Generated schema snapshot
│   └── README.md          # Migration CLI documentation
├── scripts/
│   ├── run-dbmate.js      # dbmate wrapper
│   ├── build-baseline-migration.js
│   ├── adopt-existing-migrations.js
│   └── dump-schema.js
└── models/                # Mongoose models (MongoDB legacy)
```

### Migration Commands

| Command | Fungsi |
|---------|--------|
| `npm run migrate` | Jalankan semua pending migrations |
| `npm run migrate:down` | Rollback migration terakhir |
| `npm run migrate:status` | Lihat status migration |
| `npm run migrate:new -- <name>` | Buat file migration baru |
| `npm run migrate:dump` | Generate `db/schema.sql` dari database aktif |
| `npm run migrate:adopt-existing` | Tandai migrations sebagai applied (DB existing) |
| `npm run migrate:baseline:build` | Build baseline migration dari SQL dump |

### Workflow: Membuat Perubahan Schema Baru

1. Buat file migration:
   ```powershell
   cd node_backend
   npm run migrate:new -- add_column_xyz
   ```

2. Edit file yang dihasilkan di `db/migrations/`:
   ```sql
   -- migrate:up
   ALTER TABLE truck ADD COLUMN xyz VARCHAR(100) NULL;

   -- migrate:down
   ALTER TABLE truck DROP COLUMN xyz;
   ```

3. Jalankan migration:
   ```powershell
   npm run migrate
   ```

4. (Opsional) Update schema snapshot:
   ```powershell
   npm run migrate:dump
   ```

5. Commit file migration ke git

### Naming Convention Migration

Format: `YYYYMMDDHHMMSS_deskripsi_singkat.sql`

Contoh:
- `20260401010000_baseline_from_trucking_dump.sql`
- `20260424010000_add_truck_is_active.sql`

### Tabel Utama

#### `truck`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `no_polisi` | VARCHAR | Nomor plat |
| `jenis_kendaraan` | VARCHAR | Tipe kendaraan |
| `wialon_unit_id` | VARCHAR(64) NULL | Mapping ke Wialon unit |
| `is_active` | TINYINT(1) DEFAULT 1 | Soft delete flag |

#### `driver`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `nama_supir` | VARCHAR | Nama driver |
| `is_active` | TINYINT(1) DEFAULT 1 | Soft delete flag |

#### `sales_cost`

Tabel transaksi utama yang menghubungkan truck, driver, customer, area, dan data biaya.

#### `area`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `kode_area` | VARCHAR | Kode area |
| `nama_area` | VARCHAR | Generated dari route steps |
| `finish_geofence_resource_id` | VARCHAR NULL | Wialon resource ID |
| `finish_geofence_zone_id` | VARCHAR NULL | Wialon zone ID |
| `finish_geofence_zone_name` | VARCHAR NULL | Nama geofence finish |

#### `area_route_step`

Menyimpan urutan langkah route per area dengan mapping ke Wialon geofence.

#### `sales_cost_route_history`

Menyimpan riwayat kunjungan geofence aktual per Sales Cost delivery.

#### `schema_migrations`

Tabel internal dbmate untuk tracking migration yang sudah diterapkan.

### Connection Pool

```javascript
// db.js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "trucking",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

#### Penggunaan di Route/Service

```javascript
const pool = require("../db");

// Query biasa
const [rows] = await pool.query("SELECT * FROM truck WHERE is_active = 1");

// Query dengan parameter (prepared statement)
const [rows] = await pool.query("SELECT * FROM truck WHERE id = ?", [truckId]);

// Insert
const [result] = await pool.query(
  "INSERT INTO truck (no_polisi, jenis_kendaraan) VALUES (?, ?)",
  [noPolisi, jenisKendaraan]
);
```

> **⚠️ Keamanan:** Selalu gunakan parameterized queries (`?` placeholder). Jangan pernah string concatenation untuk values.

### MongoDB (Legacy)

MongoDB digunakan untuk beberapa fitur lama. Model didefinisikan di `node_backend/models/`.

Koneksi MongoDB opsional — jika `MONGO_URI` tidak diset di `.env`, server tetap berjalan tanpa MongoDB.

### Backup & Restore

```powershell
# Export schema
npm run migrate:dump

# Full backup
mysqldump -u root -p trucking > backup_trucking.sql

# Restore
mysql -u root -p trucking < backup_trucking.sql
npm run migrate:adopt-existing
```

### Tips Database

1. **Selalu buat migration** untuk perubahan schema — jangan edit database langsung
2. **Commit migration files** ke git agar semua developer sinkron
3. **Jangan edit migration yang sudah di-apply** — buat migration baru untuk koreksi
4. **Test migration down** sebelum push untuk memastikan rollback berfungsi
5. **Gunakan `is_active` flag** untuk soft delete, bukan `DELETE FROM`
6. **Date handling**: Simpan sebagai `DATE` type, parse sebagai local date (bukan UTC)

---

## 5. API Reference

Semua endpoint menggunakan prefix `/api/` dan berkomunikasi via JSON. Autentikasi menggunakan JWT Bearer token di header `Authorization`.

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "username": "admin", "level": "admin" }
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile

```http
PUT /api/auth/me
Authorization: Bearer <token>
```

### Master Data

#### Trucks

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/trucks` | List trucks (default: active only) |
| GET | `/api/trucks?include_inactive=1` | List semua trucks |
| GET | `/api/trucks?status=active` | Filter active |
| GET | `/api/trucks?status=inactive` | Filter inactive |
| POST | `/api/trucks` | Create truck |
| PUT | `/api/trucks/:id` | Update truck |
| PATCH | `/api/trucks/:id/status` | Toggle active/inactive |
| DELETE | `/api/trucks/:id` | Hard delete truck |

#### Drivers

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/drivers` | List drivers (default: active only) |
| GET | `/api/drivers?include_inactive=1` | List semua drivers |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/:id` | Update driver |
| PATCH | `/api/drivers/:id/status` | Toggle active/inactive |
| DELETE | `/api/drivers/:id` | Hard delete driver |

#### Customers

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

#### Areas

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/areas` | List areas (includes route_steps) |
| GET | `/api/areas/:id` | Get area detail + route config |
| POST | `/api/areas` | Create area (with kode_area, route_steps) |
| PUT | `/api/areas/:id` | Update area + regenerate nama_area |
| DELETE | `/api/areas/:id` | Delete area |

#### Warehouses

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/warehouses` | List warehouses |
| POST | `/api/warehouses` | Create warehouse |
| PUT | `/api/warehouses/:id` | Update warehouse |
| DELETE | `/api/warehouses/:id` | Delete warehouse |

#### Subcontractors

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/subconts` | List subcontractors |
| POST | `/api/subconts` | Create subcontractor |
| PUT | `/api/subconts/:id` | Update subcontractor |
| DELETE | `/api/subconts/:id` | Delete subcontractor |

#### Admins

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admins` | List admin users |
| POST | `/api/admins` | Create admin |
| PUT | `/api/admins/:id` | Update admin |
| DELETE | `/api/admins/:id` | Delete admin |

### Transactions

#### Sales Cost

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/sales-costs` | List sales costs |
| GET | `/api/sales-costs/:id` | Detail (includes route_steps, route_history) |
| GET | `/api/sales-costs/:id/print` | Print single SPK |
| POST | `/api/sales-costs` | Create sales cost |
| PUT | `/api/sales-costs/:id` | Update sales cost |
| DELETE | `/api/sales-costs/:id` | Delete sales cost |

> **ℹ️ Info:** Sales Cost reject inactive trucks/drivers untuk create dan import. Edit existing record memperbolehkan keep current inactive truck/driver, tapi reject ganti ke inactive lain.

#### Repairs

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/repairs` | List repairs |
| POST | `/api/repairs` | Create repair |
| PUT | `/api/repairs/:id` | Update repair |
| DELETE | `/api/repairs/:id` | Delete repair |

#### Subcontractor Transactions

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/subcontractor` | List subcontractor transactions |
| POST | `/api/subcontractor` | Create transaction |
| PUT | `/api/subcontractor/:id` | Update transaction |
| DELETE | `/api/subcontractor/:id` | Delete transaction |

### GPS & Monitoring (Wialon)

#### Truck Locations

```http
GET /api/wialon/trucks/location
Authorization: Bearer <token>
```

Response per truck:
```json
{
  "id": 1,
  "no_polisi": "B 1234 XYZ",
  "lat": -6.123456,
  "lon": 106.789012,
  "speed": 45,
  "gps_status": "moving",
  "driver_name": "Budi",
  "operational_status": "transaksi",
  "transaksi": {},
  "repair": null,
  "last_transaction": {}
}
```

> **⚠️ Catatan:** Hanya mengembalikan trucks dengan `is_active = 1`.

#### Reverse Geocoding

```http
GET /api/wialon/reverse-geocode?lat=-6.123&lon=106.789
Authorization: Bearer <token>
```

- Hanya request untuk 1 truck yang dipilih (bukan semua)
- Cached 24 jam di backend dan frontend localStorage

#### Monthly Mileage

```http
GET /api/wialon/trucks/monthly-distance?month=2026-01
Authorization: Bearer <token>
```

#### Monthly Mileage Export

```http
GET /api/wialon/trucks/monthly-distance/export?month=2026-01
Authorization: Bearer <token>
```

Returns: `.xlsx` file

#### Auto-Map Trucks to Wialon

```http
POST /api/wialon/trucks/auto-map
Authorization: Bearer <token>
```

#### Geofence List

```http
GET /api/wialon/geofences
Authorization: Bearer <token>
```

### Other Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard` | Dashboard summary data |
| GET | `/api/data-trucks` | Data truck reports |
| GET | `/api/data-chasis` | Data chasis reports |
| GET | `/api/data-supir` | Data driver reports |
| GET | `/api/monitoring-kendaraan` | Vehicle monitoring summary |
| POST | `/api/master/import` | Import master data dari Excel |
| GET | `/api/master/template` | Download import template |
| GET | `/api/notifications` | List notifications |
| GET | `/api/schedule-pengiriman` | Schedule pengiriman (accessible by CS) |
| GET | `/api/address-book` | Address book |

### Error Responses

Semua error mengikuti format:

```json
{
  "message": "Deskripsi error dalam Bahasa Indonesia"
}
```

| Status Code | Arti |
|-------------|------|
| 400 | Bad Request — validasi gagal |
| 401 | Unauthorized — token tidak valid/expired |
| 403 | Forbidden — role tidak punya akses |
| 404 | Not Found — resource tidak ditemukan |
| 500 | Internal Server Error — error di server |

### Authentication Header

Semua endpoint (kecuali `/api/auth/login`) memerlukan:

```http
Authorization: Bearer <jwt_token>
```

---

## 6. Deployment

### Arsitektur Production

```
Internet
  │
  ▼
[Reverse Proxy / Domain]
  │
  ├── https://sankyu-transport.fun (Frontend)
  │     └── Static files (Vite build output)
  │
  └── https://sankyu-transport.fun/api/* (Backend)
        └── Node.js Express (port 3000)
```

### Prerequisites Production

| Software | Versi |
|----------|-------|
| Node.js | 18+ LTS |
| MySQL | 8.0+ |
| npm | 9+ |
| Git | 2.30+ |

Opsional:
- MongoDB 6.0+ (jika fitur legacy digunakan)
- PM2 atau systemd (process manager)
- Nginx atau Caddy (reverse proxy)

### Deploy Backend

#### 1. Clone & Install

```bash
git clone <repo-url> /opt/transport
cd /opt/transport/node_backend
npm install --production
```

#### 2. Konfigurasi Environment

Buat file `.env` dengan nilai production:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=transport_user
DB_PASS=<strong_password>
DB_NAME=trucking

JWT_SECRET=<random_64_char_string>
PORT=3000

WIALON_BASE_URL=https://hst-api.wialon.com/wialon/ajax.html
WIALON_TOKEN=<production_wialon_token>
WIALON_LOGIN_FLAGS=13
WIALON_SESSION_TTL_MS=2700000
WIALON_TIMEOUT_MS=20000

GEOAPIFY_API_KEY=<production_api_key>
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1/geocode/reverse
GEOAPIFY_TIMEOUT_MS=6000

REVERSE_GEOCODE_CACHE_TTL_MS=86400000
WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS=600000
GEOFENCE_TRACKING_INTERVAL_MS=60000
DEFAULT_FINISH_GEOFENCE_NAME=Sankyu
```

> **🔒 Keamanan:**
> - Gunakan password MySQL yang kuat dan user dedicated (bukan root)
> - Generate `JWT_SECRET` yang random dan panjang
> - Jangan commit `.env` ke git
> - Batasi akses file `.env` hanya untuk user yang menjalankan service

#### 3. Setup Database

```bash
npm run migrate
```

#### 4. Jalankan dengan Process Manager

**Menggunakan PM2:**

```bash
npm install -g pm2

# Start
pm2 start server.js --name transport-backend

# Auto-start on reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs transport-backend
```

**Menggunakan systemd:**

```ini
# /etc/systemd/system/transport-backend.service
[Unit]
Description=Transport Backend API
After=network.target mysql.service

[Service]
Type=simple
User=transport
WorkingDirectory=/opt/transport/node_backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable transport-backend
sudo systemctl start transport-backend
```

### Deploy Frontend

#### 1. Build

```bash
cd /opt/transport/tailadmin-vuejs-1.0.0
npm install
npm run build-only
```

Output build ada di folder `dist/`.

> **ℹ️ Info:** `npm run build-only` skip type-check untuk build lebih cepat. Gunakan `npm run build` jika ingin type-check sekaligus.

#### 2. Konfigurasi API URL

Pastikan `.env.production` mengarah ke URL backend yang benar:

```
VITE_API_URL=https://sankyu-transport.fun
```

#### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name sankyu-transport.fun;

    # Frontend static files
    root /opt/transport/tailadmin-vuejs-1.0.0/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ke backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy static uploads
    location /img/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location /doc-data-truck/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location /doc-data-chasis/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location /doc-supir/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

### Alternatif: Development Server sebagai Production

Untuk deployment sederhana (internal network):

```bash
# Backend
cd node_backend && npm start

# Frontend
cd tailadmin-vuejs-1.0.0 && npm run dev -- --host 0.0.0.0
```

> **⚠️ Peringatan:** Cara ini tidak direkomendasikan untuk production publik.

### Update / Redeploy

```bash
# Pull changes
cd /opt/transport
git pull origin main

# Update backend
cd node_backend
npm install
npm run migrate
pm2 restart transport-backend

# Update frontend
cd ../tailadmin-vuejs-1.0.0
npm install
npm run build-only
```

### SSL/HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sankyu-transport.fun
```

### Monitoring Production

```bash
# Logs (PM2)
pm2 logs transport-backend

# Logs (systemd)
journalctl -u transport-backend -f

# Health check
curl http://localhost:3000/api/auth/me
# Expect: 401 = server berjalan
```

### Database Backup (Cron)

```bash
# /etc/cron.d/transport-backup
0 2 * * * transport mysqldump -u transport_user -p'password' trucking > /backup/trucking_$(date +\%Y\%m\%d).sql
```

### Checklist Deployment

- [ ] `.env` production sudah dikonfigurasi dengan benar
- [ ] Database migration sudah dijalankan
- [ ] Frontend build berhasil tanpa error
- [ ] Backend berjalan dan merespons di port 3000
- [ ] Reverse proxy (Nginx) dikonfigurasi
- [ ] SSL certificate aktif
- [ ] Process manager (PM2/systemd) dikonfigurasi untuk auto-restart
- [ ] Backup database terjadwal
- [ ] Firewall hanya expose port 80/443

---

## 7. Troubleshooting

### Backend Issues

#### Server Tidak Bisa Start

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL tidak berjalan | Start MySQL service |
| `Access denied for user` | Kredensial salah | Cek `DB_USER` dan `DB_PASS` di `.env` |
| `Unknown database 'trucking'` | Database belum dibuat | Jalankan `npm run migrate` |
| `JWT_SECRET belum dikonfigurasi` | `.env` tidak lengkap | Tambahkan `JWT_SECRET` di `.env` |
| `MONGO_URI belum dikonfigurasi` | MongoDB tidak diset | Opsional — server tetap jalan |
| `EADDRINUSE :::3000` | Port sudah dipakai | Kill proses lain atau ganti `PORT` |

Cek port yang dipakai:
```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

#### API Return 401 Unauthorized

Penyebab umum:
1. Token expired — login ulang
2. Token tidak dikirim — cek header `Authorization: Bearer <token>`
3. `JWT_SECRET` berbeda antara saat generate dan verify

#### API Return 403 Forbidden

User dengan role `cs` mencoba akses endpoint yang tidak diizinkan. Hanya endpoint berikut yang bisa diakses CS:
- `GET /api/schedule-pengiriman`
- `GET /api/auth/me`
- `PUT /api/auth/me`

#### MySQL Connection Pool Exhausted

**Gejala:** Request timeout atau `Too many connections`

Solusi:
1. Pastikan tidak ada query yang hang
2. Cek `connectionLimit` di `db.js` (default: 10)
3. Pastikan setiap query menggunakan pool (bukan manual connection)

#### Migration Gagal

| Situasi | Solusi |
|---------|--------|
| Table already exists | Gunakan `npm run migrate:adopt-existing` |
| Syntax error di SQL | Perbaiki file migration, rollback dulu jika perlu |
| Permission denied | Cek user MySQL punya privilege CREATE/ALTER |

### Frontend Issues

#### Halaman Blank / White Screen

1. Buka browser DevTools (F12) → Console
2. Cek apakah ada JavaScript error
3. Cek Network tab — apakah API calls gagal

Penyebab umum:
- Backend belum berjalan → start backend dulu
- CORS error → seharusnya tidak terjadi dengan Vite proxy
- Build error → jalankan `npm run build-only` untuk cek

#### API Calls Gagal (Network Error)

**Development:**
- Pastikan backend berjalan di port 3000
- Vite proxy otomatis forward `/api/*` ke `http://127.0.0.1:3000`

**Production:**
- Pastikan `VITE_API_URL` di `.env.production` benar
- Cek Nginx proxy configuration

#### CSS / UI Tidak Update

- Hard refresh: `Ctrl + Shift + R`
- Clear browser cache
- Leaflet cluster icons bisa ter-cache

#### TypeScript Build Error

Jika ada TS error di file yang tidak terkait:
- Gunakan `npm run build-only` (skip type-check)
- File legacy `.js` di `src/services/` mungkin punya implicit any — known issue

#### Leaflet Map Tidak Muncul

1. Container div tidak punya height → pastikan parent punya fixed height
2. Leaflet CSS tidak ter-import → cek import di component
3. Tile server unreachable → cek koneksi internet

### GPS / Wialon Issues

#### Semua Truck Muncul Offline

1. Restart backend
2. Cek log backend untuk error login Wialon
3. Verifikasi `WIALON_TOKEN` di `.env` belum expired
4. Cek apakah Wialon API accessible dari server

#### Reverse Geocode Tidak Menampilkan Alamat

Penyebab:
1. `GEOAPIFY_API_KEY` tidak valid atau quota habis
2. Koordinat tidak valid (0,0 atau null)

Solusi:
- UI fallback ke koordinat mentah
- Cek Geoapify dashboard untuk usage/quota
- Clear localStorage jika ingin force re-fetch:
  ```javascript
  Object.keys(localStorage)
    .filter(k => k.startsWith('geocode_'))
    .forEach(k => localStorage.removeItem(k));
  ```

#### Geofence History Tetap "Pending"

Penyebab: Wialon `resource/get_zones_by_unit` mengembalikan nested payload.

Langkah debug:
1. Cek raw Wialon membership result untuk truck/unit bermasalah
2. Verifikasi parsed membership map dari `fetchUnitsInZonesByResource`
3. Pastikan `normalizeZoneMembershipPayload` handle nested format: `{resourceId: {zoneId: [unitIds]}}`
4. Cek apakah truck benar-benar di dalam polygon geofence di Wialon

#### Monthly Mileage "Invalid GPS Mapping"

Penyebab: `wialon_unit_id` di database tidak cocok dengan unit di Wialon.

Solusi:
1. Cek mapping di Master Truck
2. Jalankan auto-map ulang: `POST /api/wialon/trucks/auto-map`
3. Atau update `wialon_unit_id` manual

### Database Issues

#### Tanggal Bergeser 1 Hari

Penyebab: MySQL `DATE` di-parse melalui UTC conversion.

Solusi:
- Backend: Jangan gunakan `new Date(dateString).toISOString().slice(0,10)`
- Frontend: Parse dengan `new Date(year, month - 1, day)` bukan `new Date('YYYY-MM-DD')`

#### Data Tidak Konsisten Setelah Import

1. Cek log import di backend console
2. Verifikasi format Excel sesuai template
3. Pastikan referensi (truck_id, driver_id) valid dan active
4. Import akan reject inactive trucks/drivers

### Network & Infrastructure

#### CORS Error

- **Development:** Pastikan request ke `/api/*` (bukan full URL ke port 3000)
- **Production:** Pastikan Nginx proxy_pass dikonfigurasi untuk semua path

#### WebSocket / HMR Error (Development)

- Pastikan port 5173 tidak diblokir firewall
- Untuk development lokal, comment out `hmr` config di `vite.config.ts`

#### PowerShell Execution Policy

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Performance Issues

#### Backend Response Lambat

1. Cek slow queries: `SHOW PROCESSLIST;`
2. Tambahkan index untuk kolom yang sering di-query/filter
3. Cek Wialon API timeout (increase `WIALON_TIMEOUT_MS`)
4. Cek connection pool usage

#### Frontend Load Lambat

1. Jalankan production build (bukan dev mode)
2. Cek bundle size via `npm run build-only`
3. Pastikan gambar/assets sudah optimized
4. Gunakan browser DevTools → Performance tab

---

## 8. Coding Conventions

### Backend (Node.js / Express)

#### Bahasa & Module System

- JavaScript (bukan TypeScript)
- CommonJS: `require()` / `module.exports`
- Tidak menggunakan ES Modules di backend

#### Struktur File Route

```javascript
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM table_name");
    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

module.exports = router;
```

#### Naming Conventions (Backend)

| Item | Convention | Contoh |
|------|-----------|--------|
| File route | camelCase | `salesCost.js`, `dataTruck.js` |
| File service | camelCase | `wialonService.js` |
| Variable | camelCase | `truckId`, `noPolisi` |
| Database column | snake_case | `is_active`, `wialon_unit_id` |
| API endpoint | kebab-case | `/api/sales-costs`, `/api/data-trucks` |
| Error message | Bahasa Indonesia | `"Token tidak ditemukan"` |

#### Database Query Pattern

```javascript
// ✅ Parameterized query (aman dari SQL injection)
const [rows] = await pool.query(
  "SELECT * FROM truck WHERE id = ? AND is_active = ?",
  [id, 1]
);

// ❌ String concatenation (JANGAN)
const [rows] = await pool.query(
  `SELECT * FROM truck WHERE id = ${id}`
);
```

#### Error Handling Pattern

```javascript
router.post("/", async (req, res) => {
  try {
    // ... logic
    res.status(201).json({ message: "Berhasil", data: result });
  } catch (error) {
    console.error("Deskripsi context:", error);
    res.status(500).json({ message: "Pesan error user-friendly" });
  }
});
```

#### Soft Delete Pattern

```javascript
// Deactivate
router.patch("/:id/status", async (req, res) => {
  const { is_active } = req.body;
  await pool.query("UPDATE truck SET is_active = ? WHERE id = ?", [is_active, id]);
});

// Default query: hanya active
const [rows] = await pool.query("SELECT * FROM truck WHERE is_active = 1");

// Admin view: semua
const [rows] = await pool.query("SELECT * FROM truck");
```

#### Date Handling (Backend)

```javascript
// ✅ Preserve local date parts
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ❌ Jangan gunakan (bisa geser 1 hari karena UTC)
const bad = new Date(dateValue).toISOString().slice(0, 10);
```

### Frontend (Vue 3 / TypeScript)

#### Bahasa & Style

- TypeScript untuk file baru (`.ts`, `.vue` dengan `<script setup lang="ts">`)
- File legacy boleh tetap `.js` sampai ada kebutuhan refactor
- Vue 3 Composition API dengan `<script setup>`
- Tailwind CSS utility classes

#### Struktur Component (Vue SFC)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API_BASE } from '@/config/api'

const props = defineProps<{
  truckId: number
}>()

const loading = ref(false)
const data = ref<TruckData | null>(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/trucks/${props.truckId}`)
    data.value = await res.json()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-4">
    <!-- template -->
  </div>
</template>
```

#### Naming Conventions (Frontend)

| Item | Convention | Contoh |
|------|-----------|--------|
| Component file | PascalCase | `TruckLocationMap.vue` |
| View folder | PascalCase | `views/Master/`, `views/Monitoring/` |
| Service file | camelCase | `truckLocationService.ts` |
| Composable | camelCase with `use` prefix | `useAuth.ts` |
| Variable/ref | camelCase | `truckList`, `isLoading` |
| CSS class | Tailwind utilities | `class="flex items-center gap-2"` |

#### Service Pattern

```typescript
// src/services/truckLocationService.ts
import { API_BASE } from '@/config/api'

export const getTruckLocations = async () => {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/wialon/trucks/location`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}
```

#### Path Alias

Gunakan `@/` untuk import dari `src/`:

```typescript
import { API_BASE } from '@/config/api'
import TruckCard from '@/components/TruckCard.vue'
```

#### Tailwind CSS Guidelines

```html
<!-- ✅ Tailwind utilities -->
<div class="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm">

<!-- ❌ Hindari custom class tanpa alasan kuat -->
<div class="truck-card-wrapper">
```

### Git Conventions

#### Commit Messages

Format: `<type>: <description>`

| Type | Penggunaan |
|------|-----------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `refactor` | Refactoring tanpa perubahan behavior |
| `docs` | Perubahan dokumentasi |
| `style` | Formatting, missing semicolons, dll |
| `chore` | Maintenance, dependency update |

Contoh:
```
feat: add monthly mileage export to Excel
fix: date shift issue on Sales Cost edit
refactor: extract geofence tracking to service
```

#### Branch Naming

```
feature/add-truck-mileage
fix/date-shift-sales-cost
refactor/wialon-service-cleanup
```

### File Organization Rules

1. **Satu route file per domain** — jangan gabung multiple domains
2. **Business logic di services** — route hanya handle HTTP
3. **Satu service file per external integration** — e.g., `wialonService.js`
4. **Views by domain** — `views/Master/`, `views/Transaksi/`
5. **Shared components di `components/`** — bukan di dalam `views/`
6. **Migration files tidak boleh diedit** setelah di-apply — buat migration baru

### Bahasa

| Context | Bahasa |
|---------|--------|
| Code (variable, function, comments) | English |
| UI text | Bahasa Indonesia |
| API error messages | Bahasa Indonesia |
| Documentation | Bahasa Indonesia (kecuali technical terms) |
| Git commits | English |

---

> **Dokumen ini di-generate dari:** `docs/developer/` folder  
> **Terakhir diperbarui:** Mei 2026
