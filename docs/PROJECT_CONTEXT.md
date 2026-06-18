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
- The backend now tracks geofence history for active Sales Cost deliveries:
  - first entry only per planned step
  - supports out-of-order arrival
  - keeps planned route and actual route history separate
- A default final system step named `Finish Order` is recorded when:
  - all planned route steps have been visited, and
  - the truck later enters the configured finish geofence on the related `area`
- `Finish Order` geofence is now configured per Master Area via:
  - `area.finish_geofence_resource_id`
  - `area.finish_geofence_zone_id`
  - `area.finish_geofence_zone_name`
- Legacy fallback to default company geofence `Sankyu` still exists for older areas that do not have finish geofence configured yet.
- Sales Cost detail now includes a `Riwayat Geofence Pengiriman` section that shows:
  - planned steps
  - visited steps with timestamps
  - pending steps
  - light badge for out-of-order visits

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

### Geofence Tracking Flow

1. Backend loads active Sales Cost candidates for trucks that already have `wialon_unit_id`.
2. Backend loads route-step to geofence mappings from `area_route_step`.
3. Backend polls Wialon zone membership on an interval.
4. If the truck is currently inside a mapped geofence and that step has not been recorded yet, backend inserts one history row into `sales_cost_route_history`.
5. After all planned steps are completed, backend also watches the finish geofence configured on the area to record the system step `Finish Order`.
6. Re-entry to the same step is ignored in phase 1 to avoid noisy duplicate history rows.

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
  - polls Wialon geofence membership for active deliveries
  - writes first-entry route history
  - records system `Finish Order` step using default company geofence
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
