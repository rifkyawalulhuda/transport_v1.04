# Audit Bug Report — transport_v1.04
**Tanggal audit:** 2026-07-18  
**Terakhir diupdate:** 2026-07-18  
**Branch:** add-module-bbs  
**Scope:** Backend penuh (auth, salesCost, repair, monitoring, geofenceTracking, wialonService, deliveryNotifications, server)

---

## Status Perbaikan

| ID | Deskripsi Singkat | Status | Tanggal Fix |
|---|---|---|---|
| C2 | updateRepair overwrite id_truck ke null | ✅ FIXED | 2026-07-18 |
| C3 | updateRepair overwrite nik_admin ke null | ✅ FIXED | 2026-07-18 |
| C4 | updateRepair overwrite semua field string ke "" | ✅ FIXED | 2026-07-18 |
| C5 | finish_order_datetime tidak pernah di-set geofence | ✅ FIXED | 2026-07-18 |
| C6 | finish_geofence fields dibuang, selalu fallback Sankyu | ✅ FIXED | 2026-07-18 |
| C7 | tax pakai Number() bukan parseNumber() | ⏸ DITUNDA | Field jarang dipakai, risiko minimal |
| C8 | total tidak include adminCharge/materai | ⏸ DITUNDA | Formula konsisten di 3 tempat, fix akan corrupt data historis |
| C9 | GPS cache skip koordinat 0 karena falsy check | ✅ FIXED | 2026-07-18 |

### Fix di luar audit ini
| Modul | Deskripsi | Status | Tanggal |
|---|---|---|---|
| Monitoring Kendaraan | Stale on_trip window 60 hari | ✅ FIXED | 2026-07-18 |
| Monitoring Kendaraan | lastSql tie-breaking non-deterministik | ✅ FIXED | 2026-07-18 |
| Monitoring Kendaraan | Enrich response GPS + durasi + SC number | ✅ FIXED | 2026-07-18 |
| Monitoring Kendaraan | Auto-refresh 60 detik + filter bulan/tahun | ✅ FIXED | 2026-07-18 |
| GPS Cache | Kolom last_lat/lng/address/gps_time di tabel truck | ✅ FIXED | 2026-07-18 |
| GPS Cache | geofenceTrackingService persist posisi Wialon ke DB | ✅ FIXED | 2026-07-18 |
| GPS Cache | Reverse geocode ke last_address (Geoapify) | ✅ FIXED | 2026-07-18 |
| Notifikasi Pengiriman | Auto-refresh polling 60 detik | ✅ FIXED | 2026-07-18 |
| Notifikasi Pengiriman | unread_count dihitung dari LIMIT bukan total DB | ✅ FIXED | 2026-07-18 |
| Notifikasi Pengiriman | formatTimeAgo bug label "d" untuk detik | ✅ FIXED | 2026-07-18 |
| Notifikasi Pengiriman | Navigasi klik notif ke /sales-cost list (bukan detail) | ✅ FIXED | 2026-07-18 |

---

## Ringkasan Eksekutif

| Tingkat | Jumlah | Sudah Fix | Tersisa |
|---|---|---|---|
| CRITICAL | 9 | 6 | 3 (C1, C7⏸, C8⏸) |
| HIGH | 15 | 0 | 15 |
| MEDIUM | 12 | 0 | 12 |
| LOW | 9 | 0 | 9 |
| **Total** | **45** | **6** | **39** |

---

## CRITICAL

### C1 — Password disimpan dan dicompare dalam plaintext
**File:** `node_backend/routes/auth.js:55`  
**Masalah:** Query `WHERE nik_admin=? AND password=?` membandingkan password langsung ke DB tanpa hashing. Ada TODO comment yang mengakui ini. Jika DB dump terjadi, semua akun compromised seketika.  
**Fix:** Gunakan bcrypt pada create + `bcrypt.compare()` pada login.

---

### C2 — `updateRepair` silently overwrite `id_truck` ke null
**Status: ✅ FIXED 2026-07-18** — `repairService.js:266` — pattern `!== undefined && != null` untuk preserve existing value dan guard NOT NULL constraint  
**File:** `node_backend/services/repairService.js:266`  
**Masalah:** `id_truck: payload.id_truck || null` akan menghapus relasi truck jika client tidak mengirim field ini dalam partial update.

---

### C3 — `updateRepair` silently overwrite `nik_admin` ke null
**Status: ✅ FIXED 2026-07-18** — `repairService.js:276` — pattern `!== undefined && != null` untuk preserve existing value dan guard NOT NULL constraint  
**File:** `node_backend/services/repairService.js:276`  
**Masalah:** Sama seperti C2 untuk field `nik_admin`.

---

### C4 — `updateRepair` overwrite semua field string ke `""`
**Status: ✅ FIXED 2026-07-18** — `repairService.js:265–274` — semua 12 field diubah ke pattern `payload.field !== undefined ? payload.field : existing.field`  
**File:** `node_backend/services/repairService.js:265–274`  
**Masalah:** Semua field string (`kategori_repair`, `no_spk_perbaikan`, `jenis_kerusakan`, `spare_part`, `keterangan`) tidak punya fallback ke nilai existing. Partial update apapun akan menghapus semua data string.

---

### C5 — `finish_order_datetime` tidak pernah di-set oleh geofence tracking
**Status: ✅ FIXED 2026-07-18** — `geofenceTrackingService.js:461-471` — tambah `UPDATE sales_cost SET finish_order_datetime = NOW()` setelah INSERT route history, dengan idempotency guard dan pakai `NOW()` bukan `gpsTime` yang bisa stale  
**File:** `node_backend/services/geofenceTrackingService.js:433–459`  
**Masalah:** Setelah truk masuk finish geofence dan INSERT ke `sales_cost_route_history`, tidak ada `UPDATE sales_cost SET finish_order_datetime = NOW()`. Akibatnya:
- Pengiriman yang sudah selesai secara fisik tetap dianggap aktif selamanya
- `getActiveSalesCostCandidates` akan terus memprosesnya setiap sync cycle
- `checkArrivalDelays` terus generate notifikasi duplikat

---

### C6 — `finish_geofence_resource_id/zone_id` selalu dibuang, semua pakai fallback "Sankyu"
**Status: ✅ FIXED 2026-07-18** — `geofenceTrackingService.js:96-104` — tambah 3 field `finish_geofence_resource_id`, `finish_geofence_zone_id`, `finish_geofence_zone_name` ke objek `pickedByTruck`  
**File:** `node_backend/services/geofenceTrackingService.js:96–101`  
**Masalah:** Query SQL mengambil `finish_geofence_resource_id`, `finish_geofence_zone_id` dari tabel area, tapi saat build objek di `pickedByTruck.set(...)`, kolom-kolom itu tidak disertakan. `resolveFinishGeofenceForSalesCost` selalu fallback ke `DEFAULT_FINISH_GEOFENCE_NAME`. Semua pengiriman ke area berbeda menggunakan finish geofence yang sama (Sankyu).

---

### C7 — `tax` pakai `Number()` bukan `parseNumber()` — silent data loss
**Status: ⏸ DITUNDA** — Field jarang dipakai, dampak minimal. Masuk sprint berikutnya sebagai low-risk fix.  
**File:** `node_backend/routes/salesCost.js:1459, 1794`

---

### C8 — `total` tidak menyertakan `adminCharge` dan `materai` → margin salah
**Status: ⏸ DITUNDA** — Formula konsisten di 3 tempat (baris 682, 1496-1504, 1826-1834). Fix akan merusak data historis. Field hampir tidak pernah dipakai. Perlu data migration strategy terpisah.  
**File:** `node_backend/routes/salesCost.js:1496–1504, 1826–1834, 682`

---

### C9 — GPS cache skip koordinat 0 karena falsy check
**Status: ✅ FIXED 2026-07-18** — `geofenceTrackingService.js:348` — ganti `!position?.lon` ke `position?.lon == null`  
**File:** `node_backend/services/geofenceTrackingService.js:345`

---

## HIGH

### H1 — Tidak ada guard: truk on_trip bisa dibuat repair baru
**File:** `node_backend/services/repairService.js` (createRepair)  
**Masalah:** Tidak ada pengecekan apakah truk sedang on_trip sebelum membuat record repair baru. Data monitoring akan inkonsisten — truk muncul di dua status sekaligus.  
**Fix:** Tambahkan validasi `getTruckStatus()` sebelum INSERT repair.

### H2 — Race condition: create repair + create sales cost tanpa lock
**File:** `node_backend/services/repairService.js`, `node_backend/routes/salesCost.js`  
**Masalah:** Antara pengecekan status truk dan penyimpanan record baru, truk bisa mendapat assignment ganda dari dua request bersamaan.  
**Fix:** Gunakan MySQL `SELECT ... FOR UPDATE` atau serialisasi queue per `id_truck`.

### H3 — Status `SELESAI → PROSES` bisa dibalik tanpa batasan
**File:** `node_backend/services/repairService.js`  
**Masalah:** Status repair bisa di-set ke nilai apapun tanpa state machine validation. SELESAI bisa kembali ke PROSES.  
**Fix:** Implementasi state machine: `null/PROSES → SELESAI` (satu arah).

### H4 — JWT di-decode ulang di rbac.js, tidak sync ke `req.user`
**File:** `node_backend/middleware/rbac.js:38, 86`  
**Masalah:** RBAC middleware mendecode JWT sendiri alih-alih membaca dari `req.user` yang sudah di-set `authenticateToken`. Request tanpa token yang lolos auth middleware bisa melewati RBAC check.  
**Fix:** Baca dari `req.user` yang sudah ada.

### H5 — 60-day window terlalu longgar untuk stuck on_trip
**File:** `node_backend/routes/monitoringKendaraan.js:224`  
**Masalah:** Trip yang gagal finish (GPS mati, geofence tidak trigger) akan stuck di on_trip selama 60 hari. Dikombinasikan dengan C5, ini bisa menjadi permanen.  
**Fix:** Tangani C5 terlebih dahulu. Setelah C5 fix, window bisa dikurangi ke 14-30 hari.

### H6 — Repair query tidak filter `is_active=0`
**File:** `node_backend/routes/monitoringKendaraan.js:112`  
**Masalah:** Repair query di monitoring tidak exclude truk non-aktif (`is_active=0`). Truk yang sudah dinonaktifkan masih muncul di monitoring repair.  
**Fix:** Tambahkan `AND truck.is_active = 1` ke JOIN kondisi repair query.

### H7 — `summary.total` vs data di-slice oleh limit tidak konsisten
**File:** `node_backend/routes/monitoringKendaraan.js:447`  
**Masalah:** `summary.total` menghitung semua item, tapi response mengembalikan `slice(0, limit)`. Frontend menerima jumlah yang tidak sesuai dengan data yang ditampilkan.  
**Fix:** Tambahkan field `has_more` atau ubah summary ke `total_unfiltered` vs `showing`.

### H8 — `stopGeofenceTracking` tidak tunggu cycle selesai
**File:** `node_backend/services/geofenceTrackingService.js:504`  
**Masalah:** Saat server restart, `clearInterval` tidak menunggu sync cycle yang sedang berjalan selesai. Bisa terjadi double-run saat hot-reload.  
**Fix:** Tambahkan promise/flag untuk drain cycle sebelum stop.

### H9 — Truk dengan 2 pengiriman aktif bisa salah trigger finish
**File:** `node_backend/services/geofenceTrackingService.js:419`  
**Masalah:** Jika ada dua `sales_cost` aktif untuk truk yang sama (edge case C5), masuk geofence finish bisa menyelesaikan pengiriman yang salah.

### H10 — Semua `WialonError` trigger re-login + retry
**File:** `node_backend/services/wialonService.js:393`  
**Masalah:** Re-login hanya seharusnya terjadi untuk error session expired, bukan semua error Wialon (network timeout, rate limit, dsb). Re-login berlebihan bisa lock out session.  
**Fix:** Hanya retry untuk error code session expired.

### H11 — `id_sc_stop` vs `id_area_route_step` inkonsisten
**File:** `node_backend/services/geofenceTrackingService.js:175`  
**Masalah:** Beberapa query menggunakan `id_sc_stop` dan beberapa menggunakan `id_area_route_step` untuk referensi yang sama. Kemungkinan schema mismatch.  
**Fix:** Audit semua query dan unifikasi nama kolom.

### H12 — Reverse geocoding sequential dalam GPS cache loop — bottleneck serius
**File:** `node_backend/services/geofenceTrackingService.js:347`  
**Masalah:** `await reverseGeocodeCoordinates(...)` dipanggil satu per satu dalam loop sebelum membuat `gpsUpdates` array. Untuk 50 truk dengan cache miss, bisa memakan waktu 50 × 6 detik = 300 detik per sync cycle, jauh melebihi interval 60 detik.  
**Fix:** Pindahkan reverse geocode ke parallel `Promise.allSettled` terpisah dari GPS coordinate update, atau batch geocode setelah bulk update koordinat.

### H13 — FK wajib tidak divalidasi sebelum INSERT salesCost
**File:** `node_backend/routes/salesCost.js:1446`  
**Masalah:** `id_truck`, `id_driver`, `id_area`, `id_customer` tidak divalidasi keberadaannya di DB sebelum INSERT. FK constraint error akan muncul sebagai 500 Internal Server Error.  
**Fix:** Validasi eksplisit dan kembalikan 400 dengan pesan yang deskriptif.

### H14 — Tidak ada validasi ordering tanggal
**File:** `node_backend/routes/salesCost.js:1446`  
**Masalah:** Tidak ada validasi bahwa `departure_datetime < arrival_datetime < finish_order_datetime`. Data dengan urutan tanggal terbalik bisa masuk DB dan menyebabkan kalkulasi durasi negatif.  
**Fix:** Tambahkan validasi urutan tanggal di layer POST/PUT handler.

### H15 — DELETE tidak punya month-lock guard
**File:** `node_backend/routes/salesCost.js:1968`  
**Masalah:** Record sales cost yang sudah dikunci (tidak bisa diedit karena sudah di bulan lampau) masih bisa dihapus. Inkonsistensi bisnis: edit dilarang tapi delete diizinkan.  
**Fix:** Terapkan lock yang sama untuk operasi DELETE seperti untuk operasi UPDATE.

---

## MEDIUM

| ID | File | Masalah |
|---|---|---|
| M1 | salesCost.js | `delivery_stops` delete+reinsert tidak dalam transaksi DB — data bisa hilang jika INSERT gagal |
| M2 | salesCost.js | `departure_datetime` dan `arrival_datetime` tidak divalidasi format sebelum masuk DB |
| M3 | salesCost.js | Excel import: `arrivalOrder` optional tapi `finishOrder` required — inkonsisten dengan UI |
| M4 | salesCost.js:902 | LIKE `%keyword%` tidak di-escape — `%` dan `_` bisa jadi wildcard tidak terduga |
| M5 | salesCost.js | `PUT /:id/dn` tidak ada ownership/lock check |
| M6 | repairService.js | `new Date(string)` timezone-sensitive — bisa off-by-one di timezone WIB |
| M7 | rbac.js:20 | Path matching pakai `startsWith` — bisa bypass dengan path prefix trick |
| M8 | server.js:38 | `cors({ origin: true })` harus di-whitelist ke domain spesifik sebelum production |
| M9 | geofenceTrackingService.js:214 | History key collision jika `step_key` dan `id_sc_stop` keduanya NULL |
| M10 | geofenceTrackingService.js:652 | Backfill tidak menggunakan DEFAULT finish geofence fallback |
| M11 | geofenceTrackingService.js:42 | `toMySqlDateTime(null)` mungkin return epoch `1970-01-01` bukan null |
| M12 | server.js:50 | Static file endpoint (`/doc-data-truck`, `/doc-supir`, dll) bisa diakses tanpa autentikasi |

---

## LOW

| ID | File | Masalah |
|---|---|---|
| L1 | salesCost.js | `almtPickup`/`almtDrop` diparsing dari body tapi tidak pernah di-INSERT ke DB |
| L2 | salesCost.js | `noDn` dead code di POST dan PUT handler |
| L3 | repair.js | `formatNumber` didefinisikan jauh dari penggunaannya |
| L4 | wialonService.js | `normalizePositiveIntString` duplikat di 3 tempat berbeda |
| L5 | geofenceTrackingService.js | Dua blok `require("./wialonService")` terpisah (top-level dan HISTORICAL BACKFILL section) |
| L6 | wialonService.js | `fetchWialonUnitCatalog` dan `fetchWialonUnitSnapshot` identik fungsional — perlu deduplikasi |
| L7 | server.js | MongoDB tidak terhubung tidak menghentikan server — silent fail tanpa alert |
| L8 | wialonService.js:252 | Timestamp logic ambigu untuk nilai >1e10 (milliseconds vs seconds detection) |
| L9 | rbac.js | Style `parseInt` tidak konsisten dengan file lain |

---

## Prioritas Penanganan

### ✅ Sudah Selesai — Kelompok 1
1. **C5** — `finish_order_datetime` tidak pernah di-set (tracking loop tak berhenti, notif spam) — **FIXED 2026-07-18**
2. **C6** — Finish geofence per-area selalu diabaikan, semua fallback ke Sankyu — **FIXED 2026-07-18**
3. **C2/C3/C4** — Partial update merusak data repair — **FIXED 2026-07-18**
4. **C9** — GPS falsy check skip koordinat 0 — **FIXED 2026-07-18**

### ⏸ Ditunda
5. **C8** — Formula total tidak include adminCharge/materai — field hampir tidak dipakai, fix akan corrupt data historis, butuh data migration strategy
6. **C7** — tax pakai Number() bukan parseNumber() — dampak minimal, field jarang dipakai

### Sprint Berikutnya — Logika Bisnis
7. **H12** — Reverse geocoding sequential dalam GPS loop (bottleneck 300 detik per sync cycle)
8. **H1/H2/H3** — Repair business logic (status machine, race condition, guard on_trip)
9. **H13/H14** — Validasi FK dan ordering tanggal di salesCost
10. **H4** — RBAC JWT decode ulang
11. **H15** — DELETE lock inconsistency
12. **H6** — Repair query tidak filter is_active=0

### Backlog — Security & Infrastructure
13. **C1** — Plaintext password (breaking change, butuh migration semua password)
14. **M8** — CORS whitelist untuk production
15. **M12** — Static file auth
16. **M7** — RBAC path matching
17. **H5** — Reduce 60-day window on_trip (bisa dikurangi setelah C5 sudah fix)

---

## Catatan

- C5 dan C6 sudah di-fix bersama — sekarang finish geofence per-area dipakai dengan benar DAN delivery yang selesai ditandai dengan `finish_order_datetime`.
- C7 dan C8 **ditunda** — formula total konsisten di 3 tempat, field hampir tidak pernah dipakai, mengubahnya akan merusak data historis.
- H12 adalah bottleneck performance kritis — geocoding sequential 50 truk × 6 detik = 300 detik per sync cycle, jauh melebihi interval 60 detik.
- C1 (plaintext password) adalah breaking change — semua user harus reset password atau ada migration script untuk rehash, butuh planning khusus.
