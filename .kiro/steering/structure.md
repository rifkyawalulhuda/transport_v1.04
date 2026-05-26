# Project Structure

## Top-Level Layout

```
transport_v1.04/
├── node_backend/          # Express API server
├── tailadmin-vuejs-1.0.0/ # Vue 3 frontend SPA
├── docs/                  # VitePress documentation site
└── API GPS Docs/          # External API reference (PDF)
```

## Backend (`node_backend/`)

```
node_backend/
├── server.js              # App bootstrap, middleware, route registration
├── db.js                  # MySQL connection pool (mysql2/promise)
├── routes/                # Express route handlers (one file per domain)
│   ├── auth.js
│   ├── truck.js
│   ├── salesCost.js
│   ├── wialon.js          # GPS/geofence/mileage endpoints
│   └── ...
├── services/              # Business logic & external integrations
│   ├── wialonService.js   # Wialon GPS API client
│   ├── geofenceTrackingService.js
│   ├── areaRouteService.js
│   └── ...
├── middleware/            # Express middleware
│   ├── auth.js            # JWT verification
│   └── rbac.js            # Role-based access control
├── models/                # Mongoose models (MongoDB, legacy)
├── db/
│   ├── migrations/        # SQL migration files (dbmate format)
│   └── schema.sql         # Generated schema snapshot
├── scripts/               # CLI utilities (migration wrappers)
├── upload/                # User-uploaded files
├── img/                   # Static images
└── logs/                  # Application logs
```

### Backend Conventions

- One route file per domain entity (e.g., `routes/truck.js`, `routes/salesCost.js`)
- Business logic lives in `services/`, route files handle HTTP concerns
- All routes are prefixed with `/api/` and registered in `server.js`
- MySQL queries use `mysql2/promise` pool directly (no ORM)
- Migrations follow timestamp naming: `YYYYMMDDHHMMSS_description.sql`

## Frontend (`tailadmin-vuejs-1.0.0/src/`)

```
src/
├── main.ts                # App entry point
├── App.vue                # Root component
├── router/                # Vue Router configuration
├── views/                 # Page-level components (by domain)
│   ├── Master/            # Master data CRUD pages
│   ├── Transaksi/         # Transaction pages (Sales Cost, etc.)
│   ├── Monitoring/        # GPS map, mileage, vehicle monitoring
│   ├── DataTransport/     # Historical data reports
│   ├── Auth/              # Login/auth pages
│   └── ...
├── components/            # Shared/reusable UI components
├── composables/           # Vue composables (shared logic)
├── services/              # API client wrappers (one per domain)
│   ├── truckLocationService.ts
│   ├── salesCostService.js
│   └── ...
├── config/                # Navigation config, API base URL
├── utils/                 # Utility functions
├── icons/                 # Icon components
└── assets/                # Static assets (CSS, images)
```

### Frontend Conventions

- Views are organized by business domain in subdirectories
- Services wrap API calls and are imported by views/composables
- TypeScript for new service files (`.ts`); some legacy files remain `.js`
- Tailwind utility classes for styling; no separate CSS files per component unless necessary
- Leaflet map logic is self-contained within monitoring views
