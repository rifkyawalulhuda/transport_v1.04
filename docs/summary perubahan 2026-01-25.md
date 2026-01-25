# Ringkasan Perubahan - 2026-01-25

## Fitur Schedule Pengiriman
- Menambahkan halaman Schedule Pengiriman (grouped + expand/collapse DN) beserta filter, pagination, sorting, dan tombol detail read-only.
- Default tanggal filter: Delivery Order = hari ini, Arrival Order = 7 hari ke depan.
- Search ditambah dukungan No. DN dan No. Aju.
- Pagination model nomor (seperti Data Truck) + tombol Expand/Collapse All.
- Tombol Detail dinonaktifkan untuk role cs dan mekanik.

## Backend Schedule Pengiriman
- Endpoint GET `/api/schedule-pengiriman` dengan batch join MySQL + Mongo, pagination parent, sorting, search.
- Filter tambahan: hanya transaksi dengan `arrival_order >= hari ini`.

## Address Book Autocomplete (DN Pickup/Drop)
- Menambahkan collection Mongo `address_book` + API: suggest, use, upsert.
- Komponen autocomplete untuk textarea pickup/drop dengan rekomendasi dan free-text.
- Top 5 rekomendasi saat fokus kosong, pencarian tampil lebih banyak hasil.
- Upsert alamat baru setelah DN save sukses (tanpa mengganggu flow lama).

## RBAC & Akses Role
- Role `cs` hanya bisa akses Schedule Pengiriman (+ profile), redirect/403 jika akses route lain.
- Middleware backend membatasi API untuk role cs (hanya schedule + auth/me).
- Role mekanik diblok akses Sales Cost & Subcontractor.
- Role user diblok akses halaman Edit Repair.
- Menu sidebar disesuaikan untuk cs; notifikasi header disembunyikan untuk cs.

## UI/UX Table Rows Dropdown
- Dropdown rows (15/20/50) ditambahkan di:
  - Sales Cost (default 15, opsi 10 dihapus), Subcontractor, Repair.
  - Data Truck, Data Chasis, Data Supir.
  - Semua halaman Master Data (Admin, Customer, Driver, Truck, Area, Warehouse, Subcont).

## Lain-lain
- Tambah role CS di dropdown Master Admin.
- Tombol Edit disembunyikan untuk mekanik di Data Truck dan untuk role user di Daftar Repair.
- Login redirect: role cs langsung ke `/schedule-pengiriman`.
