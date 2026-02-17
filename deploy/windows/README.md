# Deploy Lokal Windows - transport_v1.04

Dokumen ini untuk jalankan aplikasi `transport_v1.04` di PC server lokal (akses LAN) dengan:
1. Nginx (frontend + reverse proxy API)
2. Node.js backend
3. MySQL + MongoDB

## 1. Struktur Script

Folder: `deploy/windows`

1. `start-local-server.bat` / `.ps1`
2. `stop-local-server.bat` / `.ps1`
3. `backup-db.bat` / `.ps1` (MySQL + MongoDB)
4. `restore-db.bat` / `.ps1` (MySQL + MongoDB)

## 2. Prasyarat

1. Node.js LTS
2. Nginx for Windows
3. Frontend sudah build (`tailadmin-vuejs-1.0.0/dist`)
4. `.env` backend valid (`node_backend/.env`)

Contoh `.env` minimal:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=trucking
MONGO_URI=mongodb://127.0.0.1:27017/transport_db
PORT=3000
```

## 3. Start/Stop Service

Jalankan dari `deploy/windows`:

```bat
start-local-server.bat
```

Jika path nginx beda:

```bat
start-local-server.bat -NginxDir "D:\tools\nginx-1.28.2"
```

Stop:

```bat
stop-local-server.bat
```

## 3.1 Pakai Nginx Config Final

File siap pakai:
1. `deploy\windows\nginx.conf`
2. `deploy\windows\nginx.8080.conf` (jika port 80 bentrok)

Copy ke Nginx:

```bat
copy /Y D:\Github\transport_v1.04\deploy\windows\nginx.conf C:\Users\rifky\Downloads\nginx-1.28.2\conf\nginx.conf
```

Test config:

```bat
cd C:\Users\rifky\Downloads\nginx-1.28.2
nginx.exe -t
```

Jika harus pakai port `8080`:

```bat
copy /Y D:\Github\transport_v1.04\deploy\windows\nginx.8080.conf C:\Users\rifky\Downloads\nginx-1.28.2\conf\nginx.conf
cd C:\Users\rifky\Downloads\nginx-1.28.2
nginx.exe -t
nginx.exe -s reload
```

Buka firewall `8080` (Run as Administrator):

```bat
cd D:\Github\transport_v1.04\deploy\windows
open-firewall-8080.bat
```

Akses dari LAN:
1. `http://<IP_SERVER>:8080/`

## 4. Backup Database

Mode default `auto`:
1. Pakai command host kalau ada (`mysqldump`, `mongodump`)
2. Fallback Docker container kalau command host tidak ada

```bat
backup-db.bat
```

Output default:
1. `deploy\windows\backups\backup_YYYYMMDD_HHMMSS\mysql.sql`
2. `deploy\windows\backups\backup_YYYYMMDD_HHMMSS\mongo.archive.gz`
3. `deploy\windows\backups\backup_YYYYMMDD_HHMMSS\backup-meta.json`

Backup ke folder custom:

```bat
backup-db.bat "D:\backup\transport_20260212"
```

Force mode:

```bat
backup-db.bat -Mode host
backup-db.bat -Mode docker
```

Container custom:

```bat
backup-db.bat -Mode docker -MySqlContainer mysql8 -MongoContainer mongo7
```

## 5. Restore Database

Restore dari backup terbaru:

```bat
restore-db.bat
```

Restore dari folder tertentu:

```bat
restore-db.bat "D:\backup\transport_20260212"
```

Restore akan minta konfirmasi `YES`.

Skip konfirmasi:

```bat
restore-db.bat "D:\backup\transport_20260212" -Force
```

Mode dan container custom:

```bat
restore-db.bat "D:\backup\transport_20260212" -Mode docker -MySqlContainer mysql8 -MongoContainer mongo7
```

## 6. Catatan Penting

1. `restore-db` akan overwrite data:
   - MySQL import ulang ke `DB_NAME`
   - Mongo restore dengan `--drop`
2. Jika port `80` dipakai aplikasi lain, ubah port listen Nginx (misal `8080`) dan buka firewall port tersebut.
3. Untuk akses dari PC lain: pakai `http://<IP_SERVER>:<PORT_NGINX>/`

## 7. Troubleshooting Cepat

1. `mysqldump`/`mysql` tidak dikenali:
   - install MySQL client, atau pakai `-Mode docker`
2. `mongodump`/`mongorestore` tidak dikenali:
   - install MongoDB Database Tools, atau pakai `-Mode docker`
3. Nginx gagal start:
   - cek `nginx.exe -t`
4. UI kosong:
   - build frontend ulang `npm run build`
