---
type: Workflow Reference
title: Key Workflows
description: The main operational workflows in transport_v1.04 — Sales Cost/SPK lifecycle, delivery notification system, GPS tracking and geofence loop via Wialon, schedule pengiriman, GPS trail playback, age-based auto-finish, and BBS ADAS alarm import.
tags: [workflow, sales-cost, spk, gps, wialon, geofence, delivery-notifications, schedule, bbs, adas]
resource: node_backend/services/geofenceTrackingService.js
---

# Key Workflows

## Sales Cost / SPK Lifecycle

**Domain**: Transactions — the central business record linking truck, driver, customer, area, and warehouse into a delivery order (SPK = *Surat Perintah Kerja*).

**Source**: `node_backend/routes/salesCost.js`, `tailadmin-vuejs-1.0.0/src/views/Transaksi/`

### Flow

1. **Create** — User fills Sales Cost form. Backend validates that both the selected truck (`is_active = 1`) and driver (`is_active = 1`) are active; inactive assignments are rejected.
2. **Edit** — Existing records can be opened even if the assigned truck/driver was later deactivated. The frontend preserves the current value in the picker. Changing the truck/driver on an existing record enforces the active-only rule.
3. **Import** — Excel import via `routes/masterImport.js` + `services/masterImportConfig.js`. Import template omits inactive trucks and drivers.
4. **Print SPK**:
   - Single: `GET /api/sales-costs/:id/print`
   - Bulk: `GET /api/sales-costs/print?ids=1,2,3` — multiple SPK sheets render in one print page via checkbox selection in the list view.

### Extension Points

- Adding a new field to Sales Cost requires: a `dbmate` migration, route handler update in `salesCost.js`, and frontend form/table update in `SalesCost.vue`.
- The active-truck and active-driver validation is enforced in the route handler — check `salesCost.js` before adding new assignment logic.

---

## Delivery Notification System

**Domain**: Geofence-triggered events surfaced to users as in-app notifications.

**Source**: `node_backend/services/geofenceTrackingService.js`, `node_backend/routes/deliveryNotifications.js`, `node_backend/services/deliveryNotificationReadService.js`, `tailadmin-vuejs-1.0.0/src/components/DeliveryNotificationBell.vue`, `tailadmin-vuejs-1.0.0/src/views/Transaksi/DeliveryNotifications.vue`

### Flow

```
geofenceTrackingService (background, 60s loop)
  └─► Detects truck enters/exits finish geofence (DEFAULT_FINISH_GEOFENCE_NAME)
        └─► Writes delivery_notification row to MySQL
              └─► Frontend NotificationBell polls /api/delivery-notifications
                    └─► User opens DeliveryNotifications.vue
                          └─► deliveryNotificationReadService marks rows as read
                                (delivery_notification_read table, migration 20260720000010)
```

### Notification Bell

`DeliveryNotificationBell.vue` in the top navigation bar:
- Polls the backend for unread notification count
- Badge shows count; click opens the Notifications page
- Read state is tracked per-user in `delivery_notification_read` (MySQL), not in MongoDB

### Finish Geofence

The target geofence name is configured via `DEFAULT_FINISH_GEOFENCE_NAME` (default: `Sankyu`). This matches a named geofence defined in Wialon. If the name doesn't match any Wialon geofence, no delivery notifications will fire.

### Extension Points

- Changing geofence trigger logic: `services/geofenceTrackingService.js`
- Adding new notification types: extend `deliveryNotifications.js` route and add a migration for any new columns
- Read tracking schema: `db/migrations/20260720000010_create_delivery_notification_read.sql`

---

## GPS Tracking & Geofence Loop

**Domain**: Live fleet visibility using Wialon GPS data.

**Source**: `node_backend/services/geofenceTrackingService.js` (29 KB), `node_backend/services/wialonService.js` (57 KB), `node_backend/routes/monitoringKendaraan.js`, `node_backend/routes/wialon.js`, `tailadmin-vuejs-1.0.0/src/views/Monitoring/MonitoringKendaraan.vue`

### Wialon Integration

All Wialon API calls are **server-side only** via `wialonService.js`. The service manages:
- Session login/refresh (token in `WIALON_TOKEN`, session TTL `WIALON_SESSION_TTL_MS`)
- Unit position fetching (maps to `truck.wialon_unit_id`)
- Monthly trip/mileage reports (`WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS` for cache)

Only **active** trucks (`is_active = 1`) are returned by the live GPS endpoint. Inactive trucks are invisible to the map, fleet list, and monitoring summaries.

### Background Polling Loop

```
detectAndRunStartupBackfill()   — runs once at startup
  └─► Fills route_history gaps for the overnight window

startGeofenceTracking()          — runs every GEOFENCE_TRACKING_INTERVAL_MS (60s default)
  └─► Fetches current unit positions from Wialon
  └─► Compares positions against configured geofences
  └─► On entry/exit: writes route_history row, triggers delivery notification if finish geofence
```

### Reverse Geocoding

GPS coordinates are reverse-geocoded to human-readable addresses via Geoapify (`GEOAPIFY_API_KEY`):
- **Backend**: in-memory cache, TTL = `REVERSE_GEOCODE_CACHE_TTL_MS` (default 24h)
- **Frontend**: `localStorage` cache with matching 24-hour TTL — survives page refresh

### Monitoring Kendaraan UI

Two distinct fleet visibility pages exist in the Monitoring domain:

**`MonitoringKendaraan.vue`** (`/monitoring-kendaraan`) — fleet status summary board:
- Shows all active trucks with current transaction, repair status, and last GPS position
- Search + month/year filter; results capped at 200 via `resolveLimit`
- `Buka Peta` button links to `TruckLocationMap.vue` for the live map view

**`TruckLocationMap.vue`** (`/truck-locations`) — live GPS map (Lokasi Truk):
- Full-page Leaflet + OpenStreetMap map with fleet inspector panel
- Shows total armada count and last sync timestamp
- 30-second auto-refresh badge; manual `Refresh Sekarang` button
- Back-link to `/monitoring-kendaraan`
- `leaflet.markercluster` for dense fleets; custom truck marker icon embedded inline

### Extension Points

- `wialon_unit_id` on the `truck` table links MySQL trucks to Wialon units — this mapping must be kept current in Master Truck when GPS units change.
- Adjusting polling frequency: `GEOFENCE_TRACKING_INTERVAL_MS` env var.
- Adding new geofence actions: extend the event handler in `geofenceTrackingService.js`.
- Schema changes for `route_history`: add a `dbmate` migration **and** update `schemaSyncService.js`.

### Geofence Guards (anti false positive)

Two guards added to `assignStopHits` (2026-07-27) to prevent false positive hits:

- **Departure pre-window guard** (`GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC` = 8h default): rejects Departure zone entries that occurred more than 8 hours before the planned `departure_datetime`. Prevents re-entry from a prior trip being assigned as Departure for a new SPK (#44442).
- **Same-zone inter-stop gap guard** (`GEOFENCE_SAME_ZONE_MIN_INTER_STOP_GAP_SEC` = 10min default): for shuttle routes where the same zone appears multiple times (e.g. Tujuan 1, 3, 5 all KIIC), rejects a second assignment to the same zone if the gap from the previous hit is less than the threshold. Prevents rapid re-assignment during the same tracking cycle (#44415).

Both guards are implemented in `assignStopHits()` in `geofenceTrackingService.js`. Set env vars to `0` to disable. Unit tests: `node_backend/scripts/test-geofence-assign.js` (29 cases).

### GPS Trail Playback

A separate on-demand GPS trail API (`GET /api/sales-costs/:id/gps-trail`) fetches historical GPS messages from Wialon for a specific SPK:

- Window: `depTs - GPS_TRAIL_PRE_BUFFER_SEC` (2h) to `finishTs || now`
- GPS messages downsampled via `downsampleTrailPoints` (max `GPS_TRAIL_MAX_POINTS`, default 800)
- `planned_stops[]` includes geofence centroid + simplified polygon for each step (via `gpsTrailGeometry.js`)
- UI: `DetailSalesCost.vue` — Leaflet map with trail polyline, polygon fills, layer toggles, and time scrubber playback

### GPS Trail Playback

**Domain**: On-demand historical GPS track for a specific SPK.

**Source**: `node_backend/routes/salesCost.js` (`GET /api/sales-costs/:id/gps-trail`), `node_backend/services/gpsTrailGeometry.js`, `tailadmin-vuejs-1.0.0/src/views/Transaksi/DetailSalesCost.vue`

### Flow

```
GET /api/sales-costs/:id/gps-trail
  │
  ├── Login isolated Wialon session
  ├── Fetch raw GPS messages: window = depTs - GPS_TRAIL_PRE_BUFFER_SEC (2h) → finishTs||now
  ├── Downsample via downsampleTrailPoints (max GPS_TRAIL_MAX_POINTS = 800)
  ├── For each planned stop: fetch zone polygon → simplify (max GPS_TRAIL_POLYGON_MAX_POINTS = 80)
  │     └── gpsTrailGeometry.js: wialonPointsToLatLngRing → simplifyLatLngRing (stride sampling)
  └── Return { trail: [[lat,lon,ts],...], planned_stops: [{centroid, polygon, ...}] }
```

UI in `DetailSalesCost.vue`:
- Leaflet map with polyline trail, filled stop polygons, layer toggles
- Time scrubber for playback along the trail
- Shows planned stops with geofence polygon overlays

### Extension Points

- Adjust trail window: `GPS_TRAIL_PRE_BUFFER_SEC`
- Adjust downsampling: `GPS_TRAIL_MAX_POINTS`, `GPS_TRAIL_POLYGON_MAX_POINTS`
- Geometry helpers: `services/gpsTrailGeometry.js` — `buildPlannedPolygon`, `wialonPointsToLatLngRing`, `simplifyLatLngRing`

---

## Age-Based Auto-Finish

**Domain**: Background cleanup — automatically finish SPKs that are past their distance-based age threshold.

**Source**: `node_backend/services/geofenceTrackingService.js` (`applyDueDistanceAgeFinish`)

### Logic

```
applyDueDistanceAgeFinish() — runs inside the geofence tracking loop
  │
  ├── Query active SPKs without a finish record, with departure_datetime in lookback window
  ├── Load planned stops + zone polygons from Wialon (isolated session)
  ├── Compute trip distance: haversine from departure zone centroid to furthest stop centroid
  │
  ├── Age thresholds by distance:
  │     ≤ 60km  → 3 days  (GEOFENCE_AGE_FINISH_DAYS_SHORT)
  │     ≤ 100km → 7 days  (GEOFENCE_AGE_FINISH_DAYS_MID)
  │     > 100km → 10 days (GEOFENCE_AGE_FINISH_DAYS_LONG)
  │     no distance → fallback 3 days (GEOFENCE_AGE_FINISH_DAYS_FALLBACK)
  │
  └── If age >= threshold: INSERT finish record (step_key='system:finish_order')
        └── Dry-run mode: GEOFENCE_AGE_FINISH_DRY_RUN=1 logs only, no INSERT
```

### Extension Points

- All thresholds configurable via env vars — see [Operations Runbook](../operations/runbook.md)
- `GEOFENCE_AGE_FINISH_LOOKBACK_DAYS` controls how far back to scan (default 60 days)
- Step name in history: `Auto Finish (Jarak/Umur)`

---

## BBS ADAS Alarm Import

**Domain**: Safety — import and analyse ADAS (Advanced Driver Assistance System) alarm data from Wialon GPS devices.

**Source**: `node_backend/routes/bbsAlarm.js`, `tailadmin-vuejs-1.0.0/src/views/BBS/BbsAlarmTab.vue`, `tailadmin-vuejs-1.0.0/src/views/BBS/BbsDashboardTab.vue`

### Flow

```
POST /api/bbs/alarm/import  (CSV or XLSX)
  │
  ├── Parse file with xlsx (cellDates: true)
  ├── Validate required headers: device id, device name, alarm type, begin time, start position
  ├── For each row:
  │     ├── Normalize plate → match truck in DB
  │     ├── Map alarm type → BBS category (o2=speed, o3=collision, o4=distraction, o5=lane, o6=fatigue, o8=other)
  │     ├── Deduplicate burst: same plate + alarm_type within 30s → dedup_burst count
  │     └── INSERT into bbs_alarm table
  └── Return: { inserted, duplicates, dedup_burst, unmatched_driver, failed, errors[] }
```

### Alarm Type Mapping

| Wialon alarm type | BBS category key | Nilai |
|---|---|---|
| Eyes closed | `o6` | berbahaya |
| Yawn | `o6` | berisiko |
| Distracted | `o4` | berisiko |
| Lane departure | `o5` | berisiko |
| Pedestrian/forward collision/headway | `o3` | berisiko |
| Speed/overspeed | `o2` | berisiko |
| Other | `o8` | berisiko |

### Dashboard Integration

`BbsDashboardTab.vue` now includes:
- **ADAS Score table**: per-truck score breakdown across fatigue, distraction, collision, lane, speed categories
- **Alarm breakdown chart**: bar chart of alarm counts per type for selected month (Chart.js)
- Both sourced from `GET /api/bbs/dashboard?month=YYYY-MM`

### Access Control

Import is blocked for `level=user`. Admin and patcher can import. The `patcher` role has full CRUD on `/bbs` including alarm import.

### Extension Points

- Alarm type mapping: `mapAlarm()` in `bbsAlarm.js`
- ADAS score computation: `GET /api/bbs/dashboard` in `bbs.js`
- Frontend chart: `BbsDashboardTab.vue` → `renderBreakdownChart()`

---

## Subcontractor CS Access

**Domain**: CS role can now create and edit Subcontractor records (not delete).

**Source**: `node_backend/middleware/rbac.js`, `node_backend/routes/subcontractor.js`, `tailadmin-vuejs-1.0.0/src/components/subcontractor/SubcontractorForm.vue`

CS whitelist additions in `rbac.js`:
- `GET /subcontractor` — list
- `POST /subcontractor` — create
- `PUT /subcontractor` — edit
- `GET /warehouses`, `GET /customers`, `GET /subconts` — master options for form dropdowns

`PrintSubcontractor.vue` — new print view for Subcontractor records (`/subcontractor/:id/print`), matching the SPK print layout style.

---

**Domain**: Delivery schedule view used by operations and CS staff.

**Source**: `node_backend/routes/schedulePengiriman.js`, `tailadmin-vuejs-1.0.0/src/views/Home/SchedulePengiriman.vue`

### Flow

- Backend provides a filtered, paginated delivery schedule via `GET /api/schedule-pengiriman`
- Frontend `SchedulePengiriman.vue` renders the schedule with date-range filtering (uses `DatePickerInput.vue` component backed by `@vuepic/vue-datepicker`)
- The `cs` role is explicitly allowed `GET /schedule-pengiriman` in `rbac.js` — this is the primary read-only view for CS users
- Schedule status values computed by `resolveScheduleStatus` in `schedulePengiriman.js`:
  - `waiting` — departure has not yet occurred
  - `on_trip` — departure time has passed, delivery not yet finished
  - `overdue` — finish deadline passed without a finish geofence hit; deadline is `finish_order_datetime` when set, falling back to `arrival_datetime`
  - `completed` — finish geofence hit and all intermediate stops visited
  - `incomplete_finish` — finish geofence hit but one or more intermediate stops were not visited

### Access Control

This route is the only one explicitly granted to the `cs` role (beyond `/auth/me`). Any expansion of CS access must be added to the `isAllowedForCs` whitelist in `middleware/rbac.js`.
