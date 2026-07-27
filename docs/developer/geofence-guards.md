# Geofence Guards

`assignStopHits` di `geofenceTrackingService.js` memiliki beberapa **guard** untuk mencegah false positive assignment geofence yang ditemukan dari kasus SPK aktual.

## Guard 1 — Departure Pre-Window (fix #44442)

### Masalah

SPK #44442 truk B 9781 FEV:

- Truk **kembali ke base Sankyu** dari trip sebelumnya jam **26 Jul 17:33**
- SPK baru `departure_datetime` = **27 Jul 05:24** (11.8 jam kemudian)
- Re-entry 17:33 ter-assign sebagai **Departure** SPK baru
- Karena Departure zone = Finish zone (Sankyu), sistem lanjut verifikasi leave evidence dari window lama → lolos
- `system:finish_order` dicatat **27 Jul 02:35** padahal truk baru berangkat 05:24

### Fix

Tambah parameter `departureTs` ke `assignStopHits`. Untuk setiap Departure stop, entry yang terjadi lebih dari `GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC` sebelum planned departure **ditolak**.

```
entry.entryTs < (departureTs - departureHitMaxPreWindowSec) → SKIP
```

Default 8 jam = 28800 detik. Truk kembali 11.8 jam sebelum dep → ditolak.  
Truk tiba 6 jam sebelum dep (overnight) → diterima.

### Environment Variable

| Variabel | Default | Keterangan |
|----------|---------|-----------|
| `GEOFENCE_DEPARTURE_HIT_MAX_PRE_WINDOW_SEC` | `28800` (8j) | Set `0` untuk disable guard |

---

## Guard 2 — Same-Zone Inter-Stop Gap (fix #44415)

### Masalah

SPK #44415 truk B 9126 SEU, rute shuttle KIIC → GIIC → KIIC → GIIC → KIIC → GIIC:

- Tujuan 1, 3, 5 semua menggunakan zone KIIC (zone 4)
- Tujuan 3 ter-hit jam **09:37:31**
- Tujuan 5 ter-hit **67 detik** kemudian (09:38:38) — truk masih di KIIC, belum pergi ke GIIC
- Root cause: `inZoneMap` di-reset setiap tracking cycle. Cycle berikutnya membangun fresh timeline, truk masih di KIIC → entry baru terdeteksi → Tujuan 5 ter-assign

### Fix

Tambah `sameZoneMinInterStopGapSec` ke `assignStopHits`. Hit ke-2 di zone yang sama ditolak jika gap dari hit sebelumnya kurang dari threshold.

```
lastHitTs = consumedByZone.get(zoneKey)
entry.entryTs - lastHitTs < sameZoneMinInterStopGapSec → SKIP
```

Default 10 menit = 600 detik. Gap 67 detik → ditolak. Gap 2 jam (real re-entry) → diterima.

### Environment Variable

| Variabel | Default | Keterangan |
|----------|---------|-----------|
| `GEOFENCE_SAME_ZONE_MIN_INTER_STOP_GAP_SEC` | `600` (10m) | Set `0` untuk disable guard |

---

## Finish GPS — Loose + Same-Zone Logic

Selain dua guard di atas, `resolveFinishGpsHit` memiliki logic untuk mencegah finish palsu pada kasus **Departure zone = Finish zone** (seperti Sankyu):

| Condition | Behavior |
|-----------|----------|
| `sameZoneFinish && !middleHitAfterTrip` | Butuh bukti leave ≥ 20 mnt atau ≥ 1 km dari centroid |
| `middleHitAfterTrip` | `analyzeBaseExit` di-skip, finish bisa diproses |
| `now < depTs` | Hard gate — finish tidak pernah dicatat sebelum planned departure |

### Environment Variables Finish

| Variabel | Default | Keterangan |
|----------|---------|-----------|
| `GEOFENCE_FINISH_MIN_AWAY_SEC` | `1200` (20m) | Min durasi di luar zone base |
| `GEOFENCE_FINISH_MIN_AWAY_M` | `1000` (1km) | Min jarak dari centroid base |
| `GEOFENCE_FINISH_LEAVE_LOOKBACK_SEC` | `14400` (4j) | Window lookback untuk bukti leave |
| `GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH` | `0` | Set `1` = strict (semua stop harus hit) |

---

## Auto-Finish berdasarkan Jarak dan Umur

SPK yang terlalu lama aktif akan di-finish otomatis via `applyDueDistanceAgeFinish`:

| Jarak Trip | Auto-finish setelah |
|------------|---------------------|
| ≤ 60 km | 3 hari |
| ≤ 100 km | 7 hari |
| > 100 km | 10 hari |
| Tidak bisa hitung | 3 hari (fallback) |

Timer dihitung dari `departure_datetime`. Insert `system:finish_order` dengan `is_manual=1`.

| Variabel | Default |
|----------|---------|
| `GEOFENCE_AGE_FINISH_SHORT_KM` | `60` |
| `GEOFENCE_AGE_FINISH_MID_KM` | `100` |
| `GEOFENCE_AGE_FINISH_DAYS_SHORT` | `3` |
| `GEOFENCE_AGE_FINISH_DAYS_MID` | `7` |
| `GEOFENCE_AGE_FINISH_DAYS_LONG` | `10` |
| `GEOFENCE_AGE_FINISH_DAYS_FALLBACK` | `3` |
| `GEOFENCE_AGE_FINISH_DRY_RUN` | `0` | Set `1` untuk log-only tanpa INSERT |

---

## Unit Tests

29 test cases mencakup semua guard, termasuk kasus #44442, #44415, dan edge cases:

```bash
cd node_backend
node scripts/test-geofence-assign.js
```
