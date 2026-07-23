# Audit: Logika bisnis timeline pengiriman (read-only)

Tanggal audit: 2026-07-23  
Scope: GPS geofence tracking, finish longgar, manual ETA, Schedule, Monitoring, source of truth.

---

## 1. Arsitektur truth (yang disepakati di code)

| Konsep | Source of truth |
|--------|-----------------|
| Stop visited | `sales_cost_route_history` row `step_key = stop:{id}` |
| SPK selesai (GPS & manual) | `step_key = system:finish_order` |
| Waktu aktual hit | `gps_time` (GPS entry **atau** ETA manual `is_manual=1`) |
| Estimasi / jadwal | `scss.estimated_arrival`, `sc.departure/arrival/finish_order_datetime` |
| Overdue notifikasi | ETA lewat + belum hit |
| Schedule `completed` | `finishHit` (= ada `system:finish_order`) |
| Monitoring on-trip | **Tidak** ada `system:finish_order` (14 hari) |

**Pemisahan ETA vs GPS sudah benar secara desain** untuk tracking GPS.  
**Inkonsistensi:** kolom `finish_order_datetime` sering diisi **saat create** sebagai ETA, bukan saat selesai GPS → dipakai di beberapa query seolah “sudah finish”.

---

## 2. Alur yang benar (OK)

### 2.1 GPS multi-stop zona berulang
- `buildZoneEntryTimeline` + `assignStopHits` + seed history  
- Per-zone consume → KIIC#2 ≠ waktu KIIC#1  
- Opsi B: tidak wajib stop sebelumnya  
- Hit = waktu GPS, bukan ETA  

### 2.2 Finish longgar (GPS)
- `resolveFinishGpsHit`: boleh tanpa semua tujuan  
- Guard: setelah departure, re-entry / leave trail (hindari idle di base)  
- Schedule: `completed` jika `finishHit`  
- Label **Geofence dilewati** untuk stop tengah setelah finish  

### 2.3 Manual / no-GPS
- `applyDueManualEtaHits`: hit stop saat `NOW ≥ estimated_arrival`  
- Finish → `system:finish_order` + `is_manual=1`  
- Kandidat: `is_manual_mode` OR no unit OR no zones  

### 2.4 Single source finish di UI
- Schedule & Detail SC: finish stop hit via `system:finish_order` fallback  

---

## 3. Temuan — kesalahan / risiko logika

### CRITICAL

#### C1 — `departure_datetime` tidak di-pass ke objek kandidat GPS

```366:376:node_backend/services/geofenceTrackingService.js
.map((row) => ({
  id_sales_cost: ...,
  id_area: ...,
  id_truck: ...,
  wialon_unit_id: ...,
  finish_geofence_*: ...,
  // ❌ departure_datetime TIDAK di-map
}));
```

Dipakai di:

```749:node_backend/services/geofenceTrackingService.js
const departureTs = Math.floor(new Date(salesCost.departure_datetime).getTime() / 1000);
```

**Efek:**
- `departure_datetime` = `undefined` → `departureTs = NaN`
- Window pesan GPS: `timeFrom = max(0, NaN - buffer)` → **undefined/NaN behavior**
- `resolveFinishGpsHit({ departureTs: NaN })`: guard `depTs > 0 && now < depTs` **skip** (depTs=0) → **minFinishTs lemah**, finish idle-at-base **lebih mudah lolos**
- Re-entry logic mengandalkan `depTs` → **rusak / tidak konsisten**

**Severity:** CRITICAL — inti guard finish & window GPS.

**Fix:** tambahkan `departure_datetime: row.departure_datetime` (dan idealnya `arrival_datetime`) ke map kandidat.

---

### HIGH

#### H1 — Dua arti `finish_order_datetime`

| Pemakaian | Arti di data |
|-----------|----------------|
| Create Sales Cost | **ETA finish** (template) |
| GPS finish insert | Hanya di-set jika null/zero → **sering tetap ETA** |
| Schedule overdue | `finish_order_datetime < now` → overdue |
| Monitoring `trxConditions` | `finish_order_datetime IS NULL` → SPK dengan ETA terisi **tidak** masuk bucket “aktif” tertentu |
| Monitoring on-trip overdue flag | ETA lewat + belum `system:finish_order` |

**Efek bisnis:**
- SPK masih jalan tapi status Schedule **overdue** hanya karena ETA finish lewat (bisa OK sebagai warning, tapi membingungkan vs “belum finish GPS”).
- Beberapa filter monitoring/list yang memakai kolom datetime **bukan** history finish → **inkonsisten** dengan “Selesai = system:finish_order”.

**Fix product (pilih satu):**
- A) Pisah kolom `planned_finish_datetime` vs `actual_finish_datetime`, atau  
- B) Jangan isi `finish_order_datetime` di create; simpan ETA hanya di `scss` finish stop, atau  
- C) Overdue/on-trip **hanya** pakai history + `scss.estimated_arrival`, abaikan `sc.finish_order_datetime` untuk status.

#### H2 — `getActiveSalesCostCandidates` tanpa batas waktu

Semua SPK unfinished + zone + unit (tahun lalu pun) ikut sync GPS tiap menit.

**Efek:** beban Wialon/API, backfill window besar, noise.

**Fix:** bound mis. `departure_datetime >= DATE_SUB(NOW(), INTERVAL 14/30 DAY)` (selaras monitoring/manual).

#### H3 — Manual ETA: `break` saat stop tanpa ETA

```1109:1115:geofenceTrackingService.js
if (!stop.estimated_arrival) continue;  // OK skip
// but if ETA future:
if (eta > now) {
  if (Number(stop.is_finish) !== 1) break;  // blocks later stops
}
```

Stop tengah **tanpa** ETA di-skip (`continue`), tapi stop tengah **ETA future** mem-`break` seluruh sisa → finish tidak bisa auto meski finish ETA lewat (ada path kedua di bawah, bagus).

Path kedua finish-only **ada** — mitigasi parsial. Tetap: stop setelah middle missing-ETA bisa tertahan di loop pertama.

#### H4 — GPS truck tanpa zone di stop

Manual candidate: `NOT EXISTS (... wialon_zone_id IS NOT NULL)` pada stop non-finish.

Jika user buat SPK “GPS mode” tapi lupa isi geofence semua stop → masuk **manual ETA** auto-hit.

**Efek:** SPK “seolah GPS” finish by ETA tanpa GPS.

**Mitigasi:** hanya `is_manual_mode=1` OR no unit; **jangan** auto-manual hanya karena zone kosong (atau require explicit flag).

---

### MEDIUM

#### M1 — Departure history dengan waktu **sebelum** `departure_datetime` SPK

Contoh nyata #44360: Departure hit 22 Jul, SPK departure 23 Jul 07:00.  
Diizinkan (buffer 12h + early entry).  
**OK** untuk “truk di base sebelum jadwal”, tapi UI bisa aneh (aktual < est).

#### M2 — Loose finish + multi-SPK same truck same day

Truk 2 SPK aktif: finish longgar di Sankyu bisa close **kedua** SPK jika keduanya belum finish dan re-entry memenuhi minFinishTs.

**Risiko:** SPK B selesai karena truck “pulang” untuk SPK A.

**Mitigasi (belum ada):** hanya finish SPK “primary” / urutan / butuh hit tujuan dulu untuk multi-active.

#### M3 — `geofence_skipped` vs manual incomplete

Setelah finish GPS, semua middle unhit = “Geofence dilewati”.  
Tidak membedakan: skip sengaja vs GPS unit mati di tujuan.

#### M4 — Schedule filter `incomplete_finish` masih di UI

Status SPK tidak lagi set `incomplete_finish` (completed on finishHit), tapi opsi filter UI masih ada → dead filter.

#### M5 — Monitoring on-trip 14 hari vs GPS active unlimited

SPK >14 hari hilang dari on-trip monitoring tapi masih di GPS candidates (setelah H2 fix, selaras).

#### M6 — Timezone

`toMySqlDateTime` / `toMysqlLocal` pakai **local server**.  
ETA form vs MySQL `timezone: local` — harus satu WIB; jika server UTC, ETA “jam 14” bisa geser.

#### M7 — Historical bad data

Rows pre-fix (first-hit duplicate times, finish tanpa re-entry) **tidak** di-repair otomatis.

---

### LOW / hygiene

#### L1 — `visited_stops` summary menghitung `id_sc_stop IS NOT NULL` termasuk Departure  
Progress “1/1 tujuan” bisa salah jika hitung departure.

#### L2 — `applyDueManualEtaHits` processed:628 with inserted:0  
Banyak kandidat “no unit / no zone” historis di-scan tiap cycle — OK tapi berat (related H2/H4).

#### L3 — Dual path finish insert di manual ETA (loop + block kedua)  
Bisa disederhanakan; risiko double-insert di-mitigasi `INSERT IGNORE` + existing set.

#### L4 — Env flags banyak  
`GEOFENCE_REQUIRE_PREVIOUS_STOP`, `GEOFENCE_REQUIRE_ALL_STOPS_BEFORE_FINISH` — dokumentasi ops kurang.

---

## 4. Matriks skenario (expected vs actual)

| Skenario | Expected product | Actual code | Verdict |
|----------|------------------|-------------|---------|
| GPS urut zona berulang | Waktu berbeda per visit | assignStopHits + seed | OK |
| GPS skip tujuan, balik Sankyu | Finish + completed | resolveFinish + schedule | OK (jika C1 fixed) |
| GPS idle base pre-departure | Jangan finish | guards | **Weak jika C1** |
| GPS unit stuck no trail | Tidak hijau tujuan | no points | OK (data) |
| Manual ETA lewat | Auto hit + finish | applyDueManualEtaHits | OK |
| GPS + zone + unit | Hanya GPS track | exclude manual | OK |
| GPS unit, zone kosong | ? | Manual ETA auto | **H4 risk** |
| Multi SPK 1 truck | Finish per SPK hati-hati | finish all eligible | **M2 risk** |
| ETA finish lewat, belum GPS finish | Overdue warning | schedule overdue | OK by design / H1 confusing |
| `finish_order_datetime` terisi create | Bukan “selesai” | on-trip OK via history | OK; list lain H1 |

---

## 5. Prioritas perbaikan (rekomendasi)

| Prio | Item | Effort |
|------|------|--------|
| P0 | **C1** map `departure_datetime` (+ gunakan di finish/window) | 5 min |
| P1 | **H1** pisah planned vs actual finish / overdue dari scss ETA | medium |
| P1 | **H2** bound active GPS candidates 14–30 hari | small |
| P1 | **H4** manual ETA hanya `is_manual_mode=1` OR no unit (drop “no zone only”) | small |
| P2 | **M2** multi-SPK finish policy | medium |
| P2 | Repair historical duplicate hits | script |
| P3 | Dead UI incomplete_finish filter; docs env | small |

---

## 6. Kesimpulan

**Tidak ada satu “kerusakan total”** — pondasi timeline (stop history + `system:finish_order`, loose finish, sequential zones, manual ETA) **selaras goal bisnis** yang dibahas di sesi ini.

**Ada bug implementasi kritis (C1):** `departure_datetime` tidak di-map ke kandidat GPS → window pesan & guard finish **tidak andal**. Ini harus diperbaiki dulu sebelum audit dianggap “bersih”.

**Ada debt model data (H1):** `finish_order_datetime` = ETA create vs actual finish → status overdue & beberapa filter monitoring **semantik campur**.

**Ada edge multi-SPK & false manual (M2, H4)** yang perlu keputusan product.

---

## 7. Plan eksekusi perbaikan (jika user approve)

### Phase A — Hotfix (wajib)
1. Fix `getActiveSalesCostCandidates` map: include `departure_datetime` (and pass through sync).
2. Add unit/assert: kandidat object has finite `departureTs`.
3. Restart backend; spot-check one active GPS SPK finish guard.

### Phase B — Consistency (recommended)
1. Overdue schedule: gunakan finish **stop** `estimated_arrival` jika ingin “ETA”, bukan `sc.finish_order_datetime` jika kolom = planned.
2. Bound GPS candidates 30 day.
3. Tighten manual candidate: `(is_manual_mode=1 OR unit empty)` only.

### Phase C — Product edge
1. Multi-active SPK finish policy.
2. Optional data repair script.

**Tidak dieksekusi di mode plan ini** — menunggu **lanjut eksekusi** untuk Phase A/B.
