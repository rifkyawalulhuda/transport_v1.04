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

## Wialon Integration

### Purpose

Wialon is used as the GPS source for truck locations. The hardware/vendor side is assumed to already handle device telemetry.

### Backend Flow

1. Backend logs in to Wialon using the token stored in `node_backend/.env`.
2. Backend fetches last known positions for mapped units.
3. Backend normalizes the response into truck-friendly data.
4. Frontend requests only the normalized backend endpoint.

### Important Backend Files

- `node_backend/services/wialonService.js`
  - token login
  - session reuse and retry
  - location normalization
  - auto mapping helper
- `node_backend/routes/wialon.js`
  - protected API routes for truck location and auto mapping

### Important Routes

- `GET /api/wialon/trucks/location`
  - returns truck locations and summary info
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

## Suggested Next Improvements

- Add a preview step before auto mapping updates the database.
- Add an overwrite mode for remapping existing truck rows.
- Add cluster summaries by status percentage.
- Add a small legend panel for moving / idle / offline / unlinked statuses.
