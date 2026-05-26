---
title: "Database & Migrations"
outline: deep
---

# Database & Migrations

## Overview

Sistem menggunakan **MySQL** sebagai database utama dan **MongoDB** untuk fitur legacy. Schema MySQL dikelola menggunakan **dbmate** yang dibungkus dalam custom Node.js scripts.

## Struktur File

```
node_backend/
├── db.js                  # MySQL connection pool
├── db/
│   ├── migrations/        # SQL migration files (timestamp-ordered)
│   │   ├── 20260401010000_baseline_from_trucking_dump.sql
│   │   ├── 20260401011000_add_tracking_foreign_keys.sql
│   │   ├── 20260401012000_add_area_finish_geofence.sql
│   │   ├── 20260424010000_add_truck_is_active.sql
│   │   └── 20260424011000_add_driver_is_active.sql
│   ├── schema.sql         # Generated schema snapshot
│   └── README.md          # Migration CLI documentation
├── scripts/
│   ├── run-dbmate.js      # dbmate wrapper (builds DATABASE_URL from .env)
│   ├── build-baseline-migration.js
│   ├── adopt-existing-migrations.js
│   └── dump-schema.js
└── models/                # Mongoose models (MongoDB legacy)
```

## Migration Commands

| Command | Fungsi |
|---------|--------|
| `npm run migrate` | Jalankan semua pending migrations |
| `npm run migrate:down` | Rollback migration terakhir |
| `npm run migrate:status` | Lihat status migration |
| `npm run migrate:new -- <name>` | Buat file migration baru |
| `npm run migrate:dump` | Generate `db/schema.sql` dari database aktif |
| `npm run migrate:adopt-existing` | Tandai migrations sebagai applied (DB existing) |
| `npm run migrate:baseline:build` | Build baseline migration dari SQL dump |

## Workflow Migration

### Membuat Perubahan Schema Baru

1. Buat file migration:
   ```powershell
   cd node_backend
   npm run migrate:new -- add_column_xyz
   ```

2. Edit file yang dihasilkan di `db/migrations/`:
   ```sql
   -- migrate:up
   ALTER TABLE truck ADD COLUMN xyz VARCHAR(100) NULL;

   -- migrate:down
   ALTER TABLE truck DROP COLUMN xyz;
   ```

3. Jalankan migration:
   ```powershell
   npm run migrate
   ```

4. (Opsional) Update schema snapshot:
   ```powershell
   npm run migrate:dump
   ```

5. Commit file migration ke git

### Naming Convention

Format: `YYYYMMDDHHMMSS_deskripsi_singkat.sql`

Contoh:
- `20260401010000_baseline_from_trucking_dump.sql`
- `20260424010000_add_truck_is_active.sql`

### Sync di Perangkat Lain

Setelah pull dari git, cukup jalankan:

```powershell
cd node_backend
npm run migrate
```

## Tabel Utama

### `truck`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `no_polisi` | VARCHAR | Nomor plat |
| `jenis_kendaraan` | VARCHAR | Tipe kendaraan |
| `wialon_unit_id` | VARCHAR(64) NULL | Mapping ke Wialon unit |
| `is_active` | TINYINT(1) DEFAULT 1 | Soft delete flag |

### `driver`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `nama_supir` | VARCHAR | Nama driver |
| `is_active` | TINYINT(1) DEFAULT 1 | Soft delete flag |

### `sales_cost`

Tabel transaksi utama yang menghubungkan truck, driver, customer, area, dan data biaya.

### `area`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `kode_area` | VARCHAR | Kode area |
| `nama_area` | VARCHAR | Generated dari route steps |
| `finish_geofence_resource_id` | VARCHAR NULL | Wialon resource ID |
| `finish_geofence_zone_id` | VARCHAR NULL | Wialon zone ID |
| `finish_geofence_zone_name` | VARCHAR NULL | Nama geofence finish |

### `area_route_step`

Menyimpan urutan langkah route per area dengan mapping ke Wialon geofence.

### `sales_cost_route_history`

Menyimpan riwayat kunjungan geofence aktual per Sales Cost delivery.

### `schema_migrations`

Tabel internal dbmate untuk tracking migration yang sudah diterapkan.

## Connection Pool

```javascript
// db.js
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "trucking",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Penggunaan di Route/Service

```javascript
const pool = require("../db");

// Query biasa
const [rows] = await pool.query("SELECT * FROM truck WHERE is_active = 1");

// Query dengan parameter (prepared statement)
const [rows] = await pool.query(
  "SELECT * FROM truck WHERE id = ?",
  [truckId]
);

// Insert
const [result] = await pool.query(
  "INSERT INTO truck (no_polisi, jenis_kendaraan) VALUES (?, ?)",
  [noPolisi, jenisKendaraan]
);
```

::: warning Keamanan
Selalu gunakan parameterized queries (`?` placeholder). Jangan pernah string concatenation untuk values.
:::

## MongoDB (Legacy)

MongoDB digunakan untuk beberapa fitur lama. Model didefinisikan di `node_backend/models/`.

Koneksi MongoDB opsional — jika `MONGO_URI` tidak diset di `.env`, server tetap berjalan tanpa MongoDB.

```javascript
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  await mongoose.connect(mongoUri);
}
```

## Backup & Restore

### Export Schema

```powershell
npm run migrate:dump
```

Menghasilkan `db/schema.sql` yang bisa digunakan sebagai referensi.

### Full Database Backup

```powershell
mysqldump -u root -p trucking > backup_trucking_$(date +%Y%m%d).sql
```

### Restore dari Backup

```powershell
mysql -u root -p trucking < backup_trucking_20260401.sql
```

Setelah restore, jalankan:
```powershell
npm run migrate:adopt-existing
```

## Tips & Best Practices

1. **Selalu buat migration** untuk perubahan schema — jangan edit database langsung
2. **Commit migration files** ke git agar semua developer sinkron
3. **Jangan edit migration yang sudah di-apply** — buat migration baru untuk koreksi
4. **Test migration down** sebelum push untuk memastikan rollback berfungsi
5. **Gunakan `is_active` flag** untuk soft delete, bukan `DELETE FROM`
6. **Date handling**: Simpan sebagai `DATE` type, parse sebagai local date (bukan UTC)
