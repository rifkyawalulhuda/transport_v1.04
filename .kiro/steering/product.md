# Product Overview

Transport Management System (TMS) for a logistics/trucking company (Sankyu). Manages the full lifecycle of transport operations including fleet management, delivery tracking, and cost accounting.

## Core Domains

- **Master Data**: Trucks, drivers, customers, areas/routes, warehouses, subcontractors, admins
- **Transactions**: Sales Cost (delivery cost records), repairs, subcontractor jobs
- **Monitoring**: Real-time truck GPS locations, monthly mileage reports, vehicle status
- **Geofence Tracking**: Automated delivery route progress via Wialon GPS geofences
- **Data Transport**: Historical reporting for trucks, chassis, and drivers
- **Import/Export**: Bulk data operations via Excel (xlsx)

## Key Business Rules

- Trucks and drivers use soft-delete (`is_active` flag) — inactive records stay for historical reference but are excluded from operational pickers, GPS views, and new transactions.
- Sales Cost is the primary transaction record tying together truck, driver, customer, area/route, and cost data.
- GPS data comes exclusively from Wialon (server-side only) — tokens are never exposed to the frontend.
- Reverse geocoding uses Geoapify with 24-hour cache on both backend and frontend (localStorage).
- MySQL DATE values must be handled as local dates — never parse through UTC helpers like `toISOString().slice(0,10)`.

## Users & Roles

- Admin: Full access to all modules
- CS (Customer Service): Restricted access controlled via RBAC middleware
