---
type: Architecture Overview
title: System Architecture
description: Express + Vue 3 SPA architecture for transport_v1.04. Covers the two-process design, dual-database split (MySQL + MongoDB), API surface, startup sequence, background GPS services, and CORS/static-serving setup.
tags: [architecture, express, vue3, mysql, mongodb, gps, wialon]
resource: node_backend/server.js
---

# System Architecture

## High-Level Design

`transport_v1.04` is a **two-process monolith** served as a single origin in production:

```
Browser
  └─► Express (node_backend/server.js :3000)
        ├─► /api/*          — REST API (JWT-authenticated)
        ├─► /img/*          — Public static images
        ├─► /doc-data-*     — Auth-gated uploaded documents
        └─► GET *           — Vue 3 SPA (dist/index.html fallback)
```

In development, Vite runs a separate dev server that proxies `/api` to Express. In production, `npm run build` outputs to `tailadmin-vuejs-1.0.0/dist/` and Express serves it directly.

## Dual Database

Two databases serve distinct purposes. There are **no foreign key guarantees across them** — joins must happen in application code.

| Database | Driver | Used for |
|---|---|---|
| **MySQL** (`trucking`) | `mysql2` pool (`db.js`) | All transactional data: trucks, drivers, customers, sales costs, repairs, scheduling, GPS route history, BBS |
| **MongoDB** | `mongoose` | Notifications, address book, legacy document records (DataTruck, DataChasis, DataSupir Mongoose models) |

If `MONGO_URI` is not set, the server logs a warning and continues — MongoDB-backed features silently fail. This env var is **missing from `.env.example`** and must be added manually (see [Operations Runbook](../operations/runbook.md)).

## API Surface

All REST routes are mounted under `/api` in `server.js`. The full route-to-domain map:

| Mount path | Route file | Domain |
|---|---|---|
| `/api/auth` | `routes/auth.js` | Login, JWT issue, profile (`/me`) |
| `/api/dashboard` | `routes/dashboard.js` | Aggregate KPIs |
| `/api/trucks` | `routes/truck.js` | Truck master CRUD + activate/deactivate |
| `/api/drivers` | `routes/driver.js` | Driver master CRUD + activate/deactivate |
| `/api/customers` | `routes/customer.js` | Customer master |
| `/api/areas` | `routes/area.js` | Area/route master, geofence config |
| `/api/warehouses` | `routes/warehouse.js` | Warehouse master |
| `/api/subconts` | `routes/subcont.js` | Subcontract reference data |
| `/api/subcontractor` | `routes/subcontractor.js` | Subcontractor operational records |
| `/api/admins` | `routes/admin.js` | Admin user management |
| `/api/sales-costs` | `routes/salesCost.js` | Sales Cost / SPK lifecycle, bulk print |
| `/api/repairs` | `routes/repair.js` | Truck repair records |
| `/api/master` | `routes/masterImport.js` | Excel import/export for master data |
| `/api/notifications` | `routes/notifications.js` | MongoDB notifications |
| `/api/delivery-notifications` | `routes/deliveryNotifications.js` | Geofence-triggered delivery events |
| `/api/data-trucks` | `routes/dataTruck.js` | Truck document management |
| `/api/data-chasis` | `routes/dataChasis.js` | Chassis document management |
| `/api/data-supir` | `routes/dataSupir.js` | Driver document management |
| `/api/schedule-pengiriman` | `routes/schedulePengiriman.js` | Delivery schedule |
| `/api/wialon` | `routes/wialon.js` | GPS live data proxy (Wialon) |
| `/api/address-book` | `routes/addressBook.js` | MongoDB address book |
| `/api/monitoring-kendaraan` | `routes/monitoringKendaraan.js` | Fleet monitoring summary + mileage |
| `/api/bbs` | `routes/bbs.js` | BBS safety observations/incidents |
| `/api/delivery-templates` | `routes/deliveryTemplate.js` | Delivery template master (template + ordered stops) |

## Authentication & RBAC

Every request to `/api/*` first passes through two role-restriction middlewares before reaching route handlers:

```
/api/* → restrictCsAccess → restrictPatcherAccess → [authenticateToken inside each route]
```

`restrictCsAccess` and `restrictPatcherAccess` (in `middleware/rbac.js`) use a **whitelist approach**: if the JWT `level` claim is `cs` or `patcher`, the request is rejected unless it matches an explicit `{ method, path }` entry in that role's allowed list.

Roles and their allowed routes are documented in [Operations Runbook — RBAC](../operations/runbook.md#rbac). Any new route intended for `cs` or `patcher` access must be explicitly added to `rbac.js`.

Document static file routes (`/doc-data-truck`, `/doc-data-chasis`, `/doc-supir`) apply `authenticateToken` directly as Express middleware before `express.static`.

## Startup Sequence

```
startServer()
  1. mongoose.connect(MONGO_URI)         — optional, warns if unset
  2. ensureTrackingSchema()              — ALTER TABLE safety net for GPS columns
  3. app.listen(PORT, HOST)
  4. detectAndRunStartupBackfill()       — fills missing geofence records for overnight gap
  5. startGeofenceTracking()             — begins 60s polling loop
```

Steps 4–5 are managed by [geofenceTrackingService](../workflows/key-workflows.md#gps-tracking--geofence-loop), which is the core background service for GPS event detection.

## Background Services

| Service | File | What it does |
|---|---|---|
| `geofenceTrackingService` | `services/geofenceTrackingService.js` | Polls Wialon every `GEOFENCE_TRACKING_INTERVAL_MS` (default 60s), detects entry/exit of geofenced areas, writes `route_history`, triggers delivery notifications |
| `wialonService` | `services/wialonService.js` | Session management and all Wialon API calls (login, unit positions, trip reports) |
| `schemaSyncService` | `services/schemaSyncService.js` | Runs `ALTER TABLE IF NOT EXISTS` at startup to ensure GPS tracking columns exist — a fallback for environments where `dbmate` migrations haven't run |
| `areaRouteService` | `services/areaRouteService.js` | Area/geofence route calculation logic |
| `repairService` | `services/repairService.js` | Repair record business logic |
| `deliveryNotificationReadService` | `services/deliveryNotificationReadService.js` | Marks delivery notifications as read, manages `delivery_notification_read` table |
| `notificationService` | `services/notificationService.js` | MongoDB notification creation |
| `auditLogger` | `services/auditLogger.js` | Writes to `node_backend/logs/audit.log` |
| `masterImportConfig` | `services/masterImportConfig.js` | Column map config for Excel imports |

## Frontend Architecture

The Vue 3 SPA is organized as follows:

```
src/
├── main.ts                  # App bootstrap, global CSS
├── router/index.ts          # All route definitions (path → component)
├── config/
│   ├── navigation.js        # Sidebar sections and items
│   └── api.js               # Axios base URL config
├── views/                   # Page components, grouped by domain:
│   ├── Home/                # Dashboard, SchedulePengiriman
│   ├── Monitoring/          # MonitoringKendaraan (fleet + map)
│   ├── Transaksi/           # SalesCost, Repair, DeliveryNotifications
│   ├── Master/              # Trucks, Drivers, Customers, Areas, etc.
│   └── DataTransport/       # DataTruck, DataChasis, DataSupir
├── components/              # Shared: DeliveryNotificationBell, DatePickerInput, etc.
└── services/                # API call wrappers (axios)
```

The frontend is entirely client-rendered (SPA). Navigation is sidebar-driven via `config/navigation.js`. The `DeliveryNotificationBell` component in the top nav polls `/api/delivery-notifications` for unread counts.

The Monitoring Kendaraan page uses Leaflet with a 30-second auto-refresh, 3-panel layout (map / vehicle detail / fleet list), and reverse geocode results cached in `localStorage` with a 24-hour TTL matching the backend cache. It is described in detail in [Key Workflows](../workflows/key-workflows.md#gps-tracking--geofence-loop).
