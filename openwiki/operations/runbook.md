---
type: Runbook
title: Operations Runbook
description: Setup, configuration, migration, RBAC, and known gotchas for operating transport_v1.04 in development and production. Covers all required env vars, dbmate migration workflow, role whitelist maintenance, and flagged code issues.
tags: [operations, runbook, env, migrations, rbac, devops, gotchas]
resource: node_backend/.env.example
---

# Operations Runbook

## Environment Variables

Copy `node_backend/.env.example` to `node_backend/.env` and fill in the values. The table below covers every required and optional variable.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USER` | Yes | — | MySQL username |
| `DB_PASS` | Yes | — | MySQL password |
| `DB_NAME` | Yes | `trucking` | MySQL database name |
| `DATABASE_URL` | For dbmate only | — | Full DSN used by `dbmate` (see Migrations below) |
| `JWT_SECRET` | Yes | — | Secret for signing/verifying JWTs. Must be set before the server accepts any authenticated requests. |
| `PORT` | No | `3000` | Express listen port |
| `HOST` | No | `0.0.0.0` | Express bind address |
| `ALLOWED_ORIGIN` | No | (all origins) | Restrict CORS to this domain in production (e.g. `https://app.example.com`). Unset = open in dev. |
| `MONGO_URI` | **Yes** ⚠️ | — | MongoDB connection string. **Not in `.env.example`** — add manually. Without it, all MongoDB-backed features (notifications, address book, document records) fail silently at startup. |
| `WIALON_TOKEN` | Yes (GPS) | — | Wialon API session token |
| `WIALON_BASE_URL` | No | `https://hst-api.wialon.com/wialon/ajax.html` | Wialon API endpoint |
| `WIALON_LOGIN_FLAGS` | No | `13` | Wialon login flags bitmask |
| `WIALON_SESSION_TTL_MS` | No | `2700000` (45m) | How long to reuse a Wialon session before re-login |
| `WIALON_TIMEOUT_MS` | No | `20000` | Wialon HTTP request timeout |
| `WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS` | No | `600000` (10m) | Cache TTL for monthly mileage data from Wialon |
| `GEOAPIFY_API_KEY` | Yes (GPS) | — | Reverse geocoding API key (Geoapify) |
| `GEOAPIFY_BASE_URL` | No | `https://api.geoapify.com/v1/geocode/reverse` | Geoapify endpoint |
| `GEOAPIFY_TIMEOUT_MS` | No | `6000` | Reverse geocode HTTP timeout |
| `REVERSE_GEOCODE_CACHE_TTL_MS` | No | `86400000` (24h) | Backend in-memory cache TTL for reverse geocoded addresses |
| `GEOFENCE_TRACKING_INTERVAL_MS` | No | `60000` (60s) | How often the background geofence loop polls Wialon |
| `DEFAULT_FINISH_GEOFENCE_NAME` | No | `Sankyu` | Name of the Wialon geofence that triggers delivery notifications on truck arrival |

## Running Migrations

The project uses [`dbmate`](https://github.com/amacneil/dbmate) for schema management. Migrations live in `node_backend/db/migrations/`.

```bash
# Install dbmate (one-time)
# macOS: brew install dbmate
# Linux: see https://github.com/amacneil/dbmate#installation

cd node_backend

# Set DATABASE_URL in .env (dbmate reads it directly):
# DATABASE_URL=mysql://root:password@localhost:3306/trucking

# Apply all pending migrations
dbmate up

# Check migration status
dbmate status

# Roll back the last migration
dbmate down
```

> **Schema sync safety net**: `schemaSyncService.js` also runs `ALTER TABLE` statements at startup for GPS-related columns. This is a fallback, not a replacement. Always create a proper `dbmate` migration for new columns, then also check whether `schemaSyncService.js` needs a matching entry. See [Data Models — Schema Sync](../architecture/data-models.md#schema-sync-safety-net).

### Adding a New Migration

```bash
dbmate new <short_description>
# Creates: node_backend/db/migrations/<timestamp>_<short_description>.sql
```

Write your `-- migrate:up` and `-- migrate:down` SQL, then `dbmate up` to apply.

### Importing a Production Dump

When bootstrapping a dev environment from a production DB dump, `dbmate up` alone is not enough because a raw dump won’t have the `schema_migrations` tracking rows. Two scripts in `node_backend/scripts/` handle this:

**`sync-from-production.js`** — run this immediately after importing the dump. It inspects each migration file, checks whether its effect already exists in the DB (table present, column present, correct type), and marks matching migrations as applied in `schema_migrations` without re-running their SQL. Migrations whose effects are absent are left unmarked so `dbmate up` will apply them on the next run.

```bash
cd node_backend
node scripts/sync-from-production.js
npm run migrate          # applies only genuinely new migrations
npm run migrate:status   # verify Pending: 0
```

**`fix-missing-tables.js`** — an idempotent script that directly runs the `ALTER TABLE` / `RENAME COLUMN` statements needed to bring an older production dump up to the current schema (e.g. renaming `delivery_order` → `departure_datetime`). It skips silently if the target already exists (`ER_DUP_FIELDNAME`, `ER_TABLE_EXISTS_ERROR`). Run it when `sync-from-production.js` + `dbmate up` leaves columns missing, or use `autorun-prod.bat` which calls it automatically on every production deploy.

```bash
cd node_backend
node scripts/fix-missing-tables.js
```

Both scripts read DB credentials from `node_backend/.env`.


## Starting the Server

```bash
cd node_backend
node server.js
```

Startup sequence:
1. MongoDB connect (logs warning if `MONGO_URI` unset, continues)
2. `ensureTrackingSchema()` — ALTER TABLE safety net
3. HTTP server binds to `HOST:PORT`
4. `detectAndRunStartupBackfill()` — fills geofence gaps from the overnight window
5. `startGeofenceTracking()` — begins 60s Wialon polling loop

For production on Windows, use `autorun-prod.bat` (repo root) instead of running these steps manually. It runs three steps in sequence:

1. Builds the frontend with `npm run build-only -- --mode local-prod`
2. Runs `node scripts/fix-missing-tables.js` to sync the schema
3. Starts (or restarts) the backend via PM2 using `ecosystem.prod.config.js`

```bat
REM From the repo root:
autorun-prod.bat
```

The PM2 process is named `transport-backend-prod`. Useful commands after starting:

```bash
pm2 status
pm2 logs transport-backend-prod
pm2 stop transport-backend-prod
pm2 restart transport-backend-prod
```

`ecosystem.prod.config.js` configures PM2 with `watch: false`, `autorestart: true`, and `max_memory_restart: 512M`. On non-Windows environments, use a systemd service or equivalent process manager pointing at `node_backend/server.js`.

## Building the Frontend

```bash
cd tailadmin-vuejs-1.0.0
npm run build
# Output: tailadmin-vuejs-1.0.0/dist/
```

The backend's catch-all `GET *` route in `server.js` serves `dist/index.html` for all non-API paths.

## RBAC

Three user roles are encoded in the JWT `level` claim. Role enforcement is done by `node_backend/middleware/rbac.js`, which applies globally to all `/api/*` routes before they reach individual route handlers.

| Role | Access |
|---|---|
| `admin` | Full access — passes both middleware checks unconditionally |
| `cs` | Allowed: `GET /schedule-pengiriman`, `GET /auth/me`, `PUT /auth/me`. All other routes return `403`. |
| `patcher` | Allowed: all CRUD on `/bbs`, `GET /trucks`, `GET /drivers`, `GET /auth/me`, `PUT /auth/me`. All other routes return `403`. |

**Adding a new route for `cs` or `patcher`**: edit `node_backend/middleware/rbac.js` and add an entry to `isAllowedForCs` or `isAllowedForPatcher`.

```js
// Example: allow cs to read customers
{ method: "GET", path: "/customers" }
```

> **Note**: The whitelist uses `path.startsWith(route.path)`, so `/customers` also matches `/customers/123`. Be intentional about prefix breadth.

## Known Issues and Gotchas

### 1. `MONGO_URI` Missing from `.env.example`

`MONGO_URI` is consumed in `server.js` but absent from `.env.example`. New environments will get a startup warning and silently broken MongoDB features (notifications, address book, DataTruck/Chasis/Supir document records). **Always add `MONGO_URI` manually when setting up a new environment.**

### 2. Auth Gap on `dataTruck.js` and `dataChasis.js`

`authenticateToken` is imported in these route files but not applied via `router.use()`, leaving their endpoints (including `/export`) effectively unprotected by authentication. Static file serving for `/doc-data-truck` and `/doc-data-chasis` **is** protected at the Express level in `server.js`, but the JSON API endpoints in these routes are not. **Verify and apply `authenticateToken` before adding any new endpoints to these files.**

### 3. Schema Sync Dual Source of Truth

`schemaSyncService.js` runs `ALTER TABLE` statements at startup as a safety net. If you add new columns only in `schemaSyncService.js` without a corresponding `dbmate` migration, fresh environments using `dbmate up` will not get those columns. Conversely, if you add a migration but forget to update `schemaSyncService.js`, the safety net diverges from the migration state. **Always do both.**

### 4. RBAC Whitelist Maintenance

The `cs` and `patcher` role whitelists are hardcoded arrays in `rbac.js`. There is no runtime discovery. If a new route is added that should be accessible to these roles, `rbac.js` must be updated manually or the route will silently return `403` for those users.

### 5. CORS in Production

`ALLOWED_ORIGIN` defaults to allowing all origins (`true` in the cors config) when unset. Set it to the production domain before deploying to a shared or customer-facing environment.

### 6. Wialon Geofence Name Must Match Exactly

`DEFAULT_FINISH_GEOFENCE_NAME` (default: `Sankyu`) must exactly match a named geofence in the Wialon account. If it does not match, no delivery notifications will fire and no error is surfaced — the tracking loop will simply never trigger. Verify the name in the Wialon admin panel if delivery notifications stop working.

## Logs and Audit Trail

- Application logs: stdout/stderr from `node server.js`
- Audit log: `node_backend/logs/audit.log` — written by `services/auditLogger.js` for significant data mutations

## File Uploads

Uploaded documents are stored locally under `node_backend/upload/`:

| Path | Contents |
|---|---|
| `upload/doc-data-truck/` | Truck document files |
| `upload/doc-data-chasis/` | Chassis document files |
| `upload/doc-supir/` | Driver document files |

These directories are served via authenticated static routes at `/doc-data-truck`, `/doc-data-chasis`, and `/doc-supir`. In production, consider moving uploads to object storage (S3, GCS) and updating the serving logic.
