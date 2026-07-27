# Plan: Backfill Geofence Diubah di Tengah Perjalanan

**Date:** 2026-07-27  
**Branch:** add-module-bbs  
**Feature:** When user edits an SPK and changes a stop's wialon_zone_id, offer GPS-based retroactive hit recording for that stop.

## Decisions (from grill-me session)

| Item | Decision |
|------|----------|
| Jenis backfill | GPS-based retroactive (fetch Wialon messages) |
| Timing | Aktif + sudah finish |
| Trigger | Zone ID berubah → post-save dialog |
| Access | Admin + user (same as other endpoints) |
| Scope stop | Hanya stop yang zone_id-nya berubah |
| History stop lama | Tidak insert jika stop sudah punya history (idempotent) |
| GPS confirm | Insert route_history dengan timestamp GPS aktual |
| GPS tidak ada | Warning + biarkan user memutuskan (manual option) |

## Global Constraints

- Node.js/Express backend, Vue 3 + TypeScript frontend
- `authenticateToken` on all new endpoints (no requireAdmin — both admin and user may access)
- Idempotent: backfill skipped if stop already has route_history
- Finish (system:finish_order) is NEVER modified by backfill
- Manual override uses `is_manual=1` in route_history
- Only trigger when `wialon_zone_id` changes (not stop_name, estimated_arrival, etc.)
- GPS message window: `depTs - 12h` to `finishTs || nowTs`
- All new backend constants configurable via env

## Architecture

```
Edit SPK → zone_id stop berubah → save → response includes geofence_changed_stops[]
  └─ FE detects → post-save dialog
       └─ User clicks "Cek GPS & Backfill"
            └─ POST /api/sales-costs/:id/backfill-stop { id_sc_stop }
                 ├─ Already hit? → { skipped: true, reason: "already_hit" }
                 ├─ GPS found? → INSERT route_history → { found: true, gps_time }
                 ├─ GPS not found? → { found: false, warning: "..." }
                 └─ Manual fallback: POST with { manual: true, manual_gps_time }
                      → INSERT route_history is_manual=1
```

## Task 1 — Backend: Deteksi perubahan zone_id di PUT handler

**File:** `node_backend/routes/salesCost.js`

In the PUT handler, before updating `sales_cost_step_schedule`:
1. Query current zone_ids from DB for all stops of this SPK
2. Compare with new zone_ids from request body
3. Collect `changedStops[]` = stops where `wialon_zone_id` changed AND stop does NOT already have route_history
4. Include in PUT response:

```json
{
  "id_sales_cost": 44413,
  "updated": true,
  "geofence_changed_stops": [
    {
      "id": 273,
      "stop_name": "Tujuan 1",
      "stop_order": 1,
      "old_zone_id": 85,
      "new_zone_id": 107,
      "new_zone_name": "Fuji Trans GIIC",
      "already_hit": false
    }
  ]
}
```

Only include stops where `is_departure=0`, `is_finish=0`, and zone_id changed.
If stop already has route_history, set `already_hit: true` (still include in array but FE can skip).

## Task 2 — Backend: Endpoint POST /sales-costs/:id/backfill-stop (GPS-based)

**File:** `node_backend/routes/salesCost.js`

```
POST /api/sales-costs/:id/backfill-stop
Auth: authenticateToken
Body: { id_sc_stop: number }
```

Logic:
1. Validate stop belongs to SPK and is not is_departure/is_finish
2. Check route_history: if stop already has history → `{ skipped: true, reason: "already_hit" }`
3. Load SPK: `departure_datetime`, `finish_order_datetime`, `wialon_unit_id`
4. Compute window: `timeFrom = depTs - 43200 (12h)`, `timeTo = finishTs || nowTs`
5. Login Wialon (isolated session)
6. `fetchRawMessagesForUnit` for window
7. `fetchZonePolygons` for stop's `wialon_resource_id`
8. `buildZoneEntryTimeline` — only for this stop's zone
9. `assignStopHits` with single stop + timeline + all guards (departureTs, sameZoneMinInterStopGapSec etc.)
10. If hit found → INSERT `sales_cost_route_history`, return `{ found: true, gps_time: "..." }`
11. If not found → return `{ found: false, warning: "GPS tidak mengkonfirmasi kunjungan ke zone ini. Data GPS mungkin tidak tersedia atau truk belum mengunjungi lokasi ini." }`
12. Logout Wialon
13. logAuditEvent

Imports needed: `buildZoneEntryTimeline`, `assignStopHits` from geofenceTrackingService.

## Task 3 — Frontend: Post-save dialog di SalesCostForm.vue

**File:** `tailadmin-vuejs-1.0.0/src/components/sales-cost/SalesCostForm.vue`

After successful PUT response, check `data.geofence_changed_stops`:
- If empty/undefined: proceed as normal
- If has entries with `already_hit: false`: show backfill dialog

Dialog state ref:
```ts
const backfillDialog = ref<{
  open: boolean
  stops: Array<{ id: number; stop_name: string; stop_order: number; new_zone_name: string; already_hit: boolean }>
  id_sales_cost: number
  currentStopIdx: number
  status: 'idle' | 'loading' | 'found' | 'not_found' | 'already_hit' | 'error' | 'manual_input'
  resultGpsTime: string | null
  errorMessage: string
  manualDateTime: string
}>({ open: false, stops: [], id_sales_cost: 0, currentStopIdx: 0, status: 'idle', resultGpsTime: null, errorMessage: '', manualDateTime: '' })
```

Dialog title: "Geofence Tujuan Diubah"
Dialog body varies by status:
- `idle`: "Geofence [stop_name] telah diubah ke [new_zone_name]. Truk mungkin sudah mengunjungi lokasi ini. Ingin mencari hit GPS aktual?"
- `loading`: spinner + "Mencari data GPS Wialon..."
- `found`: "Hit GPS ditemukan: [gps_time]. Kunjungan telah dicatat."
- `not_found`: "GPS tidak mengkonfirmasi kunjungan ke zone baru. Truk mungkin belum mengunjungi lokasi ini, atau data GPS tidak tersedia. Ingin mencatat kunjungan secara manual?"
- `already_hit`: "Stop ini sudah memiliki catatan kunjungan."
- `error`: "[errorMessage]" + Coba Lagi button
- `manual_input`: DateTimePicker + "Simpan Manual" button

Buttons:
- `idle`: [Lewati] [Cek GPS & Backfill]
- `loading`: (disabled)
- `found`: [Tutup]
- `not_found`: [Lewati] [Input Manual]
- `already_hit`: [Tutup]
- `error`: [Tutup] [Coba Lagi]
- `manual_input`: [Batal] [Simpan Manual]

If multiple stops changed, process one by one (currentStopIdx advances after each).

## Task 4 — Frontend: Manual override UI

Already integrated in Task 3 dialog (`manual_input` state).

When user clicks "Input Manual":
- Status → `manual_input`
- Show DateTimePicker for `manualDateTime`

When user clicks "Simpan Manual":
- Call `POST /api/sales-costs/:id/backfill-stop` with `{ id_sc_stop, manual: true, manual_gps_time: manualDateTime }`
- On success → status `found` with "Kunjungan dicatat secara manual"

## Task 5 — Frontend: Button "Cari Hit GPS" di Detail Sales Cost

**File:** `tailadmin-vuejs-1.0.0/src/views/Transaksi/DetailSalesCost.vue`

In the delivery stops timeline section, for each middle stop (is_departure=0, is_finish=0) that does NOT have a route_history entry (i.e., step not in routeHistory), show a small button:

```html
<button @click="triggerBackfillForStop(stop.id)" class="...">
  Cari Hit GPS
</button>
```

State:
```ts
const backfillStopStatus = ref<Record<number, 'idle' | 'loading' | 'found' | 'not_found' | 'error'>>({})
```

On click:
- Set status loading
- Call `salesCostService.backfillStop(idParam, stop.id)`
- On `found: true` → show gps_time in a small badge, reload detail
- On `found: false` → show "GPS tidak menemukan kunjungan" message inline
- On error → show error inline

Add `backfillStop(id, stopId)` to `salesCostService.js`.

## Task 6 — Backend: Extend endpoint for manual override

**File:** `node_backend/routes/salesCost.js` (same endpoint as T2)

Extend `POST /api/sales-costs/:id/backfill-stop`:

Body can also include `{ id_sc_stop, manual: true, manual_gps_time: "YYYY-MM-DD HH:MM:SS" }`.

When `manual: true`:
- Skip Wialon fetch entirely
- Validate `manual_gps_time` is a valid datetime string
- Validate stop doesn't already have history (idempotent)
- INSERT route_history with `gps_time = manual_gps_time`, `is_manual = 1`, `lat = null`, `lon = null`
- Return `{ found: true, manual: true, gps_time: manual_gps_time }`

## Task 7 — Docs: Update PROJECT_CONTEXT.md

Add section under Sales Cost:
```
### Sales Cost — Backfill Geofence Diubah (2026-07-27)
- POST /api/sales-costs/:id/backfill-stop: GPS-based retroactive hit for a single stop
  whose wialon_zone_id was changed mid-trip. Skipped if stop already has history.
- GPS window: depTs − 12h to finishTs/now.
- Manual override: { manual: true, manual_gps_time } → is_manual=1 in route_history.
- PUT /api/sales-costs/:id now returns geofence_changed_stops[] if any stop's zone_id changed.
- FE: post-save dialog in SalesCostForm + "Cari Hit GPS" button in Detail SPK.
```
