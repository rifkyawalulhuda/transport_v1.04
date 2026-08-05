# transport_v1.04 Project Context

## Overview

`transport_v1.04` is a transport management system with two main parts:

- `node_backend`: Express + MySQL backend for business data, authentication, and file/API services.
- `tailadmin-vuejs-1.0.0`: Vue 3 + TypeScript frontend for the dashboard UI.

The project now also includes truck location tracking with Wialon GPS data displayed on a Leaflet + OpenStreetMap map.

## Tech Stack

### Backend

- Node.js
- Express
- MySQL via `mysql2`
- `dbmate` for SQL migration workflow
- MongoDB via `mongoose` for existing features
- JWT authentication
- File import/export with `xlsx` and `exceljs`
- Multipart uploads with `multer`

### Frontend

- Vue 3
- TypeScript
- Vue Router
- Tailwind-based admin UI
- Leaflet for maps
- `leaflet.markercluster` for map clustering

## Repository Structure

### Backend

- `node_backend/server.js` - Express app bootstrap and route registration.
- `node_backend/db.js` - MySQL pool connection.
- `node_backend/db/` - SQL migrations and generated schema snapshot.
- `node_backend/routes/` - API route handlers.
- `node_backend/services/` - business logic and external integrations.
- `node_backend/middleware/` - auth and access control.
- `node_backend/models/` - MongoDB models for existing features.
- `node_backend/upload/` - uploaded files.
- `node_backend/img/` - static images.

### Frontend

- `tailadmin-vuejs-1.0.0/src/main.ts` - app bootstrap and global CSS imports.
- `tailadmin-vuejs-1.0.0/src/router/` - routing.
- `tailadmin-vuejs-1.0.0/src/config/` - navigation and API config.
- `tailadmin-vuejs-1.0.0/src/services/` - frontend API wrappers.
- `tailadmin-vuejs-1.0.0/src/views/` - page-level views.
- `tailadmin-vuejs-1.0.0/src/components/` - shared UI components.

## Current Feature Set

### Core Modules

- Master data management for trucks, drivers, customers, areas, warehouses, subcontractors, and admins.
- Master data tables support sortable headers with ascending/descending toggles after search/filter and before pagination.
- Master Truck supports soft deactivation via `truck.is_active`; inactive trucks stay in Master Truck for history/admin visibility but are removed from operational pickers and GPS fleet views.
- Monitoring Kendaraan summary and lists only count active trucks (`truck.is_active = 1`), so inactive trucks are excluded from total, transaksi, repair, idle, and search results.
- Master Driver supports soft deactivation via `driver.is_active`; inactive drivers stay in Master Driver for administration/history but are removed from operational driver pickers, Sales Cost import/template options, and Data Transport Data Supir list/search/export.
- Transaction and monitoring views.
- Sales Cost list supports checkbox-based bulk selection and multi-record SPK printing. The print route still supports single-record `/sales-cost/:id/print`, and bulk print passes selected IDs through the `ids` query string so multiple SPK sheets render in one print page.
- Import/export flows for master data.
- Authentication and role-based access control.

### Truck GPS and Map Tracking

- Truck master now supports `wialon_unit_id`.
- Truck master now supports `is_active` for active/inactive fleet control.
- Wialon data is fetched server-side only.
- The live GPS location endpoint only returns active trucks, so inactive trucks are excluded from the location summary, map markers, fleet list, and fleet search/filter results.
- Reverse geocode cache now uses a 24-hour TTL on both backend in-memory cache and frontend `localStorage`.
- Monitoring now also includes monthly truck mileage calculation based on Wialon trip data per month.
- The frontend uses a dedicated truck location page:
  - Leaflet map
  - OpenStreetMap tiles
  - marker clustering
  - cluster popup summary
  - truck status colors
  - 30-second auto refresh
  - reverse geocode cache that survives page refresh via browser `localStorage`
  - adaptive 3-panel workspace layout:
    - left: main live map
    - middle: `Vehicle Detail` panel shown only when a truck is selected
    - right: `Fleet` panel with fixed-height scrollable list
  - selection sync between marker, detail panel, and fleet list
  - GPS-only filter chips: `All`, `Moving`, `Idle`, `Offline`, `Belum Terhubung`
  - simplified fleet cards that only show truck number and GPS status
  - custom truck marker icon embedded inline in the frontend code so it does not depend on an external image file at runtime

### Master Truck Active/Inactive Flow

- Master Truck now has a status badge: `Aktif` or `Nonaktif`.
- Master Truck row actions are grouped in a dropdown, matching the Sales Cost action-menu pattern:
  - `Edit`
  - `Nonaktifkan` / `Aktifkan`
  - `Hapus`
- `Hapus` remains available and still performs the hard delete flow.
- `Nonaktifkan` is a soft operational disable:
  - the truck remains visible in Master Truck when that page loads all rows
  - historical Sales Cost rows can still display the truck through their existing relation
  - the truck is removed from new operational selections and GPS fleet/location views
- Frontend edit flows for existing Sales Cost records preserve the currently assigned truck option even if that truck is later inactive, so old records can still be opened without losing their displayed selection.
- New Sales Cost creation, Sales Cost import, and truck changes on existing Sales Cost records reject inactive trucks on the backend.

### Master Driver Active/Inactive Flow

- Master Driver has a status badge: `Aktif` or `Nonaktif`.
- Master Driver row actions are grouped in a dropdown:
  - `Edit`
  - `Nonaktifkan` / `Aktifkan`
  - `Hapus`
- `Nonaktifkan` is a soft operational disable:
  - the driver remains visible in Master Driver when that page loads all rows
  - historical Sales Cost rows can still display the driver through their existing relation
  - the driver is removed from new operational selections and Data Transport Data Supir list/search/export
- New Sales Cost creation and Sales Cost import reject inactive drivers on the backend.
- Existing Sales Cost edit allows keeping the current inactive driver, but rejects changing to another inactive driver.

### Monthly Truck Mileage

- A dedicated monitoring page `KM Bulanan Truk` now exists in the frontend.
- The page lets users:
  - choose a calendar month
  - search trucks by plate / vehicle / Wialon unit
  - export the filtered monthly mileage dataset to Excel
  - see total KM, active trucks, and trip counts for the selected month
- Mileage is calculated from Wialon trip history, not from simple current-position deltas.
- Backend keeps a short in-memory cache for monthly mileage responses to avoid hammering Wialon on repeated refreshes.
- Backend now validates local `wialon_unit_id` against the live Wialon unit catalog before requesting mileage, so stale mappings are shown as invalid GPS mapping instead of generic trip errors.
- KM Bulanan Truk only includes active trucks (`truck.is_active = 1`) in the page data and Excel export, so inactive trucks are excluded from displayed totals and mileage calculations.

### Geofence Route Flow for Sales Cost

- Master Area now supports route-step modeling:
  - `kode_area`
  - generated `nama_area`
  - `route_steps[]` mapped to Wialon geofences
- Wialon geofences remain managed in Wialon, not drawn manually inside this project.
- Sales Cost still stores and displays the route using the familiar `nama_area` string such as `117-CLC-GIIC-HEKIKAI`.
- The backend tracks geofence history for active Sales Cost deliveries via GPS message timeline (point-in-polygon), not only live membership snapshots:
  - chronological zone entries; repeated zones get distinct visit times
  - loose stop order (field may skip/reorder)
  - planned route (`sales_cost_step_schedule`) vs actual history (`sales_cost_route_history`) stay separate
- System step `Finish Order` (`system:finish_order`) is recorded when the truck qualifies for finish geofence (loose by default; same-zone base requires min-away or middle hit — see Geofence Tracking Flow), or via manual ETA / age-distance auto-finish / admin check-in.
- Finish geofence resolution order: area.finish_geofence_* → scss finish-stop zone → default name `Sankyu` (`DEFAULT_FINISH_GEOFENCE_NAME`).
- Unfinished SPKs can also auto-close by **trip distance + age** after planned departure (see age/distance auto-finish).
- Sales Cost detail now includes a `Riwayat Geofence Pengiriman` section that shows:
  - planned steps
  - visited steps with timestamps
  - pending steps
  - light badge for out-of-order visits
  - middle stops never GPS-hit after finish → **Geofence dilewati**

## Wialon Integration

### Purpose

Wialon is used as the GPS source for truck locations. The hardware/vendor side is assumed to already handle device telemetry.

### Backend Flow

1. Backend logs in to Wialon using the token stored in `node_backend/.env`.
2. Backend loads active local trucks, fetches the latest mapped unit snapshot from Wialon, and reads position data from `core/search_items` output.
3. Backend enriches GPS data with operational context from existing app tables:
   - active transaction
   - active repair
   - last transaction
   - driver name
4. Backend normalizes the response into a truck-friendly combined payload.
5. Frontend requests only the normalized backend endpoint for map/list/detail data.
6. When a user selects a truck, frontend can request reverse geocoding for the selected coordinate only.
7. Reverse geocode results are cached on the server and also persisted in browser `localStorage` so repeated clicks after refresh do not always hit Geoapify again.

### Monthly Mileage Flow

1. Frontend requests monthly mileage for a selected `YYYY-MM` period.
2. Backend loads local trucks and checks `wialon_unit_id`.
3. For each mapped truck, backend uses Wialon message loader for the selected monthly interval.
4. Backend calls `unit/get_trips` and sums trip mileage for the month.
5. Backend returns one row per truck with:
   - total distance
   - trip count
   - first trip time
   - last trip time
   - status such as `has_trip`, `no_trip`, `unlinked`, or `error`

### Geofence Tracking Flow (current — Jul 2026)

Sync cycle order each `GEOFENCE_TRACKING_INTERVAL_MS` (default 60s):  
`syncGeofenceRouteHistory` (GPS) → `applyDueManualEtaHits` (manual ETA) → `applyDueDistanceAgeFinish` (age/distance) → arrival delays → purge notifications.

1. **GPS candidates:** truck has `wialon_unit_id`, at least one stop with `wialon_zone_id`, no `system:finish_order` yet, `departure_datetime` within last **30 days**. Multi-SPK per truck: **all** active SPKs are tracked (H9).
2. Stop → geofence mappings come from `sales_cost_step_schedule` (step key `stop:{scss.id}`). `area_route_step` is only for Surat Jalan printing.
3. **GPS trail:** login Wialon → fetch raw GPS messages (planned departure **−12h** buffer → now) → `fetchZonePolygons` (flags 28/0/8 for points) → `buildZoneEntryTimeline` + `assignStopHits` (point-in-polygon entry events).
4. **Stop hits (GPS):** `gps_time` = actual GPS entry time (not ETA). Repeated zones (e.g. KIIC→GIIC→KIIC) use chronological re-entries; history is seeded each cycle so visit #2 never reuses visit #1 timestamp. Stop order is **loose** (Opsi B): a later stop may hit without previous stop (`GEOFENCE_REQUIRE_PREVIOUS_STOP=0`).
5. **Finish (GPS, loose by default):** inserts `system:finish_order` even if middle stops were skipped (`GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH=0`).  
   - **Hard gate:** `now >= planned departure` before finish may be recorded.  
   - **Same-zone** (Departure = Finish, typical Sankyu): require meaningful leave within **lookback** before planned dep (`GEOFENCE_FINISH_LEAVE_LOOKBACK_SEC`, default **4h**): ≥20 min outside and/or ≥1 km from base centroid, **or** ≥1 middle stop hit in that window — then re-entry = finish (re-entry may be **before** planned dep). Blocks ignition false finish (#44390); allows early trip+return (#44394).  
   - Env: `GEOFENCE_FINISH_MIN_AWAY_SEC`, `GEOFENCE_FINISH_MIN_AWAY_M`, `GEOFENCE_FINISH_LEAVE_LOOKBACK_SEC`.  
   - Helpers: `analyzeBaseExit`, `resolveFinishGpsHit`.
6. **Manual / no-GPS path:** `applyDueManualEtaHits()` auto-hits stops when `NOW ≥ estimated_arrival` for SPKs with `is_manual_mode=1` or truck without `wialon_unit_id`. Finish stop due → `system:finish_order` (`is_manual=1`, `gps_time` = ETA).
7. **Age / distance auto-finish (all active SPKs):** `applyDueDistanceAgeFinish()` after GPS + manual.  
   - Candidates: unfinished, planned dep in lookback (default **60 days**), dep at least min-bracket days ago (default **3**).  
   - Distance = max haversine between Departure zone centroid and middle (or finish) stop centroids; if polygons missing → distance `null` → fallback days.  
   - Bracket: **≤60 km → 3 days**, **≤100 km → 7 days**, **>100 km → 10 days**; null distance → **3 days** fallback.  
   - When `NOW ≥ departure_datetime + N days` → insert `system:finish_order` (`is_manual=1`, snapshot name `Auto Finish (Jarak/Umur)`).  
   - Dry-run: `GEOFENCE_AGE_FINISH_DRY_RUN=1` logs only. Helpers: `computeTripDistanceKm`, `resolveAgeFinishDays`, `isDueForAgeFinish`.
8. Dedup via existing history keys / `INSERT IGNORE`. Startup backfill + `POST /api/wialon/backfill` still available.
9. UI: middle stops never hit after finish → badge **Geofence dilewati**; departure without history but later hit → `inferred_passed`. Schedule **completed** only when `system:finish_order` exists (not from `sc.finish_order_datetime` alone).

### Wialon Response Notes

- `resource/get_zones_by_unit` may return nested payloads shaped like `{resourceId: {zoneId: [unitIds]}}`.
- Do not assume the response is already flattened by zone ID.
- `node_backend/services/wialonService.js` must keep support for nested parsing in `normalizeZoneMembershipPayload`.
- A previous bug caused geofence history to stay `Pending` even when a truck was already inside `Sankyu`, because the nested Wialon membership payload was parsed incorrectly.
- When debugging geofence history, verify both:
  - raw Wialon membership result for the truck/unit
  - parsed membership map returned by `fetchUnitsInZonesByResource`

### Important Backend Files

- `node_backend/services/wialonService.js`
  - token login
  - session reuse and retry
  - location normalization from Wialon snapshot data
  - filters truck location payloads to active local trucks (`truck.is_active = 1`)
  - auto mapping helper
  - operational data enrichment for map payload
  - Geoapify reverse geocoding with in-memory cache
  - monthly truck mileage calculation from Wialon trip history
  - short in-memory cache for monthly mileage results
- `node_backend/services/geofenceTrackingService.js`
  - GPS: zone-entry timeline, loose/repeated-zone assign, same-zone min-away + leave lookback finish (`resolveFinishGpsHit`)
  - Manual: `applyDueManualEtaHits()` for no-GPS / `is_manual_mode` SPKs
  - Age/distance: `applyDueDistanceAgeFinish()` auto-closes stuck SPKs by km bracket + days since planned dep
  - records `system:finish_order`; optional per-area finish geofence + Sankyu fallback
  - unit tests: `node_backend/scripts/test-geofence-assign.js`
- `node_backend/services/schemaSyncService.js`
  - legacy runtime schema safety net for tracking-related columns/tables
- `node_backend/routes/truck.js`
  - Master Truck CRUD
  - active/inactive listing filters
  - `PATCH /api/trucks/:id/status` for soft activation/deactivation
- `node_backend/routes/wialon.js`
  - protected API routes for truck location, reverse geocoding, auto mapping, and geofence listing
- `node_backend/routes/area.js`
  - CRUD for area master with `kode_area`, generated `nama_area`, and `route_steps`
- `node_backend/routes/salesCost.js`
  - sales cost detail now includes route plan and geofence route history
  - rejects inactive trucks for new transactions, import, and truck changes
- `node_backend/routes/schedulePengiriman.js`
  - Schedule list + status; Excel export with per-stop est/aktual, **Jumlah Hari (Aktual)**, **Selisih Waktu (Est vs Aktual)**
- `node_backend/routes/subcontractor.js`
  - Subcontractor CRUD; multi-stop `delivery_stops`; Excel export with separate Departure/Tujuan/Finish columns
  - Detail GET joins creator (`created_by_name` / `created_by_nik`); PUT does not overwrite creator `nik_admin` (stores `id_admin`)
- `tailadmin-vuejs-1.0.0/src/components/subcontractor/SubcontractorForm.vue`
  - Input/Edit form: 4 section cards (Mitra, Kendaraan, Jadwal manual timeline, Biaya); no geofence
- `tailadmin-vuejs-1.0.0/src/views/Transaksi/PrintSubcontractor.vue`
  - A4 Portrait print: **Laporan Subcontractor** (operational only, no cost figures)
- `tailadmin-vuejs-1.0.0/src/views/Monitoring/TruckLocationMap.vue`
  - 3-panel operational workspace UI
  - Leaflet marker sync and focus behavior
  - selected truck inspector
  - fleet search/filter/list behavior
  - inline SVG truck marker icon
  - local-safe date formatting for `YYYY-MM-DD` values in `Vehicle Detail`
- `tailadmin-vuejs-1.0.0/src/views/Monitoring/TruckMonthlyMileage.vue`
  - monthly mileage monitoring UI
  - month filter and search
  - KPI summary cards and truck mileage table
- `tailadmin-vuejs-1.0.0/src/services/truckLocationService.ts`
  - frontend API wrapper for truck locations and reverse geocoding
- `tailadmin-vuejs-1.0.0/src/services/truckMileageService.ts`
  - frontend API wrapper for monthly truck mileage

### Important Routes

- `GET /api/wialon/trucks/location`
  - returns truck locations and summary info
  - only includes trucks where `truck.is_active = 1`
  - each truck now includes combined GPS + operational fields:
    - `driver_name`
    - `operational_status`
    - `transaksi`
    - `repair`
    - `last_transaction`
- `GET /api/wialon/reverse-geocode?lat=...&lon=...`
  - returns reverse geocoding result for one selected truck coordinate
  - uses Geoapify and backend cache
  - frontend also keeps a localStorage cache keyed by normalized coordinate
  - backend and frontend cache entries expire after 24 hours
- `POST /api/wialon/trucks/auto-map`
  - tries to fill `wialon_unit_id` for trucks that are still empty
- `GET /api/trucks`
  - returns active trucks by default
  - supports `?include_inactive=1` or `?status=all` when Master Truck needs all rows
  - supports `?status=active` and `?status=inactive`
- `PATCH /api/trucks/:id/status`
  - updates `truck.is_active`
  - used by Master Truck `Aktifkan` / `Nonaktifkan`
- `GET /api/wialon/trucks/monthly-distance?month=YYYY-MM`
  - returns monthly mileage per truck for the selected month
  - uses Wialon trip history
  - returns rows for mapped, unlinked, and error cases
- `GET /api/wialon/trucks/monthly-distance/export?month=YYYY-MM`
  - exports the filtered monthly mileage result to `.xlsx`
  - includes a summary sheet and a detailed truck sheet
- `GET /api/wialon/geofences`
  - returns Wialon geofence options for route-step mapping in Master Area
- `GET /api/areas`
  - now also returns `kode_area`, `route_steps`, and `draft_route_steps`
- `GET /api/areas/:id`
  - returns one area plus route-step configuration
- `POST /api/areas`
  - now accepts `kode_area` and `route_steps`
- `PUT /api/areas/:id`
  - updates route-step configuration and regenerates `nama_area`
- `GET /api/sales-costs/:id`
  - now also returns `route_steps` and `route_history`
- `GET /api/subcontractor/:id`
  - returns header + `delivery_stops` + `created_by_name` / `created_by_nik`
- `GET /api/subcontractor/export`
  - Excel one row per transaction; dynamic **Tujuan 1…N** columns from batch max middle stops
- Frontend print: `/subcontractor/:id/print` (CS allowed)

## Database Notes

### Truck Table

The `truck` table now includes:

- `wialon_unit_id VARCHAR(64) NULL`
- `is_active TINYINT(1) NOT NULL DEFAULT 1`

`wialon_unit_id` is used as the primary mapping between local truck records and Wialon units.

`is_active` is used for soft operational filtering. Inactive trucks are excluded from:

- Sales Cost truck dropdowns and template/import master options
- Data Transport Data Truck list/search/export
- GPS Lokasi Truk summary, fleet list, fleet filters/search, and map markers

Inactive trucks should still remain available for historical display where existing records already reference them.

### Driver Table

The `driver` table now includes:

- `is_active TINYINT(1) NOT NULL DEFAULT 1`

`is_active` is used for soft operational filtering. Inactive drivers are excluded from:

- Sales Cost driver dropdowns and template/import master options
- Data Transport Data Supir list/search/export

Inactive drivers should still remain available for historical display where existing records already reference them.

### Area and Route Tracking Tables

The project now also uses:

- `area.kode_area`
- `area.finish_geofence_resource_id`, `area.finish_geofence_zone_id`, `area.finish_geofence_zone_name`
- `area_route_step`
  - stores route step order, step name, and mapped Wialon geofence
- `sales_cost_route_history`
  - stores actual timestamped visits for each Sales Cost route step
  - includes support for system step keys such as `Finish Order`

### Why No New Table Is Required

For the current design, one truck maps to one Wialon unit. A single nullable column is enough and keeps the system simpler.

Create a separate table only if future requirements need:

- mapping history
- multiple GPS providers
- one truck with multiple GPS devices
- audit trail for mapping changes

## Environment Variables

### Backend `.env`

Use `node_backend/.env` locally. Do not commit it.

Required or currently used variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `DATABASE_URL` (optional explicit override for migration tooling)
- `JWT_SECRET`
- `PORT`
- `WIALON_BASE_URL`
- `WIALON_TOKEN`
- `WIALON_LOGIN_FLAGS`
- `WIALON_SESSION_TTL_MS`
- `WIALON_TIMEOUT_MS`
- `GEOAPIFY_API_KEY`
- `GEOAPIFY_BASE_URL`
- `GEOAPIFY_TIMEOUT_MS`
- `REVERSE_GEOCODE_CACHE_TTL_MS`
- `WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS`
- `GEOFENCE_TRACKING_INTERVAL_MS`
- `DEFAULT_FINISH_GEOFENCE_NAME`
- `GEOFENCE_REQUIRE_PREVIOUS_STOP` (default `0` = loose stop order)
- `GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH` (default `0` = loose finish)
- `GEOFENCE_FINISH_MIN_AWAY_SEC` (default `1200` = 20 min leave for same-zone finish)
- `GEOFENCE_FINISH_MIN_AWAY_M` (default `1000` = 1 km away for same-zone finish)
- `GEOFENCE_FINISH_LEAVE_LOOKBACK_SEC` (default `14400` = 4h leave-evidence window before planned dep; early trip #44394)
- `GEOFENCE_AGE_FINISH_SHORT_KM` (default `60`)
- `GEOFENCE_AGE_FINISH_MID_KM` (default `100`)
- `GEOFENCE_AGE_FINISH_DAYS_SHORT` (default `3`)
- `GEOFENCE_AGE_FINISH_DAYS_MID` (default `7`)
- `GEOFENCE_AGE_FINISH_DAYS_LONG` (default `10`)
- `GEOFENCE_AGE_FINISH_DAYS_FALLBACK` (default `3` when distance unknown)
- `GEOFENCE_AGE_FINISH_LOOKBACK_DAYS` (default `60` — how far back unfinished SPKs are scanned)
- `GEOFENCE_AGE_FINISH_DRY_RUN` (`1` = log only, no INSERT)

### Example File

- `node_backend/.env.example` is the safe template for sharing required keys without secrets.

## Frontend Dependencies Added For Maps

- `leaflet`
- `leaflet.markercluster`
- `@types/leaflet`
- `@types/leaflet.markercluster`

## Important Usage Rules

- Keep Wialon token only on the backend.
- Never expose secret tokens in the frontend bundle.
- Use `wialon_unit_id` as the stable mapping key instead of relying only on plate number.
- Preserve manual mapping if a truck already has a valid `wialon_unit_id`.
- Use `truck.is_active` for soft operational disable instead of deleting truck rows when historical references should remain readable.
- Use `driver.is_active` for soft operational disable instead of deleting driver rows when historical references should remain readable.
- Default truck option APIs should return active trucks only; Master Truck can opt into inactive rows with `include_inactive=1` for administration.
- Default driver option APIs should return active drivers only; Master Driver can opt into inactive rows with `include_inactive=1` for administration.
- GPS location payloads should never include inactive trucks unless a future admin-only diagnostic endpoint explicitly asks for them.
- Reverse geocoding is intentionally done server-side, not directly from the browser.
- Reverse geocoding should only be requested for the selected truck, not every truck on every refresh.
- Reverse geocode lookup is cached both server-side and in browser `localStorage` so repeated clicks on the same coordinates stay cheap.
- Keep a fallback to raw coordinates when no address is available.
- The primary filter meaning on the map page is GPS status, not business/operational status.

## How To Run

### Backend

```bash
cd node_backend
npm install
npm start
```

### Database Migration CLI

```bash
cd node_backend
npm run migrate
```

Useful commands:

```bash
npm run migrate:status
npm run migrate:new -- add_some_change
npm run migrate:adopt-existing
npm run migrate:dump
```

Notes:

- `npm run migrate` is the default bootstrap path for a fresh database on another device.
- `npm run migrate:adopt-existing` is meant for an already-populated database that is close to the latest schema; it will fill in the tracked schema gaps safely and then initialize `schema_migrations`.
- Baseline migration is generated from `trucking.sql` as schema-only by default for better portability and stability.

### Frontend

```bash
cd tailadmin-vuejs-1.0.0
npm install
npm run dev
```

### Build Check

```bash
cd tailadmin-vuejs-1.0.0
npm run build-only
```

## Current Caveats

- `tailadmin-vuejs-1.0.0` still has some older TypeScript warnings in unrelated files outside the map feature.
- The build for the map feature itself is currently working.
- If the UI looks stale after CSS changes, do a hard refresh because Leaflet cluster icons can be cached in the browser.
- `Vehicle Detail` is intentionally hidden until a truck is selected by the user.
- Auto-refresh keeps map data fresh, but should not aggressively re-focus the map on every refresh.
- Address lookup depends on a valid `GEOAPIFY_API_KEY` in backend `.env`.
- When Geoapify is unavailable or quota is exhausted, the UI falls back to showing coordinates in the `Lokasi` card.
- Browser `localStorage` can be cleared if you want to force Geoapify to resolve the same coordinates again before the 24-hour TTL expires.
- Wialon status derivation was corrected to use searchable snapshot data; if every truck suddenly appears offline again, restart the backend and check that the Wialon token still logs in successfully.
- Geofence route history is polling-based, so events are recorded when Wialon reports the truck is inside a mapped zone during a polling cycle.
- If a truck is parked inside a zone while GPS/device is inactive, history may only be recorded after the device reports position again and Wialon reflects zone membership.
- `resource/get_zones_by_unit` from Wialon does not always return a flat map; if geofence history suddenly stays `Pending` for trucks that are visibly inside a polygon, inspect the raw payload shape first.
- MySQL `DATE` values can shift by one day if they are converted through UTC-style helpers such as `toISOString().slice(0, 10)` or blindly rendered with `new Date('YYYY-MM-DD')`.
- For this project, backend date normalization should preserve local calendar parts, and frontend display for `YYYY-MM-DD` should parse to a local `Date(year, month - 1, day)` instead of relying on UTC parsing.

## Suggested Next Improvements

- Add a preview step before auto mapping updates the database.
- Add an overwrite mode for remapping existing truck rows.
- Add cluster summaries by status percentage.
- Add a small legend panel for moving / idle / offline / unlinked statuses.
- Consider adding an explicit loading skeleton for address lookup in the detail panel.
- Consider moving legacy runtime schema sync fully into migrations only, after migration workflow is used consistently across environments.
- Consider adding dedicated data seeding flow separate from baseline schema migration if a fresh environment also needs starter master data.

## Updates (2026-06-19)

### BBS Module — Multi-Language Support (ID/EN)

- Added language toggle (Indonesia / English) to the entire BBS module.
- Toggle button located at top-right of the BBS header with globe icon, shows "EN" or "ID" depending on current state.
- Language state is global/shared across all BBS components via `src/composables/useBbsLang.ts`.
- All UI text in BBS is now reactive to language selection:
  - Tab labels (Dashboard, Observasi/Observation, Checklist, Insiden/Incident, Riwayat/History)
  - Form labels, placeholders, validation messages, toast messages
  - Observation items (8 parameters) + categories
  - Checklist items (16 items across 3 sub-tabs) + OK/NOK/N/A buttons
  - Incident form fields, factor buttons, type options
  - Dashboard metrics, chart titles, risk labels
  - History page: status badges, filter dropdowns, pagination text, export modal
  - Detail Drawer: all field labels, status badges, edit form, delete confirmation
- Backend data labels (risk names, status values) are mapped client-side via `riskLabelMap` and `statusMap` in the composable.
- Chart.js charts re-render on language change via `watch(lang, ...)`.
- No external i18n library added — lightweight composable-only approach.
- New file: `src/composables/useBbsLang.ts`

### Toast Notification Redesign (Global)

- Moved from **top-right** to **bottom-right** to avoid being hidden behind header.
- Redesigned with icon per variant (✓ success, ✕ error, ⚠ warning, ℹ info) + contextual title ("Berhasil", "Gagal", etc.).
- Animation: slide-in from right with spring curve (300ms enter, 200ms exit).
- Component: `src/components/common/ToastHost.vue` — applies globally to all modules.

### Export Excel Modal (Sales Cost, Subcontractor, Repair)

- All three transaction pages now use a **modal popup** for Export Excel (same pattern as BBS Riwayat).
- Modal offers 3 options: Per Bulan, Per Tahun, Semua Data.
- Date reference per page: Sales Cost → Tanggal DO, Subcontractor → Tanggal Pengerjaan, Repair → Tanggal Kerusakan.
- Month picker uses `showPicker()` for full-area clickable input.
- Year dropdown shows last 6 years.
- Existing Excel format output is unchanged — only the UI trigger mechanism was updated.
- Files changed: `SalesCost.vue`, `Subcontractor.vue`, `RepairList.vue`.

### Detail Sales Cost Page Redesign

- Removed all `<input readonly>` patterns.
- Replaced with structured card sections: Info Utama (grid card), Kendaraan & Container, Timeline Pengiriman (mini-cards), Rincian Biaya (summary row with conditional green/red Gross Profit).
- Added **Print button** that opens `/sales-cost/:id/print` in a new tab.
- UX rules applied: `field-grouping`, `visual-hierarchy`, `whitespace-balance`, `color-semantic`.
- File changed: `DetailSalesCost.vue`.

### Production Build & Cloudflared Tunnel

- Backend `server.js` now serves frontend production build from `../tailadmin-vuejs-1.0.0/dist/` with SPA fallback.
- Cloudflared tunnel config updated to route `sankyu-transport.fun` → `localhost:3000` (production build, not Vite dev server).
- Vite dev server (`port 5173`) can still run concurrently for local development.
- Config file: `.cloudflared/config.yml`, documentation: `.cloudflared/README.md`.

### Sidebar Navigation

- BBS Transportasi added to **main sidebar** (below Transaksi group) with `ShieldCheckIcon`.
- Navigation filtering updated per role (patcher sees only BBS + Profile, user sees BBS visible, etc.).
- File changed: `src/config/navigation.js`, new icon: `src/icons/ShieldCheckIcon.vue`.

### BBS Location Map Picker (Observasi & Insiden)

- Replaced plain text input for "Lokasi" with interactive **Leaflet map picker** in both BBS Observasi and Insiden forms.
- New reusable component: `src/views/BBS/BbsLocationPicker.vue`
- Features:
  - Click on map → place pin → reverse geocode → display address
  - Search autocomplete with debounce (Nominatim, 5 suggestions, keyboard navigation)
  - "Lokasi Saya" button (browser geolocation)
  - Draggable marker → re-geocode on drag end
  - Expand/collapse map size (240px ↔ 460px) via button
  - Double fallback geocode: backend Geoapify → Nominatim → coordinates
  - Loading spinner during address resolution
- Database changes:
  - `bbs_observations`: added `latitude DECIMAL(10,7)`, `longitude DECIMAL(10,7)`, extended `location` to `VARCHAR(500)`
  - `bbs_incidents`: added `latitude DECIMAL(10,7)`, `longitude DECIMAL(10,7)`, extended `location` to `VARCHAR(500)`
- Backend: POST/PUT endpoints for observations and incidents now accept and store `latitude`/`longitude`
- Detail Drawer: incident location resolved via reverse geocode when coordinates are stored
- Z-index management: search bar `z-[1000]`, suggestions `z-[1100]`, SearchableSelect dropdown `z-[1100]`, driver grid row `z-[1200]` to prevent stacking conflicts with Leaflet map

### Detail Subcontractor Page Redesign

- Replaced all `<input readonly>` with structured card sections (same pattern as Detail Sales Cost).
- Sections: Info Utama, Kendaraan, Timeline Pengiriman, Rincian Biaya (with Gross Profit color indicator).
- Applied: `field-grouping`, `visual-hierarchy`, `whitespace-balance`, `color-semantic`, `read-only-distinction`.

### Detail Repair Page Redesign

- Replaced all `<input readonly>` with structured card sections.
- Sections: Info Utama, Timeline, Detail Kerusakan, Biaya Perbaikan.
- Status badge redesign: compact with dot indicator (Selesai/Proses).
- Applied same UI/UX pattern as Detail Sales Cost and Detail Subcontractor.

---

## Major Feature Additions (Juli 2026)

### Delivery Timeline DATETIME Migration

- Renamed `sales_cost` columns: `delivery_order` → `departure_datetime`, `arrival_order` → `arrival_datetime`, `finish_order` → `finish_order_datetime` (type `DATE` → `DATETIME`).
- All backend routes, export/import, geofence tracking, monitoring, and frontend views updated to use new field names.
- `DatePickerInput.vue` updated with `enableTime` prop — uses `type="datetime-local"` (then later upgraded to Flatpickr).
- `SalesCostForm.vue` section "Tanggal Transaksi" hidden from UI (Opsi B) — values auto-synced from "Jadwal Pengiriman" stops in `buildPayload()`.
- `mysql2` pool configured with `timezone: 'local'` and `dateStrings: true` to prevent UTC conversion issues.

### Monitoring Kendaraan — Status "Dalam Perjalanan"

- New `on_trip` status added: truck is "Dalam Perjalanan" if `departure_datetime` is set, `finish_order_datetime` is NULL, and no `system:finish_order` in `sales_cost_route_history`.
- `monitoringKendaraan.js` adds `onTripSql` query and returns `on_trip` array + `summary.on_trip` in response.
- `MonitoringKendaraan.vue` adds new "Kendaraan Dalam Perjalanan" section above Transaksi, with amber badge and "⚠ Terlambat" indicator if overdue.

### Delivery Notifications (Arrival Overdue Alerts)

- New table `delivery_notifications` for arrival overdue notifications.
- `geofenceTrackingService.js` — `checkArrivalDelays()` runs every 60 seconds, creates notifications when `arrival_datetime` has passed but truck hasn't triggered finish geofence.
- New backend route `routes/deliveryNotifications.js` — GET, PUT read, PUT read-all, DELETE endpoints.
- `DeliveryNotificationBell.vue` component — polls every 30 seconds, shows unread badge in AppHeader, dropdown with stop-level context badges.
- Notifications support per-stop context: `id_sc_stop`, `step_name` columns distinguish stop-level vs final arrival notifications.

### Delivery Stops — Direct Geofence Selection (Pendekatan C)

- `sales_cost_step_schedule` table restructured: replaced `id_area_route_step` FK with direct geofence fields (`stop_order`, `stop_name`, `wialon_resource_id`, `wialon_zone_id`, `wialon_zone_name`, `is_departure`, `is_finish`).
- Area `route_steps` (from `area_route_step`) are no longer used for geofence tracking — only for Surat Jalan printing.
- New endpoint `GET /api/areas/:id/route-steps` added to `area.js` (before `/:id` to avoid param conflict).
- `SalesCostForm.vue` — "Jadwal Pengiriman" section replaces old "Estimasi Tiba Per Stop": vertical timeline card with Departure (fixed), dynamic middle stops (add/remove), Finish (fixed). Each stop has geofence picker (`SearchableSelect` with `value-key="value"`) + Flatpickr datetime.
- Validation: all stops require geofence + estimated time; date order validated both on submit and realtime via `watch` + `updateStopOrderErrors()`.
- `geofenceTrackingService.js` — all tracking logic now uses `sales_cost_step_schedule` stops instead of `area_route_step`. Step key format changed from `route:{id_area_route_step}` to `stop:{scss.id}`.
- `sales_cost_route_history` and `delivery_notifications` gain `id_sc_stop` column for per-stop tracking.
- `DetailSalesCost.vue` — "Jadwal & Realisasi Pengiriman" uses `delivery_stops` + `id_sc_stop` matching for hit/overdue/actual_arrival.

### Historical Geofence Backfill

- `wialonService.js` — new `fetchRawMessagesForUnit()` (uses `messages/load_interval` + `messages/get_messages`), `fetchZonePolygons()` (polygon data from Wialon), `pointInPolygon()` (ray-casting algorithm). `loginIsolatedSession` and `logoutIsolatedSession` now exported.
- `geofenceTrackingService.js` — `runBackfill(fromTs, toTs)` processes active sales costs in time window, checks point-in-polygon for each GPS message vs geofence zones, inserts missing `sales_cost_route_history` records.
- `detectAndRunStartupBackfill()` — auto-detects downtime gap (min 5 min, max 7 days) on server startup, runs backfill before `startGeofenceTracking()`.
- `routes/wialon.js` — `POST /api/wialon/backfill` endpoint for manual admin trigger with `from`/`to` ISO timestamps.
- `server.js` — startup sequence: `detectAndRunStartupBackfill().finally(() => startGeofenceTracking())`.

### Flatpickr Datetime Picker

- `DatePickerInput.vue` upgraded: when `enableTime=true`, uses `vue-flatpickr-component` instead of `type="datetime-local"`. Config: 24-hour, Indonesian locale, 5-minute steps, `allowInput: true`. Both `flatpickr` and `vue-flatpickr-component` already installed. CSS imported globally in `main.ts`.

### Timeline Card UI — Jadwal Pengiriman

- `SalesCostForm.vue` Jadwal Pengiriman section redesigned as vertical timeline:
  - Connector line gradient (brand-400 → gray-400) linking all nodes.
  - Departure: filled brand-500 circle with play icon, gradient card.
  - Middle stops: numbered circles, subtle × remove button.
  - Add stop: dashed circle node + full-width dashed add card.
  - Finish: flag icon gray-600 circle, gradient gray card.
  - Error messages in rounded red box per stop.
- `DetailSalesCost.vue` "Jadwal & Realisasi Pengiriman" matching read-only timeline:
  - Node icons change per status: ✓ (hit), ⚠ (overdue), ▶ (departure), 🏁 (finish), numbered (middle).
  - Card background gradient changes per status.
  - Status badges include icons for better readability.

### Bug Fixes (Juli 2026)

- `wialonService.js` all `delivery_order`/`arrival_order`/`finish_order` column refs renamed to new names.
- `dashboard.js` and `schedulePengiriman.js` column refs updated.
- `db.js` pool: `timezone: 'local'`, `dateStrings: true` to fix UTC timezone shift on DATETIME save.
- `formatDateTime()` in `DetailSalesCost.vue` normalizes timezone suffix (strips `Z`) to prevent gps_time UTC offset display mismatch.
- `SalesCostForm.vue`: removed `required` attributes from hidden Tanggal Transaksi fields (was blocking form submit via browser HTML5 validation).
- `DatePickerInput.vue`: added `value-key="value"` to all geofence `SearchableSelect` instances (was preventing geofence selection from working).
- `sales_cost_step_schedule`: FK and `id_area_route_step` column dropped via manual migration; `estimated_arrival` set to NULL-able.
- `salesCost.js`: `insertedId` → `result.insertId` fix for delivery stops save.
- `area.js`: `GET /:id/route-steps` endpoint added before `GET /:id` to prevent param conflict.
- `SalesCostForm.vue` HTML structure: Jadwal Pengiriman moved outside hidden Tanggal Transaksi div (was causing section to be invisible).

## Key DB Schema Notes (current)

- `sales_cost.departure_datetime` DATETIME NOT NULL (was `delivery_order DATE`)
- `sales_cost.arrival_datetime` DATETIME NULL (was `arrival_order DATE`)
- `sales_cost.finish_order_datetime` DATETIME NULL (was `finish_order DATE`) — often **planned ETA at create**, not actual completion
- `sales_cost.is_manual_mode` TINYINT(1) NOT NULL DEFAULT 0 — manual/no-GPS SPK; drives ETA auto-hits
- `sales_cost_step_schedule`: `stop_order`, `stop_name`, `wialon_resource_id`, `wialon_zone_id`, `wialon_zone_name`, `is_departure`, `is_finish`, `estimated_arrival` (no more `id_area_route_step`)
- `sales_cost_route_history`: `id_sc_stop INT NULL`, `is_manual`, nullable wialon fields; completion key `system:finish_order`
- `delivery_notifications`: `id_sc_stop INT NULL`, `step_name VARCHAR(100) NULL`
- `sub_contractor.nik_admin` INT — stores **`admin.id_admin` of creator** (not NIK string; JWT `nik_admin` like `CLC003` must not be written here)
- `sub_contractor_step_schedule` — planned multi-stop schedule for subcontractor (no Wialon columns): `stop_order`, `stop_name`, `is_departure`, `is_finish`, `estimated_arrival`

## Active Branch

- `add-module-bbs` — contains all Juli 2026 features. Not yet pushed to GitHub.

---

## Updates (2026-07-18 to 2026-07-20)

### Monitoring Kendaraan — Enhancements & Bug Fixes

- `monitoringKendaraan.js` — enriched `truckRows` query to include `last_lat`, `last_lng`, `last_gps_time`, `last_address` from `truck` table.
- `monitoringKendaraan.js` — fixed stale `on_trip` window: added `departure_datetime >= DATE_SUB(NOW(), INTERVAL 60 DAY)` to `onTripSql`.
- `monitoringKendaraan.js` — fixed `lastSql` tie-breaking: double subquery with `MAX(id_sales_cost)` as tiebreaker for non-deterministic `last_transaction`.
- `monitoringKendaraan.js` — added `status_duration_minutes` to `on_trip` and `transaksi` items (minutes since departure).
- `monitoringKendaraan.js` — `on_trip` status now only applies to trucks with `sales_cost_step_schedule` configured (GPS-tracked deliveries). Older transactions without step schedule fall into `transaksi` instead of polluting `on_trip` with 500+ stale entries.
- `monitoringKendaraan.js` — `is_overdue` badge now uses `finish_order_datetime < NOW()` (not `arrival_datetime`) as overdue deadline, and also checks `NOT EXISTS system:finish_order` to avoid false overdue on completed trips.
- `MonitoringKendaraan.vue` — auto-refresh every 60 seconds + manual refresh button with "X menit lalu" display.
- `MonitoringKendaraan.vue` — filter bulan/tahun now exposed to user (was wired in backend but never sent from frontend).
- `MonitoringKendaraan.vue` — truck cards now show: driver name, duration in status, last GPS coordinates/address, Sales Cost number.
- `MonitoringKendaraan.vue` — fixed broken `<div>` tag on transaksi section that caused entire page to not respond.

### GPS Cache — Truck Table

- Migration `20260717000008` — added `last_lat`, `last_lng`, `last_address`, `last_gps_time` columns to `truck` table.
- `geofenceTrackingService.js` — GPS cache now 2-phase: Phase 1 updates coordinates in parallel, Phase 2 runs reverse geocoding as fire-and-forget (`void Promise.allSettled`) — no longer blocks sync cycle.
- `geofenceTrackingService.js` — GPS `null` coordinate check changed from falsy (`!position?.lon`) to explicit null check (`position?.lon == null`) to allow coordinate `0`.
- `monitoringKendaraan.js` — `last_address` column now included in `truckRows` SELECT query so reverse-geocoded address is served in monitoring response.

### Delivery Notifications — Bug Fixes & Improvements

- `deliveryNotifications.js` — `unread_count` now uses a separate `SELECT COUNT(*)` query (not counted from LIMIT-50 rows, which gave wrong count when >50 unread).
- `deliveryNotifications.js` — GET handler now runs both queries (rows + count) in parallel with `Promise.all`.
- `DeliveryNotificationBell.vue` — `formatTimeAgo` bug fixed: seconds label was `"${diff}d lalu"` (showing "5d lalu"), now `"${diff} dtk lalu"`.
- `DeliveryNotificationBell.vue` — click on notification now navigates to `/sales-cost/${item.id_sales_cost}` (detail page) instead of generic `/sales-cost` list.
- `DeliveryNotificationBell.vue` — polling interval was `30000ms`; updated to `60_000ms` with proper `clearInterval` on unmount.

### DatePickerInput — Replaced flatpickr with VueDatePicker

- `DatePickerInput.vue` — `flat-pickr` component replaced with `@vuepic/vue-datepicker` (v8.8.1, already installed).
- VueDatePicker uses `teleport="body"` + internal `@floating-ui` for viewport-aware popup positioning — fixes calendar popup being clipped on right-column inputs in forms.
- Output format unchanged: `YYYY-MM-DD HH:MM` string. All callers (`SalesCostForm.vue`, etc.) unaffected.
- CSS imported via `import '@vuepic/vue-datepicker/dist/main.css'` inside the component; flatpickr CSS import in `main.ts` preserved (still used by `DefaultInputs.vue` demo page).

### Security & Infrastructure (Kelompok 3)

- `routes/auth.js` — password login now uses bcrypt dual-mode: tries `bcrypt.compare()` first; falls back to plaintext for legacy passwords and auto-upgrades to bcrypt hash on successful login (12 rounds, non-blocking).
- `routes/admin.js` — admin CREATE and UPDATE now hash password with `bcrypt.hash(password, 12)` before INSERT/UPDATE. Password column removed from all GET/POST/PUT response SELECT queries.
- `server.js` — CORS `origin` now reads from `process.env.ALLOWED_ORIGIN`; falls back to `true` (all origins) when unset (dev mode).
- `server.js` — CORS preflight `app.options("*", cors())` now passes same config as main cors middleware (previously bypassed restrictions).
- `server.js` — static routes `/doc-data-truck`, `/doc-data-chasis`, `/doc-supir` now protected with `authenticateToken` middleware.
- `server.js` — `/img` static route left public (browser `<img>` tags cannot send Authorization headers; profile photos must be accessible without auth).
- `middleware/rbac.js` — `restrictCsAccess` and `restrictPatcherAccess` now use hybrid pattern: reads `req.user` if already decoded by `authenticateToken`, falls back to `jwt.verify` if not.
- `.env` — cleaned: removed duplicate `MONGO_URI`, added missing `DB_PORT`, `WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS`, `GEOFENCE_TRACKING_INTERVAL_MS`, `DEFAULT_FINISH_GEOFENCE_NAME`, `ALLOWED_ORIGIN`.
- `.env.example` — updated to match all keys now used in `.env`.
- `bcrypt@5.1.1` added to `node_backend/package.json`.
- `ALLOWED_ORIGIN` env var — new variable for CORS production restriction. Set to production domain (e.g. `https://app.example.com`) in production `.env`. Leave empty for dev.

### Geofence Tracking — Critical Bug Fixes

- `geofenceTrackingService.js` — C5: `finish_order_datetime` is now set to `NOW()` via `UPDATE sales_cost` after inserting `system:finish_order` to `sales_cost_route_history`. Uses idempotency guard (`finish_order_datetime IS NULL OR = '0000-00-00 00:00:00'`).
- `geofenceTrackingService.js` — C6: `finish_geofence_resource_id`, `finish_geofence_zone_id`, `finish_geofence_zone_name` are now included in the `pickedByTruck` map object (were previously dropped), so per-area finish geofence is used correctly instead of always falling back to `DEFAULT_FINISH_GEOFENCE_NAME` ("Sankyu").

### Repair Business Logic Fixes

- `repairService.js` — C2/C3/C4: `updateRepair` now uses `payload.field !== undefined ? payload.field : existing.field` pattern for all 12 fields — prevents partial update from overwriting existing data with empty strings or null. `id_truck` and `nik_admin` (both NOT NULL in DB) use additional `!= null` guard.
- `repairService.js` — H1: `createRepair` now checks if the truck is currently on an active trip (`system:finish_order` not yet recorded, within 60 days) before inserting. Returns 409 if truck is on trip.
- `repairService.js` — H3: `updateRepair` enforces one-way state machine: `SELESAI → PROSES` transition is now blocked with a 400 error.

### Sales Cost — Validation & Lock Fixes

- `salesCost.js` — H14: date ordering validation added to both POST and PUT handlers: `departure ≤ arrival ≤ finish_order`. Returns 400 with Indonesian message if order is wrong.
- `salesCost.js` — H15: DELETE handler now has same month-lock check as PUT handler: records from past months cannot be deleted (returns 403 "Data terkunci. Tidak bisa dihapus.").
- `salesCost.js` — `POST /:id/check-in` handler now selects `stop.is_finish` from `sales_cost_step_schedule` and, if `is_finish = 1`, automatically inserts a `system:finish_order` record into `sales_cost_route_history` and updates `finish_order_datetime` on the `sales_cost` row (idempotent). This ensures manual check-in of the Finish stop has the same effect as GPS-triggered finish, making Monitoring Kendaraan status consistent with Schedule Pengiriman.

### Database Migrations

- `20260717000008_add_gps_cache_to_truck.sql` — added `last_lat`, `last_lng`, `last_address`, `last_gps_time` to `truck`.
- `20260720000009_nullable_wialon_fields_route_history.sql` — changed `wialon_resource_id`, `wialon_zone_id`, `wialon_zone_name` in `sales_cost_route_history` from `NOT NULL` to `NULL DEFAULT NULL`. Required so manual check-in (without Wialon GPS config) can insert route history without error.

### Monitoring Kendaraan — Status Logic Alignment with Schedule Pengiriman

**Problem:** `on_trip` status in Monitoring used `finish_order_datetime IS NULL` as primary gate, but `finish_order_datetime` is also set manually as an estimated schedule — causing trucks to appear as "Transaksi" even while physically en route.

**Fix:** Removed `finish_order_datetime IS NULL` from `onTripSql`. The single source of truth for "delivery finished" is now `system:finish_order` in `sales_cost_route_history` — consistent with Schedule Pengiriman's `resolveScheduleStatus` logic.

- `monitoringKendaraan.js` — `onTripSql` no longer requires `finish_order_datetime IS NULL`; only requires `NOT EXISTS (system:finish_order in route_history)` AND `EXISTS (sales_cost_step_schedule)`.

### Schedule Pengiriman — Overdue Logic Fix

**Problem:** `resolveScheduleStatus` in `schedulePengiriman.js` used `arrival_datetime` (estimated stop 1 arrival time) as the overdue deadline. This caused "Estimasi arrival sudah lewat" text to appear even when the truck was ahead of schedule, because `arrival_datetime` is the stop 1 ETA, not the overall delivery deadline.

**Fix:** `resolveScheduleStatus` now uses `finish_order_datetime` as the overdue deadline (fallback to `arrival_datetime` for backwards compatibility). The overdue condition also now requires `!finishHit` — completed deliveries cannot be overdue.

- `schedulePengiriman.js` — `resolveScheduleStatus` accepts new parameter `finishOrderDatetime`; uses it as `overdueDeadline` when available.

---

## Updates (2026-08-04)

### Subcontractor DN (Delivery Note) — Fitur Baru

Fitur pengelolaan Delivery Note per transaksi subcontractor, menggunakan MySQL child table `sub_contractor_dn` dengan pola DELETE+re-INSERT (konsisten dengan `sub_contractor_step_schedule`).

#### Database

- `node_backend/db/schema.sql` — tabel baru `sub_contractor_dn`: `id`, `id_subcontractor`, `no_dn`, `pickup_alamat`, `drop_alamat`, `qty`, `pkg` (ENUM: IBC/CTN/PIL/DRM/''), `gw` decimal(10,2), `no_container`, `no_aju`, `remarks`.
- `scripts/fix-missing-tables.js` — migration `20260804000015` ditambahkan untuk create `sub_contractor_dn` (idempotent).

#### Backend

- `node_backend/routes/subcontractor.js` — helper `replaceDNForSubcontractor` baru + route `GET /:id/dn` + `POST /:id/dn` (pola DELETE+re-INSERT, non-transactional, independen dari main form).
  - `gw`: `parseFloat` + replace koma (handle `"1,5"` → `1.5`).
  - Semua string field: `!= null ? String(...)` (null-safe).
  - `qty`: `parseInt()` eksplisit.

#### Frontend Service

- `tailadmin-vuejs-1.0.0/src/services/subcontractorService.js` — metode baru `fetchDNList(id)` dan `saveDNList(id, items)`. `createSubcontractor` dan `updateSubcontractor` strip `_dnItems` sebelum dikirim ke backend (mencegah field internal mencemari request body).

#### Form Input & Edit Subcontractor

- `SubcontractorForm.vue` — tipe `DNItem`, state `dnItems`/`dnCollapsed`, fungsi `addDnItem`/`removeDnItem`/`toggleDnItem`/`loadDnItems`/`saveDnItems`, DN section UI (accordion). Posisi DN section: setelah Section 2 (Kendaraan & Dokumen), sebelum Section 3 (Jadwal Pengiriman). Urutan final: **Mitra & Pesanan → Kendaraan & Dokumen → Delivery Note (DN) → Jadwal Pengiriman → Biaya & Tagihan**.
- `InputSubcontractor.vue` — setelah create sukses, memanggil `saveDNList` dengan `result.id` (non-blocking).
- `EditSubcontractor.vue` — setelah update sukses, memanggil `saveDNList` (non-blocking; gagal = toast warning).

#### Detail Subcontractor

- `DetailSubcontractor.vue` — tipe `DNItem`, state `dnItems`/`dnLoading`/`dnError`, fungsi `loadDN()` memanggil `fetchDNList`. `onMounted` paralel `loadDetail()` + `loadDN()`. Template: DN table section (di bawah Rincian Biaya), 10 kolom: #, No. DN, Pickup, Drop, Qty, Pkg (badge), GW, No. Container, No. AJU, Remarks. Handles loading/error/empty state.
- Bug fix: `dnItems.value = Array.isArray(data?.items) ? data.items : []` — backend mengembalikan `{ items: [] }` bukan array langsung.

#### Arsitektur

DN disimpan independen dari main form transaction, mengikuti pola Sales Cost. Jika DN gagal, data utama tetap tersimpan dan ditampilkan sebagai toast warning.

---

## Updates (2026-08-05)

### Print Subcontractor — DN Section

- `PrintSubcontractor.vue` — added Delivery Note (DN) section below "Jadwal Pengiriman" table, above footer.
- New `DNItem` type; new reactive `dnItems` state.
- `loadDN()` calls `subcontractorService.fetchDNList(id)`, unwraps `data.items`; errors are silently ignored so the print page remains functional even if DN fetch fails.
- `onMounted` now runs `loadDetail()` and `loadDN()` in parallel.
- DN table has 9 columns: #, No. DN, Pickup, Drop, Qty, Pkg, GW (Indonesian number format), No. Container, No. AJU.
- New CSS classes: `.dn-block`, `.dn-table` — styled consistently with the Jadwal Pengiriman table.

### Export Excel — DN Sheet "ID SC" → "No. Laporan"

- `node_backend/routes/subcontractor.js` — sheet DN column `"ID SC"` (key: `id_sc`) renamed to `"No. Laporan"` (key: `no_laporan`, width 12).
- DN loop changed from `rows.forEach((row) =>` to `rows.forEach((row, index) =>`.
- Value changed from `scId` (id_subcontractor PK) to `index + 1` — matches the "No." column in the main "Laporan Sub Contractor" sheet, enabling direct cross-reference between sheets.
- Design decision: three options were considered; **Option 1** (row number matching main sheet) was chosen over Option 2 (id_subcontractor PK) and Option 3 (remove column entirely), because it gives users a direct visual cross-reference between the two sheets without exposing internal IDs.

### Monitoring Kendaraan — Repair Query Fix

- `monitoringKendaraan.js` — repair query changed from `LEFT JOIN truck` to `INNER JOIN truck AND truck.is_active = 1` so inactive trucks no longer appear in monitoring repair list.

### Schedule Pengiriman — Text Fix

- `SchedulePengiriman.vue` — fixed garbled separator characters in date range display. Was `{{ filters.startDate }} → {{ filters.endDate }}` (broken encoding); now uses HTML entities `&mdash;` and `&bull;` for clean display.

## Key Business Logic Rules (post-2026-07-24)

### "Dalam Perjalanan" (on_trip) definition
A truck is `on_trip` in Monitoring Kendaraan if ALL of:
1. `truck.is_active = 1`
2. `sales_cost.departure_datetime IS NOT NULL` and within **14 days**
3. `NOT EXISTS (system:finish_order in sales_cost_route_history)` — delivery not yet finished
4. `EXISTS (sales_cost_step_schedule for this sales_cost)` — has a delivery timeline

### "Transaksi" monitoring bucket
Active unfinished SPKs with a step schedule and arrival window. **Must have** `sales_cost_step_schedule` rows (empty-schedule SPKs are excluded so they do not appear as Transaksi without a timeline).

### "system:finish_order" as single source of truth
`system:finish_order` in `sales_cost_route_history` is the **only** authoritative signal that a delivery is complete. Written by:
- `syncGeofenceRouteHistory` / `resolveFinishGpsHit` — GPS finish (loose + same-zone min-away + leave lookback)
- `applyDueManualEtaHits()` — manual/no-GPS when finish ETA is due
- `applyDueDistanceAgeFinish()` — age/distance auto-close (`is_manual=1`, name `Auto Finish (Jarak/Umur)`)
- `salesCost.js` check-in / complete-all — manual admin/user actions

`sales_cost.finish_order_datetime` is often filled at **create time as planned ETA**. It is **not** proof of completion. Prefer finish-stop `scss.estimated_arrival` for overdue deadlines; completion = history only.

### Schedule status
- `completed` = `finishHit` (`system:finish_order` present), even if middle stops were skipped
- Middle stops never GPS-hit after finish → UI badge **Geofence dilewati**
- `overdue` = planned finish ETA past and not finished (not completed)

### Overdue deadline
- Prefer finish-stop `estimated_arrival` on `sales_cost_step_schedule`
- Fallback: `sc.finish_order_datetime` then `arrival_datetime`
- Never treat `sc.finish_order_datetime` alone as “delivery finished”

### Manual / no-GPS auto timeline
Eligible for ETA auto-hits only if:
- `sales_cost.is_manual_mode = 1`, **or**
- truck has no `wialon_unit_id`

When `NOW ≥ stop.estimated_arrival`, insert history with `is_manual=1` and `gps_time = ETA`. Finish due → also `system:finish_order`.

### Age / distance auto-finish
Closes **any** unfinished SPK (GPS or manual) when planned departure is old enough relative to trip distance:
- Distance: max haversine (Departure zone centroid → middle/finish zone centroids); missing polygons → fallback days
- **≤60 km → 3 days**, **≤100 km → 7 days**, **>100 km → 10 days**, unknown → **3 days**
- Deadline: `departure_datetime + N days`; insert finish with `gps_time = NOW()`
- Does not invent middle-stop hits; UI shows **Geofence dilewati** for unhit middles
- Prefer GPS/manual finish first (runs later in the same cycle)

### Password security
- Login: bcrypt dual-mode. New passwords hashed with bcrypt (12 rounds). Legacy plaintext passwords auto-upgrade on first successful login.
- Admin CREATE/UPDATE: passwords always hashed before DB write.
- Admin GET responses: `password` field never included in response payload.

### Sales Cost step schedule (smart upsert)
- PUT handler uses smart upsert — stops with existing `id` are UPDATEd (preserving ID), new stops are INSERTed, removed stops are DELETEd only if they have no `sales_cost_route_history` records.
- This prevents `id_sc_stop` references in route_history from becoming orphaned when the user edits a Sales Cost with an active delivery timeline.

### Schedule Pengiriman filter behavior
- Date range filter is based on `departure_datetime` only — no hidden `arrival_datetime >= TODAY` restriction.
- Default range: 7 days ago to 7 days ahead.
- Status filter can be server-side via `?status=` (see Updates 2026-07-21).
- Only transactions with `sales_cost_step_schedule` configured appear with GPS-tracked status; others appear as `waiting` or `on_trip` based on dates only.

### Schedule Pengiriman Excel export (duration / selisih)
- File: `node_backend/routes/schedulePengiriman.js` `GET /export` → `schedule-pengiriman_YYYY-MM-DD.xlsx`.
- **19 columns**; merge SPK fields **1–11** (includes **Jumlah Hari (Aktual)**).
- **Jumlah Hari (Aktual):** actual departure hit → actual finish (`formatDurationId` → `X hari Y jam Z mnt`); incomplete → `-`. Finish time from finish-stop hit or `system:finish_order.gps_time`.
- **Selisih Waktu (Est vs Aktual):** per stop, `formatSignedDurationId` on (aktual − estimasi) minutes — e.g. `1 jam 56 mnt`, `-45 mnt`, `tepat`; missing times → `-`. Positive = late vs estimate.

---

## Updates (2026-07-20 continued)

### Sales Cost — Delivery Stop Smart Upsert
- `salesCost.js` — PUT handler replaced DELETE-all + re-INSERT delivery stops with smart upsert:
  - Steps with existing `id` are UPDATEd in place (preserves `id` so `sales_cost_route_history.id_sc_stop` remains valid)
  - Steps removed from payload are DELETEd only if they have no route history records (safety guard)
  - New steps (no `id`) are INSERTed with new IDs
- This fixes the bug where editing & saving a Sales Cost would reset the delivery timeline (green visited stops turning back to pending).

### Sales Cost — Import H14 Date Ordering Validation
- `salesCost.js` Excel import handler — added date ordering validation after parsing all dates:
  - `arrivalDate < deliveryDate` → reject with `INVALID_DATE_ORDER`
  - `finishDate < arrivalDate` → reject with `INVALID_DATE_ORDER`
  - `finishDate < deliveryDate` → reject with `INVALID_DATE_ORDER` (edge case: no arrival)
- Consistent with POST/PUT handler validation added earlier.

### Sales Cost — Manual Check-in Finish Stop
- `salesCost.js POST /:id/check-in` — when `stop.is_finish = 1`, automatically writes:
  - `system:finish_order` record to `sales_cost_route_history` (idempotent — only if not already present)
  - Updates `finish_order_datetime` on `sales_cost` (idempotent guard)
- Ensures manual Finish check-in has same effect as GPS-triggered finish for Monitoring Kendaraan consistency.

### Database Migration — Nullable Wialon Fields
- `20260720000009_nullable_wialon_fields_route_history.sql` — `wialon_resource_id`, `wialon_zone_id`, `wialon_zone_name` in `sales_cost_route_history` changed from `NOT NULL` to `NULL DEFAULT NULL`.
- Required for manual check-in on stops without Wialon geofence configuration.

### Schedule Pengiriman — Filter Improvements
- `schedulePengiriman.js` — removed hardcoded `arrival_datetime >= TODAY` condition that was hiding all past transactions regardless of the date range filter the user selected.
- `SchedulePengiriman.vue` — default date range changed from `today → +7 days` to `-7 days → +7 days` so active deliveries from the past week are visible by default.
- `SchedulePengiriman.vue` — added **Status filter** dropdown (Semua / Menunggu / Dalam Perjalanan / Terlambat / Selesai / Belum Lengkap) as a client-side filter on top of server-side results.
- `SchedulePengiriman.vue` — `filteredRows` computed property filters `rows` by `filters.status`; template uses `filteredRows` instead of `rows` for display.

### Monitoring Kendaraan — on_trip Status Alignment
- `monitoringKendaraan.js` — `onTripSql` no longer requires `finish_order_datetime IS NULL`. Single source of truth is `NOT EXISTS system:finish_order in route_history`.
- `monitoringKendaraan.js` — added `AND EXISTS (SELECT 1 FROM sales_cost_step_schedule)` filter so only GPS-configured deliveries appear as `on_trip`; legacy transactions without step schedule remain in `transaksi`.
- `monitoringKendaraan.js` — `is_overdue` now uses `finish_order_datetime < NOW()` (not `arrival_datetime`) and guards against completed trips (`NOT EXISTS system:finish_order`).

### Schedule Pengiriman — Overdue Deadline Fix
- `schedulePengiriman.js:resolveScheduleStatus` — uses `finish_order_datetime` as `overdueDeadline` when available; falls back to `arrival_datetime` for backwards compatibility.
- Overdue condition now requires `!finishHit` — completed deliveries cannot be overdue.
- Caller passes `finishOrderDatetime: row.finish_order_datetime` to `resolveScheduleStatus`.

### Security Fixes (Kelompok 3)
- `routes/auth.js` — bcrypt dual-mode login with auto-upgrade of legacy plaintext passwords.
- `routes/admin.js` — passwords hashed on CREATE/UPDATE; `password` field excluded from all responses.
- `server.js` — CORS conditional via `ALLOWED_ORIGIN` env var; CORS preflight uses same config.
- `server.js` — `/doc-data-truck`, `/doc-data-chasis`, `/doc-supir` protected by `authenticateToken`; `/img` left public (browser `<img>` cannot send auth headers).
- `middleware/rbac.js` — hybrid `req.user` + `jwt.verify` fallback pattern.
- `.env` cleaned and `.env.example` updated to match all required keys.
- `bcrypt@5.1.1` added to dependencies.

---

## Updates (2026-07-20 — Departure Geofence Tracking)

### Departure Stops Are Now GPS-Tracked
- `geofenceTrackingService.js` — removed the `if (Number(stop.is_departure) === 1) continue;` guard from **both** tracking paths:
  - `syncGeofenceRouteHistory()` (realtime sync loop, every `GEOFENCE_TRACKING_INTERVAL_MS`)
  - `runBackfill()` (historical GPS replay from Wialon raw messages)
- **Behavior:** a departure stop is now inserted into `sales_cost_route_history` (step key `stop:{scss.id}`) as soon as the truck is detected inside its geofence — exactly like any middle stop. Previously departure was always skipped and could only appear as "passed" via UI inference.
- **Rationale:** restores the original design where departure is GPS-verifiable (proves the truck actually left the origin), not just inferred.
- **`inferred_passed` fallback retained:** `schedulePengiriman.js` and `DetailSalesCost.vue` still mark departure as passed when a later stop is hit but departure has no history row — covering trucks that skip the departure point or depart before the Sales Cost is created.
- **Finish guard unchanged:** `deliveryStops` used by the finish-order check still excludes departure (`stops.filter((s) => Number(s.is_departure) !== 1)`), so `system:finish_order` is only recorded after all middle (delivery) stops are visited. Departure never blocks finish.
- **Verified:** SPK #43632 (departure geofence `Sankyu`) recorded its departure row immediately on the first sync cycle after the change.

---

## Updates (2026-07-20 — Session Fixes & UI Enhancements)

### Bug Fixes

#### Geofence Dropdown — Hapus Suffix Resource Name
- `AreaMaster.vue` (line 573) dan `SalesCostForm.vue` (line 1003) — label dropdown geofence diubah dari `` `${row.zone_name} (${row.resource_name})` `` menjadi `row.zone_name` saja. Field `resource_name` tetap ada di object option untuk keperluan search, hanya teks tampilan yang dipersingkat.

#### Monitoring Kendaraan — Status "Idle" setelah Finish Order
- `monitoringKendaraan.js` — `trxConditions` bug fix: kondisi `finish_order_datetime > todayString` menyebabkan truk yang sudah selesai (dengan `finish_order_datetime` di hari yang sama tapi jam berbeda) masih muncul sebagai "Transaksi". Root cause: perbandingan `DATETIME > DATE` di MySQL cast `DATE` ke `YYYY-MM-DD 00:00:00`, sehingga jam 20:49 masih dianggap "masa depan".
- **Fix:** `trxConditions` sekarang hanya memasukkan truk sebagai "Transaksi" jika `finish_order_datetime IS NULL OR = '0000-00-00'`. Jika `finish_order_datetime` sudah diisi (apapun nilainya), truk dianggap selesai dan masuk "Idle".

#### Master Admin — Ganti Password Internal Server Error
- `admin` table — kolom `password` diperlebar dari `VARCHAR(50)` ke `VARCHAR(255)` via migration `20260720000011_extend_admin_password_column.sql`. bcrypt hash (60 karakter) tidak bisa disimpan di `VARCHAR(50)`.
- Migration dijalankan langsung via Node.js karena `dbmate` tidak tersedia di PATH.

#### Schedule Pengiriman — Karakter "?" pada DN Text
- `SchedulePengiriman.vue` (line 447) — separator antara `almt_pickup` dan `almt_drop` di expanded DN card diubah dari literal `?` menjadi `→`. Karakter `→` mengalami encoding corruption saat disimpan.

### Monitoring Kendaraan — Multi-SPK Aktif per Truk

**Problem:** 1 truk bisa memiliki 2–4 SPK aktif dalam 1 hari. Map `transaksiByTruck` dan `onTripByTruck` hanya menyimpan 1 row per truk (first-wins), sehingga SPK lainnya hilang diam-diam.

**Fix:**
- `monitoringKendaraan.js` — `transaksiByTruck` dan `onTripByTruck` diubah dari `Map<key, row>` menjadi `Map<key, row[]>`. Semua SPK aktif per truk dikumpulkan, primary row = `array[0]` (paling baru, karena query `ORDER BY departure_datetime DESC`).
- Dua field baru ditambahkan ke setiap item `transaksi` dan `on_trip`:
  - `active_spk_count: number` — jumlah SPK aktif untuk truk tersebut
  - `active_spk_ids: number[]` — array ID semua SPK aktif
- `MonitoringKendaraan.vue` — badge warning `"N SPK aktif →"` ditambahkan di card header `on_trip` dan `transaksi`. Badge ditampilkan jika `active_spk_count >= 1` (berlaku untuk 1 SPK maupun lebih).
- Badge adalah `<button>` dengan `@click.stop="navigateToSpk(item)"` yang navigate ke `/schedule-pengiriman?spk_ids=43633,43634` dengan filter otomatis.

### Schedule Pengiriman — Navigasi dari Badge SPK

**Feature:** Klik badge "N SPK aktif" di Monitoring Kendaraan langsung membuka Schedule Pengiriman dengan filter otomatis menampilkan semua SPK terkait.

- `schedulePengiriman.js` — param baru `?spk_ids=43633,43634,43635`: parse comma-separated list, filter `WHERE sc.id_sales_cost IN (...)` dengan parameterized query (SQL injection safe). Saat `spk_ids` diisi, date range filter di-skip.
- `SchedulePengiriman.vue` — baca `route.query.spk_ids` saat `onMounted`. Jika ada: `spkIdsActive` ref di-set, date range default di-skip. Jika tidak ada: perilaku normal tidak berubah.
- `SchedulePengiriman.vue` — `buildParams()` include `spk_ids` ke API call saat `spkIdsActive` non-empty.
- `SchedulePengiriman.vue` — dismissable banner warning kuning muncul saat filter aktif: "Menampilkan N SPK aktif dari Monitoring Kendaraan". Tombol "× Hapus filter" clear `spkIdsActive` dan reload data normal.
- `MonitoringKendaraan.vue` — `useRouter` import + fungsi `navigateToSpk(item)` menggunakan `item.active_spk_ids?.join(',')`.

### Lokasi Truk — UI/UX Enhancements

6 perubahan di `TruckLocationMap.vue`:

1. **Animasi detail panel** — `<Transition>` slide+fade 220ms masuk / 160ms keluar saat panel Vehicle Detail muncul/hilang.
2. **Kartu truk redesign** — status bar vertikal 3px di sisi kiri kartu (warna solid per GPS status), 3 baris info: plat+badge, driver+rute, speed (jika moving)+waktu GPS terakhir. Fungsi `statusBarClass` ditambahkan.
3. **Loading address skeleton** — saat `selectedTruckAddressLoading = true`, tampilkan skeleton shimmer `animate-pulse` bukan teks + koordinat mentah. Koordinat hanya tampil di branch error fallback (`selectedTruckAddressError`).
4. **Debounce search** — `watch([searchInput, gpsFilter])` dipecah menjadi dua watcher: `gpsFilter` instant, `searchInput` debounced 250ms via `useDebounceFn` dari `@vueuse/core`.
5. **Legend GPS interaktif** — 4 badge (Moving/Idle/Offline/Belum Terhubung) diubah dari `<span>` dekoratif menjadi `<button>` yang toggle `gpsFilter`. Klik lagi reset ke `'all'`. Active state solid color.
6. **Moving truck pulse** — CSS `@keyframes status-pulse` pada `.status-bar--moving` (opacity 1→0.45, 2s loop). `@media (prefers-reduced-motion: reduce)` menonaktifkan animasi.
- `@vueuse/core` ditambahkan ke `package.json` secara resmi via `npm install`.

### Database Migrations
- `20260720000011_extend_admin_password_column.sql` — `ALTER TABLE admin MODIFY COLUMN password VARCHAR(255) NOT NULL`.

### Key Business Logic Rules (tambahan)

#### Multi-SPK per Truk
- Jika 1 truk memiliki beberapa SPK aktif (`finish_order_datetime IS NULL`) dalam waktu bersamaan, Monitoring Kendaraan menampilkan SPK paling baru sebagai primary di card. Count total SPK aktif tersedia via `active_spk_count`, semua ID via `active_spk_ids`.
- Badge `"N SPK aktif →"` tampil di semua card yang punya `active_spk_count >= 1`.

#### Schedule Pengiriman spk_ids Mode
- Saat URL mengandung `?spk_ids=`, filter date range default di-skip. Backend query menggunakan `WHERE sc.id_sales_cost IN (...)`.
- Dismiss banner → clear `spkIdsActive` → reload data → kembali ke filter date range normal.
- URL param name: `spk_ids` (konsisten dari `router.push` → `route.query` → `buildParams` → `req.query`).

---

## Updates (2026-07-21 — Print SPK, Export Excel, Bug Fixes)

### Print Sales Cost — Label "Tiba di Tujuan"
- `PrintSalesCost.vue` — tambah label `"Tiba di Tujuan"` tepat di bawah `"Total Trip"` di print SPK.
- Data diambil dari stop pertama yang bukan departure dan bukan finish (`delivery_stops` → first middle stop).
- Format: `HH.MM (D Bulan YYYY)` — contoh: `10.25 (21 Juli 2026)`.
- Perubahan: `DeliveryStopPrint` type, `formatIndonesianDateTime()` helper, `getFirstDestination()` helper, CSS positioning `top: 112mm` (7mm di bawah `label-trip`).
- `SalesCostPrintDetail` type ditambahkan field `delivery_stops?: DeliveryStopPrint[]` — API sudah return field ini, hanya belum dipakai di print.

### Sales Cost — Mode Manual Fallback Jadwal Pengiriman
- `SalesCostForm.vue` — toggle `"Mode Manual"` di header section Jadwal Pengiriman sebagai fallback saat server GPS Wialon error/offline.
- State: `useManualMode = ref(false)`, reset ke `false` setiap form dibuka via `applyInitialData`.
- Saat mode manual aktif: geofence picker (`SearchableSelect`) disembunyikan di semua stop (Departure, Middle, Finish), diganti teks italic abu-abu `"Geofence tidak dikonfigurasi (mode manual)"`.
- Validasi: guard `!useManualMode.value` ditambahkan pada validasi `wialon_zone_id` — geofence tidak wajib di mode manual. `stop_name` dan `estimated_arrival` tetap wajib.
- Backend tidak perlu diubah — `wialon_zone_id/resource_id/zone_name` sudah nullable di `sales_cost_step_schedule`.
- Info banner warning kuning muncul saat mode manual aktif.

#### Flow Bisnis Mode Manual
- Sales Cost dengan mode manual tetap bisa disimpan dan tampil di Schedule Pengiriman dengan timeline stops (status semua "Pending").
- Status `on_trip` di Monitoring Kendaraan tetap aktif (karena cek `EXISTS sales_cost_step_schedule`, tidak peduli geofence NULL).
- GPS tracking otomatis tidak berjalan (Wialon tidak mengenal zone-nya).
- Progression status harus dilakukan manual via check-in di Schedule Pengiriman.
- `system:finish_order` hanya masuk via manual Finish check-in.

### Notifikasi Pengiriman — Scrollable Fix
- `DeliveryNotificationBell.vue` — `<ul>` list notifikasi diubah dari `h-auto overflow-y-auto` menjadi `flex-1 min-h-0 overflow-y-auto`. `flex-1` mengisi sisa tinggi dropdown (480px - header - footer), `min-h-0` memungkinkan flex child shrink sehingga `overflow-y-auto` aktif.

### Schedule Pengiriman — Export Excel (current — Jul 2026)
**Backend:** `node_backend/routes/schedulePengiriman.js` → `GET /export` (sebelum `GET /`).
- Params: `start_date`, `end_date` (YYYY-MM-DD). Tanpa param = semua data.
- Per-stop via `resolveStopTimelineSummary`; filename `schedule-pengiriman_YYYY-MM-DD.xlsx`.
- **19 kolom**; satu baris per stop; **merge kolom 1–11** (info SPK + **Jumlah Hari (Aktual)**) untuk SPK multi-stop.
- Alternating group colors per SPK; merged cells `vertical: "top"`.

**Helpers (export duration / selisih):**
- `formatDurationId` — Aktual Departure → Aktual Finish → `X hari Y jam Z mnt` (atau `-` jika salah satu belum hit). Finish actual: stop finish hit, fallback `system:finish_order.gps_time`.
- `diffMinutes` / `formatSignedDurationId` / `formatDiffMinutes` — selisih per stop: aktual − estimasi; human-readable omit-zero units.

**Frontend:** `SchedulePengiriman.vue` — tombol Export Excel + modal (Per Bulan / Per Tahun / Semua Data) → blob download.

**Kolom Excel (current):**

| # | Kolom | Level | Source / notes |
|---|---|---|---|
| 1–10 | No. … Status SPK | SPK (merge) | identity + `schedule_status` |
| 11 | **Jumlah Hari (Aktual)** | SPK (merge) | Actual dep → actual finish: `0 hari 3 jam 15 mnt`; `-` if incomplete |
| 12 | Stop | stop | `stop_name` |
| 13 | Nama Geofence | stop | `wialon_zone_name` |
| 14 | Estimasi Tiba | stop | `estimated_arrival` |
| 15 | Aktual Tiba | stop | `actual_arrival` (GPS/manual) |
| 16 | **Selisih Waktu (Est vs Aktual)** | stop | human-readable: `1 jam 56 mnt`, `-45 mnt`, `tepat`, `-`; **+** = late vs est, **−** = early |
| 17 | Status Stop | stop | see labels below |
| 18 | Sumber Aktual | stop | GPS / Manual / - |
| 19 | Koordinat GPS | stop | `lat, lon` 6 decimals if hit |

**Status Stop labels:**
- `"Tercapai"` — hit
- `"Geofence dilewati"` — middle never hit after finish
- `"Terlewati (Otomatis)"` — inferred departure
- `"Terlambat"` — overdue, not hit
- `"Pending"` — not hit, not overdue

### Important Routes (tambahan)
- `GET /api/schedule-pengiriman/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - Export Schedule Pengiriman ke `.xlsx` (per-stop est/aktual + durasi SPK + selisih waktu)
  - Merge kolom 1–11; alternating group colors per SPK

---

## Updates (2026-07-21 continued — Export Enhancements, DB Deployment, Status Filter, Selesaikan Semua)

### Schedule Pengiriman Export — Kolom Tambahan (superseded by current 19-col layout)

- History export selects `lat`, `lon`; timeline exposes `gps_lat` / `gps_lon`.
- Added **Nama Geofence** + **Koordinat GPS**; later **Jumlah Hari (Aktual)** + **Selisih Waktu (Est vs Aktual)** (see current table above).
- Merge range expanded to columns **1–11** when Jumlah Hari was added.
- Status label **"Terlewati (Otomatis)"** for inferred departure; **"Geofence dilewati"** for skipped middles after finish.

### Schedule Pengiriman — Status Filter: Client-Side → Server-Side

**Problem:** Filter status (`filters.status`) sebelumnya murni client-side (`filteredRows` computed) — hanya menyaring data yang sudah ter-load di halaman aktif. Jika transaksi dengan status "Selesai" tidak ada di rentang tanggal/halaman yang sedang ditampilkan, filter tidak menemukannya sama sekali.

**Fix — Opsi A (server-side dengan in-memory pagination saat status filter aktif):**
- `schedulePengiriman.js` (`GET /`) — terima param `?status=` (valid: `waiting`, `on_trip`, `overdue`, `completed`, `incomplete_finish`).
- Response mapping logic diekstrak ke helper `buildResponseRows(rows)` agar reusable oleh kedua path.
- **Tanpa `status`**: perilaku lama tidak berubah — SQL `LIMIT/OFFSET` pagination di level database.
- **Dengan `status`**: fetch SEMUA rows yang match date/search/spk_ids (tanpa `LIMIT`), hitung `schedule_status` per row via `resolveScheduleStatus`, filter in-memory, baru paginate hasil filter tersebut.
- `meta.status` selalu disertakan di response (null jika tidak difilter).
- `SchedulePengiriman.vue` — `filteredRows` computed disederhanakan menjadi `computed(() => rows.value)` (tidak filter lagi di client). `buildParams()` kini mengirim `status` ke API. Status dropdown mendapat `@change="applyFilter"` agar memilih status langsung memicu reload data dari page 1.

**Trade-off:** saat status filter aktif, backend fetch seluruh dataset tanpa limit — bisa lebih berat untuk dataset sangat besar, tapi memastikan akurasi penuh (tidak ada status yang "hilang" karena berada di luar halaman aktif).

### Sales Cost — Fitur "Selesaikan Semua" (Admin Only)

**Fitur:** Admin bisa menekan satu tombol di card Schedule Pengiriman untuk menyelesaikan seluruh timeline pengiriman suatu SPK sekaligus (semua stop yang belum `hit` di-check-in otomatis), tanpa perlu check-in satu-per-satu secara manual.

**Backend — `POST /api/sales-costs/:id/complete-all`:**
- Role guard: hanya `req.user.level === 'admin'` (403 untuk role lain).
- Fetch semua `sales_cost_step_schedule` untuk SPK terkait, filter stop yang **bukan departure** dan **belum ada di `sales_cost_route_history`**.
- Untuk tiap pending stop (urut `stop_order`): `arrived_at` = `estimated_arrival` jika di masa lalu, atau `now` jika `estimated_arrival` di masa depan (tidak boleh > sekarang, sesuai constraint check-in manual).
- Timestamp dijaga **monoton naik** — jika `arrived_at` hasil hitung ≤ stop sebelumnya, ditambah 1 menit, agar tidak melanggar validasi "arrived_at tidak boleh kurang dari stop sebelumnya".
- Stop Finish: menulis `system:finish_order` (idempotent, skip jika sudah ada) dan update `finish_order_datetime` (idempotent guard) — **dibungkus try/catch terpisah** dari INSERT stop utama, sehingga kegagalan di langkah finish (mis. `system:finish_order` sudah ada dari GPS trigger sebelumnya) tidak membuat stop tersebut ikut masuk daftar `errors` meski INSERT stop utamanya sudah berhasil.
- Response: `{ message, completed, errors? }` — jika sebagian stop gagal, `errors` berisi detail per stop yang gagal.

**Bug ditemukan & diperbaiki saat testing:** Awalnya INSERT `system:finish_order` berada di dalam try block yang sama dengan INSERT stop biasa — jika finish_order INSERT gagal (duplicate karena sudah pernah tercatat via GPS), exception tertangkap oleh catch yang sama dan **seluruh stop Finish dianggap gagal** meski INSERT utamanya sukses, menghasilkan pesan salah seperti "1 sukses, 1 gagal" padahal proses sebenarnya berhasil penuh. Diperbaiki dengan memisahkan try/catch untuk bagian finish-order (kegagalan di situ hanya di-log sebagai warning, tidak membatalkan status sukses stop).

**Frontend:**
- `salesCostService.js` — method baru `completeAll(id)` → `POST /api/sales-costs/:id/complete-all`.
- `SchedulePengiriman.vue`:
  - `isAdmin = computed(() => authUser.value?.level === 'admin')`
  - `completingIds = ref<Set<number>>(new Set())` — tracking loading state per card (mendukung multiple card diproses independen)
  - `hasPendingStops(row)` — true jika ada stop non-departure yang belum `hit` di `delivery_stops_summary`
  - `handleCompleteAll(row)` — call service, toast feedback, `loadData()` untuk refresh
  - Tombol **"Selesaikan Semua"** (hijau/success, dengan spinner saat loading) di card footer, sebelah kiri tombol "Detail" — `v-if="isAdmin && row.schedule_status !== 'completed' && hasPendingStops(row)"`, `@click.stop` agar tidak trigger expand/collapse card.

### Local Production Deployment — PM2 Autorun

**Problem:** Autorun PM2 yang ada (`autorun.bat` + `ecosystem.config.js`) hanya untuk development mode (backend `NODE_ENV=development` + Vite dev server terpisah di `:5173`). Dibutuhkan mode production untuk infra lokal yang serve frontend build sebagai static file dari backend Express (`:3000` saja, sesuai desain `server.js` yang sudah serve `dist/`).

**File baru:**
- `ecosystem.prod.config.js` — PM2 config khusus production, hanya 1 app (`transport-backend-prod`), `NODE_ENV=production`. Tidak ada proses Vite — frontend sudah di-compile ke static files.
- `autorun-prod.bat` — 3 langkah: (1) build frontend dengan `npm run build-only -- --mode local-prod`, (2) sinkronisasi DB via `node scripts/fix-missing-tables.js`, (3) `pm2 startOrRestart ecosystem.prod.config.js` + `pm2 save`.
- `tailadmin-vuejs-1.0.0/.env.local-prod` — env file baru khusus mode lokal, **tidak** men-set `VITE_API_URL` sehingga `api.js` fallback ke `window.location.origin` (bekerja untuk akses via `localhost:3000` ATAU IP LAN seperti `192.168.x.x:3000`).

**Root cause bug yang ditemukan:** `npm run build-only` default membaca `.env.production`, yang berisi `VITE_API_URL=https://sankyu-transport.fun` (untuk deploy Cloudflare Tunnel). Saat dipakai untuk build infra lokal, semua API call ter-hardcode ke domain Cloudflare — menyebabkan CORS error `blocked by CORS policy` saat akses via IP lokal (origin mismatch: browser di `192.168.x.x:3000` tapi fetch ke `sankyu-transport.fun`).

**Solusi:** Dua env file terpisah, tidak saling mempengaruhi:
| Mode | Build command | Env file dibaca | API URL hasil |
|---|---|---|---|
| Local infra | `npm run build-only -- --mode local-prod` | `.env.local-prod` | `window.location.origin` (dinamis) |
| Cloudflare deploy | `npm run build-only` (default) | `.env.production` | `https://sankyu-transport.fun` (statis) |

`.env.production` tidak disentuh — build untuk Cloudflare Tunnel tetap berjalan seperti sebelumnya, kompatibel dengan akses `sankyu-transport.fun` maupun jika suatu saat tunnel tersebut mem-forward ke backend lokal yang sama.

**Catatan:** `npm run build` (dengan `type-check` via `vue-tsc`) gagal dengan 133 TypeScript errors pre-existing (module declaration issues di banyak file `.js` service). `autorun-prod.bat` sengaja memakai `build-only` untuk skip type-check di deployment lokal — bukan untuk CI/CD publik, jadi trade-off ini diterima untuk saat ini.

### Database Deployment — Sync dari Production Dump

**Problem:** Skenario umum — drop database lokal, import dump database dari server production yang **belum punya perubahan skema** yang sudah dilakukan di repo ini (kolom rename, tabel baru, dll). Menjalankan `npm run migrate` langsung gagal karena dbmate mendeteksi tabel `schema_migrations` kosong/tidak ada dan mencoba re-run SEMUA migration dari awal — termasuk migration rename kolom yang sudah pernah dijalankan di lingkungan lain, menyebabkan `ER_BAD_FIELD_ERROR` (`Unknown column 'delivery_order'` dst.) atau `ER_NO_DEFAULT_FOR_FIELD`.

**Investigasi bertahap yang dilakukan:**
1. `npm run migrate:adopt-existing` (script lama) — menandai SEMUA migration pending sebagai "applied" tanpa verifikasi aktual, sehingga migration yang membuat tabel baru (`delivery_notifications`, `sales_cost_step_schedule`, `delivery_notification_read`) ditandai selesai padahal tabelnya belum pernah dibuat.
2. Ditemukan bug case-sensitivity: `information_schema.tables` di Windows MySQL mengembalikan kolom `TABLE_NAME` (uppercase), bukan `table_name` — `adopt-existing-migrations.js` sempat salah membaca ini sebagai `undefined` untuk semua row, membuat `matchesLatestTrackedSchema` selalu return `false`. **Fix:** case-insensitive lookup via `row.table_name ?? row.TABLE_NAME ?? Object.values(row)[0]`.
3. MySQL 8.4 `STRICT_TRANS_TABLES` mode memblokir `ALTER TABLE ... CHANGE COLUMN` pada `sales_cost` karena ada data ENUM tidak valid di kolom lain (`jenis_trip` dengan value `''` duplikat) — solusi: `SET SESSION sql_mode` tanpa `STRICT_TRANS_TABLES` sebelum ALTER.
4. `id_area_route_step` di `sales_cost_step_schedule` (kolom lama, sisa dari struktur sebelum restructure) tidak bisa di-`DROP COLUMN` karena terikat foreign key constraint — solusi: biarkan kolom itu ada tapi ubah jadi `NULL DEFAULT NULL` agar INSERT baru (yang tidak menyertakan kolom ini) tidak gagal dengan `ER_NO_DEFAULT_FOR_FIELD`.

**Solusi final — script baru `node_backend/scripts/fix-missing-tables.js`** (`npm run migrate:fix-missing`):
- Idempotent — aman dijalankan berkali-kali, setiap step di-`try/catch` dan `[SKIP]` jika sudah ada (`ER_TABLE_EXISTS_ERROR`, `ER_DUP_FIELDNAME`, `ER_DUP_KEYNAME`, atau pesan "Duplicate column/key").
- Set `sql_mode` tanpa strict mode di awal.
- Urutan operasi mengikuti urutan migration: rename `delivery_order/arrival_order/finish_order` → `departure_datetime/arrival_datetime/finish_order_datetime`; create `delivery_notifications`; create+restructure `sales_cost_step_schedule` (drop kolom lama, tambah kolom baru, buat `id_area_route_step` nullable); tambah `id_sc_stop`/`is_manual` ke `sales_cost_route_history`; tambah GPS cache columns ke `truck`; nullable wialon fields; create `delivery_notification_read`; extend `admin.password` ke `VARCHAR(255)`.
- Setiap step yang berhasil juga `INSERT IGNORE` versi migration terkait ke `schema_migrations` agar status konsisten dengan `npm run migrate:status`.

**Flow deploy DB yang benar (dicatat untuk referensi ke depan):**
```bash
cd node_backend
npm run migrate:fix-missing   # idempotent, aman dijalankan berkali-kali
npm run migrate:status        # verifikasi Applied: 22, Pending: 0
```

**Catatan penting:** `npm run migrate:adopt-existing` (script lama) TIDAK disarankan lagi untuk skenario "import dump production lama" karena menandai migration sebagai selesai tanpa verifikasi efek aktual di DB. `migrate:fix-missing` adalah pendekatan yang lebih aman — tiap operasi dicoba secara langsung dan hanya di-skip jika benar-benar sudah ada.

---

## Updates (2026-07-21 — Bug Fixes, HIGH/MEDIUM Audit Fixes, Confirm Dialog)

### Notifikasi Pengiriman — Auto-delete >30 Hari

- `geofenceTrackingService.js` — fungsi baru `purgeOldDeliveryNotifications()` dijalankan di dalam `runSyncCycle()` (throttle 1x per jam via `lastPurgeAt`).
- Hard-delete `delivery_notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`.
- Sekaligus cleanup orphan rows di `delivery_notification_read` yang referensinya sudah dihapus.
- Error di langkah purge hanya di-log sebagai warning — tidak menghentikan sync cycle utama.

### Schedule Pengiriman — Konfirmasi "Selesaikan Semua"

- `SchedulePengiriman.vue` — tombol "Selesaikan Semua" kini membuka modal konfirmasi sebelum eksekusi.
- State baru: `confirmCompleteRow = ref<any>(null)` — menyimpan row yang menunggu konfirmasi.
- Klik tombol → set `confirmCompleteRow = row` (bukan langsung eksekusi).
- Modal `<Teleport to="body">` dengan info SPK (No. SPK, Truk, Driver, Rute), warning banner kuning, tombol Batal dan "Ya, Selesaikan Semua".
- Klik "Ya" → `handleCompleteAll(confirmCompleteRow)` + reset `confirmCompleteRow = null`.
- Memakai `fade-export` transition yang sudah ada.

### Audit Bug Fixes — HIGH (7 issues)

Semua HIGH bugs dari `docs/superpowers/plans/audit-bug-report.md` diselesaikan:

- **H2** — `repairService.js:createRepair` — MySQL `SELECT ... FOR UPDATE` + `BEGIN/COMMIT` untuk cegah race condition dua request assign truk yang sama ke repair/sales cost bersamaan.
- **H5** — `monitoringKendaraan.js` — window on_trip dikurangi dari `INTERVAL 60 DAY` ke `INTERVAL 14 DAY` (C5 sudah stable).
- **H7** — `monitoringKendaraan.js` — tambah `meta.has_more` per kategori (`on_trip`, `transaksi`, `repair`, `idle`) agar frontend tahu data lebih banyak dari yang ditampilkan.
- **H8** — `geofenceTrackingService.js:stopGeofenceTracking` — diubah menjadi async, polling `syncInProgress` sampai false atau timeout 5s sebelum return.
- **H9** — `geofenceTrackingService.js:getActiveSalesCostCandidates` — hapus dedup `pickedByTruck`, semua SPK aktif per truk kini di-track (bukan hanya yang paling baru). Fix salah trigger finish untuk truk multi-pengiriman aktif.
- **H10** — `wialonService.js:wialonRequest` — re-login hanya untuk error code 1/401/403 (session-related); kode lain di-log dan re-throw tanpa login storm.
- **H11** — `geofenceTrackingService.js` — tandai RESOLVED: tracking sudah konsisten pakai `id_sc_stop` sejak refactor Juli 2026.

### Audit Bug Fixes — MEDIUM (6 issues)

- **M1** — `salesCost.js` — delivery_stops upsert (PUT handler) dibungkus dalam `db.getConnection()` + `BEGIN/COMMIT` transaction agar partial failure tidak korup stops.
- **M4** — `salesCost.js` — tambah helper `escapeLikeParam(value)` yang escape `%`, `_`, `\` dari input user sebelum dipakai di `LIKE` clause (dua lokasi search handler).
- **M5** — `salesCost.js:PUT /:id/dn` — tambah guard: verifikasi sales cost exists + month-lock check sebelum overwrite DN list.
- **M6** — `repairService.js:normalizeDateOnly` — ganti `new Date(string)` ke manual parse `YYYY-MM-DD` via regex untuk hindari UTC midnight timezone shift WIB (off-by-one-day bug).
- **M7** — `rbac.js` — ganti `path.startsWith(route.path)` ke `path === route.path || path.startsWith(route.path + '/')` di kedua checker (CS dan Patcher) untuk cegah prefix bypass.
- **M11** — `geofenceTrackingService.js:toMySqlDateTime` — tambah guard `if (value === null || value === undefined) return null` di baris pertama. Sebelumnya `new Date(null)` = epoch `1970-01-01`, bukan null.

### Audit Bug Fixes — MEDIUM yang di-Resolve (bukan bug aktif)

- **M2** — `isValidIsoDateTime()` sudah ada dan dipakai di POST/PUT handler — resolved.
- **M9** — `.filter(k => k !== ':')` sudah mitigasi key collision NULL+NULL — resolved.
- **M10** — Fixed by C6 fix (finish_geofence_* di-pass dari area table) — resolved.

### Important Usage Rules (tambahan)

#### Delivery Stop Upsert (Sales Cost PUT)
- Smart upsert sekarang dibungkus transaction — kegagalan di tengah loop rollback semua perubahan stops agar tidak partial.
- `escapeLikeParam()` wajib dipakai untuk semua input user yang masuk ke `LIKE` clause.

#### RBAC Path Matching
- Gunakan `path === route.path || path.startsWith(route.path + '/')` — **bukan** bare `startsWith(route.path)` — untuk whitelist RBAC. Pola lama bisa di-bypass dengan path yang diawali nama route yang sama.

---

## Updates (2026-07-23 / 2026-07-24 / 2026-07-25 — Delivery Timeline Overhaul)

Major session work on Schedule Pengiriman / Monitoring / geofence tracking. Plans live under `.opencode/plans/` (e.g. sequential zones, loose finish, manual ETA, audit C1/H1–H4, false-finish same-zone, multi-SPK M2 audit, early leave #44394, age/distance auto-finish).

### GPS polygon & sequential stops
- `fetchZonePolygons`: Wialon flags **28 → 0 → 8** (flags:4 alone returns bounds without points — root cause of empty polygons / zero hits).
- Live polygon map: correctly reads `Map<zoneId, {name, points}>` (not bare points array).
- `msg.t` treated as **Unix seconds** (not ms).
- `assignStopHits` + `seedConsumptionFromHistory`: repeated zones get distinct timestamps; history seeded each cycle.
- Stop order **loose** (Opsi B): field visit order need not match `stop_order`.
- Message window: planned departure **−12h** buffer so early GPS still counts.
- Backfill uses the **same** assigner (no more first-hit-only reuse).

### Finish GPS — loose + same-zone min-away (anti #44390 / early leave #44394)
- Default: finish **without** requiring all middle stops (`GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH=0`).
- Schedule: `completed` when `system:finish_order` exists; skipped middles → **Geofence dilewati**.
- **Hard gate:** `now >= planned departure` before finish may be recorded.
- **Same-zone finish** (Departure zone = Finish zone, typical Sankyu): require either:
  - meaningful leave within lookback before planned dep: **≥20 min** outside and/or **≥1 km** from base centroid, **or**
  - ≥1 middle stop GPS-hit in that lookback window  
  then re-entry = finish (re-entry may be **before** planned dep). Blocks ignition/idle false finish (#44390); allows early trip+return (#44394).
- Env: `GEOFENCE_FINISH_MIN_AWAY_SEC` (default 1200), `GEOFENCE_FINISH_MIN_AWAY_M` (default 1000), `GEOFENCE_FINISH_LEAVE_LOOKBACK_SEC` (default **14400** = 4h).
- **Departure hit pre-window guard (fix #44442):** Departure stop entries earlier than `depTs − GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC` (default **8h = 28800 s**) are rejected in `assignStopHits`. Prevents re-entry from a prior trip being assigned as Departure, which would satisfy the same-zone leave-evidence and trigger false finish. Env: `GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC`.
- **Same-zone inter-stop gap guard (fix #44415):** For shuttle routes where the same zone appears multiple times (e.g. Tujuan 1, 3, 5 all KIIC zone), a second assignment to the same zone is rejected unless `entryTs − lastHitTs ≥ GEOFENCE_SAME_ZONE_MIN_INTER_STOP_GAP_SEC` (default **10 min = 600 s**). Prevents rapid re-assignment within the same tracking cycle when `inZoneMap` resets. Env: `GEOFENCE_SAME_ZONE_MIN_INTER_STOP_GAP_SEC`.
- **Departure-as-Finish collision guard (fix #44449):** In `resolveFinishGpsHit`, `minFinishTs` is raised to ≥ the timestamp of the latest Departure hit in `historyRows`. Prevents the same zone entry (e.g. Sankyu re-entry at 06:02) from being used simultaneously as Departure hit and Finish entry in the same tracking cycle. Implemented via `depHitTs` reduction over `historyRows` with `is_departure=1` stops.
- **Live position stale cache guard (fix #44450):** In the live fallback path of `resolveFinishGpsHit`, `liveTs` (from `position.gps_time`) must also be `>= depTs`. Prevents a stale GPS position cache timestamp earlier than planned departure from being recorded as finish entryTs even when `nowTs` has already passed `depTs`.
- Helpers: `analyzeBaseExit`, `resolveFinishGpsHit` (exported for tests in `scripts/test-geofence-assign.js`).

### Manual mode / no-GPS auto-finish by ETA
- Column `sales_cost.is_manual_mode` (migration `20260723000012`; also in `fix-missing-tables.js`).
- Form `SalesCostForm.vue` sends `is_manual_mode` on create/update.
- `applyDueManualEtaHits()` in each tracking cycle: auto-hit due stops; finish ETA due → `system:finish_order` (`is_manual=1`, `gps_time` = ETA).
- Eligible: `is_manual_mode=1` **or** empty `wialon_unit_id` only (not “GPS truck with empty zones”).

### Age / distance auto-finish (all active SPKs) — 2026-07-25
- After GPS + manual ETA each cycle: `applyDueDistanceAgeFinish()` in `runSyncCycle`.
- Timer: `departure_datetime + N days` where N from trip distance (max haversine centroid Departure → middle/finish zones).
- Bracket: **≤60 km → 3 days**, **≤100 km → 7 days**, **>100 km → 10 days**; no polygon distance → **fallback 3 days**.
- Scan window: unfinished SPKs with dep in last **60 days** and at least **min bracket days** old (SQL prefilter).
- Inserts `system:finish_order` (`is_manual=1`, snapshot name `Auto Finish (Jarak/Umur)`); middle stops stay **Geofence dilewati** if never hit.
- Env: `GEOFENCE_AGE_FINISH_*` (km/days/lookback); `GEOFENCE_AGE_FINISH_DRY_RUN=1` logs only (no INSERT).
- Helpers: `computeTripDistanceKm`, `resolveAgeFinishDays`, `isDueForAgeFinish` (exported; covered in `test-geofence-assign.js`).

### Critical / High audit fixes (C1, H1–H4)
- **C1:** map `departure_datetime` onto GPS candidates; skip invalid departure.
- **H2:** GPS candidates limited to last **30 days**.
- **H4:** manual ETA eligibility tightened (see above).
- **H1:** Schedule/Monitoring overdue prefer finish-stop ETA; active transaksi uses **no** `system:finish_order` (not `finish_order_datetime IS NULL`); transaksi list requires **exists** step_schedule (fixes empty-timeline SPKs #44335/#44336 showing as Transaksi after H1).

### Monitoring / Schedule UI labels
- Badge **Geofence dilewati** for middle stops after finish without GPS hit (Schedule + Detail SC + Excel export).
- Finish longgar product: skip tujuan + return base can complete SPK when min-away (or middle hit) satisfied.

### Multi-SPK same truck (M2) — audited, not fully product-fixed
- Tracking still finishes **each** active SPK independently with loose finish → shared Sankyu re-entry can close multiple SPKs (documented in `.opencode/plans/audit-m2-multi-spk-finish.md`).
- Recommended future policy **D**: multi-active → require all middle hits before auto-finish; single-active keep loose. **Not implemented yet.**

### Case notes (ops reference)
- **#44363** Daikin: empty polygons (flags) + early visit window — fixed by polygon flags + buffer.
- **#44368** Finish Sankyu: membership-only finish + null area finish cols — fixed by timeline finish + scss/Sankyu fallback.
- **#44361** stuck GPS unit: no trip trail in Wialon — data issue, not app finish logic.
- **#44360** skip Jotun, return Sankyu: loose finish + insert verified.
- **#44390** false finish at base on ignition: same-zone min-away guard (this section).
- **#44394** early leave/return before planned dep (B 9979 SYM): leave lookback so re-entry ~minutes before dep still finishes after `now >= dep`; no LAFI polygon hit → Tujuan **Geofence dilewati**.

### Deploy / DB notes (unchanged path)
- Local prod frontend: `vite --mode local-prod` (no forced `VITE_API_URL`).
- After production dump import: prefer `npm run migrate:fix-missing` over bare adopt-existing.
- WIB = UTC+7 for backfill windows when diagnosing Wialon times.

### Tests
- `node_backend/scripts/test-geofence-assign.js` — sequential zones, loose finish, same-zone min-away / #44390-like cases, early leave/return #44394, age-finish bracket/distance/due helpers.
- Run: `cd node_backend && node scripts/test-geofence-assign.js`

### Schedule export duration columns (2026-07-25)
- Excel **19 columns**: merge **1–11** includes **Jumlah Hari (Aktual)** (`X hari Y jam Z mnt` from actual dep→finish).
- Per-stop **Selisih Waktu (Est vs Aktual)**: human-readable signed duration (`1 jam 56 mnt` / `-…` / `tepat`); positive = late vs estimate.
- Helpers: `formatDurationId`, `formatSignedDurationId`, `formatDiffMinutes` in `schedulePengiriman.js`.

### Sales Cost — GPS trail playback (Phase 1 + 2A + 2B, 2026-07-25)
- `GET /api/sales-costs/:id/gps-trail` (auth): window from `departure − GPS_TRAIL_PRE_BUFFER_SEC` (default 2h, also earliest history) to finish hit or NOW.
- Reuses `fetchRawMessagesForUnit` + `downsampleTrailPoints` (default max **800** points, env `GPS_TRAIL_MAX_POINTS`).
- Soft empty reasons: `no_wialon_unit`, `wialon_empty`, `wialon_error`, etc. (HTTP 200).
- Markers from `sales_cost_route_history` rows with lat/lon (hit aktual).
- **`planned_stops`**: centroid + **`polygon: [[lat,lon],…]`** (simplified, env `GPS_TRAIL_POLYGON_MAX_POINTS` default **80**) per `sales_cost_step_schedule` via `fetchZonePolygons`; still returned when trail empty.
- Geometry helpers: `node_backend/services/gpsTrailGeometry.js`.
- UI Detail **Rute GPS Aktual**: trail, pin D/1/2/3/F, **polygon fill**, hit hijau, expand map, **layer chips** (Trail / Tujuan / Polygon / Hit).
- **Phase 2B scrubber:** Play/Pause, speed 1×/2×/4×, range by point index, truck marker + progress polyline; no auto-pan; FE-only (no API change).
- Out of scope still: print map SPK, multi-SPK M2 policy.
- Tests: `scripts/test-gps-trail-downsample.js`, `scripts/test-gps-trail-polygon.js`.

### Sales Cost — Backfill Geofence Diubah (2026-07-27)
- **`POST /api/sales-costs/:id/backfill-stop`** (auth): GPS-based retroactive hit recording for a single middle stop whose `wialon_zone_id` was changed mid-trip.
  - Body: `{ id_sc_stop: number }` for GPS-based; `{ id_sc_stop, manual: true, manual_gps_time: "YYYY-MM-DD HH:MM:SS" }` for manual override.
  - GPS window: `depTs − 12h` to `finishTs || now`. Uses `buildZoneEntryTimeline` + `assignStopHits` with all guards.
  - Idempotent: returns `{ skipped: true, reason: "already_hit" }` if stop already has `route_history`.
  - Manual: `is_manual=1`, no GPS coordinates.
  - Returns `{ found: true, gps_time }` or `{ found: false, warning: "..." }`.
- **PUT `/:id` response** now includes `geofence_changed_stops[]` when a middle stop's `wialon_zone_id` changed during update.
- **FE: `EditSalesCost.vue`** shows a post-save dialog when geofence changed stops are detected. States: idle → GPS fetch → found/not_found → manual override. Navigates away only after all changed stops are processed or skipped.
- **FE: `DetailSalesCost.vue`** shows "Cari Hit GPS" button for unhit middle stops. On success, reloads detail.
- **`salesCostService.backfillStop(id, stopId, options?)`** added.
- Only middle stops eligible (not `is_departure`, not `is_finish`). Finish (`system:finish_order`) is never touched by backfill.

### Subcontractor — Jadwal manual, CS, export, print (2026-07-25)

#### Schema & API
- Table `sub_contractor_step_schedule` (migration `20260725000013` / `fix-missing-tables`): multi-stop planned times **without** Wialon/geofence.
- `GET/POST/PUT` handle `delivery_stops`; replace-all stops on PUT when array provided.
- `sub_contractor.nik_admin` = creator **`id_admin`** (numeric). POST sets from JWT `id_admin`; PUT **does not** overwrite creator.
- Detail GET: `LEFT JOIN admin` → `created_by_name`, `created_by_nik`.
- DELETE remains `requireAdmin`.

#### Form (`SubcontractorForm.vue`)
- Always **manual** timeline (Departure / Tujuan / Finish): `stop_name` + datetime; no geofence / GPS toggle.
- Header `delivery_date` / `arrival_date` (DATE) synced from stops; `tujuan_pengiriman` auto-filled from **Finish stop name** (fallback join middle names).
- Field **Tujuan Pengiriman** removed from UI (covered by jadwal).
- Optional free-text: No. Polisi, Jenis Kendaraan, Tonase, Driver, No. Surat Jalan (not required).
- Layout: 4 TailAdmin section cards — **Mitra & Pesanan**, **Kendaraan & Dokumen**, **Jadwal Pengiriman**, **Biaya & Tagihan**.

#### CS privilege
- Nav: Transaksi → Subcontractor; routes `allowCS: true` (list/new/edit/detail/**print**).
- RBAC `isAllowedForCs`: GET/POST/PUT `/subcontractor` + GET `/warehouses`, `/customers`, `/subconts` (no DELETE, no export unless later whitelisted).

#### Excel export (`GET /export`)
- One row per transaction.
- After Arrival Date: **Departure (Nama/Waktu)**, **Tujuan 1…N (Nama/Waktu)** (N = max middle stops in export batch), **Finish (Nama/Waktu)**.
- Removed combined “Jadwal Pengiriman” string / Est. Departure-only columns.

#### Print A4 Portrait
- Route `/subcontractor/:id/print` → `PrintSubcontractor.vue`.
- Title **Laporan Subcontractor**; operational summary + schedule table; **no** Cost/Sales/GP.
- Entry: Detail **Print** button + list row action **Print**.
- `@page { size: A4 portrait }`; flow layout (not absolute SPK clone).

#### Detail page
- **Dibuat Oleh**: `created_by_name (created_by_nik)`; `-` if `nik_admin` 0 / missing admin.
- Optional list of planned stops when `delivery_stops` present.

---

## Updates (2026-07-28 — GPS Finish Guards, Template Jadwal, UI/UX, VitePress Docs)

### Geofence Finish — Additional False-Finish Guards

Three new guards added to `resolveFinishGpsHit` and `assignStopHits` to close remaining false-finish cases:

#### Fix #44449 — Departure-as-Finish Collision Guard (same-cycle timestamp)
- **Root cause:** SPK #44449 (B 9782 SYM): Departure hit at 06:02 and `system:finish_order` at 06:02 — identical timestamp. Same zone entry (Sankyu) used as both Departure hit and Finish in the same tracking cycle.
- **Fix:** In `resolveFinishGpsHit`, `minFinishTs` is raised to ≥ the timestamp of the latest Departure hit in `historyRows`. Implemented via `depHitTs` reduction over `historyRows` filtering `is_departure=1` stops.
- **Location:** `geofenceTrackingService.js:~L543`

#### Fix #44450 — Live Position Stale Cache Guard
- **Root cause:** SPK #44450 (B 9567 FXS): `position.gps_time = 07:54` (stale GPS cache from before planned departure 08:00). `nowTs > depTs` already passed the hard gate, but `liveTs < depTs` → finish recorded before departure.
- **Fix:** In the live fallback path of `resolveFinishGpsHit`, `liveTs` (from `position.gps_time`) must also be `>= depTs`. Guards against stale position cache even when `nowTs` has passed `depTs`.
- **Location:** `geofenceTrackingService.js:~L613`

#### Unit tests (33 test cases total)
- `test-geofence-assign.js` — 4 new cases for #44449 and #44450 scenarios + genuine-finish-accepted cases.
- Run: `cd node_backend && node scripts/test-geofence-assign.js`

---

### Sales Cost — Template Jadwal Pengiriman

New feature: reusable delivery schedule templates to speed up SPK creation for recurring routes.

#### Database (migration `20260728000014_create_delivery_template.sql`)
- `delivery_template` — id, template_name, description, is_active, created_at, updated_at
- `delivery_template_stop` — id, id_delivery_template, stop_order, stop_name, wialon_resource_id, wialon_zone_id, wialon_zone_name, is_departure, is_finish, `time_hhmm` (VARCHAR(5), stores "HH:MM" fixed time)
- FK: `delivery_template_stop.id_delivery_template → delivery_template.id` ON DELETE CASCADE
- Also added to `scripts/fix-missing-tables.js` (idempotent, marks version `20260728000014`)

#### Backend API (`routes/deliveryTemplate.js`)
- `GET /api/delivery-templates` — list active templates with stops (auth: all roles)
- `GET /api/delivery-templates/:id` — single template detail (auth: all roles)
- `POST /api/delivery-templates` — create template + stops in transaction (admin only)
- `PUT /api/delivery-templates/:id` — update (delete + reinsert stops) in transaction (admin only)
- `DELETE /api/delivery-templates/:id` — soft delete `is_active=0` (admin only)
- Registered in `server.js` at `/api/delivery-templates`
- RBAC: CS can read (`GET /delivery-templates` added to `isAllowedForCs` whitelist)

#### Backend API — Area route-steps endpoint enhanced
- `GET /api/areas/:id/route-steps` — upgraded: now requires `authenticateToken`, returns `{ id_area, nama_area, stops[] }` in delivery-stop shape (was plain steps array). `time_hhmm: null` since area route steps have no fixed time.

#### Frontend
- `services/deliveryTemplateService.ts` — typed service: fetchTemplates, fetchTemplate, createTemplate, updateTemplate, deleteTemplate
- `salesCostService.backfillStop(id, stopId, options?)` — added (POST to `/backfill-stop`)
- `salesCostService.fetchAreaRouteSteps(areaId)` — added (GET `/areas/:id/route-steps`)
- `SalesCostForm.vue` — two new features:
  - **Auto-populate on area change**: when area is selected in create mode and stops are still default, fetches route-steps and populates `deliveryStops` with geofence data. Guard: only if `isStopsDefault()`, only in create mode, `areaAutoPopulating` flag prevents loop.
  - **"Pakai Template" button** + modal: select template from dropdown + pick base date → populate stops with `${baseDate} ${time_hhmm}:00` per stop. Uses `DatePickerInput` (date-only, `:enable-time="false"`) for base date picker.
- `views/Master/DeliveryTemplateMaster.vue` — admin CRUD page for templates:
  - Standard data table (matches TruckMaster/AreaMaster): SearchBar, SortableTableHeader, Pagination, rows-per-page, total count; `filterItemsByQuery` + `useSortableItems` + `useListQuery` for client-side search/sort/paginate
  - Create/Edit modal: `max-w-3xl`, structured header/body/footer with border separators, 2-col grid for name+description, horizontal 3-col stop rows (Badge · Nama · Geofence · Jam · Delete), `max-height: 400px` scroll for stops list, redundant picker feedback text removed
  - Uses `SearchableSelect` (identical to SalesCostForm geofence picker) + `DatePickerInput` (`:enable-time="true"`, time-only via dummy date `2000-01-01`) for each stop
  - Route: `/master/delivery-templates` (added to router + navigation.js under Master group)
- VitePress `config.mts` — `srcExclude: ['PROJECT_CONTEXT.md']` added to prevent build error from this file being processed as a page

#### Mode Manual override behavior fix
- **Bug:** When a template was applied (stops had `wialon_zone_id`), toggling Mode Manual only changed the boolean — geofence data remained silently on stops, blocking manual mode UX.
- **Fix:** `toggleManualMode()` added to `SalesCostForm.vue`. When switching **to manual mode**, clears `wialon_resource_id`, `wialon_zone_id`, `wialon_zone_name` from all stops. `@click` on Mode Manual button now calls `toggleManualMode()` instead of inline toggle.
- **Location:** `SalesCostForm.vue:~L1165`

---

### VitePress Documentation Update (2026-07-28)

New pages added to `docs/` (deployed to GitHub Pages):
- `docs/developer/gps-trail.md` — GPS Trail Playback (Phase 1, 2A, 2B), endpoint, planned_stops polygon, env vars
- `docs/developer/geofence-guards.md` — All false-finish guards (#44442, #44415, #44449, #44450), env vars, unit tests
- `docs/developer/backfill-geofence.md` — Backfill feature endpoint, GPS/manual flow, PUT response change, UI

Updated existing docs:
- `docs/developer/api-reference.md` — GPS trail endpoint, backfill-stop endpoint, PUT geofence_changed_stops
- `docs/developer/architecture.md` — `gpsTrailGeometry.js` service, GPS trail + geofence env vars table
- `docs/changelog/changelog.md` — Full Juli 2026 changelog (GPS trail phases, geofence guards, backfill, template jadwal, double-alamat fix, subcontractor)
- `docs/guide/user-guide.md` — Panduan Rute GPS Aktual, backfill geofence, Subcontractor section
- `openwiki/workflows/key-workflows.md` — Geofence guards section + GPS trail playback + backfill workflow
- `openwiki/operations/runbook.md` — 17 new env vars (GPS trail + geofence guards + auto-finish)
- `openwiki/quickstart.md` — Optional GPS trail + geofence guard env vars noted
- `docs/.vitepress/config.mts` — Added "GPS & Tracking" sidebar section (3 pages), `srcExclude: ['PROJECT_CONTEXT.md']`

---

### Lokasi Truk — Double Alamat Fix (2026-07-28)
- **Bug:** Panel "Lokasi" di halaman Peta Lokasi Truk menampilkan alamat dua kali — satu dari `selectedTruckLocationValue` (computed yang sudah include address) dan satu dari `v-else-if="selectedTruckAddress"`.
- **Fix:** `TruckLocationMap.vue` template — consolidated to single rendering path: loading → skeleton, error → coords, else → `selectedTruckLocationValue`. Removed the redundant `v-else-if="selectedTruckAddress"` block.

