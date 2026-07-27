# GPS Trail Playback

Halaman **Detail Sales Cost** menyediakan section **Rute GPS Aktual** yang menampilkan jejak perjalanan truk dari data GPS Wialon dalam window trip SPK.

## Endpoint

```
GET /api/sales-costs/:id/gps-trail
Authorization: Bearer <token>
```

Endpoint ini menggunakan **soft-fail** — selalu mengembalikan HTTP 200. Jika data GPS tidak tersedia, `reason` akan terisi dan `points` kosong.

### Response

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
      "stop_name": "Tujuan 1",
      "label": "Tujuan 1",
      "kind": "middle",
      "middle_index": 1,
      "wialon_zone_name": "Fuji Trans GIIC",
      "lat": -6.356098,
      "lon": 107.281455,
      "polygon": [[-6.354, 107.279], [-6.357, 107.283], [-6.358, 107.281]],
      "hit": true
    }
  ],
  "reason": null
}
```

### Field `reason`

| Nilai | Keterangan |
|-------|-----------|
| `null` | Data GPS tersedia |
| `no_truck` | SPK tidak memiliki truk terhubung |
| `no_wialon_unit` | Truk tidak memiliki Wialon unit ID |
| `no_departure` | `departure_datetime` tidak valid |
| `wialon_empty` | Wialon tidak mengembalikan pesan GPS |
| `wialon_error` | Error saat menghubungi Wialon API |
| `invalid_window` | Window waktu tidak valid |

## Window GPS

```
timeFrom = departure_datetime - GPS_TRAIL_PRE_BUFFER_SEC (default 2 jam)
timeTo   = waktu finish hit ATAU sekarang
```

Window juga diperluas ke waktu tercepat dari `route_history` jika lebih awal dari `timeFrom`.

## Planned Stops

Setiap stop di `sales_cost_step_schedule` di-resolve ke koordinat geofence melalui:

1. `fetchZonePolygons(resource_id, sid)` — fetch polygon dari Wialon
2. `polygonCentroid(points)` — hitung titik tengah polygon
3. `buildPlannedPolygon(points, max)` — simplified ring untuk render di peta

Field `polygon` berisi array `[[lat, lon], ...]` yang sudah di-simplify (max `GPS_TRAIL_POLYGON_MAX_POINTS` vertex, default 80).

Field `hit` = `true` jika stop sudah ter-hit di `route_history`.

## Fitur UI

### Phase 1 — Trail Dasar

- Polyline biru = jejak GPS aktual
- Titik hijau = hit geofence aktual dari `route_history`
- Expand/collapse height (300px / 520px)
- Reload data

### Phase 2A — Polygon + Layer Toggle

- Polygon fill per stop geofence rencana
  - Oranye = Tujuan (middle stops)
  - Ungu = Departure
  - Abu = Finish
- Pin badge bernomor: **D** (Departure), **1/2/3** (Tujuan), **F** (Finish)
- 4 chip toggle: **Trail GPS** / **Tujuan** / **Polygon** / **Hit aktual**
- `fitBounds` mencakup semua layer

### Phase 2B — Time Scrubber

- Tombol Play/Pause
- Speed selector: 1× / 2× / 4×
- Range slider per index titik GPS (0 → N−1)
- Marker truck bergerak + progress polyline biru (full trail redup 0.35 opacity)
- Auto-pause di akhir trail

## Services Terkait

| Service | Fungsi |
|---------|--------|
| `wialonService.fetchRawMessagesForUnit` | Fetch GPS messages dari Wialon |
| `wialonService.downsampleTrailPoints` | Even-stride downsample, preserve first+last |
| `wialonService.fetchZonePolygons` | Fetch polygon zone dari Wialon |
| `gpsTrailGeometry.buildPlannedPolygon` | Convert + simplify polygon ring |
| `gpsTrailGeometry.wialonPointsToLatLngRing` | Convert Wialon `{x,y}` ke `[lat,lon]` |

## Environment Variables

| Variabel | Default | Keterangan |
|----------|---------|-----------|
| `GPS_TRAIL_PRE_BUFFER_SEC` | `7200` (2j) | Buffer sebelum departure untuk window GPS |
| `GPS_TRAIL_MAX_POINTS` | `800` | Maks titik GPS setelah downsample |
| `GPS_TRAIL_POLYGON_MAX_POINTS` | `80` | Maks vertex per polygon geofence planned stop |

## Unit Tests

```bash
cd node_backend
node scripts/test-gps-trail-downsample.js
node scripts/test-gps-trail-polygon.js
```
