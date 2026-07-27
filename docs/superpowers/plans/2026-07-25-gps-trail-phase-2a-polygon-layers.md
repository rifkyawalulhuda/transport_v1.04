# GPS Trail Phase 2A — Polygon Geofence + Layer Toggle

> **Status:** Implemented (session 2026-07-25)  
> **Scope:** Detail Sales Cost Rute GPS Aktual — polygon geofence + layer toggle chips.

## Done

1. `node_backend/services/gpsTrailGeometry.js` — ring convert + simplify + buildPlannedPolygon  
2. `salesCost.js` — `planned_stops[].polygon`, env `GPS_TRAIL_POLYGON_MAX_POINTS`  
3. `scripts/test-gps-trail-polygon.js`  
4. `DetailSalesCost.vue` — 4 layer groups, polygon render, chip toggles  
5. `docs/PROJECT_CONTEXT.md` updated  

## Out of scope

- Time scrubber playback  
- Print map on SPK  
- Subcontractor map  
