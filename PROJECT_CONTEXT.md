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
- Transaction and monitoring views.
- Import/export flows for master data.
- Authentication and role-based access control.

### Truck GPS and Map Tracking

- Truck master now supports `wialon_unit_id`.
- Wialon data is fetched server-side only.
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

## Wialon Integration

### Purpose

Wialon is used as the GPS source for truck locations. The hardware/vendor side is assumed to already handle device telemetry.

### Backend Flow

1. Backend logs in to Wialon using the token stored in `node_backend/.env`.
2. Backend fetches the latest mapped unit snapshot from Wialon and reads position data from `core/search_items` output.
3. Backend enriches GPS data with operational context from existing app tables:
   - active transaction
   - active repair
   - last transaction
   - driver name
4. Backend normalizes the response into a truck-friendly combined payload.
5. Frontend requests only the normalized backend endpoint for map/list/detail data.
6. When a user selects a truck, frontend can request reverse geocoding for the selected coordinate only.
7. Reverse geocode results are cached on the server and also persisted in browser `localStorage` so repeated clicks after refresh do not always hit Geoapify again.

### Important Backend Files

- `node_backend/services/wialonService.js`
  - token login
  - session reuse and retry
  - location normalization from Wialon snapshot data
  - auto mapping helper
  - operational data enrichment for map payload
  - Geoapify reverse geocoding with in-memory cache
- `node_backend/routes/wialon.js`
  - protected API routes for truck location, reverse geocoding, and auto mapping
- `tailadmin-vuejs-1.0.0/src/views/Monitoring/TruckLocationMap.vue`
  - 3-panel operational workspace UI
  - Leaflet marker sync and focus behavior
  - selected truck inspector
  - fleet search/filter/list behavior
  - inline SVG truck marker icon
- `tailadmin-vuejs-1.0.0/src/services/truckLocationService.ts`
  - frontend API wrapper for truck locations and reverse geocoding

### Important Routes

- `GET /api/wialon/trucks/location`
  - returns truck locations and summary info
  - each truck now includes combined GPS + operational fields:
    - `driver_name`
    - `operational_status`
    - `transaksi`
    - `repair`
    - `last_transaction`
- `GET /api/wialon/reverse-geocode?lat=...&lon=...`
  - returns reverse geocoding result for one selected truck coordinate
  - uses Geoapify and backend cache
  - frontend also keeps a localStorage cache keyed by coordinate
- `POST /api/wialon/trucks/auto-map`
  - tries to fill `wialon_unit_id` for trucks that are still empty

## Database Notes

### Truck Table

The `truck` table now includes:

- `wialon_unit_id VARCHAR(64) NULL`

This field is used as the primary mapping between local truck records and Wialon units.

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
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
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
- Browser `localStorage` can be cleared if you want to force Geoapify to resolve the same coordinates again.
- Wialon status derivation was corrected to use searchable snapshot data; if every truck suddenly appears offline again, restart the backend and check that the Wialon token still logs in successfully.

## Suggested Next Improvements

- Add a preview step before auto mapping updates the database.
- Add an overwrite mode for remapping existing truck rows.
- Add cluster summaries by status percentage.
- Add a small legend panel for moving / idle / offline / unlinked statuses.
- Consider adding an explicit loading skeleton for address lookup in the detail panel.
- Consider adding cache TTL / invalidation rules for browser and server-side reverse geocode caches if map coordinates change very frequently.
