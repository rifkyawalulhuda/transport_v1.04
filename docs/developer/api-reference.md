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
