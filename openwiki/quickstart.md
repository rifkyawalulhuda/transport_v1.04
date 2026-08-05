---
type: Quickstart
title: transport_v1.04 — Quickstart
description: Entry point for the transport_v1.04 TMS codebase. Covers what the system does, how to run it locally, repo layout, and links to all major documentation sections.
tags: [quickstart, transport, tms, express, vue3]
---

# transport_v1.04 — Quickstart

`transport_v1.04` is a **Transport Management System (TMS)** built for an Indonesian trucking company. It manages fleet master data, delivery scheduling, sales cost / SPK documents, truck GPS tracking via Wialon, safety observations (BBS), and operational monitoring — all in one integrated web app.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, MySQL (`mysql2`), MongoDB (`mongoose`), JWT auth |
| Frontend | Vue 3, TypeScript, Vue Router, Tailwind-based admin UI |
| GPS / Maps | Wialon API (server-side), Leaflet + OpenStreetMap, `leaflet.markercluster` |
| File I/O | `xlsx`, `exceljs` (import/export), `multer` (uploads) |
| Schema mgmt | `dbmate` (SQL migrations) + `schemaSyncService` (startup safety net) |

## Running Locally

### 1. Configure the backend

```bash
cd node_backend
cp .env.example .env
# Fill in DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET,
# WIALON_TOKEN, GEOAPIFY_API_KEY, and MONGO_URI (not in .env.example — add it manually)
# Optional GPS trail vars: GPS_TRAIL_PRE_BUFFER_SEC, GPS_TRAIL_MAX_POINTS, GPS_TRAIL_POLYGON_MAX_POINTS
# Optional geofence guards: GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC, GEOFENCE_SAME_ZONE_MIN_INTER_STOP_GAP_SEC
```

Key env vars — see [Operations Runbook](./operations/runbook.md) for the full table.

### 2. Run migrations

```bash
# Requires dbmate installed: https://github.com/amacneil/dbmate
cd node_backend
dbmate up
```

### 3. Start the backend

```bash
cd node_backend
npm install
node server.js
# Listens on HOST:PORT (default 0.0.0.0:3000)
```

On startup the server:
1. Connects to MongoDB (logs warning if `MONGO_URI` is unset)
2. Runs `ensureTrackingSchema()` — ALTER TABLE safety net for GPS columns
3. Calls `detectAndRunStartupBackfill()` then `startGeofenceTracking()` for background GPS polling

### 4. Start the frontend (dev mode)

```bash
cd tailadmin-vuejs-1.0.0
npm install
npm run dev
# Vite dev server, proxies /api to localhost:3000
```

In production the backend serves the built frontend from `tailadmin-vuejs-1.0.0/dist/` as a static SPA at the catch-all `GET *` route.

## Repository Layout

```
transport_v1.04/
├── node_backend/
│   ├── server.js              # Express bootstrap, route registration, startup sequence
│   ├── db.js                  # MySQL connection pool
│   ├── db/migrations/         # 24+ dbmate SQL migrations (schema history)
│   ├── routes/                # 23 route files — one per domain (see Architecture)
│   ├── services/              # Business logic & external integrations
│   ├── middleware/            # auth.js (JWT), rbac.js (role whitelist)
│   ├── models/                # Mongoose models (MongoDB)
│   ├── upload/                # Multer file upload destination
│   └── .env.example           # Non-secret env var template
├── tailadmin-vuejs-1.0.0/
│   ├── src/
│   │   ├── main.ts            # Vue app bootstrap
│   │   ├── router/index.ts    # All frontend routes
│   │   ├── config/navigation.js  # Sidebar nav config
│   │   ├── views/             # Page-level Vue components (grouped by domain)
│   │   ├── components/        # Shared UI components
│   │   └── services/          # Frontend API wrappers (axios)
│   └── dist/                  # Production build (served by Express)
└── docs/
    └── PROJECT_CONTEXT.md     # Authoritative feature & design notes
```

## Roles

Three JWT-encoded user levels exist (`level` claim):

| Role | Access |
|---|---|
| `admin` | Full access to all routes |
| `cs` | Read-only: schedule pengiriman + own profile |
| `patcher` | BBS CRUD + truck/driver read + own profile |

RBAC is enforced by `restrictCsAccess` and `restrictPatcherAccess` middleware applied globally at `/api/*` before route handlers. See [Operations Runbook](./operations/runbook.md#rbac).

## Key Sections

- [Architecture Overview](./architecture/overview.md) — system components, dual DB, startup, background services
- [Data Models](./architecture/data-models.md) — MySQL schema evolution, MongoDB collections, dual-DB boundary
- [Key Workflows](./workflows/key-workflows.md) — Sales Cost/SPK, subcontractor records, delivery notifications, GPS tracking, geofence backfill, schedule pengiriman
- [Operations Runbook](./operations/runbook.md) — env vars, migrations, RBAC, known gotchas

## Backlog

| Area | Source Anchor | Reason Deferred |
|---|---|---|
| BBS Safety Module | `node_backend/routes/bbs.js` (34 KB) | Distinct domain with no recent git activity; large but self-contained |
| Address Book | `node_backend/routes/addressBook.js`, MongoDB models | Small scope, MongoDB-only, low coupling to core flows |
| Master Import/Export | `node_backend/services/masterImportConfig.js`, `routes/masterImport.js` | Excel import/export plumbing — useful but not blocking any current feature work |
| Document Management | `routes/dataTruck.js`, `routes/dataChasis.js`, `routes/dataSupir.js` | File upload/download flows; auth gap exists on these routes (see Runbook) |
| Frontend Components | `src/components/DatePickerInput.vue`, shared UI patterns | Pure UI library patterns; low agent-decision value |
