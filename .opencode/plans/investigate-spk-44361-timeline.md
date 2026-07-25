# Plan: SPK #44361 (B 9519 FXT) — Timeline belum hijau

## Status data (read-only, verified 2026-07-23)

| Field | Value |
|-------|-------|
| SPK | `44361` |
| Truk | B 9519 FXT, unit Wialon `26484190`, `is_active=1` |
| Area | `127-CLC-KIM` (`id_area=127`) |
| Departure | 2026-07-23 07:00 |
| Arrival ETA | 2026-07-23 15:00 |
| Finish ETA | 2026-07-23 17:00 (`finish_order_datetime` = jadwal, **bukan** GPS hit) |
| Area finish geofence cols | NULL |

### Stops (`sales_cost_step_schedule`)

| id | stop | zone | notes |
|----|------|------|-------|
| 79 | Departure | Sankyu `26237644:1` | `is_departure=1` |
| 80 | Tujuan 1 | **IPTI KIM** `26237644:79` | ETA 15:00 |
| 81 | Finish | Sankyu `26237644:1` | `is_finish=1` |

### Route history

| step_key | zone | gps_time |
|----------|------|----------|
| `stop:79` Departure | Sankyu | **2026-07-22 16:52:16** |
| Tujuan 1 | — | **TIDAK ADA** |
| `system:finish_order` | — | **TIDAK ADA** |

### GPS Wialon (unit 26484190)

- Posisi live: `-6.3910666, 107.158115` → **di dalam** polygon Sankyu (`pointInPolygon = true`).
- Messages ~22 Jul 12:52Z → 23 Jul 10:54Z: **hanya 23–24 titik**, **semua koordinat sama** (Sankyu).
- Unique positions: **1**.
- Left-Sankyu transitions: **0**.
- Hits zone IPTI KIM (bbox ~107.308–107.310, -6.380–-6.377): **0**.
- `messages/load_interval` dengan flags berbeda tetap ~24 pesan → **bukan bug flags**; data Wialon memang “parked” di base.

---

## Root cause analysis

### RC-A — Timeline Tujuan/Finish tidak hijau: **benar secara sistem**

1. **Tujuan 1 (IPTI KIM)** hanya bisa hijau jika ada GPS di dalam polygon zone 79. Tidak ada satupun message di zona itu.
2. **Finish Sankyu** (live + backfill setelah fix 44368) hanya insert `system:finish_order` **setelah semua delivery stop (non-departure) visited**. Karena Tujuan 1 belum hit → Finish **sengaja** di-skip.
3. Truk “sudah di Sankyu” **sekarang** tidak cukup untuk Finish jika belum pernah (atau belum tercatat) ke tujuan. Re-entry Sankyu tanpa Tujuan 1 = incomplete trip by design.

### RC-B — GPS unit tidak merekam perjalanan

Unit seolah **stuck / blackbox tidak update rute**: hanya heartbeat hourly di titik yang sama. Berbeda dengan unit 44368/44363 yang punya ratusan points + trail ke Daikin.

Ini **bukan** bug `fetchZonePolygons` / finish-timeline yang sudah diperbaiki; ini **data GPS kosong untuk trip**.

### RC-C — Departure **sudah** ada di DB; UI seharusnya hijau di node D

`resolveStopTimelineSummary` set `hit: true` jika `id_sc_stop` match:

```88:104:node_backend/routes/schedulePengiriman.js
// historyByStopId dari id_sc_stop
// hit = !!historyEntry
```

History row id 38: `id_sc_stop=79`, `step_key=stop:79` → **Departure harus `hit=true`** (dot hijau `bg-success-500`).

Jika user melihat **“belum hijau sama sekali”**, kemungkinan:

1. **Persepsi**: node D biru brand (hanya jika `hit=false`) / Tujuan+Finish abu — user fokus ke keseluruhan.
2. **Filter/cache UI** Schedule tidak load history row (perlu verifikasi response API live).
3. **Halaman lain** (Detail SC) pakai mapping berbeda — perlu cek `DetailSalesCost.vue` jika keluhan dari sana.

**Bukan** karena truck “belum di Sankyu” — departure sudah tercatat dari kemarin.

### RC-D — Finish ETA 17:00 di `sales_cost` menyesatkan

Kolom terisi sebagai **jadwal** template, sama pola 44363/44368. Schedule status bisa “incomplete” / overdue berdasarkan ETA, sementara GPS finish belum ada.

---

## Apa yang **tidak** boleh di-auto-fix

| Action | Why not |
|--------|---------|
| Insert `system:finish_order` karena posisi sekarang di Sankyu | Melanggar rule “finish after all tujuan visited”; Tujuan 1 belum hit |
| Insert hit IPTI KIM tanpa GPS | Data palsu |
| Longgarkan polygon IPTI agar “Sankyu = hit” | Zona beda kota (Karawang vs Bekasi) |

---

## Recommended plan (setelah approve eksekusi)

### Fase 0 — Konfirmasi opsional ke user (1 pertanyaan)

Apakah B 9519 FXT **benar sudah berangkat ke IPTI KIM** hari ini, atau masih di base Sankyu?

- **Masih di base / GPS stuck** → perbaikan di perangkat Wialon / unit mapping; sistem tidak bisa menghijaukan Tujuan.
- **Sudah trip nyata** → investigasi blackbox Wialon (unit salah / device offline / message storage); opsi manual check-in.

### Fase 1 — Verifikasi API UI (cepat, read-only di eksekusi)

1. GET Schedule untuk SPK 44361 → pastikan `delivery_stops_summary[0].hit === true` untuk Departure.
2. Jika API `hit=true` tapi UI abu → bug frontend class binding / stale cache → fix Vue.
3. Jika API `hit=false` padahal DB ada row → bug mapping `id_sc_stop` / query history (list endpoint) → fix backend.

### Fase 2 — Tidak ada code change wajib untuk “GPS di Sankyu → semua hijau”

Kecuali product decision baru, mis.:

- **Manual mode / manual complete** Tujuan + Finish dari UI (sudah ada pola partial di Sales Cost manual).
- Atau tombol admin “Selesaikan stop” dengan audit.

### Fase 3 — Opsional product improvements (jika diminta)

1. **UI clarity**: label “GPS unit tidak bergerak / tidak ada trail” di Monitoring atau Schedule bila unique positions = 1 selama window trip.
2. **visited_stops summary**: count hanya non-departure (sekarang `id_sc_stop IS NOT NULL` menghitung Departure sebagai visited — bisa menyesatkan badge progress).
3. **Alert unit GPS stale**: last position unchanged > N jam saat SPK on_trip.
4. **Manual hit** untuk stop (admin) dengan `is_manual=1` — untuk kasus blackbox rusak.

### Fase 4 — Jika user minta “paksa hijau” untuk 44361 (explicit)

Hanya dengan approval eksplisit:

- Manual insert Tujuan 1 (is_manual=1) + optional Finish, **atau**
- User pakai alur manual di app.

Jangan silent auto-insert.

---

## Files (jika eksekusi bug UI/API ditemukan)

| File | Kapan disentuh |
|------|----------------|
| `schedulePengiriman.js` | jika history tidak ter-map ke timeline |
| `SchedulePengiriman.vue` / `DetailSalesCost.vue` | jika hit true tapi warna salah |
| `geofenceTrackingService.js` | **tidak** untuk memaksa finish tanpa tujuan |
| Ops / Wialon | unit 26484190 message storage |

## Success criteria

| Goal | Criteria |
|------|----------|
| Honesty | Tujuan/Finish tetap tidak hijau tanpa GPS IPTI atau manual explicit |
| Departure | Node D hijau di Schedule jika history stop:79 ada (verify API+UI) |
| Ops | User paham unit GPS tidak merekam trip (23 pts stuck) |
| Optional | Manual complete path + stale-GPS indicator |

## Ringkasan untuk user

**Sistem bekerja sesuai data GPS:**

- Departure **sudah** tercatat (Sankyu 22 Jul 16:52).
- Truk **sekarang** di Sankyu, tapi Wialon **tidak punya jejak** ke IPTI KIM (semua message di titik yang sama).
- Karena Tujuan 1 belum hit → Finish **belum boleh** hijau (rule yang sama yang dipakai fix 44368).

**Bukan** bug finish-geofence seperti 44368; **data trip GPS kosong / unit stuck**.
