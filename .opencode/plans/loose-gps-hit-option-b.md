# Plan: GPS hit aktual + Opsi B (longgar)

## Product intent (user)

1. **Waktu hit = waktu aktual GPS** (`gps_time` dari entry Wialon), **bukan** `estimated_arrival` / ETA.
2. **ETA hanya acuan notifikasi** (overdue / “seharusnya tiba jam …”).  
   Hit jam 10:00 meski ETA 14:00, atau hit lewat ETA → **tetap tercatat**.
3. **Opsi B**: stop boleh ter-hit **tanpa** menunggu stop sebelumnya (urutan lapangan tidak bisa diprediksi).

---

## Current state (verified)

| Area | Behavior |
|------|----------|
| Hit recording | Sudah pakai `entryTs` dari GPS messages → **bukan ETA** |
| `estimated_arrival` in tracking | Hanya di `checkArrivalDelays` (notifikasi overdue) |
| Schedule UI | `actual_arrival` = history `gps_time`; `overdue` = !hit && ETA &lt; now |
| Window messages | `departure − 12h` → `now` (live) / backfill window — **tidak dibatasi ETA stop** |
| Gate sequential | `requirePreviousStopHit: **true**` di live + backfill → **ini yang perlu diubah** |
| Global monotonic | `minTs = max(lastZoneTs, lastGlobalTs)` → stop berikutnya zona lain harus **setelah** jam hit terakhir |

### Why Opsi B needs more than flipping one flag

Scenario lapangan: fisik **Stop2 @ t1 → Stop1 @ t2 → Stop3 @ t3**

| Setting | Hasil |
|---------|--------|
| Gate strict + monotonic | Stop1=t2; Stop2 tidak dapat t1 (t1 &lt; lastGlobal); Stop3 blocked |
| Gate loose only (`requirePreviousStopHit: false`) + still monotonic | Stop1=t2; Stop2 still fails (t1 ≤ lastGlobal) |
| **Gate loose + per-zone consume only** (no global minTs) | Stop1=first zone1 entry; Stop2=first zone2 entry (bisa t1); Stop3=… → **semua bisa tercatat** |

**Kesimpulan implementasi Opsi B yang selaras goal user:**

1. `requirePreviousStopHit: false`
2. **`minTs = lastZoneTs` saja** (jangan pakai `lastGlobalTs` untuk filter entry)  
   - Tetap **per-zone consume** agar KIIC#1 ≠ KIIC#2  
   - `lastGlobalTs` boleh di-seed untuk finish / logging, bukan untuk memblokir hit stop

ETA: **no code change needed** for “hit before/after ETA” — already free. Hanya pastikan tidak ada filter ETA yang terselip (audit saat implement).

---

## Implementation plan

### 1. `assignStopHits` — Opsi B defaults

**File:** `node_backend/services/geofenceTrackingService.js`

```js
// default product:
requirePreviousStopHit = false

// when matching entry:
const minTs = lastZoneTs;  // NOT Math.max(lastZoneTs, lastGlobalTs)

// when no entry:
if (!entry) continue;  // never break on missing (even if requirePrevious true later)
// if requirePreviousStopHit && prev missing: continue (not break) when loose...
// when strict: break remains for optional future env flag
```

Optional env (nice-to-have, not required):

- `GEOFENCE_REQUIRE_PREVIOUS_STOP=0|1` (default `0` = Opsi B)
- Keep code path for strict if later needed

### 2. Wire live + backfill

```js
assignStopHits({ ..., requirePreviousStopHit: false })
// or read from env once
```

Both call sites currently hardcode `true` (~lines 691, 1109) → set `false`.

### 3. Finish order (unchanged rule, still sensible)

- Finish tetap: **setelah semua delivery stop (non-departure) sudah hit**
- Finish entry: `entryTs > last delivery hit time` (max of delivery `gps_ts`)  
  - Masih OK; out-of-order stops all hit → max ts = latest actual visit → finish re-entry after that

### 4. ETA / notifications (explicit boundary)

| Use | Source |
|-----|--------|
| Route history `gps_time` | GPS entry only |
| Overdue notification | `estimated_arrival` / `arrival_datetime` |
| Schedule badge overdue | `!hit && estimated_arrival < now` |
| Display actual | `history.gps_time` |

**Do not** add any `entryTs >= estimated_arrival` check.

Optional small UX (if easy, same PR or follow-up): label “Aktual GPS” vs “Estimasi” di Schedule — already partially there via `actual_arrival`.

### 5. Unit tests — update `scripts/test-geofence-assign.js`

| Case | Expect |
|------|--------|
| Full KIIC→GIIC→KIIC→GIIC | t1,t2,t3,t4 (same as now) |
| Partial seed | 2nd KIIC = t3 not t1 |
| **Out-of-order physical: zone2@t1, zone1@t2, zone3@t3** | Stop1=t2, Stop2=t1, Stop3=t3 (all assigned) |
| Gate loose: stop2 missing entry, stop3 has entry | Stop3 can assign without stop2 |
| Early vs ETA | N/A pure unit (document only) |
| Sequential gate when `requirePreviousStopHit: true` | Keep one test for strict mode if flag retained |

### 6. Verify

1. `node scripts/test-geofence-assign.js`
2. `node --check services/geofenceTrackingService.js`
3. Restart `transport-backend`
4. Spot-check multi-stop SC with real GPS trail (if available)

### Out of scope

- Repair historical wrong rows (duplicate first-hit times) — separate opt-in script
- Changing notification copy
- #44361 stuck GPS

---

## Behavior after change (examples)

### A. Early GPS vs ETA 14:00

Truk masuk zona jam 10:00 → **hit 10:00** tercatat. Notifikasi overdue tidak fire. UI: aktual 10:00, estimasi 14:00.

### B. Late GPS after ETA

Masuk jam 16:00, ETA 14:00 → **hit 16:00** tercatat. Notifikasi overdue mungkin sudah pernah (jika belum hit); setelah hit, stop hijau.

### C. Skip order di lapangan (Stop2 dulu)

Entry zona2 @ 09:00, zona1 @ 10:00 → Stop1=`10:00`, Stop2=`09:00` (waktu aktual GPS). Timeline by `stop_order` bisa tampil “mundur” antar baris — **accepted** under Opsi B. Optional later: sort secondary by `gps_time` di UI.

### D. Repeated zone

KIIC→GIIC→KIIC tetap **entry berbeda** (per-zone consume).

---

## Files

| File | Change |
|------|--------|
| `node_backend/services/geofenceTrackingService.js` | Default loose; minTs per-zone only; call sites |
| `node_backend/scripts/test-geofence-assign.js` | Opsi B cases |

## Risks

| Risk | Mitigation |
|------|------------|
| UI shows stop_order 2 before stop_order 1 by clock | Expected; document; optional UI sort later |
| Missing middle stop still incomplete | Finish still waits all delivery hits |
| First-hit reuse across visits | Still prevented by per-zone consume |

## Success criteria

- [ ] `requirePreviousStopHit` default false in production path  
- [ ] Assignment does not require `entryTs > lastGlobalTs`  
- [ ] Per-zone re-visit still distinct timestamps  
- [ ] ETA never gates insert of GPS hit  
- [ ] Unit tests cover out-of-order + repeated zone  
- [ ] Backend restarted  

---

## No code until you approve

Reply **implement** / **lanjut eksekusi** to apply this plan.
