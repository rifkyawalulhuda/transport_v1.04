---
title: "Development dengan Laragon + MySQL"
outline: deep
---

# Development dengan Laragon + MySQL

Panduan lengkap setup environment development menggunakan Laragon sebagai local server stack di Windows.

## Prerequisites

| Software | Keterangan |
|----------|------------|
| [Laragon](https://laragon.org/download/) | Full edition (sudah include MySQL, Apache, phpMyAdmin) |
| [Node.js](https://nodejs.org/) | Versi 18+ LTS |
| [Git](https://git-scm.com/) | Versi 2.30+ |

## Step 1: Install & Start Laragon

1. Download dan install Laragon Full
2. Buka Laragon → klik **Start All**
3. Pastikan **MySQL** dan **Apache** berstatus hijau (running)

> **Catatan:** Laragon menggunakan MySQL 8.4.x. Default user `root` tanpa password.

## Step 2: Clone Repository

```powershell
git clone https://github.com/rifkyawalulhuda/transport_v1.04.git
cd transport_v1.04
```

## Step 3: Setup Backend

### Install Dependencies

```powershell
cd node_backend
npm install
```

### Konfigurasi Environment

```powershell
Copy-Item .env.example .env
```

Edit `node_backend/.env` sesuai Laragon:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=trucking
DATABASE_URL=mysql://root@localhost:3306/trucking

JWT_SECRET=your_random_secret_string
PORT=3000
```

> **💡 Tip:** `DB_PASS` dikosongkan karena Laragon MySQL default tanpa password.
> Jika kamu sudah set password (lihat bagian bawah), isi sesuai password yang di-set.

### Jalankan Database Migration

```powershell
npm run migrate
```

Perintah ini akan:
- Membuat database `trucking` secara otomatis
- Menjalankan semua migration files

### Jalankan Backend

```powershell
npm start
```

Backend berjalan di `http://localhost:3000`.

## Step 4: Setup Frontend

```powershell
cd tailadmin-vuejs-1.0.0
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

> **ℹ️ Info:** Vite otomatis proxy `/api/*` ke backend port 3000. Pastikan backend sudah running.

## Step 5: Akses phpMyAdmin

Buka browser:

```
http://localhost/phpmyadmin
```

Login:
- **Username:** `root`
- **Password:** *(kosong)*

Jika error "Access denied (using password: YES)", edit config phpMyAdmin:

1. Buka `C:\laragon\etc\apps\phpMyAdmin\config.inc.php`
2. Cari dan ubah:
   ```php
   $cfg['Servers'][$i]['password'] = '';
   ```
3. Save dan refresh browser

## Step 6: Verifikasi

Checklist:

- [ ] Laragon MySQL running (hijau)
- [ ] `npm run migrate` berhasil tanpa error
- [ ] Backend running di `http://localhost:3000`
- [ ] Frontend running di `http://localhost:5173`
- [ ] phpMyAdmin bisa akses database `trucking`
- [ ] Login di frontend berhasil

---

## Set Password MySQL (Opsional)

Jika ingin menambahkan password ke MySQL Laragon agar sama dengan production:

1. Buka **Laragon → Terminal**
2. Jalankan:
   ```
   mysql -u root
   ```
3. Di MySQL prompt:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED BY '123457sankyu';
   FLUSH PRIVILEGES;
   EXIT;
   ```
4. Update `node_backend/.env`:
   ```env
   DB_PASS=123457sankyu
   DATABASE_URL=mysql://root:123457sankyu@localhost:3306/trucking
   ```
5. Update phpMyAdmin config:
   ```php
   $cfg['Servers'][$i]['password'] = '123457sankyu';
   ```

---

## Troubleshooting Laragon

### MySQL tidak bisa start

- Cek apakah port 3306 sudah dipakai (XAMPP, MySQL lain)
- Laragon → Preferences → Services & Ports → ubah port MySQL jika bentrok
- Jika ubah port, sesuaikan `DB_PORT` di `.env`

### `vite` is not recognized

```powershell
cd tailadmin-vuejs-1.0.0
npm install
```

`node_modules` belum terinstall — `npm install` akan download semua dependency termasuk Vite.

### `npm run migrate` error: Access denied

Password di `.env` tidak cocok dengan MySQL. Cek:
- Laragon default: `DB_PASS=` (kosong)
- Jika sudah set password: `DB_PASS=<password_yang_diset>`

### `npm run migrate` error: ADD COLUMN IF NOT EXISTS

MySQL 8.x tidak support syntax `IF NOT EXISTS` di ALTER TABLE. Migration files di repo ini sudah diperbaiki untuk compatible dengan MySQL 8.x. Pastikan kamu pull versi terbaru:

```powershell
git pull origin main
```

### phpMyAdmin error "Access denied (using password: YES)"

phpMyAdmin config punya password hardcoded yang tidak cocok. Edit:
- File: `C:\laragon\etc\apps\phpMyAdmin\config.inc.php`
- Set `$cfg['Servers'][$i]['password']` sesuai password MySQL aktual

### Backend error: ECONNREFUSED 127.0.0.1:3306

MySQL Laragon belum running. Buka Laragon → Start All.

### PowerShell execution policy error

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Struktur Workflow Harian

```
1. Buka Laragon → Start All
2. Terminal 1: cd node_backend → npm start
3. Terminal 2: cd tailadmin-vuejs-1.0.0 → npm run dev
4. Browser: http://localhost:5173
5. phpMyAdmin: http://localhost/phpmyadmin (jika perlu cek DB)
```

---

## Perbedaan dengan Production

| Item | Laragon (Dev) | Production |
|------|---------------|------------|
| MySQL password | Kosong (atau custom) | `123457sankyu` |
| Frontend | Vite dev server (port 5173) | Static build + Nginx |
| Backend | `npm start` langsung | PM2 / systemd |
| URL | `http://localhost:5173` | `https://sankyu-transport.fun` |
| HTTPS | Tidak | Ya (Certbot) |
| Hot reload | Ya (Vite HMR) | Tidak |
