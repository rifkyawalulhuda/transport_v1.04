# Plan: Fix Finish Geofence SPK #44368 (B 9974 SYM / Sankyu)

## Status data (read-only, verified)

| Field | Value |
|-------|-------|
| SPK | `44368` |
| Truk | B 9974 SYM, unit `26484179` |
| Departure | 2026-07-23 08:00 |
| Tujuan 1 | PT. Daikin Industries Indonesia — **HIT** 09:08:40 |
| Finish (scss) | zone Sankyu `26237644:1`, ETA 11:01 |
| History finish | **TIDAK ADA** `system:finish_order` |
| `finish_order_datetime` | `2026-07-23 11:01:00` (jadwal, **bukan** bukti GPS hit) |
| Area finish geofence cols | **NULL** → live sync pakai fallback nama "Sankyu" |
| GPS cache truk | lat `-6.3894883`, lon `107.158855` (18:04:17) |
| `pointInPolygon` posisi sekarang | **false** (~3.7 m di **luar** edge polygon Sankyu) |
| Membership Wialon `get_zones_by_unit` | unit **tidak** di zone 1 |
| Re-entry Sankyu setelah Tujuan 1 | **ada**: `2026-07-23T05:00:15Z` = **12:00:15 WIB** (lat -6.3905, lon 107.1595) |

Kesimpulan: truk **sudah pernah masuk** Sankyu setelah tujuan (~12:00 WIB), tapi row finish **tidak pernah di-insert**. Posisi "saat ini" di UI bisa terlihat di Sankyu padahal ~4 m di luar polygon Wialon (dan membership API juga kosong).

---

## Root causes (code)

### RC1 — Live finish pakai membership API, bukan timeline GPS (utama)

`syncGeofenceRouteHistory` (live):

- Stops → `buildZoneEntryTimeline` + `pointInPolygon` (message history) ✅  
- **Finish** → `fetchUnitsInZonesByResource` / `resource/get_zones_by_unit` **hanya posisi saat ini** ❌  

```556:569:node_backend/services/geofenceTrackingService.js
// Process finish geofence — only after all non-departure stops visited
...
const finishMembership = membershipByResource.get(finishResourceId)?.get(finishZoneId) || null;
if (!finishMembership || !finishMembership.has(unitId)) continue;
```

Jika truk sempat masuk Sankyu lalu keluar sedikit / GPS drift / polygon ketat, finish **tidak pernah** tercatat meski sudah re-entry di history.

### RC2 — Bug `gpsTime` undefined saat insert finish

Di loop per-SC, `gpsTime` hanya didefinisikan di fase update cache truck (scope luar). Di blok insert finish dipakai `gpsTime` tanpa definisi lokal → **ReferenceError** potensial → insert finish gagal diam-diam / cycle error.

```590:592:node_backend/services/geofenceTrackingService.js
gpsTime,
position?.lat ?? null,
position?.lon ?? null
```

### RC3 — Backfill finish hanya dari kolom `area.finish_geofence_*`

```856:858:node_backend/services/geofenceTrackingService.js
const fResId = normalizePositiveIntString(sc.finish_geofence_resource_id);
const fZId = normalizePositiveIntString(sc.finish_geofence_zone_id);
if (fResId && fZId) {
```

Untuk area 117 semua NULL → **backfill finish selalu skip**, padahal scss stop Finish (id 98) sudah punya zone Sankyu, dan live sync punya fallback `findDefaultFinishGeofence()`.

### RC4 (kontribusi) — Finish scss `is_finish=1` di-exclude dari query stops

Stops dimuat dengan `AND is_finish = 0`, jadi stop Finish #98 **tidak** diproses lewat timeline. Finish hanya lewat jalur `system:finish_order` terpisah → rawan RC1–RC3.

### RC5 (observasi UI/GPS) — Posisi sekarang di luar polygon

Bukan root cause utama (re-entry 12:00 sudah valid), tapi menjelaskan "GPS terlihat di Sankyu" vs `pointInPolygon` false. Jangan longgarkan polygon di code; optional later: buffer kecil / radius zone type.

---

## Recommended fix (implementation)

### 1. Samakan deteksi finish live dengan stop timeline

Di `syncGeofenceRouteHistory`, setelah semua delivery stops visited:

1. Resolve finish geofence: area cols → fallback default "Sankyu" → **atau** scss finish row (`is_finish=1`) zone.
2. Pastikan zone finish masuk `zonePolygonMap` (tambah resource/zone finish ke fetch polygon, bukan hanya membership).
3. Deteksi hit dengan **salah satu**:
   - **Prefer:** entry di `zoneTimeline` untuk `finishResource:finishZone` dengan `entryTs` **setelah** entry tujuan terakhir (last delivery stop hit time), ATAU  
   - **Fallback membership** (posisi saat ini) + `pointInPolygon(position, polygon)` jika timeline kosong.
4. Insert `system:finish_order` dengan `gps_time` dari entry/hit (bukan `gpsTime` undefined).
5. `UPDATE finish_order_datetime` hanya jika null/zero (sudah ada) — **jangan** overwrite jadwal 11:01 yang sudah diisi manual/template kecuali policy diubah (confirm dengan user).

### 2. Perbaiki backfill finish

- Gunakan `resolveFinishGeofenceForSalesCost` + fallback default (sama live).
- Alternatif/plus: jika scss punya row `is_finish=1` dengan zone, gunakan itu.
- Gate: hanya insert finish jika **semua** non-departure non-finish stops sudah ada di history (sama live).
- Cari hit di messages dengan `pointInPolygon`; pilih hit **setelah** waktu hit tujuan terakhir jika ada.

### 3. Fix `gpsTime` scope

```js
const finishGpsTime = toMySqlDateTime(
  entry ? new Date(entry.entryTs * 1000) : (position?.gps_time || new Date())
);
```

### 4. Backfill one-shot SPK 44368

Setelah fix deploy/restart:

- Window: dari setelah Tujuan 1 (`2026-07-23T02:08:40Z`) sampai now, atau full day.
- Expect insert: `system:finish_order` ~ `2026-07-23 12:00:15` (WIB) lat/lon re-entry.
- Verify Schedule: Finish badge `hit=true` via fallback `step_key === 'system:finish_order'` (sudah ada di `schedulePengiriman.js`).

### 5. Verifikasi

| Check | Expected |
|-------|----------|
| History 44368 | + row `system:finish_order` |
| Schedule UI | Finish hijau / `finish_hit` |
| Unit tests / manual | Unit di dalam polygon → finish insert; unit di luar + history re-entry → tetap insert; area finish null → fallback Sankyu |
| Regression 44363 | Daikin stop tetap ada |

### 6. Out of scope (opsional follow-up)

- Buffer ~10–20 m untuk zone polygon / circle zones Wialon `r`
- Set `area.finish_geofence_*` di master area agar tidak bergantung fallback nama
- Align `finish_order_datetime` (jadwal) vs `gps_time` finish (aktual) di UI label

---

## Files to touch

1. `node_backend/services/geofenceTrackingService.js` — live finish + backfill finish + gpsTime
2. (opsional) `node_backend/services/wialonService.js` — hanya jika helper shared
3. Tidak perlu UI change (fallback finish sudah ada)

## Execution order

1. Implement RC1–RC3 di `geofenceTrackingService.js`
2. Restart `transport-backend`
3. Targeted backfill / one-shot insert 44368
4. Confirm history + Schedule
5. Spot-check 1–2 SPK lain dengan Finish belum hit + truck di base

## Risk

- Finish terlalu awal jika re-entry Sankyu terjadi **sebelum** tujuan (departure juga Sankyu): **wajib** filter `entryTs > lastDeliveryHitTs`.
- Overwrite `finish_order_datetime` jadwal: jaga guard existing (hanya set jika null).
