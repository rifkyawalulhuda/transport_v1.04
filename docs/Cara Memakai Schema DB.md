# Database Migration CLI

Project ini sekarang memakai `dbmate` untuk menjaga schema database MySQL tetap konsisten antar perangkat.

## File penting

- `db/migrations/` menyimpan file migration SQL
- `scripts/run-dbmate.js` membungkus `dbmate` dan otomatis membentuk `DATABASE_URL` dari `.env`
- `scripts/build-baseline-migration.js` membangun baseline migration dari `../trucking.sql`
- `scripts/adopt-existing-migrations.js` menandai migration sebagai sudah terpasang untuk database lama yang sudah terisi
- `scripts/dump-schema.js` membuat `db/schema.sql` tanpa bergantung pada `mysqldump`

## Setup pertama di perangkat baru

1. Install dependency backend:

```powershell
cd D:\Github\transport_v1.04\node_backend
npm install
```

2. Copy `.env` dari template lalu isi koneksi MySQL:

```powershell
Copy-Item .env.example .env
```

3. Jalankan migration:

```powershell
npm run migrate
```

Perintah di atas akan:

- membaca `.env`
- membuat database jika belum ada
- menjalankan semua file di `db/migrations`
- tidak melakukan auto schema dump saat migrate agar workflow Windows/MySQL lebih stabil

## Database existing yang sudah terisi

Kalau database lama di perangkat saat ini sudah berisi schema/data yang sama dengan repo, jangan langsung jalankan `npm run migrate`.

Gunakan:

```powershell
npm run migrate:adopt-existing
```

Perintah ini akan melengkapi bagian schema yang masih kurang untuk tabel tracking yang baru, tanpa menghapus data lama, lalu menandai migration repo sebagai sudah diterapkan.

Setelah itu, migration berikutnya tinggal pakai:

```powershell
npm run migrate
```

## Perintah yang tersedia

```powershell
npm run migrate
npm run migrate:down
npm run migrate:status
npm run migrate:new -- add_some_change
npm run migrate:dump
npm run migrate:baseline:build
npm run migrate:adopt-existing
```

## Environment yang dipakai

Minimal:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=trucking
```

Opsional, kalau ingin override penuh:

```env
DATABASE_URL=mysql://root:your_password@localhost:3306/trucking
```

Kalau `DATABASE_URL` diisi, wrapper akan memakainya langsung.

## Catatan workflow

- Baseline migration saat ini dibangun dari `D:\Github\transport_v1.04\trucking.sql`
- Baseline default membawa schema terbaru dari dump, tanpa data transaksi
- Jika suatu saat perlu membangun baseline yang ikut membawa data dump, jalankan `node scripts/build-baseline-migration.js --with-data`
- Untuk perubahan schema berikutnya, buat migration baru dengan `npm run migrate:new -- nama_perubahan`
- Simpan migration SQL ke git supaya perangkat lain cukup `npm install` lalu `npm run migrate`
