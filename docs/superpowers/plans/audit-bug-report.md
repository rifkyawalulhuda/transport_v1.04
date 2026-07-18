# Audit Bug Report — transport_v1.04
**Tanggal audit:** 2026-07-18  
**Branch:** add-module-bbs  
**Scope:** Backend penuh (auth, salesCost, repair, monitoring, geofenceTracking, wialonService, deliveryNotifications, server)

---

## Ringkasan Eksekutif

| Tingkat | Jumlah |
|---|---|
| CRITICAL | 9 |
| HIGH | 15 |
| MEDIUM | 12 |
| LOW | 9 |
| **Total** | **45** |

---

## CRITICAL

### C1 — Password disimpan dan dicompare dalam plaintext
**File:** `node_backend/routes/auth.js:55`  
**Masalah:** Query `WHERE nik_admin=? AND password=?` membandingkan password langsung ke DB tanpa hashing. Ada TODO comment yang mengakui ini. Jika DB dump terjadi, semua akun compromised seketika.  
**Fix:** Gunakan bcrypt pada create + `bcrypt.compare()` pada login.

---

### C2 — `updateRepair` silently overwrite `id_truck` ke null
**File:** `node_backend/services/repairService.js:266`  
**Masalah:** `id_truck: payload.id_truck || null` akan menghapus relasi truck jika client tidak mengirim field ini dalam partial update.  
**Fix:** Gunakan `payload.id_truck !== undefined ? payload.id_truck : existingRecord.id_truck`.

---

### C3 — `updateRepair` silently overwrite `nik_admin` ke null
**File:** `node_backend/services/repairService.js:276`  
**Masalah:** Sama seperti C2 untuk field `nik_admin`.  
**Fix:** Sama seperti C2.

---

### C4 — `updateRepair` overwrite semua field string ke `""`
**File:** `node_backend/services/repairService.js:265–274`  
**Masalah:** Semua field string (`kategori_repair`, `no_spk_perbaikan`, `jenis_kerusakan`, `spare_part`, `keterangan`) tidak punya fallback ke nilai existing. Partial update apapun akan menghapus semua data string.  
**Fix:** Gunakan `payload.field ?? existingRecord.field` untuk semua field optional.

---

### C5 — `finish_order_datetime` tidak pernah di-set oleh geofence tracking
**File:** `node_backend/services/geofenceTrackingService.js:433–459`  
**Masalah:** Setelah truk masuk finish geofence dan INSERT ke `sales_cost_route_history`, tidak ada `UPDATE sales_cost SET finish_order_datetime = NOW()`. Akibatnya:
- Pengiriman yang sudah selesai secara fisik tetap dianggap aktif selamanya
- `getActiveSalesCostCandidates` akan terus memprosesnya setiap sync cycle
- `checkArrivalDelays` terus generate notifikasi duplikat
**Fix:** Tambahkan `UPDATE sales_cost SET finish_order_datetime = NOW() WHERE id_sales_cost = ?` setelah INSERT route history untuk step `system:finish_order`.

---

### C6 — `finish_geofence_resource_id/zone_id` selalu dibuang, semua pakai fallback "Sankyu"
**File:** `node_backend/services/geofenceTrackingService.js:96–101`  
**Masalah:** Query SQL mengambil `finish_geofence_resource_id`, `finish_geofence_zone_id` dari tabel area, tapi saat build objek di `pickedByTruck.set(...)`, kolom-kolom itu tidak disertakan. `resolveFinishGeofenceForSalesCost` selalu fallback ke `DEFAULT_FINISH_GEOFENCE_NAME`. Semua pengiriman ke area berbeda menggunakan finish geofence yang sama (Sankyu).  
**Fix:** Sertakan `finish_geofence_resource_id` dan `finish_geofence_zone_id` dalam objek yang disimpan ke `pickedByTruck`.

---

### C7 — `tax` pakai `Number()` bukan `parseNumber()` — silent data loss
**File:** `node_backend/routes/salesCost.js:1459, 1794`  
**Masalah:** `Number("1.500.000")` = NaN → fallback ke 0. Semua field finansial lain pakai `parseNumber()` yang strip separator Indonesia (titik ribuan, koma desimal). Field `tax` memakai `Number()` sehingga nilai dengan format Indonesia selalu tersimpan sebagai 0.  
**Fix:** Ganti `Number(body.tax)` dengan `parseNumber(body.tax)`.

---

### C8 — `total` tidak menyertakan `adminCharge` dan `materai` → margin salah
**File:** `node_backend/routes/salesCost.js:1496–1504, 1826–1834, 682`  
**Masalah:** `adminCharge` dan `materai` disimpan ke DB tapi tidak masuk kalkulasi `total`. Akibatnya `margin = price - total` overstated di semua record finansial.  
**Fix:** Tambahkan `adminCharge` dan `materai` ke formula total:
```js
const total = bills + liftOn + liftOf + containerDepot + tax + adminCharge + materai
              + containerRepair + demurrageChargers + detentionChargers
              + extendGatePass + additionalCost + opsValue;
```

---

### C9 — GPS cache skip koordinat 0 karena falsy check
**File:** `node_backend/services/geofenceTrackingService.js:345`  
**Masalah:** `if (!position?.lat || !position?.lon)` akan skip truk yang berada di koordinat 0,0 (perpotongan equator dan meridian utama, area Afrika Barat / Samudra Atlantik). Meski jarang secara geografis, ini adalah bug logika karena `0` adalah nilai koordinat valid.  
**Fix:** Ganti dengan `if (position?.lat == null || position?.lon == null)`.

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

### Minggu ini — Blocking / Data Corruption
Urutan berdasarkan dampak terbesar:
1. **C5** — `finish_order_datetime` tidak pernah di-set (tracking loop tak berhenti, notif spam)
2. **C6** — Finish geofence per-area selalu diabaikan (semua delivery pakai geofence Sankyu)
3. **C7/C8** — `tax` dan `total` salah hitung (data finansial corrupt di semua record)
4. **C2/C3/C4** — Partial update merusak data repair (data loss setiap edit)
5. **C1** — Plaintext password (security breach)

### Sprint Berikutnya — Logika Bisnis
6. **H12** — Reverse geocoding sequential (bottleneck 300 detik per sync cycle)
7. **H1/H2/H3** — Repair business logic (status machine, race condition)
8. **H13/H14** — Validasi FK dan ordering tanggal di salesCost
9. **H4** — RBAC JWT decode ulang
10. **H15** — DELETE lock inconsistency

### Backlog — Security & Infrastructure
11. **M8** — CORS whitelist untuk production
12. **M12** — Static file auth
13. **M7** — RBAC path matching
14. **C9** — GPS falsy check fix (kecil, tapi logika salah)
15. **H5** — Reduce 60-day window setelah C5 fix

---

## Catatan

- Item C5 dan C6 saling berkaitan — C6 menyebabkan finish geofence tidak pernah benar, C5 menyebabkan record tidak pernah ditutup. Harus di-fix bersama.
- Item C7 dan C8 menyebabkan **semua data finansial historis sudah corrupt**. Perlu migration data setelah fix.
- Item H12 adalah bottleneck performance kritis yang bisa menyebabkan sync cycle overlap.
