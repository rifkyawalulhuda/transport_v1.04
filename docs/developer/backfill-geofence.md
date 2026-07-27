# Backfill Geofence

Fitur untuk melakukan pencarian hit GPS retroaktif ketika **geofence sebuah stop diubah di tengah perjalanan**.

## Kasus Penggunaan

**Contoh:** SPK #44413 Tujuan 1 awalnya menggunakan geofence PT. FUJISEI, BEKASI. Di tengah perjalanan, geofence diubah ke **Fuji Trans GIIC**. Truk sudah mengunjungi lokasi Fuji Trans GIIC jam 09:00, tapi karena perubahan geofence terjadi setelah kunjungan, hit tidak tercatat otomatis.

Solusi: gunakan backfill untuk mencari hit GPS retroaktif berdasarkan zone baru.

---

## Endpoint

### POST /api/sales-costs/:id/backfill-stop

```
POST /api/sales-costs/:id/backfill-stop
Authorization: Bearer <token>
Content-Type: application/json
```

**Auth:** `authenticateToken` — admin dan user biasa boleh mengakses.

#### Body GPS-based (default)

```json
{ "id_sc_stop": 273 }
```

#### Body Manual Override

```json
{
  "id_sc_stop": 273,
  "manual": true,
  "manual_gps_time": "2026-07-27 09:00:00"
}
```

#### Response — hit ditemukan

```json
{ "found": true, "manual": false, "gps_time": "2026-07-27 09:12:34" }
```

#### Response — tidak ditemukan

```json
{
  "found": false,
  "warning": "GPS tidak mengkonfirmasi kunjungan ke zone ini. Truk mungkin belum mengunjungi lokasi ini, atau data GPS tidak tersedia untuk periode ini."
}
```

#### Response — sudah ter-hit (idempotent)

```json
{ "skipped": true, "reason": "already_hit" }
```

---

## Alur GPS-Based

```
1. Validasi: stop milik SPK ini, bukan Departure/Finish
2. Cek idempotency: stop sudah punya route_history? → skip
3. Login Wialon (isolated session)
4. fetchRawMessagesForUnit (timeFrom = depTs - 12h, timeTo = finishTs || now)
5. fetchZonePolygons untuk resource/zone stop
6. buildZoneEntryTimeline → zoneTimeline
7. assignStopHits (dengan semua guards: departure pre-window, same-zone gap)
8. Jika hit ditemukan → INSERT sales_cost_route_history
9. Logout Wialon
10. logAuditEvent
```

---

## Alur Manual Override

```
1. Validasi: stop milik SPK ini, bukan Departure/Finish
2. Cek idempotency: stop sudah punya route_history? → skip
3. Validasi manual_gps_time format (YYYY-MM-DD HH:MM:SS)
4. INSERT sales_cost_route_history dengan is_manual=1, lat=null, lon=null
5. logAuditEvent
```

---

## Perubahan PUT /:id

Response PUT sekarang menyertakan `geofence_changed_stops[]` jika ada middle stop yang `wialon_zone_id`-nya berubah selama update:

```json
{
  "id_sales_cost": 44413,
  "geofence_changed_stops": [
    {
      "id": 273,
      "stop_name": "Tujuan 1",
      "stop_order": 1,
      "old_zone_id": 85,
      "new_zone_id": 107,
      "new_zone_name": "Fuji Trans GIIC",
      "already_hit": false
    }
  ]
}
```

Field ini hanya berisi:
- Middle stops (bukan `is_departure=1`, bukan `is_finish=1`)
- Stop yang `wialon_zone_id`-nya benar-benar berubah (bukan cuma nama/waktu)
- Wrapped dalam `try/catch` — jika query gagal, response tetap sukses dengan `geofence_changed_stops: []`

---

## Batasan

| Batasan | Keterangan |
|---------|-----------|
| Hanya middle stops | Departure dan Finish tidak bisa di-backfill |
| `system:finish_order` tidak disentuh | Finish SPK tidak diubah oleh backfill |
| Idempotent | Stop yang sudah ter-hit dilewati tanpa error |
| GPS window | `depTs - 12h` hingga `finishTs || now` |
| Wialon retention | Data GPS Wialon biasanya tersimpan 3–6 bulan |

---

## UI

### Dialog Post-Save (EditSalesCost.vue)

Setelah save SPK berhasil, jika ada `geofence_changed_stops` dengan `already_hit: false`, muncul dialog:

| State | Tampilan |
|-------|---------|
| `idle` | Info perubahan zone + tombol "Cek GPS & Backfill" |
| `loading` | Spinner "Mencari data GPS Wialon..." |
| `found` | "Hit GPS ditemukan: [waktu]" + tombol Lanjut/Selesai |
| `not_found` | Warning + input datetime manual + tombol "Simpan Manual" |
| `already_hit` | Info sudah ter-hit + tombol Lanjut/Selesai |
| `error` | Pesan error + tombol Coba Lagi |

Jika ada beberapa stops yang berubah, dialog memproses satu per satu. Navigasi ke list dilakukan setelah semua stops diproses atau dilewati.

### Tombol "Cari Hit GPS" (DetailSalesCost.vue)

Di section jadwal pengiriman Detail SPK, setiap **middle stop yang belum ter-hit** menampilkan tombol kecil **Cari Hit GPS**. Klik → backfill GPS → jika berhasil, detail di-reload otomatis.
