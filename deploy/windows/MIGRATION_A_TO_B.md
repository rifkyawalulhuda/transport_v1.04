# Panduan Pindah Server A ke B - transport_v1.04 (Windows)

Dokumen ini untuk migrasi aplikasi `transport_v1.04` dari perangkat A ke perangkat B.

## 1. Komponen

1. Frontend: `tailadmin-vuejs-1.0.0/dist` (served by Nginx)
2. Backend: `node_backend` (Node.js, port dari `.env`, default `3000`)
3. Database:
   - MySQL (`DB_NAME`, default `trucking`)
   - MongoDB (`MONGO_URI`)

## 2. Langkah di Perangkat A

1. Stop service:

```bat
cd D:\Github\transport_v1.04\deploy\windows
stop-local-server.bat
```

2. Backup DB:

```bat
backup-db.bat
```

Jika DB jalan di Docker:

```bat
backup-db.bat -Mode docker
```

3. Salin ke perangkat B:
1. Folder project `D:\Github\transport_v1.04`
2. Folder backup dari `deploy\windows\backups\backup_YYYYMMDD_HHMMSS`

## 3. Langkah di Perangkat B

1. Install dependency backend:

```bat
cd D:\Github\transport_v1.04\node_backend
npm ci
```

2. Build frontend:

```bat
cd D:\Github\transport_v1.04\tailadmin-vuejs-1.0.0
npm ci
npm run build
```

3. Update `node_backend\.env` sesuai perangkat B:
1. `DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME`
2. `MONGO_URI`
3. `PORT`

4. Restore DB:

```bat
cd D:\Github\transport_v1.04\deploy\windows
restore-db.bat "D:\backup\transport_20260212"
```

Jika DB di Docker:

```bat
restore-db.bat "D:\backup\transport_20260212" -Mode docker
```

5. Jalankan service:

```bat
start-local-server.bat
```

## 4. Verifikasi

1. `http://localhost/` terbuka
2. `http://localhost:<PORT_BACKEND>/` merespons
3. Akses dari LAN: `http://<IP_SERVER>/`
4. Data aplikasi terbaca normal

## 5. Catatan

1. Jika port `80` bentrok, ubah listen Nginx ke `8080` dan akses via `http://<IP_SERVER>:8080/`
2. Restore Mongo dijalankan dengan `--drop` (data lama akan diganti)

Contoh cepat port `8080`:

```bat
copy /Y D:\Github\transport_v1.04\deploy\windows\nginx.8080.conf C:\Users\rifky\Downloads\nginx-1.28.2\conf\nginx.conf
cd C:\Users\rifky\Downloads\nginx-1.28.2
nginx.exe -t
nginx.exe -s reload
cd D:\Github\transport_v1.04\deploy\windows
open-firewall-8080.bat
```
