# Audit M2: Multi-SPK satu truck — finish geofence

**Mode:** plan only (read-only audit + fix plan).  
**Tidak dieksekusi** sampai user pilih policy + setuju implementasi.

---

## 1. Problem statement

Satu truck sering punya **2–4 SPK aktif** di hari yang sama (sudah didukung H9: tracking **semua** SPK, bukan 1 per truck).

**Finish zone hampir selalu sama** (Sankyu / base).  
Dengan **loose finish** (boleh finish tanpa semua tujuan), saat truck **re-entry Sankyu**:

> **Setiap** SPK unfinished pada truck itu yang lolos `resolveFinishGpsHit` bisa **semuanya** dapat `system:finish_order` di cycle yang sama.

Itu M2: **finish “pulang base” menutup banyak SPK sekaligus**, termasuk yang masih harus ke tujuan lain.

---

## 2. Current behavior (code)

### Tracking candidates
```333:381:geofenceTrackingService.js
// ALL unfinished SPKs with unit + zone, last 30 days
// Explicit comment: one per SPK, not one per truck (H9)
```

### Per-SC loop (independent)
For each active SC on same `wialon_unit_id`:
1. Fetch **same** GPS messages (per unit, per SC window)
2. Assign stop hits (per-SC history seed)
3. `resolveFinishGpsHit(...)` **independently**
4. Insert finish if true

**Tidak ada** koordinasi antar-SC pada truck yang sama.

### Monitoring
- `onTripByTruck`: list **semua** unfinished SPK truck
- `active_spk_count` / `active_spk_ids` — multi-SPK **sudah ditampilkan**
- Primary display = latest departure

Monitoring **bukan** root cause false multi-finish; tracking finish-lah.

---

## 3. Live evidence (DB, 14 hari)

Contoh **B 9454 FFX** (`wialon_unit_id` 26484197):

| SPK | Departure | Route (stops) | History now |
|-----|-----------|---------------|-------------|
| **44373** | 23 Jul 09:11 | Sankyu → ROHM → **NIPSEA Purwakarta** → Sankyu | Dep + Tujuan 1 |
| **44357** | 23 Jul 04:00 | Sankyu → ROHM → **LG Tangerang** → Sankyu | Dep + Tujuan 1 |

Keduanya belum `system:finish_order`.  
Jika truck kembali Sankyu sekarang:

- Kedua SC punya departure lewat, history hit, finish zone Sankyu  
- Loose finish → **kedua SPK bisa completed** meski Tujuan 2 (NIPSEA vs LG) belum hit  

Ini skenario M2 nyata, bukan hipotetis.

---

## 4. Risk matrix

| Scenario | Risk without M2 fix |
|----------|---------------------|
| 2 SPK, finish zone sama (Sankyu) | Kedua finish saat satu re-entry |
| SPK A selesai rute, SPK B masih on-trip | B ikut finish “numpang” pulang A |
| Multi-leg same day (KIIC×2) | SPK belum jalan ikut close |
| Manual ETA multi-SPK | Kurang parah (per-ETA), tapi complete-all admin masih per-SC |

**Stop hits (tujuan)** per zone: relatif aman karena seed per-SC + zone ids berbeda.  
**Bahaya utama = finish zone shared.**

---

## 5. Design options (policy)

### Option A — Primary-only finish (strict multi)

Hanya **satu** SPK “primary” per truck boleh auto-finish di cycle:

Primary = unfinished, has schedule, **latest** `departure_datetime` (lalu max `id_sales_cost`).

Lainnya: tetap track **stop hits**, **tidak** auto-finish sampai jadi primary.

| Pro | Con |
|-----|-----|
| Sederhana | SPK lama stuck sampai yang baru finish dulu |
| Cocok “satu trip fisik = SPK terbaru” | Salah jika ops sengaja selesaikan SPK lama dulu |

### Option B — Finish only if “progress sufficient” (recommended default)

Auto-finish SPK **hanya jika** salah satu:

1. **Semua** non-departure non-finish stops sudah hit, **atau**  
2. **≥1** middle stop hit **dan** re-entry finish after `max(middle hit ts)`, **atau**  
3. Explicit env: allow empty-middle finish only when **exactly 1** active SPK on that truck

Jika multi-active **dan** zero middle hits → **jangan** finish (hindari “belum berangkat tujuan ikut close”).

Untuk contoh 44373/44357 (keduanya sudah Tujuan 1): keduanya **boleh** finish on Sankyu re-entry → **masih double-close**.

Jadi B perlu ditambah:

**B+ — At most one finish per truck per re-entry event**

- Group candidates by `wialon_unit_id`
- Detect finish-eligible SCs
- Jika >1 eligible on same unit: finish **only primary** (latest departure), others wait next re-entry after their own later activity **or** until they become primary

### Option C — Finish consumes re-entry (queue)

- Build shared zone timeline per unit once
- Finish re-entries = list of Sankyu entries after each SC’s minFinishTs
- Assign **one finish entry to one SC** (FIFO by departure or primary-first)
- Next re-entry needed for next SC

| Pro | Con |
|-----|-----|
| Paling akurat “pulang sekali = satu SPK” | Butuh refactor: unit-level timeline, not pure per-SC |
| Cocok multi trip same day | Truck must leave+return again for 2nd SPK |

### Option D — Require all middle stops when multi-active

If `count(active SPK on truck) > 1`:

- Force `requireAllStopsBeforeFinish = true` for that truck’s SCs  
- Single-active: keep loose finish

| Pro | Con |
|-----|-----|
| Mencegah skip-tujuan false finish multi | SPK multi yang sengaja skip tujuan stuck sampai manual |

### Option E — Product “active SPK lock”

Ops only allows 1 open SPK per truck (UI/API validation).

| Pro | Con |
|-----|-----|
| Eliminates M2 | Bertentangan dengan H9 multi-SPK ops model |

---

## 6. Recommended policy (for plan default)

**Hybrid C-lite + D for multi:**

1. **Group by unit** after loading all active GPS candidates.  
2. **Per unit:**
   - Build messages **once** (perf bonus).  
   - For **stop hits**: still all SCs (H9 remains).  
   - For **finish**:
     - If `activeCount == 1`: current loose finish.  
     - If `activeCount > 1`:
       - Prefer finish only SCs with **all middle stops hit** (strict for multi), **else**  
       - Among remaining, **only primary** (latest departure) may use loose finish (skip middle), **else**  
       - Never finish SC with **zero** middle hits when multi-active.

**Simpler shippable MVP (recommended first ship):**

### MVP = Option D + primary tie-break

```
activeOnTruck = unfinished SCs with schedule for this unit
if activeOnTruck.length === 1:
  use current loose finish
else:
  // multi
  for each SC:
    if all middle stops hit → allow finish (loose not needed)
    else → do NOT auto-finish (admin complete-all / wait all middles)
```

Plus optional: if **exactly one** SC has all middles hit, only that one finishes; others wait.

**Does not allow** multi loose-skip when 2 SPKs both mid-route (safer).

**User must confirm** if multi + skip-tujuan still desired → then need Option C (consume re-entry).

---

## 7. Implementation plan (after policy choice)

### Phase 1 — Detect multi-active context

```js
// After getActiveSalesCostCandidates:
const byUnit = Map<unitId, SalesCost[]>
// activeCount = byUnit.get(unit).length
```

Pass `siblingActiveCount` or `isMultiActiveOnTruck` into finish decision.

### Phase 2 — Apply finish policy

In `syncGeofenceRouteHistory` finish block:

```js
const multi = siblingActiveCount > 1;
const finishHit = resolveFinishGpsHit({
  ...,
  requireAllStopsBeforeFinish: multi || DEFAULT_REQUIRE_ALL_STOPS_BEFORE_FINISH,
  // or custom: requireAllStopsBeforeFinish: multi ? true : default
});
```

If policy = MVP (D): when multi, force all middle hits.

If policy = B+/C: additional primary / entry-consume logic.

### Phase 3 — Unit-level message cache (optional perf)

`Map<unitId, messages>` for shared fetch when multi SCs share unit.

### Phase 4 — Manual ETA multi-SPK

`applyDueManualEtaHits` is per-SC by ETA — lower risk.  
Optional: when multi manual on same truck, still OK (time-based).  
No change required for MVP unless finish ETA same minute for two SPKs (rare).

### Phase 5 — Monitoring (optional UX)

- Badge: “2 SPK aktif — finish ketat sampai tujuan lengkap”
- No logic change required for MVP

### Phase 6 — Tests

| Case | Expect (MVP D) |
|------|----------------|
| 1 SC, skip middle, re-entry Sankyu | Finish OK (loose) |
| 2 SC same truck, both missing middle | **Neither** finishes on re-entry |
| 2 SC, A all middles hit, B not | **Only A** finishes |
| 2 SC, both all middles hit | Both may finish (same re-entry) — document OR apply primary-only for finish if product wants single |

**If product wants “both complete all middles still only one finish per re-entry”** → add Option C in Phase 2b.

### Files
- `node_backend/services/geofenceTrackingService.js` (core)
- `node_backend/scripts/test-geofence-assign.js` or new `test-multi-spk-finish.js`
- Optional: Monitoring tooltip copy

---

## 8. Clarifying question (required before implement)

**Saat 1 truck 2 SPK aktif, truck pulang Sankyu sekali:**

| Pilihan | Perilaku |
|---------|----------|
| **D (Recommended MVP)** | Finish auto hanya SPK yang **semua tujuan sudah hit**; yang skip tujuan **tidak** auto-finish |
| **C** | Satu pulang = **satu** SPK finish (antrian); SPK berikutnya butuh keluar-masuk lagi |
| **A** | Hanya SPK **terbaru** yang boleh auto-finish (longgar); SPK lama nunggu |
| **E** | Larang multi open SPK di form (product lock) |

Tanpa jawaban, default plan mengasumsikan **D**.

---

## 9. Success criteria (MVP D)

- [ ] Multi-active truck: re-entry Sankyu does **not** close SPK with unfinished middle stops  
- [ ] Single-active truck: loose finish unchanged  
- [ ] Multi-active with all middles hit: can complete  
- [ ] Stop tracking for all SPKs still works (H9)  
- [ ] Unit tests for 1 vs 2 SC finish matrix  
- [ ] Live check B 9454 FFX: returning base does not dual-close 44373+44357 unless middles complete  

---

## 10. Out of scope

- Changing multi-SPK creation rules (unless E)  
- Historical dual-finish cleanup  
- Manual complete-all policy  

---

## Next step

User pilih policy **D / C / A / E** (atau hybrid), lalu **lanjut eksekusi**.
