---
type: Data Model Reference
title: Data Models
description: MySQL schema evolution via dbmate migrations and schemaSyncService for transport_v1.04. Documents key tables, MongoDB collections, the dual-DB boundary, and soft-delete patterns for trucks and drivers.
tags: [data-model, mysql, mongodb, migrations, schema, dbmate]
resource: node_backend/db/migrations
---

# Data Models

## MySQL — Source of Truth

All transactional data lives in MySQL (`trucking` database). The schema is managed by `dbmate` migrations in `node_backend/db/migrations/`.

### Schema Evolution (Migration Log)

| Migration | What it introduced |
|---|---|
| `20260401010000_baseline_from_trucking_dump.sql` | Full baseline — trucks, drivers, customers, areas, warehouses, sales_cost, repair, route_history, and supporting tables |
| `20260401011000_add_tracking_foreign_keys.sql` | FK constraints for GPS tracking tables |
| `20260401012000_add_area_finish_geofence.sql` | `finish_geofence_name` column on areas |
| `20260424010000_add_truck_is_active.sql` | `is_active` flag on trucks (soft deactivation) |
| `20260424011000_add_driver_is_active.sql` | `is_active` flag on drivers (soft deactivation) |
| `20260617000000_add_patcher_role.sql` | `patcher` role seed / permission row |
| `20260617010000_create_bbs_tables.sql` | BBS safety tables: `bbs_observations`, `bbs_incidents` |
| `20260619120000_add_coordinates_to_bbs_incidents.sql` | `lat`/`lng` on BBS incidents |
| `20260619130000_extend_bbs_incidents_location.sql` | Extended location fields on BBS incidents |
| `20260619140000_add_coordinates_to_bbs_observations.sql` | `lat`/`lng` on BBS observations |
| *(+11 more)* | GPS cache columns, route history nullable fields, Wialon unit ID on trucks, delivery notification read tracking — run `dbmate status` for the full list |

### Key Tables

**`truck`** — Fleet master
- `id`, `nomor_polisi`, `wialon_unit_id` (links to Wialon GPS unit), `is_active` (soft deactivation)
- Inactive trucks are excluded from operational pickers, GPS fleet views, and new Sales Cost records; they remain visible in Master Truck for history.

**`driver`** — Driver master
- `id`, `nama`, `is_active` (soft deactivation)
- Inactive drivers are excluded from operational pickers and Sales Cost import templates.

**`sales_cost`** — Core transaction record (SPK/delivery order)
- Links truck, driver, customer, area, warehouse
- Supports single and bulk SPK print (via `ids` query string)

**`route_history`** — GPS tracking log
- Written by `geofenceTrackingService` on geofence entry/exit
- Contains nullable Wialon fields (added by migration `20260720000009`)

**`repair`** — Truck repair/maintenance records

**`delivery_notification_read`** — Read-state tracking for delivery notifications
- Added by migration `20260720000010_create_delivery_notification_read.sql`
- Managed by `deliveryNotificationReadService`

**`bbs_observations` / `bbs_incidents`** — BBS safety module tables with GPS coordinates

### Soft Deactivation Pattern

Both trucks and drivers use `is_active = 1/0` rather than hard delete for operational deactivation. The pattern is:
- **Master list**: shows all records (active + inactive)
- **Operational pickers** (Sales Cost create/edit, driver selector): only active records
- **Historical records**: existing Sales Cost rows retain their truck/driver reference even after deactivation; edit flows preserve the option to avoid breaking old data

Hard delete (`Hapus`) remains available and performs a real `DELETE`.

## Schema Sync Safety Net

`services/schemaSyncService.js` runs `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` at startup for GPS-related columns. This is a **fallback for environments where `dbmate` hasn't been run**. It is not a replacement for migrations.

> **Important for agents**: When adding new columns, create a proper `dbmate` migration in `db/migrations/` AND check whether `schemaSyncService.js` needs a corresponding `ALTER TABLE` entry. Letting them diverge creates a dual source of truth. See [Operations Runbook — Migrations](../operations/runbook.md#running-migrations).

## MongoDB Collections

MongoDB (via Mongoose models in `node_backend/models/`) is used for:

| Collection / Model | Purpose |
|---|---|
| Notifications | System-level user notifications |
| Address Book | Contact/address records |
| DataTruck / DataChasis / DataSupir | Legacy document metadata records linked to upload files |

MongoDB is **optional at startup** — the server continues if `MONGO_URI` is absent, but all MongoDB-dependent routes will fail silently. `MONGO_URI` must be added manually to `.env` (it is absent from `.env.example`).

## Dual-DB Boundary

There are no cross-database foreign keys. Application code joins MySQL and MongoDB data in memory where needed (e.g., a notification record may reference a MySQL `sales_cost` ID by string). When writing code that touches both sides:

1. Treat MySQL as the source of truth for IDs and transactional state.
2. Don't assume MongoDB records exist for every MySQL record.
3. Handle missing MongoDB data gracefully.
