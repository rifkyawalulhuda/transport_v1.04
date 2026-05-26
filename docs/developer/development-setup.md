---
title: "Development Setup"
outline: deep
---

# Development Setup

Panduan lengkap untuk menyiapkan environment development di perangkat baru.

## Prerequisites

Pastikan software berikut sudah terinstall:

| Software | Versi Minimum | Catatan |
|----------|---------------|---------|
| Node.js | 18+ | LTS recommended |
| npm | 9+ | Bundled with Node.js |
| MySQL | 8.0+ | Atau MariaDB 10.6+ |
| Git | 2.30+ | — |
| MongoDB | 6.0+ | Opsional (fitur legacy) |

## 1. Clone Repository

```powershell
git clone <repo-url> transport_v1.04
cd transport_v1.04
```

## 2. Setup Backend

### Install Dependencies

```powershell
cd node_backend
npm install
```

### Konfigurasi Environment

```powershell
Copy-Item .env.example .env
```

Edit `node_backend/.env` dan isi nilai yang sesuai:

```env
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

::: tip
Untuk development lokal tanpa GPS, cukup isi `DB_*`, `JWT_SECRET`, dan `PORT`. Fitur Wialon dan Geoapify akan gagal gracefully tanpa crash.
:::

### Setup Database

#### Perangkat Baru (Database Kosong)

```powershell
npm run migrate
```

Perintah ini akan:
- Membuat database `trucking` jika belum ada
- Menjalankan semua migration files di `db/migrations/`

#### Database Existing (Sudah Ada Data)

Jika database sudah terisi dari dump SQL sebelumnya:

```powershell
npm run migrate:adopt-existing
```

Perintah ini akan:
- Melengkapi schema yang kurang (tabel tracking baru)
- Menandai semua migration sebagai sudah diterapkan
- Tidak menghapus data yang sudah ada

### Jalankan Backend

```powershell
npm start
```

Backend akan berjalan di `http://localhost:3000`.

## 3. Setup Frontend

### Install Dependencies

```powershell
cd tailadmin-vuejs-1.0.0
npm install
```

### Konfigurasi Environment (Opsional)

Untuk development lokal, frontend sudah dikonfigurasi dengan Vite proxy ke `http://127.0.0.1:3000`. Tidak perlu mengubah file `.env.development` kecuali ada kebutuhan khusus.

File `.env.development`:
```env
VITE_ENABLE_VUE_DEVTOOLS=true
```

### Jalankan Frontend

```powershell
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

::: info
Vite dev server otomatis mem-proxy request `/api/*` ke backend di port 3000. Pastikan backend sudah berjalan sebelum mengakses frontend.
:::

## 4. Setup Documentation (Opsional)

```powershell
cd docs
npm install
npm run dev
```

Docs akan berjalan di `http://localhost:5174`.

## 5. Verifikasi Setup

Checklist untuk memastikan setup berhasil:

- [ ] Backend berjalan tanpa error di terminal
- [ ] `http://localhost:3000/api/auth/login` merespons (POST)
- [ ] Frontend bisa diakses di `http://localhost:5173`
- [ ] Login berhasil dengan kredensial yang valid
- [ ] Dashboard menampilkan data

## Development Workflow

### Menjalankan Semua Service

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

### Hot Reload

- **Frontend**: Vite HMR otomatis reload saat file berubah
- **Backend**: Tidak ada hot reload bawaan. Restart manual dengan `Ctrl+C` lalu `npm start`

::: tip
Untuk auto-restart backend saat development, bisa install `nodemon` secara global:
```powershell
npm install -g nodemon
nodemon server.js
```
:::

### Akses dari Device Lain di LAN

Frontend Vite sudah dikonfigurasi listen di `0.0.0.0:5173`. Akses dari device lain menggunakan IP komputer host:

```
http://<IP-HOST>:5173
```

### Build Check (Frontend)

Sebelum commit, pastikan build tidak error:

```powershell
cd tailadmin-vuejs-1.0.0
npm run build-only
```

### Linting & Formatting

```powershell
cd tailadmin-vuejs-1.0.0
npm run lint       # ESLint auto-fix
npm run format     # Prettier format
```

## Troubleshooting Setup

### `npm install` gagal

- Pastikan Node.js versi 18+
- Hapus `node_modules` dan `package-lock.json`, lalu install ulang
- Cek koneksi internet (beberapa package perlu download binary)

### Backend tidak bisa connect ke MySQL

- Pastikan MySQL service berjalan
- Verifikasi kredensial di `.env`
- Cek apakah database `trucking` sudah dibuat

### Frontend blank / API error

- Pastikan backend sudah berjalan di port 3000
- Cek browser console untuk error
- Pastikan tidak ada CORS issue (seharusnya tidak ada karena proxy)

### PowerShell execution policy error

Jika mendapat error saat menjalankan script:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
