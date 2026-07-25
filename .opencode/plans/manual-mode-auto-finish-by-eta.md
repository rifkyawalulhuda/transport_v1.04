# Plan: Auto-finish SPK mode Manual / tanpa GPS (berdasarkan ETA)

## Goal

SPK truk **tanpa pelacakan GPS** (Mode Manual di form Sales Cost) **finish otomatis** dari acuan estimasi jam yang diinput saat transaksi:

- Departure / Location (tujuan) / Finish → `estimated_arrival` di `sales_cost_step_schedule`
- Hasil: Schedule & Monitoring **tidak stuck** on-trip / menunggu GPS

**Keputusan product (user):**  
**Semua stop by ETA** — tiap stop ter-hit otomatis saat `NOW ≥ estimated_arrival` stop tersebut; Finish memicu `system:finish_order`.

---

## Current state (gap analysis)

| Fitur | Ada? | Catatan |
|-------|------|---------|
| Mode Manual UI form | Ya | `useManualMode` — geofence optional; hanya `stop_name` + `estimated_arrival` |
| Persist flag `manual_mode` di DB | **Tidak** | Hanya UI create; tidak disimpan di `sales_cost` |
| Manual check-in per stop | Ya | `POST .../check-in` → history `is_manual=1` |
| Selesaikan Semua (admin) | Ya | `POST .../complete-all` — pakai ETA jika lewat, else now; **manual admin only** |
| Geofence tracking auto | Ya | Butuh `wialon_unit_id` + zone; skip truck tanpa unit |
| Auto-hit by ETA scheduled | **Tidak** | Manual SPK stuck sampai admin complete-all / check-in |

**Monitoring stuck** karena:

```sql
-- on-trip: belum ada system:finish_order
NOT EXISTS ( ... step_key = 'system:finish_order' )
```

**Schedule** menunggu hit history / finish GPS.

**Complete-all** sudah punya pola ETA yang diinginkan:

```2315:2321:node_backend/routes/salesCost.js
// Use estimated_arrival if in the past, otherwise now
if (stop.estimated_arrival) {
  const estimated = new Date(stop.estimated_arrival);
  arrivedAt = estimated <= now ? new Date(estimated) : new Date(now);
}
```

→ Reuse logika ini di job otomatis, **tanpa** butuh klik admin, **hanya** jika ETA sudah lewat (jangan pakai `now` untuk stop masa depan).

---

## Detection: SPK “manual / no GPS”

Tidak ada kolom `is_manual` di `sales_cost`. Deteksi kandidat:

**Eligible** jika **salah satu**:

1. **Truck tanpa Wialon:** `t.wialon_unit_id IS NULL OR t.wialon_unit_id = ''`
2. **Jadwal tanpa geofence:** semua stop non-finish punya `wialon_zone_id IS NULL` (mode manual form)
3. **Opsional explicit flag** (recommended): kolom `sales_cost.is_manual_mode TINYINT(1)` diisi form saat create/edit

**Recommended hybrid:**

- Simpan `is_manual_mode` dari form (source of truth)
- **Plus fallback** truck tanpa unit / stops tanpa zone (SPK lama)

**Exclude** dari auto-ETA:

- Sudah ada `system:finish_order`
- Stop sudah ada history (`stop:{id}`)
- GPS-capable SPK (punya zone + unit) → biarkan geofence tracking

---

## Target behavior (semua stop by ETA)

```
Setiap cycle (interval tracking, mis. 60s):

Untuk setiap SC eligible (manual / no GPS), belum finish:
  stops = scss ORDER BY stop_order (is_finish=0 and is_finish=1)

  Untuk setiap stop belum hit:
    IF estimated_arrival IS NULL → skip (atau log warn)
    IF NOW < estimated_arrival → skip (belum waktunya)
    ELSE:
      INSERT route_history stop:{id}
        gps_time = estimated_arrival   -- acuan ETA, bukan NOW
        is_manual = 1
        lat/lon = NULL
      IF is_finish=1 OR stop is last finish row:
        juga INSERT system:finish_order (is_manual=1)
        UPDATE finish_order_datetime hanya jika null/zero
          → set = estimated_arrival finish (atau NOW jika product prefer detection time)
```

### Urutan & monotonic

- Proses **urut `stop_order`**.
- Jika stop N ETA lewat tapi stop N−1 belum hit dan ETA N−1 juga lewat → isi N−1 dulu lalu N (satu cycle).
- Jika stop N ETA lewat tapi stop N−1 ETA **belum** lewat → **jangan** loncat (tetap sequential by schedule).  
  Exception product? User pilih full-by-ETA sequential — **strict by stop_order + ETA due**.

### Departure

- Saat `NOW ≥ departure.estimated_arrival` → hit departure (`is_manual=1`).
- Tidak memblokir monitoring: on-trip gate = finish history.

### Finish

- Saat finish stop ETA due → hit finish stop + **`system:finish_order`** (wajib, single source of truth).
- Monitoring keluar on-trip.
- Schedule `completed` (finishHit).

### Tujuan tengah

- Hit by ETA masing-masing → timeline hijau bertahap, bukan “geofence dilewati” (itu untuk GPS skip).

---

## Architecture

### Option A — Extend `geofenceTrackingService` cycle (recommended)

Di `runSyncCycle` / interval yang sama:

1. `syncGeofenceRouteHistory()` (GPS trucks)
2. **`syncManualEtaHits()`** (manual / no-GPS)

Satu interval, satu proses PM2, tidak perlu cron terpisah.

### Option B — Cron terpisah

Lebih kompleks; tidak perlu kecuali interval tracking dimatikan.

**Pilih A.**

### Shared insert helper

Extract dari complete-all / check-in:

```js
// services/manualEtaTrackingService.js  OR inside geofenceTrackingService.js
async function applyDueManualEtaHits() {
  // query candidates, insert missing due stops
}
```

Reuse column patterns dari `complete-all` (is_manual=1, step_key, finish_order).

---

## Implementation steps

### 1. Schema (recommended)

Migration:

```sql
ALTER TABLE sales_cost
  ADD COLUMN is_manual_mode TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = created/edited without GPS geofence tracking';
```

Form `SalesCostForm.vue`: kirim `is_manual_mode: useManualMode` pada create/update.  
Backend `salesCost.js` persist kolom.

Fallback tanpa migration dulu: deteksi truck/stops only (bisa ship phase 1 tanpa kolom, phase 1b tambah flag).

### 2. Query kandidat

```sql
SELECT sc.id_sales_cost, sc.id_area, sc.id_truck, sc.departure_datetime,
       sc.finish_order_datetime, sc.is_manual_mode,  -- if exists
       t.wialon_unit_id
FROM sales_cost sc
JOIN truck t ON t.id_truck = sc.id_truck
WHERE NOT EXISTS (
  SELECT 1 FROM sales_cost_route_history h
  WHERE h.id_sales_cost = sc.id_sales_cost AND h.step_key = 'system:finish_order'
)
AND sc.departure_datetime IS NOT NULL
AND sc.departure_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)  -- bound work
AND (
  sc.is_manual_mode = 1
  OR t.wialon_unit_id IS NULL OR t.wialon_unit_id = ''
  OR NOT EXISTS (
    SELECT 1 FROM sales_cost_step_schedule s
    WHERE s.id_sales_cost = sc.id_sales_cost
      AND s.is_finish = 0 AND s.wialon_zone_id IS NOT NULL
  )
)
```

### 3. Apply due hits

For each SC:

1. Load stops + existing history keys.
2. For each stop in order, if not hit and `estimated_arrival <= NOW()`:
   - Insert history (mirror check-in / complete-all).
3. If finish stop inserted or is_finish processed → ensure `system:finish_order`.

**gps_time:** gunakan **`estimated_arrival`** (acuan user), bukan `NOW()`, agar timeline = jadwal input.  
**recorded_at:** NOW() (kapan sistem mendeteksi).

### 4. Wire to interval

`startGeofenceTracking` / `runSyncCycle`:

```js
await syncGeofenceRouteHistory();
await applyDueManualEtaHits();  // new
await checkArrivalDelays();     // existing
```

Errors isolated: manual ETA gagal tidak gagalkan GPS sync.

### 5. UI / UX (optional small)

- Badge stop: `is_manual` sudah “Manual” — tetap.
- Tooltip: “Hit otomatis dari estimasi (mode manual)”.
- Form: simpan `is_manual_mode` (jika migration).

### 6. Validation on create (manual mode)

Sudah: ETA wajib. Pastikan Finish `estimated_arrival` selalu terisi di mode manual (sudah di form).  
Backend: reject manual SC tanpa finish ETA jika flag on.

### 7. Tests

Unit / script:

| Case | Expect |
|------|--------|
| Manual SC, finish ETA lewat, no history | finish + system:finish_order inserted |
| Tujuan ETA lewat, finish belum | hanya tujuan hit |
| GPS truck + zones | **tidak** kena applyDueManualEtaHits |
| Truck no unit, ETA future | no insert |
| Already finished | skip |
| Monotonic: dep 10:00, tujuan 12:00, both past | both hit with ETA times |

### 8. Stuck SPK existing (one-shot)

Opsional script/backfill: jalankan `applyDueManualEtaHits` once after deploy untuk SC 30 hari last without finish.

---

## Monitoring & Schedule impact

| Layer | After change |
|-------|----------------|
| Monitoring on-trip | Clear when `system:finish_order` auto-inserted after finish ETA |
| Schedule status | `completed` via finishHit |
| Timeline | Stops turn green at ETA progressively (Manual badge) |
| Overdue notifications | Still fire if ETA passed without hit; after auto-hit, stop not overdue |

---

## Countermeasure mapping (user)

| User idea | Implementation |
|-----------|----------------|
| Acuan estimasi Departure / Location / Finish | `scss.estimated_arrival` per stop |
| Finish otomatis | Insert `system:finish_order` when finish ETA due |
| Tidak stuck Schedule/Monitoring | Same truth as GPS finish |

---

## Files to touch

| File | Change |
|------|--------|
| `db/migrations/..._sales_cost_is_manual_mode.sql` | Optional but recommended flag |
| `node_backend/routes/salesCost.js` | Persist `is_manual_mode`; reuse insert helpers if extracted |
| `tailadmin-vuejs-1.0.0/src/components/sales-cost/SalesCostForm.vue` | Send `is_manual_mode` |
| `node_backend/services/geofenceTrackingService.js` **or** `manualEtaTrackingService.js` | `applyDueManualEtaHits` |
| `node_backend/server.js` / tracking start | Call new sync in cycle |
| `scripts/test-manual-eta-hits.js` | Fixtures |

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| GPS truck wrongly auto-ETA | Exclude if has unit **and** any stop has zone |
| Finish too early (ETA wrong) | Trust user input; admin can still edit / complete-all |
| Double insert | UNIQUE / INSERT IGNORE on step_key; check existing history |
| Planned `finish_order_datetime` already set as ETA | On-trip uses **history** finish key, not only datetime — OK |
| Timezone | Use same MySQL `local` / app timezone as complete-all |

---

## Out of scope

- Changing GPS loose-finish rules
- Auto-complete for GPS trucks that lost signal mid-trip (different product)
- Replacing admin “Selesaikan Semua” (tetap ada sebagai override)

---

## Success criteria

- [ ] Manual / no-GPS SPK: after finish ETA, `system:finish_order` exists without admin click  
- [ ] Intermediate stops auto-hit when each ETA due  
- [ ] Monitoring not stuck on-trip for those SPKs  
- [ ] Schedule shows completed + Manual badges  
- [ ] GPS SPKs unchanged (still geofence-driven)  
- [ ] Unit tests / dry-run script green  

---

## Execution order

1. (Optional) migration `is_manual_mode` + form wire  
2. Implement `applyDueManualEtaHits` + candidate query  
3. Wire into tracking interval  
4. Tests + restart backend  
5. Spot-check one manual SPK with past finish ETA  

**Plan mode — no code until user says implement / lanjut eksekusi.**
