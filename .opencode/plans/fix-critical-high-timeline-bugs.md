# Fix Plan: Critical + High timeline bugs

**Mode:** plan only — no implementation until user says execute.  
**Scope:** C1 + H1 + H2 + H3 + H4 from audit.  
**Out of scope:** M2 multi-SPK finish policy, historical data repair, UI dead filters.

---

## Summary of bugs to fix

| ID | Severity | One-line |
|----|----------|----------|
| **C1** | Critical | `departure_datetime` selected but **not mapped** into GPS candidate objects → `NaN`/`0` departureTs |
| **H1** | High | `finish_order_datetime` dual meaning (planned ETA at create vs actual finish) pollutes overdue / some lists |
| **H2** | High | GPS active candidates unbounded (all unfinished SPKs ever) |
| **H3** | High | Manual ETA loop `break` on future middle ETA can block earlier-path clarity (finish has 2nd path; tighten) |
| **H4** | High | Manual ETA candidate includes “no zone on stops” → GPS-intended SPK can auto-finish by ETA |

---

## C1 — Map `departure_datetime` (and related fields)

### Problem
`getActiveSalesCostCandidates` SQL selects `sc.departure_datetime` but `.map()` drops it:

```368:376:node_backend/services/geofenceTrackingService.js
.map((row) => ({
  id_sales_cost, id_area, id_truck, wialon_unit_id,
  finish_geofence_* 
  // missing: departure_datetime, arrival_datetime
}))
```

Used as:

```js
const departureTs = Math.floor(new Date(salesCost.departure_datetime).getTime() / 1000);
// → NaN → finish guards / message window broken
```

### Fix
1. Add to map:
   - `departure_datetime: row.departure_datetime ?? null`
   - `arrival_datetime: row.arrival_datetime ?? null` (optional, for future)
2. In `syncGeofenceRouteHistory` loop, hard-guard:
   ```js
   const departureTs = Math.floor(new Date(salesCost.departure_datetime).getTime() / 1000);
   if (!Number.isFinite(departureTs) || departureTs <= 0) {
     console.warn(`[geofence-tracking] SC ${id} skip: invalid departure_datetime`);
     continue;
   }
   ```
3. Same guard when calling `resolveFinishGpsHit({ departureTs })`.

### Files
- `node_backend/services/geofenceTrackingService.js` only

### Verify
- Unit/script: mock row → mapped object has finite departureTs  
- Manual: one live SPK — finish re-entry still works; idle pre-departure still blocked  

---

## H2 — Bound GPS active candidates (30 days)

### Problem
`getActiveSalesCostCandidates` has no date window → every unfinished zoned SPK forever.

### Fix
Add to WHERE (same spirit as manual ETA / monitoring):

```sql
AND sc.departure_datetime IS NOT NULL
AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

Optional env: `GEOFENCE_ACTIVE_LOOKBACK_DAYS` default `30`.

### Files
- `node_backend/services/geofenceTrackingService.js` — `getActiveSalesCostCandidates` only  
- Do **not** change `runBackfill` window API (historical backfill stays explicit)

### Verify
- Query count of candidates drops to recent unfinished only  
- SPK older than 30 days without finish: no longer polled (document: use backfill/manual if needed)

---

## H4 — Tighten manual ETA eligibility

### Problem
Candidate OR-branch:

```sql
OR NOT EXISTS (stop with wialon_zone_id for non-finish)
```

SPK with unit + GPS mode but **empty zones** → treated as manual → auto-ETA finish.

### Fix (product-safe)
**Eligible for `applyDueManualEtaHits` only if:**

```
is_manual_mode = 1
OR wialon_unit_id IS NULL OR wialon_unit_id = ''
```

**Remove** the “no zone exists” OR branch from both primary query and fallback query.

Keep in-loop exclude as defense-in-depth:

```js
// After load stops:
if (Number(sc.is_manual_mode) !== 1 && unitId && hasZone) continue;
// After H4: also skip if unitId && !is_manual_mode (even without hasZone)
if (Number(sc.is_manual_mode) !== 1 && unitId) continue;
```

So:
- Manual flag → always ETA path  
- No GPS unit → ETA path  
- Has unit + not manual → **never** ETA path (must use GPS or admin complete-all)

### Files
- `node_backend/services/geofenceTrackingService.js` — `applyDueManualEtaHits` queries + exclude logic

### Verify
- Fixture: unit set, zones null, `is_manual_mode=0` → **0** ETA inserts  
- Fixture: `is_manual_mode=1` past ETAs → inserts + finish  
- Fixture: empty unit past ETAs → inserts  

---

## H1 — Dual meaning of `finish_order_datetime` (pragmatic, no big migration)

Full column split is large. **Phase H1 pragmatic** (this plan):

### Semantics going forward
| Field | Meaning after fix |
|-------|-------------------|
| `scss.estimated_arrival` (finish stop) | Planned finish ETA (primary for overdue) |
| `sc.finish_order_datetime` | Prefer **planned** at create; **do not** treat as proof of completion |
| `system:finish_order` + `gps_time` | **Actual** completion (only proof) |

### H1a — Schedule overdue deadline
In `resolveScheduleStatus` (`schedulePengiriman.js`):

**Today:**
```js
overdueDeadline = finishOrderDatetime || arrival
```

**Change:** prefer planned finish from timeline when available.

Call sites already have access to stops / can pass:

```js
// New optional param:
plannedFinishDatetime  // from finish stop estimated_arrival
// overdueDeadline =
//   plannedFinishDatetime || finishOrderDatetime || arrivalDatetime
```

Wire from list builder:
```js
const finishStop = delivery_stops.find(s => s.is_finish);
plannedFinishDatetime: finishStop?.estimated_arrival || null
```

If finish stop ETA missing, fallback chain stays `sc.finish_order_datetime` then `arrival`.

**Completed** remains `finishHit` only (no change).

### H1b — Monitoring on-trip overdue flag
Today:
```sql
CASE WHEN sc.finish_order_datetime IS NOT NULL
     AND sc.finish_order_datetime < NOW()
     AND NOT EXISTS (system:finish_order)
THEN 1 ELSE 0 END AS is_overdue
```

**Change** to planned ETA from schedule finish stop when possible:

```sql
CASE WHEN NOT EXISTS (system:finish_order)
     AND (
       EXISTS (
         SELECT 1 FROM sales_cost_step_schedule scss
         WHERE scss.id_sales_cost = sc.id_sales_cost
           AND scss.is_finish = 1
           AND scss.estimated_arrival IS NOT NULL
           AND scss.estimated_arrival < NOW()
       )
       OR (
         -- fallback if no finish stop ETA
         sc.finish_order_datetime IS NOT NULL
         AND sc.finish_order_datetime < NOW()
         AND NOT EXISTS (
           SELECT 1 FROM sales_cost_step_schedule scss2
           WHERE scss2.id_sales_cost = sc.id_sales_cost AND scss2.is_finish = 1
             AND scss2.estimated_arrival IS NOT NULL
         )
       )
     )
THEN 1 ELSE 0 END AS is_overdue
```

### H1c — Monitoring `trxConditions` (active transaction bucket)
Today requires `finish_order_datetime IS NULL` → SPK with planned finish filled **excluded** from some “active” lists.

**Change** active trx filter to history-based unfinished:

```sql
NOT EXISTS (
  SELECT 1 FROM sales_cost_route_history h
  WHERE h.id_sales_cost = sc.id_sales_cost
    AND h.step_key = 'system:finish_order'
)
AND (arrival_datetime IS NULL OR arrival >= today OR ...)  -- keep arrival window if still needed
```

Review the exact `trxConditions` block (~148–153) and replace “finish datetime null” with “no system:finish_order”.

### H1d — Do **not** change create form
Keep writing planned finish into `sc.finish_order_datetime` for print/SPK compatibility.  
Document: **completion = history only**.

### H1e — When GPS/manual finish inserts
Existing guard “UPDATE finish_order_datetime only if null” means planned ETA stays.  
**Optional small improvement (include in this plan):**

On `system:finish_order` insert (GPS + manual ETA + check-in), **always** set a separate concern:
- Either leave datetime as planned (current), **or**  
- Add comment only — **no force-overwrite planned** in this plan (avoids breaking print “jadwal finish”).

Overdue uses H1a/H1b → planned from scss; actual completion from history. **Enough for High.**

### Files
- `node_backend/routes/schedulePengiriman.js` — `resolveScheduleStatus` + call sites  
- `node_backend/routes/monitoringKendaraan.js` — `is_overdue` + `trxConditions`  
- No migration required for H1 pragmatic

### Verify
- SPK with planned finish yesterday, no `system:finish_order` → schedule **overdue**, on-trip **is_overdue=1**, still **not completed**  
- After GPS finish → completed, not on-trip  
- SPK with planned finish filled still appears in on-trip if no history finish  

---

## H3 — Manual ETA sequential clarity (small)

### Problem
Loop: future middle ETA → `break` (blocks later in same loop). Finish recovery path exists but is hard to reason about.

### Fix (minimal)
1. Replace `break` with `continue` for non-finish future ETA **only if** we process finishes in a dedicated second pass (already partially there).  
2. **Preferred simpler:** keep `break` for non-finish future (strict sequential by schedule), but ensure second pass always runs for finish when finish ETA due **and** no earlier stop has future ETA (already coded) — **only refactor comments + extract function** `processDueStopsForSalesCost` to avoid duplicate insert logic.

**Decision for this plan:**  
- **No behavior change required for H3** if second pass is correct.  
- **Do:** add unit test that middle ETA future + finish ETA past → **no** finish until middle due **or** document intentional wait.  
- **Do:** if second pass incorrectly finishes while middle future ETA exists, fix the `earlierBlocking` condition (already should block).

**Audit second pass once during implement; if OK, H3 = tests + comments only.**

---

## Implementation order

| Step | Item | File(s) |
|------|------|---------|
| 1 | **C1** map + guard invalid departure | `geofenceTrackingService.js` |
| 2 | **H2** 30-day bound on GPS candidates | same |
| 3 | **H4** tighten manual eligibility | same |
| 4 | **H1a** schedule overdue planned finish | `schedulePengiriman.js` |
| 5 | **H1b–c** monitoring overdue + active filter | `monitoringKendaraan.js` |
| 6 | **H3** verify/tests comments | `geofenceTrackingService.js` + test script |
| 7 | Restart backend + smoke | — |

---

## Tests / verification checklist

### Automated / script
1. **C1:** map output includes `departure_datetime`; invalid skip.  
2. **H4:** unit present + not manual + no zones → `applyDueManualEtaHits` inserts 0 for that SC.  
3. **H4:** `is_manual_mode=1` past ETAs → stop hits + `system:finish_order`.  
4. **H1a:** pure function `resolveScheduleStatus` with planned finish past, finishHit false → `overdue`.  
5. **H1a:** finishHit true → `completed` regardless of planned past.

### Manual smoke
1. GPS SPK active: tracking log no NaN; finish still needs re-entry after departure.  
2. Manual SPK: auto-finish after finish ETA.  
3. Monitoring: truck on-trip until history finish, even if `finish_order_datetime` planned filled.  
4. Schedule: overdue when planned finish ETA past and not finished.

---

## Risks

| Risk | Mitigation |
|------|------------|
| C1 changes finish timing for SPKs that “worked” by accident | Guards become correct; may delay false finishes (desired) |
| H2 drops old unfinished from live GPS | 30d bound; backfill API still available |
| H4 stops ETA for “forgot zone” SPKs | Force `is_manual_mode` or admin complete-all; form already has manual toggle |
| H1 monitoring SQL more complex | Keep fallback to `sc.finish_order_datetime` if no finish stop ETA |

---

## Explicit non-goals (this plan)

- New columns `planned_finish` / `actual_finish`  
- Multi-SPK same truck finish arbitration (M2)  
- Repair old route_history duplicates  
- Remove UI filter `incomplete_finish`  
- Frontend redesign  

---

## Success criteria

- [ ] C1: every GPS candidate has finite `departure_datetime` used for windows/guards  
- [ ] H2: GPS candidates limited to last 30 days  
- [ ] H4: only `is_manual_mode` or no-unit trucks get ETA auto-hits  
- [ ] H1: schedule/monitoring overdue & active lists use planned ETA + history finish consistently  
- [ ] H3: tests document sequential manual ETA behavior  
- [ ] GPS + manual regression: existing unit tests (`test-geofence-assign.js`) + manual ETA fixture still pass  

---

## Execute when approved

Reply **lanjut eksekusi** / **implement** to apply this plan in order 1→7.
