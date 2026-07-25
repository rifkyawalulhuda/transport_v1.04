# Plan: False finish SPK #44390 — idle/ignition di Sankyu tanpa trip

**Mode:** plan only (read-only investigation done).  
**Tidak dieksekusi** sampai user approve.

---

## 1. Case facts (DB verified)

| Field | Value |
|-------|--------|
| SPK | **#44390** |
| Truck | **B 9152 SEU** (`wialon_unit_id` 26365309) |
| Created | `tgl_order` 2026-07-23, stops created **23 Jul 16:24** |
| Planned departure | **2026-07-24 07:19** |
| Planned tujuan | IPTI KIM 09:05 |
| Planned finish | 11:00 |
| Manual mode | 0 (GPS) |

### Stops
| Order | Name | Zone |
|-------|------|------|
| 0 | Departure | **Sankyu** |
| 1 | Tujuan 1 | IPTI KIM |
| 99 | Finish | **Sankyu** (same as departure) |

### History (actual)
| Event | gps_time | Notes |
|-------|----------|--------|
| Departure `stop:203` | **2026-07-23 15:51:34** | **Sebelum** planned dep 24 Jul 07:19 — truk sudah di base saat SC dibuat |
| Tujuan IPTI | — | **Tidak ada** |
| `system:finish_order` | **2026-07-24 07:34:02** | recorded **08:14:18** — pagi, mesin on, masih Sankyu |
| | | `is_manual=0` (GPS path) |

**User narrative (matches data):** SC 23 Jul → Departure hit (base) → 24 Jul ignition → Finish hit immediately while still in Sankyu → trip never started → SPK “Selesai”, tujuan dilewati.

---

## 2. Root cause (logic)

### 2.1 Same zone for Departure and Finish (Sankyu)

Finish detection cannot distinguish “still parked at base” vs “returned from trip” without **proof of leave**.

### 2.2 Current `resolveFinishGpsHit` guards (insufficient for this case)

```212:221:geofenceTrackingService.js
minFinishTs = max(plannedDepartureTs, lastGlobalTs)  // lastGlobalTs includes early Departure hit
finishEntry = first zoneTimeline entry with entryTs > minFinishTs
```

Also live fallback: inside zone now + “left after minFinishTs once” (any single outside point).

**Failures:**

| Guard | Why it failed on #44390 |
|-------|-------------------------|
| `now >= departure` | True after 07:19 on 24 Jul |
| `entryTs > minFinishTs` | Any **new** Sankyu entry after 07:19 counts — ignition/GPS restart often creates leave→re-enter **without trip** |
| “Left zone once” | One noisy/outside point after 07:19 is enough; not “meaningful trip” |
| Loose finish (no middle required) | IPTI never required |
| Early Departure hit (23 Jul) | Seeds history; does not force leave after **planned** dep |

### 2.3 Early Departure hit (secondary)

Departure recorded **evening before** planned dep (truck already in Sankyu). That is “base presence”, not “trip started”. Using it as trip progress is wrong for finish policy.

### 2.4 Loose finish product decision (context)

Loose finish allows skip tujuan — **correct for real skip after trip**, **wrong** for “never left base”.  
Fix should target **same-zone base false finish**, not necessarily kill all loose finish.

---

## 3. Design goal

| Must | Must not |
|------|----------|
| Block finish when truck never left base after trip window opens | Break legitimate: leave → tujuan (optional) → return Sankyu |
| Still allow skip tujuan **if** truck clearly left base and returned | Require admin for every same-zone finish |
| Keep multi-SPK / sequential zone logic intact | Use ETA as GPS finish time |

---

## 4. Recommended approach (best fit)

### Core rule: **Same-zone finish requires proven base exit after trip start**

Define:

```
tripStartTs = planned departure_datetime (unix)
// Do NOT use early departure hit before tripStartTs as “progress”
finishZoneKey === departureZoneKey  →  "base-same-zone finish"
```

**Finish allowed only if ALL of:**

1. `nowTs >= tripStartTs` (already have)
2. **Proven exit after tripStartTs:**
   - Exists GPS message with `t > tripStartTs` **outside** finish polygon, **and**
   - Either:
     - **(A) Duration:** time from first outside after tripStart to re-entry ≥ `MIN_AWAY_SEC` (recommend **15–30 min**, env-configurable), **or**
     - **(B) Distance:** max distance from finish zone centroid while outside ≥ `MIN_AWAY_M` (e.g. **500–2000 m**), **or**
     - **(C) Middle stop hit** after tripStartTs (any non-departure non-finish stop) — then current loose re-entry is enough
3. **Re-entry** into finish zone after that exit (timeline entry or live after leave), with `entryTs > tripStartTs` and after the exit period

**If finish zone ≠ departure zone:** keep current loose rules (exit proof less critical).

### Why this fits #44390

- Ignition blip outside for seconds → fails MIN_AWAY duration/distance  
- Never left meaningfully → no finish  
- Real trip to IPTI (or long leave) → exit duration/distance OK → return → finish even if IPTI polygon missed (loose still works)

### Defaults (proposed)

| Param | Default | Env |
|-------|---------|-----|
| `MIN_AWAY_SEC` | **20 * 60** (20 min) | `GEOFENCE_FINISH_MIN_AWAY_SEC` |
| `MIN_AWAY_M` | **1000** | `GEOFENCE_FINISH_MIN_AWAY_M` |
| Same-zone only | true | — |
| Middle hit bypasses min away | true | — |

Use **OR** of duration and distance (whichever proves first) so sparse GPS still works if truck went far.

---

## 5. Alternative approaches (comparison)

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **R1 Same-zone min away (recommended)** | Targets exact bug; keeps loose skip | Needs tuning thresholds | **Ship this** |
| **R2 Always require ≥1 middle stop** | Simple | Breaks intentional skip-tujuan product | Too strict alone |
| **R3 Require all middles when single-SPK too** | Safest | Kills loose finish entirely | No |
| **R4 minFinishTs = last leave after dep only; ignore early dep hit** | Helps | Alone not enough if ignition re-entry after dep | Partial — include as part of R1 |
| **R5 Don’t assign Departure until truck leaves then…** | Harder | Departure semantics change | Later |
| **R6 Delay finish N hours after departure ETA** | Crude | Real short trips fail; long idle still can false finish after N | Weak |
| **R7 Manual confirm finish** | Safe | Ops load | Only fallback |

**Best: R1 (+ R4 details in minFinishTs).**

---

## 6. Implementation plan

### Phase 1 — Helper: trip evidence

**File:** `geofenceTrackingService.js` (or small pure helpers next to `resolveFinishGpsHit`)

```js
function analyzeBaseExit({
  messages, finishPoints, tripStartTs, minAwaySec, minAwayM, zoneCentroid
}) → {
  leftAfterTripStart: boolean,
  awayDurationSec: number,      // continuous or total outside after tripStart
  maxAwayMeters: number,
  firstExitTs, reentryTs,       // for finish entry binding
  qualifies: boolean            // awayDuration >= min OR maxAway >= min OR false
}
```

Pure function → unit tests with synthetic messages.

### Phase 2 — Tighten `resolveFinishGpsHit`

Inputs: add `departureZoneKey` (or `sameZoneFinish` boolean).

Logic sketch:

```
minFinishTs = tripStartTs  // planned dep only for same-zone gate base
// Optionally: max(tripStartTs, lastMiddleHitTs) if middles exist

if (sameZoneFinish) {
  const evidence = analyzeBaseExit(...)
  const hasMiddleHitAfterTrip = history has non-dep non-finish stop with gps_ts > tripStartTs

  if (!hasMiddleHitAfterTrip && !evidence.qualifies) return null

  // Finish entry must be re-entry AFTER proven exit (not first ignition blip)
  finishEntry = timeline entry with entryTs > evidence.firstExitTs (or > min reentry after qualify)
  // live fallback only if evidence.qualifies and currently inside
} else {
  // existing loose logic
}
```

**Important:** Do not use early Departure hit (`gps_ts < tripStartTs`) as `lastGlobalTs` floor for same-zone finish eligibility (can still seed stop consume separately).

### Phase 3 — Wire from sync/backfill

When calling `resolveFinishGpsHit`:
- Pass departure zone key from departure stop of that SC
- Pass same messages/finishPoints already available

### Phase 4 — Tests

| Case | Expect |
|------|--------|
| Parked Sankyu continuous, dep hit early, after planned dep still inside | **No finish** |
| Leave 30s then re-enter (ignition noise) | **No finish** (below MIN_AWAY) |
| Leave 25 min or >1 km then re-enter, no middle | **Finish OK** |
| Middle IPTI hit then return Sankyu, short leave | **Finish OK** (middle bypass) |
| Finish zone ≠ dep zone | Unchanged loose |
| #44390-like timestamps | **No finish** |

### Phase 5 — Data repair (optional, separate)

SPK #44390 already false-finished:
- Ops: reverse finish? (delete `system:finish_order`, clear status) — **manual script / admin tool**, only if user wants
- Not auto-delete in this plan without explicit request

### Phase 6 — Docs / env

Document env thresholds in comment or PROJECT_CONTEXT.

---

## 7. Interaction with other policies

| Policy | Interaction |
|--------|-------------|
| Loose finish (skip tujuan) | **Kept** if min-away or middle hit proves trip |
| Multi-SPK M2 (D) | Complementary: multi requires all middles; this fixes single-SPK base idle |
| Manual ETA | Unaffected (no GPS same-zone issue) |
| C1 departure map | Already fixed; still required for tripStartTs |

---

## 8. Files

| File | Change |
|------|--------|
| `node_backend/services/geofenceTrackingService.js` | `analyzeBaseExit`, tighten `resolveFinishGpsHit`, wire callers |
| `node_backend/scripts/test-geofence-assign.js` | New cases for #44390-like + min away |

---

## 9. Risks & tuning

| Risk | Mitigation |
|------|------------|
| Real short round-trip < 20 min fails finish | Lower MIN_AWAY_SEC or rely on distance; or middle hit bypass |
| Sparse GPS no “outside” points while on road | Distance if any outside; or middle hit; consider speed>0 outside later |
| Threshold too high for urban | Start 20 min / 1 km; make env tunable |
| Backfill historical same pattern | Same rules apply on backfill |

---

## 10. Success criteria

- [ ] #44390-like scenario does **not** auto-finish  
- [ ] Real leave ≥ threshold + return → finish without middle still works  
- [ ] Middle hit + return → finish  
- [ ] Existing unit tests still pass  
- [ ] No change to manual ETA path  

---

## 11. Recommended product summary (for stakeholders)

**Masalah:** Departure & Finish = Sankyu. Truk parkir + GPS “goyang” saat ignition dihitung re-entry → SPK selesai tanpa trip.

**Solusi terbaik:** Untuk finish **zona sama dengan departure**, wajib bukti **keluar base bermakna** setelah jam berangkat rencana (durasi dan/atau jarak), **atau** minimal satu tujuan ter-hit; baru re-entry = finish. Skip tujuan tetap boleh **setelah** benar-benar meninggalkan base.

---

## 12. Execute when approved

Reply **lanjut eksekusi** to implement Phases 1–4 (and optionally repair #44390).
