---
title: "Architecture"
outline: deep
---

# Architecture

## Gambaran Umum

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

## Backend Architecture

### Layer Pattern

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

### Route Registration

Semua route didaftarkan di `server.js` dengan prefix `/api/`:

```javascript
app.use("/api/trucks", truckRouter);
app.use("/api/sales-costs", salesCostRouter);
app.use("/api/wialon", wialonRouter);
// ...
```

### Authentication Flow

1. User login via `POST /api/auth/login`
2. Backend memverifikasi kredensial dan mengembalikan JWT token
3. Frontend menyimpan token dan mengirimnya di header `Authorization: Bearer <token>`
4. Middleware `authenticateToken` memverifikasi token di setiap request
5. Middleware `restrictCsAccess` membatasi akses role CS ke route tertentu

### Role-Based Access Control

| Role | Akses |
|------|-------|
| `admin` | Semua endpoint |
| `cs` | Hanya `GET /schedule-pengiriman`, `GET /auth/me`, `PUT /auth/me` |

### Database Connection

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

### External Integration: Wialon

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

### Geofence Tracking (Background Service)

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

## Frontend Architecture

### Component Hierarchy

```
App.vue
  └── Router View
       ├── views/Master/*        ← CRUD pages
       ├── views/Transaksi/*     ← Transaction pages
       ├── views/Monitoring/*    ← GPS & mileage
       ├── views/DataTransport/* ← Reports
       └── views/Auth/*          ← Login
```

### API Communication

Frontend berkomunikasi dengan backend melalui:

1. **Development**: Vite proxy (`/api` → `http://127.0.0.1:3000`)
2. **Production**: Direct ke `VITE_API_URL` (e.g., `https://sankyu-transport.fun`)

```typescript
// src/config/api.js
export const API_ORIGIN = import.meta.env.VITE_API_URL || window.location.origin
export const API_BASE = `${API_ORIGIN}/api`
```

### State Management

- Tidak menggunakan Vuex/Pinia global store
- State dikelola per-component atau via composables
- Data dari API di-fetch langsung di views menggunakan service wrappers

### Map Architecture (Monitoring)

```
TruckLocationMap.vue
  ├── Left Panel: Leaflet Map (markers, clusters)
  ├── Middle Panel: Vehicle Detail (shown on selection)
  └── Right Panel: Fleet List (scrollable, searchable)
```

- Auto-refresh setiap 30 detik
- Reverse geocode hanya untuk truck yang dipilih (bukan semua)
- Cache di localStorage dengan TTL 24 jam

## Data Flow Patterns

### Soft Delete Pattern

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

### Date Handling

::: warning Penting
MySQL `DATE` values harus diperlakukan sebagai local date. Jangan gunakan:
- `new Date('YYYY-MM-DD')` (akan di-parse sebagai UTC)
- `toISOString().slice(0, 10)` (bisa bergeser 1 hari)

Gunakan:
```javascript
// Backend: preserve local calendar parts
const [year, month, day] = dateString.split('-');

// Frontend: parse to local Date
new Date(year, month - 1, day);
```
:::

### File Upload Pattern

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
