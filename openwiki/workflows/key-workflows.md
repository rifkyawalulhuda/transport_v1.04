---
type: Workflow Reference
title: Key Workflows
description: The four main operational workflows in transport_v1.04 — Sales Cost/SPK lifecycle, delivery notification system, GPS tracking and geofence loop via Wialon, and schedule pengiriman. Includes geofence backfill logic and frontend notification bell.
tags: [workflow, sales-cost, spk, gps, wialon, geofence, delivery-notifications, schedule]
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

### Backfill Geofence

When a stop's `wialon_zone_id` is changed mid-trip, `POST /api/sales-costs/:id/backfill-stop` performs retroactive GPS hit lookup:
- Fetches Wialon messages for the SPK window, runs `buildZoneEntryTimeline` + `assignStopHits` with all guards
- Manual override: `{ manual: true, manual_gps_time }` inserts with `is_manual=1`
- Idempotent: skips if stop already has `route_history`
- UI triggered via post-save dialog in `EditSalesCost.vue` and "Cari Hit GPS" button in `DetailSalesCost.vue`

---

## Schedule Pengiriman

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
