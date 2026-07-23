# Plan: Finish geofence longgar (skip tujuan → tetap Selesai)

## Product decision (confirmed)

| Item | Choice |
|------|--------|
| Finish GPS tanpa semua tujuan | **Boleh** insert `system:finish_order` |
| Status SPK | **`completed` penuh** (lepas on-trip / tidak stuck) |
| Tujuan yang di-skip | Tetap **belum hit** di timeline (abu); **tidak** memblokir completed |
| Waktu finish | **GPS aktual**, bukan ETA |

Tujuan: truk melewati/skip stop, langsung kembali base (Sankyu) → SPK selesai di Schedule + Monitoring.

---

## Current blockers (code)

### 1. Live tracking — gate ketat

```745:752:node_backend/services/geofenceTrackingService.js
// Process finish geofence — only after all non-departure stops visited
const allDeliveryStopsVisited = deliveryStops.every(...)
if (!allDeliveryStopsVisited || existingHistoryKeys.has(finishHistoryKey) || !finishGeofence) {
  continue;
}
```

Tanpa semua tujuan hit → **tidak pernah** insert finish.

### 2. Backfill — gate sama

```1152:1154:node_backend/services/geofenceTrackingService.js
if (allDeliveryVisited && !existingKeys.has(...finishKey)) {
```

### 3. Schedule status — completed butuh semua stop

```50:64:node_backend/routes/schedulePengiriman.js
const completed = finishHit && visitedStops >= totalStops && totalStops > 0;
const incompleteFinish = finishHit && visitedStops < totalStops;
// incomplete_finish menang sebelum completed
```

Bahkan jika finish sudah di-insert, status jadi **`incomplete_finish`** (“Belum Lengkap”), bukan completed — user minta **completed penuh**.

### 4. Monitoring on-trip

```228:232:node_backend/routes/monitoringKendaraan.js
AND NOT EXISTS ( ... step_key = 'system:finish_order' )
```

Sudah benar: begitu finish tercatat, SPK **keluar** on-trip. Yang kurang hanya **insert finish** + status schedule.

### 5. Active tracking candidates

`getActiveSalesCostCandidates` exclude SC dengan `system:finish_order` — OK setelah finish longgar.

---

## Target behavior

| Event | Result |
|-------|--------|
| GPS masuk finish zone (Sankyu / area finish) | Insert `system:finish_order` + `gps_time` aktual |
| Tujuan tengah belum hit | Boleh |
| `schedule_status` | **`completed`** jika `finishHit` |
| Timeline stop tengah | Tetap `hit=false` (opsional label “dilewati”) |
| Monitoring | Tidak on-trip untuk SPK itu |
| Notifikasi overdue | ETA tetap; finish tidak bergantung ETA |

---

## False-finish risk (wajib di-guard)

Finish zone sering **sama** dengan Departure (Sankyu). Tanpa guard, truk yang **belum berangkat** (diam di base) bisa langsung finish.

### Recommended guards (semua AND)

1. **Sudah ada window trip**  
   `entryTs >= departure_datetime` (unix), atau `entryTs >= departure_ts - small_buffer` hanya jika product mau early return (default: **≥ departure_ts**).

2. **Bukan entry departure yang sama**  
   - Jika ada history Departure di zona finish yang sama: finish entry harus **`entryTs > departure_hit_ts`** (re-entry setelah keluar).  
   - Timeline `buildZoneEntryTimeline` sudah memecah re-entry; pakai entry **setelah** consume departure.

3. **minFinishTs**  
   ```
   minFinishTs = max(
     departureTs,                    // planned start
     lastAnyStopHitTs || 0,          // any stop incl. departure
     0
   )
   finish entry: zoneKey match && entryTs > minFinishTs
   ```
   **Hapus** syarat “semua delivery visited”.

4. **Fallback posisi live** (membership / pointInPolygon sekarang)  
   Hanya jika: `now >= departureTs` **dan** (opsional) pernah ada message **di luar** finish polygon setelah departure **atau** sudah ada ≥1 stop hit (departure cukup).  
   Hindari: SPK baru, truk idle di Sankyu → finish instan.

5. **Env kill-switch** (opsional)  
   `GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH=1` → behavior lama (strict). Default **0** = longgar.

---

## Implementation plan

### Phase 1 — Live finish (core)

**File:** `node_backend/services/geofenceTrackingService.js`

1. Hapus / bypass `allDeliveryStopsVisited` untuk gate insert (kecuali env strict).
2. Hitung:
   ```js
   const departureTs = floor(departure_datetime / 1000)
   const { lastGlobalTs } = seedConsumptionFromHistory(scHistoryRows, stops)
   const minFinishTs = Math.max(departureTs, lastGlobalTs)
   ```
3. Cari `finishEntry` di `zoneTimeline` dengan `entryTs > minFinishTs`.
4. Fallback live position: only if `Date.now()/1000 >= departureTs` and (in membership or in polygon).  
   Prefer still requiring “left zone once” if easy: scan messages for any point outside finish polygon with `t > departureTs` before accepting live fallback.
5. Insert `system:finish_order` + update `finish_order_datetime` only if null/zero (existing guard).
6. **Do not** auto-insert missing middle stops.

### Phase 2 — Backfill finish

Same rules as live:

- Drop `allDeliveryVisited &&`
- `minFinishTs = max(departureTs, seed lastGlobalTs)`
- First message in finish polygon with `ts > minFinishTs` (or first re-entry after leave if implementing leave-check)

### Phase 3 — Schedule status = completed on finishHit

**File:** `node_backend/routes/schedulePengiriman.js`

```js
// completed: GPS finish is source of truth
const completed = !!finishHit;
// incomplete_finish: optional stop-level only, NOT schedule_status
// Remove or deprioritize incompleteFinish branch for schedule_status
```

Changes:

1. `resolveScheduleStatus`: if `finishHit` → always `completed` / `has_incomplete_finish: false` (user chose full completed).
2. `resolveStopTimelineSummary`:  
   - Keep finish node `hit` via `system:finish_order`.  
   - **Remove or soften** `incomplete_finish: true` on finish stop when middle missing (user doesn’t want “Belum Lengkap” as primary state).  
   - Optional: middle stops stay overdue styling; finish is success green.

### Phase 4 — Monitoring / active SPK

- No SQL change if finish inserts correctly (`NOT EXISTS system:finish_order` already clears on-trip).
- Verify `finish_order_datetime` null-guard doesn’t block: many SCs have **planned** finish ETA pre-filled → tracking uses history `step_key`, not only datetime.  
  - On-trip uses history ✅  
  - Some idle queries use `finish_order_datetime IS NULL` — planned ETA may already be set; **GPS finish history** is still the gate for on-trip list. Confirm no path requires both.

### Phase 5 — Tests

Extend `scripts/test-geofence-assign.js` **or** small pure helper tests if finish logic extracted:

| Case | Expect |
|------|--------|
| All stops hit then finish re-entry | finish assigned |
| **No middle hits**, finish re-entry after departure | finish assigned |
| Idle in Sankyu before departure | **no** finish |
| Only departure hit (same zone), still inside without leave | **no** finish until re-entry after leave |
| Finish after departure with live position only | finish if post-departure + outside-then-in or post-departure in zone after minFinishTs |

Extract `resolveFinishHit({ departureTs, historyRows, zoneTimeline, finishZoneKey, messages, position })` for testability if finish block grows.

### Phase 6 — Verify ops

1. Unit tests green  
2. Restart backend  
3. Manual: SPK with tujuan belum hit, truck returns Sankyu after having left → finish row + Schedule `completed` + keluar Monitoring on-trip  

---

## Files

| File | Change |
|------|--------|
| `node_backend/services/geofenceTrackingService.js` | Loose finish live + backfill + guards |
| `node_backend/routes/schedulePengiriman.js` | `completed = finishHit`; drop incomplete as status |
| `node_backend/scripts/test-geofence-assign.js` or new finish helper tests | Guards + loose finish |

Optional follow-up (not required for goal):

- UI badge “tujuan terlewat” tanpa mengubah status completed  
- Repair backfill for already-stuck SPKs (truck already at base, no finish row)

---

## Risks

| Risk | Mitigation |
|------|------------|
| False finish at base before trip | `minFinishTs >= departureTs` + re-entry after leave for same-zone departure/finish |
| SPK never departed still “completed” | Same |
| Middle stops look “wrong” gray on completed SPK | Expected; optional copy “dilewati” later |
| Planned `finish_order_datetime` already set | Don’t rely on it for completion; use history; keep UPDATE only if null |

---

## Success criteria

- [ ] GPS finish tanpa semua tujuan → `system:finish_order` inserted  
- [ ] `schedule_status === 'completed'`  
- [ ] Monitoring on-trip **tidak** menampilkan SPK itu  
- [ ] Truk idle pre-departure di Sankyu **tidak** finish  
- [ ] Finish `gps_time` = GPS aktual  
- [ ] Env strict optional for rollback  

---

## Execution

Plan mode — **no code yet**. Reply **lanjut eksekusi** / **implement** to apply.
