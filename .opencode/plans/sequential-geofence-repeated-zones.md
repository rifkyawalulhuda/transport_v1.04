# Plan: Sequential geofence hits for repeated zones (KIIC ↔ GIIC)

## Closed case (no further work)

**SPK #44361 / B 9519 FXT** — **CLOSED**.  
User confirmed Wialon has no trip trail; truck only sits in Sankyu. Timeline not green is **correct** (no IPTI KIM GPS). No code change.

---

## Context: prior executed fixes (still in codebase)

| Fix | Status | Relevance to this issue |
|-----|--------|-------------------------|
| `fetchZonePolygons` flags (28/0/8) | Done | Needed so polygons exist at all |
| Live polygon map shape `{name,points}` | Done | Timeline can run |
| `msg.t` unit (seconds) | Done | Correct entry times |
| Finish via timeline + scss fallback | Done | Unrelated to multi-stop order |
| Early window 12h pre-departure | Done | Helps early hits |

---

## Problem (Sales Cost multi-stop, repeated geofence)

**Example route:** KIIC → GIIC → KIIC → GIIC  

**Observed wrong history:**

| Stop | Zone | Recorded time |
|------|------|----------------|
| 1 | KIIC | 09:28 |
| 2 | GIIC | 10:28 |
| 3 | KIIC | **09:28** (same as #1) |
| 4 | GIIC | **10:28** (same as #2) |

**Goal:** each step gets the **next chronological zone entry** after the previous step (e.g. 09:28 → 10:28 → 11:15 → 12:40).

---

## Root cause (code)

### Live path — partially correct, incomplete across cycles

`syncGeofenceRouteHistory` already has:

1. `buildZoneEntryTimeline(messages, zonePolygonMap)` — entry events on enter/leave  
2. `consumedEntryByZone` — next stop on same zone uses `entryTs > lastConsumedTs`

```563:600:node_backend/services/geofenceTrackingService.js
const lastConsumedTs = consumedEntryByZone.get(zoneKey) ?? 0;
const entry = zoneTimeline.find(
  (e) => e.zoneKey === zoneKey && e.entryTs > lastConsumedTs
);
// ...
consumedEntryByZone.set(zoneKey, entry.entryTs);
```

**Gaps:**

1. **`consumedEntryByZone` is empty every sync cycle.**  
   Existing history for KIIC stop #1 is not used to seed “first entry already consumed”.  
   On a later cycle, stop #3 still matches the **first** KIIC entry → same `gps_time` as stop #1.

2. **No global monotonic clock across different zones.**  
   Only per-zone consume. Usually OK if stops are processed in `stop_order`, but if intermediate stop missing and later stop matches an early entry, times can go backwards relative to previous *different* zone stop.

3. **No hard “stop N only after stop N−1 hit”** (optional product rule).  
   Without it, stop 3 can be filled before stop 2 if zone re-entry appears first in matching logic during partial data.

### Backfill path — main source of “same time for visit 1 and visit 2”

```967:968:node_backend/services/geofenceTrackingService.js
const hit = messages.find((m) => pointInPolygon({ x: m.lon, y: m.lat }, zoneData.points));
```

**Always first point inside zone** for every stop on that zone → KIIC#1 and KIIC#3 get identical timestamp.  
Backfill does **not** use `buildZoneEntryTimeline` / consume.

Historical wrong rows already in DB will keep showing until re-synced/corrected.

---

## Best approach (recommended)

### Design principle

Treat GPS as a **chronological stream of zone-entry events**, then **assign events to stops in `stop_order`**, one event per stop, never reuse an event.

```
messages → entry timeline [KIIC@t1, GIIC@t2, KIIC@t3, GIIC@t4]
stops     → assign next unused matching entry with t > last_assigned_ts
```

### Algorithm (single function, used by live + backfill)

```
function assignStopsToZoneEntries(stopsOrdered, zoneTimeline, existingHitsByStopId):

  // 1) Seed consumed / last global ts from existing history
  consumedByZone = Map()  // zoneKey → max gps_ts already used for that zone
  lastGlobalTs = 0
  for each existing hit (ordered by stop_order / gps_time):
    lastGlobalTs = max(lastGlobalTs, hit.gps_ts)
    consumedByZone[zoneKey] = max(consumedByZone[zoneKey], hit.gps_ts)

  // 2) Walk stops in stop_order
  for stop in stopsOrdered (is_finish=0):
    if already has history for this stop: continue  // or re-validate later
    zoneKey = resource:zone

    // STRICT sequential (recommended default):
    if previous non-departure stop exists and not yet hit: skip (wait)

    entry = first zoneTimeline event where:
      e.zoneKey == zoneKey
      AND e.entryTs > (consumedByZone[zoneKey] || 0)
      AND e.entryTs > lastGlobalTs          // monotonic across all stops
      // optional: e.entryTs >= planned_departure - buffer for stop 0 only

    if !entry: leave unhit
    else:
      insert history with gps_time = entry.entryTs
      consumedByZone[zoneKey] = entry.entryTs
      lastGlobalTs = entry.entryTs
```

### Why these three constraints together

| Constraint | Prevents |
|------------|----------|
| Per-zone consume (`entryTs > last for zone`) | Reusing first KIIC for 2nd KIIC stop |
| Global monotonic (`entryTs > lastGlobalTs`) | Stop 3 time before stop 2 time |
| Sequential previous stop hit | Filling stop 4 while stop 3 still open (messy GPS / skip) |

### Backfill

- **Delete / replace** first-hit `messages.find` loop.  
- Call the **same** assigner as live (or extract shared `assignGeofenceHitsForSalesCost(...)`).  
- When re-backfilling a window, either:
  - **A (safe):** only fill **missing** stops with correct next entries, or  
  - **B (repair):** for SC with duplicate `gps_time` on same zone across stops, delete auto (non-manual) history and re-assign from full message window.

Recommend **A for production default**; optional admin endpoint **B** for repair of known-bad SPKs.

### Live sync

- After loading `existingHistoryKeys`, also load `gps_time` (+ zone ids) for that SC and **seed** `consumedEntryByZone` + `lastGlobalTs`.  
- Prefer assigning only the **next unhit stop in order** per cycle (or full walk with sequential gate) to reduce racey multi-insert.

### Finish (already fixed)

- Keep finish after all delivery stops + entry after last delivery hit (current logic).

### Data repair (optional, separate task)

SQL detect:

```sql
-- same SC, same zone, same gps_time on 2+ stop history rows
SELECT id_sales_cost, wialon_zone_id, gps_time, COUNT(*) c
FROM sales_cost_route_history
WHERE step_key LIKE 'stop:%'
GROUP BY id_sales_cost, wialon_zone_id, gps_time
HAVING c > 1;
```

Then re-run targeted repair backfill for those IDs.

---

## Implementation plan

### Phase 1 — Extract shared assigner (core)

**File:** `node_backend/services/geofenceTrackingService.js`

1. Extract `buildZoneEntryTimeline` (already pure) — keep.  
2. Add `seedConsumptionFromHistory(historyRows, stops)` → `{ consumedByZone, lastGlobalTs }`.  
3. Add `assignStopHits({ stops, zoneTimeline, messages, existingHistory, options })` → list of inserts `{ stop, entryTs, lat, lon }`.  
4. Options:
   - `requirePreviousStopHit: true` (default)  
   - `minTs` / message window already applied by caller  

### Phase 2 — Wire live sync

Replace per-stop ad-hoc consume loop with `assignStopHits`.  
Seed from DB history for that SC before assign.

### Phase 3 — Wire backfill

Replace `messages.find` with same assigner + same seed.  
Ensure message window covers full trip (already has 12h early buffer; no cap by finish ETA — already fixed).

### Phase 4 — Tests (unit, no Wialon)

Pure functions with fixture messages:

1. KIIC@t1, GIIC@t2, KIIC@t3, GIIC@t4 → four stops get t1..t4.  
2. Partial history stop1+stop2 already t1,t2 → stop3 gets t3 not t1.  
3. Only one KIIC entry → stop3 remains unhit.  
4. Sequential gate: stop2 missing → stop3 not assigned even if KIIC entry exists.  
5. Monotonic: entry for zone A earlier than lastGlobalTs skipped.

### Phase 5 — Verify + optional repair

1. Pick real multi-leg SC (KIIC/GIIC pattern) with GPS trail.  
2. Clear auto history or use fresh SC; run backfill; assert increasing `gps_time` by `stop_order`.  
3. Optional: repair script for duplicate gps_time rows.

### Out of scope

- Changing Wialon hardware / stuck units (#44361).  
- Soft polygon buffer.  
- UI redesign (display already uses history `gps_time`).

---

## Files to touch

| File | Change |
|------|--------|
| `node_backend/services/geofenceTrackingService.js` | Shared assigner; live seed; backfill parity |
| `node_backend/services/__tests__/geofenceAssign.test.js` (or existing test dir) | Unit tests for assign logic |
| Optional `node_backend/scripts/repair-duplicate-geofence-hits.js` | Detect + re-assign bad SCs |

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Strict sequential delays later stops if middle geofence missed | Configurable; UI already has manual / incomplete_finish; document |
| Re-backfill doubles rows | Keep unique step_key / INSERT IGNORE; repair deletes only `is_manual=0` duplicates |
| Departure = same zone as later stop (Sankyu) | Departure is first stop; consume first Sankyu entry; later Sankyu needs re-entry after leave — already timeline design |

## Success criteria

- Route KIIC→GIIC→KIIC→GIIC produces **4 strictly increasing** `gps_time` when GPS has 4 corresponding entries.  
- Second visit never reuses first visit timestamp.  
- Live multi-cycle sync does not re-assign first entry to a later stop.  
- Backfill and live produce same assignment rules.  
- Unit tests green for fixtures above.

## Decision (default product choice)

**Recommended defaults for implementation:**

1. Per-zone consume + global monotonic time — **always on**.  
2. Require previous stop hit before next — **on** for delivery stops (not blocking departure).  
3. No auto-delete of existing history on normal backfill; repair script opt-in.

---

## Execution order (when user says implement)

1. Unit tests first (TDD) for assigner with fixtures.  
2. Implement assigner + seed.  
3. Wire live + backfill.  
4. Restart backend; verify one multi-leg SPK with real GPS.  
5. Optional repair pass for historical duplicates.

**No execution in this plan-mode turn** — wait for user approval to implement.
