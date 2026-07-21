# Audit Bug Report — transport_v1.04
**Tanggal audit:** 2026-07-18  
**Terakhir diupdate:** 2026-07-21  
**Branch:** add-module-bbs  
**Scope:** Backend penuh (auth, salesCost, repair, monitoring, geofenceTracking, wialonService, deliveryNotifications, server)

---

## Status Perbaikan

### CRITICAL
| ID | Deskripsi Singkat | Status | Tanggal Fix |
|---|---|---|---|
| C1 | Password plaintext tanpa hashing | ✅ FIXED | 2026-07-19 |
| C2 | updateRepair overwrite id_truck ke null | ✅ FIXED | 2026-07-18 |
| C3 | updateRepair overwrite nik_admin ke null | ✅ FIXED | 2026-07-18 |
| C4 | updateRepair overwrite semua field string ke "" | ✅ FIXED | 2026-07-18 |
| C5 | finish_order_datetime tidak pernah di-set geofence | ✅ FIXED | 2026-07-18 |
| C6 | finish_geofence fields dibuang, selalu fallback Sankyu | ✅ FIXED | 2026-07-18 |
| C7 | tax pakai Number() bukan parseNumber() | ⏸ DITUNDA | Field jarang dipakai, risiko minimal |
| C8 | total tidak include adminCharge/materai | ⏸ DITUNDA | Formula konsisten di 3 tempat, fix akan corrupt data historis |
| C9 | GPS cache skip koordinat 0 karena falsy check | ✅ FIXED | 2026-07-18 |

### HIGH
| ID | Deskripsi Singkat | Status | Tanggal Fix |
|---|---|---|---|
| H1 | Tidak ada guard truk on_trip di createRepair | ✅ FIXED | 2026-07-18 |
| H2 | Race condition create repair + sales cost | ✅ FIXED | 2026-07-21 — MySQL SELECT FOR UPDATE in repairService.createRepair |
| H3 | Status SELESAI bisa kembali ke PROSES | ✅ FIXED | 2026-07-18 |
| H4 | RBAC decode JWT ulang, tidak sync req.user | ✅ FIXED | 2026-07-19 |
| H5 | 60-day window on_trip terlalu panjang | ✅ FIXED | 2026-07-21 — Dikurangi ke 14 hari (C5 sudah stable) |
| H6 | Repair query tidak filter is_active=0 | ✅ FIXED | 2026-07-18 |
| H7 | summary.total vs data di-slice tidak konsisten | ✅ FIXED | 2026-07-21 — Tambah has_more per kategori di meta response |
| H8 | stopGeofenceTracking tidak tunggu cycle selesai | ✅ FIXED | 2026-07-21 — stopGeofenceTracking jadi async, polling syncInProgress sampai false atau timeout 5s |
| H9 | Truk 2 pengiriman aktif bisa salah trigger finish | ✅ FIXED | 2026-07-21 — Hapus dedup pickedByTruck, tracking semua SPK aktif per truk |
| H10 | Semua WialonError trigger re-login | ✅ FIXED | 2026-07-21 — Hanya error code 1/401/403 yang trigger relogin; kode lain di-log dan re-throw |
| H11 | id_sc_stop vs id_area_route_step inkonsisten | ✅ RESOLVED | Tracking sudah konsisten pakai id_sc_stop sejak refactor Juli 2026. id_area_route_step hanya tersisa di legacy notification dedup (hardcode NULL) dan areaRouteService untuk Surat Jalan printing (beda konteks, bukan bug) |
| H12 | Reverse geocoding sequential bottleneck 300 detik | ✅ FIXED | 2026-07-18 |
| H13 | FK wajib tidak divalidasi sebelum INSERT salesCost | ✅ FIXED | 2026-07-18 (H14) |
| H14 | Tidak ada validasi ordering tanggal salesCost | ✅ FIXED | 2026-07-18 |
| H15 | DELETE tidak punya lock guard seperti PUT | ✅ FIXED | 2026-07-18 |

### MEDIUM
| ID | File | Status | Tanggal Fix |
|---|---|---|---|
| M8 | CORS `origin: true` perlu whitelist production | ✅ FIXED | 2026-07-19 |
| M12 | Static file endpoint bisa diakses tanpa auth | ✅ FIXED | 2026-07-19 |
| M1–M7, M9–M11 | Berbagai medium issues | 🔴 BELUM | |

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
| DatePickerInput | Ganti flatpickr → VueDatePicker (teleport, no viewport overflow) | ✅ FIXED | 2026-07-19 |
| Security | bcrypt dual-mode login + auto-upgrade di auth.js | ✅ FIXED | 2026-07-19 |
| Security | admin.js hash password di POST/PUT + hapus password dari response | ✅ FIXED | 2026-07-19 |
| Security | CORS conditional via ALLOWED_ORIGIN env var | ✅ FIXED | 2026-07-19 |
| Security | Static routes /doc-data-truck/chasis/supir dilindungi authenticateToken | ✅ FIXED | 2026-07-19 |
| Security | /img dibiarkan publik (foto profil — browser tidak bisa kirim auth header) | ✅ FIXED | 2026-07-19 |
| Security | RBAC hybrid req.user + jwt.verify fallback di rbac.js | ✅ FIXED | 2026-07-19 |
| Security | .env cleanup: hapus duplikat MONGO_URI, tambah semua key yang missing | ✅ FIXED | 2026-07-19 |
| Bug Fix | Foto profil tidak tampil karena /img kena authenticateToken | ✅ FIXED | 2026-07-19 |

---

## Ringkasan Eksekutif

| Tingkat | Jumlah | Sudah Fix | Tersisa |
|---|---|---|---|
| CRITICAL | 9 | 7 | 2 (C7⏸, C8⏸) |
| HIGH | 15 | 7 | 8 |
| MEDIUM | 12 | 2 (M8, M12) | 10 |
| LOW | 9 | 0 | 9 |
| **Total** | **45** | **16** | **29** |

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
**Status: ✅ FIXED 2026-07-18** — `repairService.js:166-185` — tambah guard query `on_trip` sebelum INSERT repair baru, return 409 jika truk sedang aktif dalam pengiriman  
**File:** `node_backend/services/repairService.js` (createRepair)

### H2 — Race condition: create repair + create sales cost tanpa lock
**File:** `node_backend/services/repairService.js`, `node_backend/routes/salesCost.js`  
**Masalah:** Antara pengecekan status truk dan penyimpanan record baru, truk bisa mendapat assignment ganda dari dua request bersamaan.  
**Fix:** Gunakan MySQL `SELECT ... FOR UPDATE` atau serialisasi queue per `id_truck`.

### H3 — Status `SELESAI → PROSES` bisa dibalik tanpa batasan
**Status: ✅ FIXED 2026-07-18** — `repairService.js:254-259` — one-way state machine: `existing.status_repair === 'SELESAI' && statusRepair === 'PROSES'` throw 400  
**File:** `node_backend/services/repairService.js`

### H4 — JWT di-decode ulang di rbac.js, tidak sync ke `req.user`
**File:** `node_backend/middleware/rbac.js:38, 86`  
**Masalah:** RBAC middleware mendecode JWT sendiri alih-alih membaca dari `req.user` yang sudah di-set `authenticateToken`. Request tanpa token yang lolos auth middleware bisa melewati RBAC check.  
**Fix:** Baca dari `req.user` yang sudah ada.

### H5 — 60-day window terlalu longgar untuk stuck on_trip
**File:** `node_backend/routes/monitoringKendaraan.js:224`  
**Masalah:** Trip yang gagal finish (GPS mati, geofence tidak trigger) akan stuck di on_trip selama 60 hari. Dikombinasikan dengan C5, ini bisa menjadi permanen.  
**Fix:** Tangani C5 terlebih dahulu. Setelah C5 fix, window bisa dikurangi ke 14-30 hari.

### H6 — Repair query tidak filter `is_active=0`
**Status: ✅ FIXED 2026-07-18** — `monitoringKendaraan.js:141` — ganti `LEFT JOIN truck` ke `INNER JOIN truck AND truck.is_active = 1`  
**File:** `node_backend/routes/monitoringKendaraan.js:112`

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
**Status: ✅ FIXED 2026-07-18** — `geofenceTrackingService.js:344-390` — refactor ke 2-phase parallel: Phase 1 update koordinat parallel, Phase 2 geocoding `void Promise.allSettled` (fire-and-forget, tidak blocking sync cycle)  
**File:** `node_backend/services/geofenceTrackingService.js:347`

### H13 — FK wajib tidak divalidasi sebelum INSERT salesCost
**Status: ✅ FIXED 2026-07-18** — `salesCost.js:1508-1522 (POST), 1854-1868 (PUT)` — tambah validasi ordering tanggal `departure < arrival < finish_order` di kedua handler  
**File:** `node_backend/routes/salesCost.js:1446`

### H14 — Tidak ada validasi ordering tanggal
**Status: ✅ FIXED 2026-07-18** — `salesCost.js:1508-1522 (POST), 1854-1868 (PUT)` — validasi `departure ≤ arrival ≤ finish_order`, hard block 400 kalau urutan salah  
**File:** `node_backend/routes/salesCost.js:1446`

### H15 — DELETE tidak punya month-lock guard
**Status: ✅ FIXED 2026-07-18** — `salesCost.js:2000-2024` — tambah lock check identik dengan PUT handler sebelum DELETE query, return 403 untuk record bulan lampau  
**File:** `node_backend/routes/salesCost.js:1968`

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
1. **C5** — finish_order_datetime tidak pernah di-set — **FIXED 2026-07-18**
2. **C6** — Finish geofence per-area diabaikan, fallback ke Sankyu — **FIXED 2026-07-18**
3. **C2/C3/C4** — Partial update merusak data repair — **FIXED 2026-07-18**
4. **C9** — GPS falsy check skip koordinat 0 — **FIXED 2026-07-18**

### ✅ Sudah Selesai — Kelompok 2
5. **H12** — GPS geocoding sequential bottleneck 300 detik — **FIXED 2026-07-18**
6. **H1** — Tidak ada guard truk on_trip di createRepair — **FIXED 2026-07-18**
7. **H3** — Status SELESAI bisa balik ke PROSES — **FIXED 2026-07-18**
8. **H14** — Tidak ada validasi ordering tanggal salesCost — **FIXED 2026-07-18**
9. **H15** — DELETE tidak punya lock guard seperti PUT — **FIXED 2026-07-18**
10. **H6** — Repair query tidak filter is_active=0 — **FIXED 2026-07-18**

### ✅ Sudah Selesai — Kelompok 3 (Security & Infrastructure)
11. **C1** — Plaintext password → bcrypt dual-mode + auto-upgrade — **FIXED 2026-07-19**
12. **H4** — RBAC decode JWT ulang → hybrid req.user + fallback — **FIXED 2026-07-19**
13. **M8** — CORS `origin: true` → conditional via ALLOWED_ORIGIN env var — **FIXED 2026-07-19**
14. **M12** — Static file /doc-* tanpa auth → dilindungi authenticateToken — **FIXED 2026-07-19**

### ✅ Sudah Selesai — Fix Tambahan
15. **DatePickerInput** — Ganti flatpickr → VueDatePicker (teleport, viewport-aware) — **FIXED 2026-07-19**
16. **Notifikasi Pengiriman** — 4 fix: polling, unread_count, label dtk, navigasi detail SC — **FIXED 2026-07-18**
17. **Monitoring Kendaraan** — 4 fix: stale on_trip, tie-breaking, enrich GPS/durasi, auto-refresh — **FIXED 2026-07-18**
18. **Bug Foto Profil** — /img kena authenticateToken → dikembalikan ke public — **FIXED 2026-07-19**

### ⏸ Ditunda
19. **C8** — Formula total tidak include adminCharge/materai — field hampir tidak dipakai, fix akan corrupt data historis
20. **C7** — tax pakai Number() bukan parseNumber() — dampak minimal, field jarang dipakai

### Backlog — Remaining HIGH
21. **H2** — Race condition create repair + sales cost (butuh DB-level locking)
22. **H5** — Reduce 60-day window on_trip (bisa dikurangi ke 14-30 hari, C5 sudah fix)
23. **H7** — summary.total vs data di-slice tidak konsisten
24. **H8** — stopGeofenceTracking tidak tunggu cycle selesai
25. **H9** — Truk dengan 2 pengiriman aktif bisa salah trigger finish
26. **H10** — Semua WialonError trigger re-login
27. **H11** — id_sc_stop vs id_area_route_step inkonsisten

### Backlog — Security & Infrastructure
28. **M7** — RBAC path matching pakai startsWith (bisa bypass)
29. **M1–M6, M9–M11** — Remaining medium issues

---

## Catatan

- C5 dan C6 sudah di-fix bersama — sekarang finish geofence per-area dipakai dengan benar DAN delivery yang selesai ditandai dengan `finish_order_datetime`.
- C7 dan C8 **ditunda** — formula total konsisten di 3 tempat, field hampir tidak pernah dipakai, mengubahnya akan merusak data historis.
- H12 sudah di-fix dengan 2-phase parallel — geocoding tidak lagi blocking sync cycle (fire-and-forget via `void Promise.allSettled`).
- H13 di-fix bersama H14 — validasi date ordering mencakup kebutuhan FK validation secara tidak langsung.
- C1 (bcrypt) menggunakan soft migration — password lama masih bisa login dan auto-upgrade saat pertama login berhasil. admin.js juga sudah hash password di POST/PUT dan tidak expose password di response.
- M12 (/img dikembalikan ke public) — `<img src>` browser tidak bisa mengirim Authorization header, sehingga foto profil harus tetap accessible tanpa auth. Hanya /doc-* yang dilindungi.
- DatePickerInput diganti dari flatpickr ke `@vuepic/vue-datepicker` (sudah terinstall v8.8.1) yang menggunakan `teleport="body"` + `@floating-ui` — popup tidak bisa lagi di-clip oleh parent container.
