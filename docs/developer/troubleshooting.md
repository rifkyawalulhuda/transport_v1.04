---
title: "Troubleshooting"
outline: deep
---

# Troubleshooting

Panduan mengatasi masalah umum yang sering ditemui saat development maupun production.

## Backend Issues

### Server Tidak Bisa Start

**Gejala:** Error saat `npm start`

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL tidak berjalan | Start MySQL service |
| `Access denied for user` | Kredensial salah | Cek `DB_USER` dan `DB_PASS` di `.env` |
| `Unknown database 'trucking'` | Database belum dibuat | Jalankan `npm run migrate` |
| `JWT_SECRET belum dikonfigurasi` | `.env` tidak lengkap | Tambahkan `JWT_SECRET` di `.env` |
| `MONGO_URI belum dikonfigurasi` | MongoDB tidak diset | Opsional — server tetap jalan tanpa MongoDB |
| `EADDRINUSE :::3000` | Port sudah dipakai | Kill proses lain di port 3000 atau ganti `PORT` |

**Cek port yang dipakai:**
```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### API Return 401 Unauthorized

**Penyebab umum:**
1. Token expired — login ulang
2. Token tidak dikirim — cek header `Authorization: Bearer <token>`
3. `JWT_SECRET` berbeda antara saat generate dan verify — pastikan konsisten

### API Return 403 Forbidden

**Penyebab:**
- User dengan role `cs` mencoba akses endpoint yang tidak diizinkan
- Hanya endpoint berikut yang bisa diakses CS:
  - `GET /api/schedule-pengiriman`
  - `GET /api/auth/me`
  - `PUT /api/auth/me`

### MySQL Connection Pool Exhausted

**Gejala:** Request timeout atau error `Too many connections`

**Solusi:**
1. Pastikan tidak ada query yang hang (long-running query)
2. Cek `connectionLimit` di `db.js` (default: 10)
3. Pastikan setiap query menggunakan pool (bukan manual connection yang tidak di-release)

### Migration Gagal

**Gejala:** `npm run migrate` error

| Situasi | Solusi |
|---------|--------|
| Table already exists | Gunakan `npm run migrate:adopt-existing` |
| Syntax error di SQL | Perbaiki file migration, rollback dulu jika perlu |
| Permission denied | Cek user MySQL punya privilege CREATE/ALTER |

## Frontend Issues

### Halaman Blank / White Screen

**Langkah debug:**
1. Buka browser DevTools (F12) → Console
2. Cek apakah ada JavaScript error
3. Cek Network tab — apakah API calls gagal

**Penyebab umum:**
- Backend belum berjalan → start backend dulu
- CORS error → seharusnya tidak terjadi dengan Vite proxy
- Build error → jalankan `npm run build-only` untuk cek

### API Calls Gagal (Network Error)

**Development:**
- Pastikan backend berjalan di port 3000
- Vite proxy otomatis forward `/api/*` ke `http://127.0.0.1:3000`
- Cek `vite.config.ts` jika proxy tidak bekerja

**Production:**
- Pastikan `VITE_API_URL` di `.env.production` benar
- Cek Nginx proxy configuration
- Cek apakah backend accessible dari server frontend

### CSS / UI Tidak Update

**Penyebab:** Browser cache

**Solusi:**
- Hard refresh: `Ctrl + Shift + R`
- Clear browser cache
- Leaflet cluster icons bisa ter-cache — force refresh jika map styling berubah

### TypeScript Build Error

```powershell
cd tailadmin-vuejs-1.0.0
npm run build
```

Jika ada TS error di file yang tidak terkait perubahan Anda:
- Gunakan `npm run build-only` (skip type-check) untuk build tanpa TS validation
- File legacy `.js` di `src/services/` mungkin punya implicit any — ini known issue

### Leaflet Map Tidak Muncul

**Penyebab umum:**
1. Container div tidak punya height → pastikan parent element punya fixed height
2. Leaflet CSS tidak ter-import → cek import di component
3. Tile server unreachable → cek koneksi internet

### Marker Icon Rusak di Production Build

**Gejala:** Marker muncul sebagai gambar broken/placeholder "Mark" di production build (Cloudflared/dist).

**Penyebab:** Leaflet default marker menggunakan file PNG external (`marker-icon.png`, `marker-shadow.png`) dari `leaflet/dist/images/`. Saat Vite build, path file ini tidak ter-resolve dengan benar (hash berubah atau path relatif salah).

**Solusi:** Gunakan `L.divIcon()` dengan inline SVG, bukan default marker:

```ts
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none">
    <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill="#3B82F6"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
})

// Gunakan saat membuat marker:
L.marker([lat, lng], { icon: pinIcon }).addTo(map)
```

> **Catatan:** Pattern yang sama sudah digunakan di `TruckLocationMap.vue` untuk marker truk.

## GPS / Wialon Issues

### Semua Truck Muncul Offline

**Langkah debug:**
1. Restart backend
2. Cek apakah Wialon token masih valid:
   ```bash
   # Cek log backend untuk error login Wialon
   pm2 logs transport-backend | grep -i wialon
   ```
3. Verifikasi `WIALON_TOKEN` di `.env` belum expired
4. Cek apakah Wialon API accessible dari server

### Reverse Geocode Tidak Menampilkan Alamat

**Penyebab:**
1. `GEOAPIFY_API_KEY` tidak valid atau quota habis
2. Koordinat tidak valid (0,0 atau null)

**Solusi:**
- UI akan fallback ke menampilkan koordinat mentah
- Cek Geoapify dashboard untuk usage/quota
- Clear localStorage browser jika ingin force re-fetch sebelum TTL 24 jam habis:
  ```javascript
  // Di browser console
  Object.keys(localStorage)
    .filter(k => k.startsWith('geocode_'))
    .forEach(k => localStorage.removeItem(k));
  ```

### Geofence History Tetap "Pending"

**Penyebab paling umum:** Wialon `resource/get_zones_by_unit` mengembalikan nested payload yang tidak di-parse dengan benar.

**Langkah debug:**
1. Cek raw Wialon membership result untuk truck/unit yang bermasalah
2. Verifikasi parsed membership map dari `fetchUnitsInZonesByResource`
3. Pastikan `normalizeZoneMembershipPayload` di `wialonService.js` handle nested format:
   ```
   {resourceId: {zoneId: [unitIds]}}
   ```
4. Cek apakah truck benar-benar di dalam polygon geofence di Wialon monitoring

### Monthly Mileage Menampilkan "Invalid GPS Mapping"

**Penyebab:** `wialon_unit_id` di database tidak cocok dengan unit yang ada di Wialon.

**Solusi:**
1. Cek mapping di Master Truck
2. Jalankan auto-map ulang: `POST /api/wialon/trucks/auto-map`
3. Atau update `wialon_unit_id` manual di Master Truck edit

## Database Issues

### Tanggal Bergeser 1 Hari

**Penyebab:** MySQL `DATE` di-parse melalui UTC conversion.

**Solusi:**
- Backend: Jangan gunakan `new Date(dateString).toISOString().slice(0,10)`
- Frontend: Parse dengan `new Date(year, month - 1, day)` bukan `new Date('YYYY-MM-DD')`
- Lihat [Architecture > Date Handling](/developer/architecture#date-handling)

### Data Tidak Konsisten Setelah Import

**Langkah:**
1. Cek log import di backend console
2. Verifikasi format Excel sesuai template
3. Pastikan referensi (truck_id, driver_id, dll) valid dan active
4. Import akan reject inactive trucks/drivers

## Network & Infrastructure

### CORS Error di Browser

**Development:** Seharusnya tidak terjadi karena Vite proxy. Jika terjadi:
- Pastikan request ke `/api/*` (bukan full URL ke port 3000)
- Cek `vite.config.ts` proxy configuration

**Production:** Pastikan Nginx proxy_pass dikonfigurasi dengan benar untuk semua path.

### WebSocket / HMR Error (Development)

**Gejala:** `[vite] failed to connect to websocket`

**Solusi:**
- Pastikan port 5173 tidak diblokir firewall
- Jika akses dari LAN, cek `hmr.host` di `vite.config.ts`
- Untuk development lokal biasa, comment out `hmr` config

### PowerShell Execution Policy

```powershell
# Error: running scripts is disabled on this system
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Performance Issues

### Backend Response Lambat

1. Cek slow queries MySQL:
   ```sql
   SHOW PROCESSLIST;
   ```
2. Tambahkan index untuk kolom yang sering di-query/filter
3. Cek apakah Wialon API timeout (increase `WIALON_TIMEOUT_MS`)
4. Cek connection pool usage

### Frontend Load Lambat

1. Jalankan production build dan serve static (bukan dev mode)
2. Cek bundle size: `npm run build-only` akan menampilkan chunk sizes
3. Pastikan gambar/assets sudah optimized
4. Gunakan browser DevTools → Performance tab

## Logging

### Backend Logs

Backend menggunakan `console.log`/`console.error`. Untuk production dengan PM2:

```bash
pm2 logs transport-backend --lines 100
```

### Melihat Request yang Masuk

Tambahkan logging middleware sementara di `server.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

## Kontak & Eskalasi

Jika masalah tidak bisa diselesaikan:
1. Cek dokumentasi Wialon API untuk issue GPS
2. Cek Geoapify status page untuk issue geocoding
3. Cek MySQL error log: `SHOW VARIABLES LIKE 'log_error';`
