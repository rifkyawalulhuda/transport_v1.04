---
title: "API Reference"
outline: deep
---

# API Reference

Semua endpoint menggunakan prefix `/api/` dan berkomunikasi via JSON. Autentikasi menggunakan JWT Bearer token di header `Authorization`.

## Authentication

### Login

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

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Update Profile

```http
PUT /api/auth/me
Authorization: Bearer <token>
```

## Master Data

### Trucks

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

### Drivers

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/drivers` | List drivers (default: active only) |
| GET | `/api/drivers?include_inactive=1` | List semua drivers |
| POST | `/api/drivers` | Create driver |
| PUT | `/api/drivers/:id` | Update driver |
| PATCH | `/api/drivers/:id/status` | Toggle active/inactive |
| DELETE | `/api/drivers/:id` | Hard delete driver |

### Customers

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Areas

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/areas` | List areas (includes route_steps) |
| GET | `/api/areas/:id` | Get area detail + route config |
| POST | `/api/areas` | Create area (with kode_area, route_steps) |
| PUT | `/api/areas/:id` | Update area + regenerate nama_area |
| DELETE | `/api/areas/:id` | Delete area |

### Warehouses

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/warehouses` | List warehouses |
| POST | `/api/warehouses` | Create warehouse |
| PUT | `/api/warehouses/:id` | Update warehouse |
| DELETE | `/api/warehouses/:id` | Delete warehouse |

### Subcontractors

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/subconts` | List subcontractors |
| POST | `/api/subconts` | Create subcontractor |
| PUT | `/api/subconts/:id` | Update subcontractor |
| DELETE | `/api/subconts/:id` | Delete subcontractor |

### Admins

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admins` | List admin users |
| POST | `/api/admins` | Create admin |
| PUT | `/api/admins/:id` | Update admin |
| DELETE | `/api/admins/:id` | Delete admin |

## Transactions

### Sales Cost

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/sales-costs` | List sales costs |
| GET | `/api/sales-costs/:id` | Detail (includes route_steps, route_history) |
| GET | `/api/sales-costs/:id/print` | Print single SPK |
| POST | `/api/sales-costs` | Create sales cost |
| PUT | `/api/sales-costs/:id` | Update sales cost |
| DELETE | `/api/sales-costs/:id` | Delete sales cost |

::: info
Sales Cost reject inactive trucks/drivers untuk create dan import. Edit existing record memperbolehkan keep current inactive truck/driver, tapi reject ganti ke inactive lain.
:::

### Repairs

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/repairs` | List repairs |
| POST | `/api/repairs` | Create repair |
| PUT | `/api/repairs/:id` | Update repair |
| DELETE | `/api/repairs/:id` | Delete repair |

### Subcontractor Transactions

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/subcontractor` | List subcontractor transactions |
| POST | `/api/subcontractor` | Create transaction |
| PUT | `/api/subcontractor/:id` | Update transaction |
| DELETE | `/api/subcontractor/:id` | Delete transaction |

## GPS & Monitoring (Wialon)

### Truck Locations

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
  "transaksi": { ... },
  "repair": null,
  "last_transaction": { ... }
}
```

::: warning
Hanya mengembalikan trucks dengan `is_active = 1`.
:::

### Reverse Geocoding

```http
GET /api/wialon/reverse-geocode?lat=-6.123&lon=106.789
Authorization: Bearer <token>
```

- Hanya request untuk 1 truck yang dipilih (bukan semua)
- Cached 24 jam di backend dan frontend localStorage

### Monthly Mileage

```http
GET /api/wialon/trucks/monthly-distance?month=2026-01
Authorization: Bearer <token>
```

### Monthly Mileage Export

```http
GET /api/wialon/trucks/monthly-distance/export?month=2026-01
Authorization: Bearer <token>
```

Returns: `.xlsx` file

### Auto-Map Trucks to Wialon

```http
POST /api/wialon/trucks/auto-map
Authorization: Bearer <token>
```

### Geofence List

```http
GET /api/wialon/geofences
Authorization: Bearer <token>
```

## Data Transport (Reports)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/data-trucks` | Data truck reports |
| GET | `/api/data-chasis` | Data chasis reports |
| GET | `/api/data-supir` | Data driver reports |

## Monitoring

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/monitoring-kendaraan` | Vehicle monitoring summary |

## Import/Export

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/master/import` | Import master data dari Excel |
| GET | `/api/master/template` | Download import template |

## Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard` | Dashboard summary data |

## Other

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/schedule-pengiriman` | Schedule pengiriman (accessible by CS) |
| GET | `/api/address-book` | Address book |

## BBS (Safety)

Modul Behavior-Based Safety. Seluruh endpoint memerlukan `Authorization: Bearer <token>`.
Sebagian endpoint hanya untuk level **admin** (ditandai 🔒).

### Observasi, Checklist, Insiden

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/bbs/dashboard?month=YYYY-MM` | Ringkasan + skor ADAS per truk |
| POST | `/api/bbs/observations` | Simpan observasi manual |
| POST | `/api/bbs/checklists` | Simpan checklist kendaraan |
| POST | `/api/bbs/incidents` | Simpan insiden / near-miss |
| GET | `/api/bbs/observations/:id` | Detail observasi manual (baris ADAS → **404**) |
| GET | `/api/bbs/checklists/:id` | Detail checklist |
| GET | `/api/bbs/incidents/:id` | Detail insiden |
| GET | `/api/bbs/checklists/today-plates` | Plat yang sudah dichecklist hari ini |
| PUT | `/api/bbs/observations/:id` | Update observasi manual (baris ADAS → **404**) |
| PUT | `/api/bbs/checklists/:id` | Update checklist |
| PUT | `/api/bbs/incidents/:id` | Update insiden |
| DELETE | `/api/bbs/observations/:id` | Hapus observasi manual (baris ADAS → **404**) |
| DELETE | `/api/bbs/checklists/:id` | Hapus checklist |
| DELETE | `/api/bbs/incidents/:id` | Hapus insiden |

::: warning Riwayat mengecualikan data upload
`GET /api/bbs/history` dan `GET /api/bbs/export` **tidak menyertakan** observasi dengan
`source = 'adas'`. Endpoint `observations/:id` juga menolak baris ADAS dengan **404** supaya data
hasil upload tidak bisa dibuka/diedit/dihapus dari jalur Riwayat.

Filter `GET /api/bbs/history`: `type` (`all`/`observasi`/`checklist`/`insiden`), `search`, `month`,
`driver_id`, `plate_number`, `status`, `limit` (maks 200), `offset`.
:::

### Alarm ADAS

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/bbs/alarms/import` | Import CSV/XLSX (maks 10 MB; level `user` ditolak 403) |
| GET | `/api/bbs/alarms` | Daftar alarm |
| GET | `/api/bbs/alarm-breakdown?month=YYYY-MM&plates=A,B` | Breakdown alarm per tipe |
| GET | `/api/bbs/alarm-plates` | Daftar kendaraan yang punya data ADAS + jumlah alarm |

**Filter `GET /api/bbs/alarms`:** `plates=A,B` (cocok persis, untuk kontrol terpadu), `plate` (pencarian sebagian),
`alarm_type`, `date_from`, `date_to`, `page`, `limit` (maks 100).

**`GET /api/bbs/alarm-plates`** — dipakai mengisi filter chart:
```json
{ "plates": [{ "plate_number": "B 9979 SYM", "total": 1776, "last_alarm": "2026-09-16" }], "max_selectable": 6 }
```

**`GET /api/bbs/alarm-breakdown`** — `plates` opsional (maks **6**, selebihnya `truncated: true`):
```json
{
  "labels": ["Lane Departure Warning", "Headway Monitoring Warning"],
  "data": [714, 462],
  "series": [{ "plate": "B 9979 SYM", "total": 1776, "data": [714, 462] }],
  "plates_used": ["B 9979 SYM"],
  "truncated": false,
  "month": "2026-09"
}
```
`labels` = tipe alarm yang muncul pada hasil terfilter, urut **total DESC**. `data` = total per tipe
(kompatibel dengan klien lama); `series` = rincian per kendaraan untuk *grouped bar*.

## Kecepatan (Speed)

Tab Kecepatan memakai prefix `/api/bbs/speed`. Endpoint 🔒 hanya untuk level **admin**.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/bbs/speed/import` | Import CSV/XLSX (maks 10 MB) |
| GET | `/api/bbs/speed/plates` | Daftar kendaraan yang punya pelanggaran + jumlah event |
| GET | `/api/bbs/speed/by-vehicle?month=YYYY-MM&plates=A,B` | Total pelanggaran per kendaraan |
| GET | `/api/bbs/speed/daily-trend?month=YYYY-MM&plates=A,B` | Tren pelanggaran per tanggal (1..31) |
| GET | `/api/bbs/speed/events?month=YYYY-MM&plates=A,B&plate=` | Daftar event pelanggaran (paginasi) |
| GET | `/api/bbs/speed/summary?month=YYYY-MM` | Ringkasan bulanan |
| GET | `/api/bbs/speed?month=YYYY-MM` | Agregat harian (`bbs_speed_daily`) |
| GET | `/api/bbs/speed/threshold-preview?kmh=60&month=YYYY-MM` 🔒 | Simulasi ambang batas (read-only) |
| POST | `/api/bbs/speed/recompute` 🔒 | Hitung ulang event + agregat dari data mentah |
| DELETE | `/api/bbs/speed/import/:month` 🔒 | Hapus seluruh data satu bulan (`optimize=true` opsional) |
| POST | `/api/bbs/speed/purge` 🔒 | Hapus data kedaluwarsa sesuai retensi Speed |

**Konvensi `plates`:** comma-separated `plates=A,B,C` — maksimum **6** kendaraan (kelebihan dipotong
dan `truncated: true`). Plate tak dikenal menghasilkan hasil kosong, bukan error.

**`GET /api/bbs/speed/daily-trend`** mengembalikan `labels` (semua tanggal bulan itu, `YYYY-MM-DD`),
`data` (total per tanggal), dan `series` (satu entri per kendaraan) — pola sama dengan `alarm-breakdown`.

**`GET /api/bbs/speed/by-vehicle`:**
```json
{ "rows": [{ "plate_number": "B 9979 SYM", "total": 34, "days": 14, "overspeed_seconds": 2040, "max_speed_kmh": 67.95 }],
  "total_vehicles": 1, "truncated": false, "month": "2026-09" }
```

### Retensi Data 🔒

Hanya level **admin**.

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/bbs/retention` | Pengaturan retensi aktif + bounds + defaults |
| GET | `/api/bbs/retention/preview?modules=adas,speed&days=90` | Pratinjau (**read-only**); `days` opsional sebagai nilai kandidat |
| POST | `/api/bbs/retention/purge` | Eksekusi penghapusan |

**Semantik angka retensi:** `days > 0` = hapus data lebih tua dari N hari; `days <= 0` = **nonaktif**
(modul dilewati). **ADAS** memakai basis `begin_time`; **Speed** memakai `creation_time` / `end_time` / `day`.

**Dua langkah wajib** — tanpa `confirm: true` hanya melaporkan dampak:
```http
POST /api/bbs/retention/purge
{ "modules": ["adas", "speed"], "days": 90, "confirm": false }
→ 200 { "requires_confirmation": true, "preview": { ... } }

POST /api/bbs/retention/purge
{ "modules": ["adas", "speed"], "days": 90, "confirm": true, "optimize": false }
→ 200 { "results": { "adas":  { "days": 90, "enabled": true, "deleted": 0 },
                     "speed": { "days": 90, "enabled": true,
                                "deleted": { "telemetry": 0, "events": 0, "daily": 0 } } } }
```
Setiap eksekusi dicatat ke audit log dengan event `bbs_retention_purge`.

### Pengaturan BBS

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/bbs/settings` | Nilai tersimpan + nilai efektif + bounds + labels |
| PUT | `/api/bbs/settings` 🔒 | Simpan sebagian setting (validasi per key) |

Key yang didukung: `speed.overspeed_threshold_kmh` (20–200), `speed.retention_days`,
`speed.score_penalty_factor`, `speed.weight`, `speed.burst_gap_seconds`,
`speed.sample_interval_seconds` (60–3600), `adas.retention_days` (**0**–3650).

::: tip Mengapa `adas.retention_days` boleh 0
Key `speed.*` memakai batas sesuai fungsinya, sedangkan `adas.retention_days` menerima **0** karena
0 berarti *nonaktif* — bukan nilai tak valid.
:::

## GPS & Tracking

### GPS Trail

```http
GET /api/sales-costs/:id/gps-trail
Authorization: Bearer <token>
```

Mengambil jejak GPS perjalanan truk untuk satu SPK. Soft-fail — selalu HTTP 200.

**Response:**
```json
{
  "id_sales_cost": 44413,
  "wialon_unit_id": "26365312",
  "no_police": "B 9567 FXS",
  "from": 1753570800,
  "to": 1753610000,
  "point_count_raw": 1243,
  "point_count": 800,
  "downsampled": true,
  "points": [
    { "t": 1753571000, "lat": -6.391, "lon": 107.158, "speed": 0 }
  ],
  "markers": [
    {
      "type": "history",
      "label": "Tujuan 1",
      "step_key": "stop:273",
      "t": 1753590000,
      "lat": -6.356,
      "lon": 107.281
    }
  ],
  "planned_stops": [
    {
      "id": 273,
      "stop_order": 1,
      "label": "Tujuan 1",
      "kind": "middle",
      "middle_index": 1,
      "wialon_zone_name": "Fuji Trans GIIC",
      "lat": -6.356098,
      "lon": 107.281455,
      "polygon": [[-6.354, 107.279], [-6.357, 107.283]],
      "hit": true
    }
  ],
  "reason": null
}
```

**Field `reason`:** `null` (OK), `no_truck`, `no_wialon_unit`, `no_departure`, `wialon_empty`, `wialon_error`, `invalid_window`

Lihat [GPS Trail Playback](/developer/gps-trail) untuk dokumentasi lengkap.

---

### Backfill Stop

```http
POST /api/sales-costs/:id/backfill-stop
Authorization: Bearer <token>
Content-Type: application/json
```

Mencari hit GPS retroaktif untuk stop yang geofence-nya diubah.

**Body GPS-based:**
```json
{ "id_sc_stop": 273 }
```

**Body manual override:**
```json
{
  "id_sc_stop": 273,
  "manual": true,
  "manual_gps_time": "2026-07-27 09:00:00"
}
```

**Response:**
```json
{ "found": true, "gps_time": "2026-07-27 09:12:34" }
```
atau
```json
{ "found": false, "warning": "GPS tidak mengkonfirmasi kunjungan..." }
```
atau
```json
{ "skipped": true, "reason": "already_hit" }
```

Lihat [Backfill Geofence](/developer/backfill-geofence) untuk dokumentasi lengkap.

---

### PUT /api/sales-costs/:id — Perubahan Response

Jika `wialon_zone_id` sebuah middle stop berubah, response sekarang menyertakan:

```json
{
  "geofence_changed_stops": [
    {
      "id": 273,
      "stop_name": "Tujuan 1",
      "stop_order": 1,
      "old_zone_id": 85,
      "new_zone_id": 107,
      "new_zone_name": "Fuji Trans GIIC",
      "already_hit": false
    }
  ]
}
```


## Error Responses

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

## Authentication Header

Semua endpoint (kecuali `/api/auth/login`) memerlukan:

```http
Authorization: Bearer <jwt_token>
```
