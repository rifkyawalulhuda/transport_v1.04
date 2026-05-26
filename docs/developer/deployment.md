---
title: "Deployment"
outline: deep
---

# Deployment

Panduan untuk deploy aplikasi ke environment production.

## Arsitektur Production

```
Internet
  │
  ▼
[Reverse Proxy / Domain]
  │
  ├── https://sankyu-transport.fun (Frontend)
  │     └── Static files (Vite build output)
  │
  └── https://sankyu-transport.fun/api/* (Backend)
        └── Node.js Express (port 3000)
```

## Prerequisites Production

| Software | Versi |
|----------|-------|
| Node.js | 18+ LTS |
| MySQL | 8.0+ |
| npm | 9+ |
| Git | 2.30+ |

Opsional:
- MongoDB 6.0+ (jika fitur legacy digunakan)
- PM2 atau systemd (process manager)
- Nginx atau Caddy (reverse proxy)

## Deploy Backend

### 1. Clone & Install

```bash
git clone <repo-url> /opt/transport
cd /opt/transport/node_backend
npm install --production
```

### 2. Konfigurasi Environment

Buat file `.env` dengan nilai production:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=transport_user
DB_PASS=<strong_password>
DB_NAME=trucking

JWT_SECRET=<random_64_char_string>
PORT=3000

WIALON_BASE_URL=https://hst-api.wialon.com/wialon/ajax.html
WIALON_TOKEN=<production_wialon_token>
WIALON_LOGIN_FLAGS=13
WIALON_SESSION_TTL_MS=2700000
WIALON_TIMEOUT_MS=20000

GEOAPIFY_API_KEY=<production_api_key>
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1/geocode/reverse
GEOAPIFY_TIMEOUT_MS=6000

REVERSE_GEOCODE_CACHE_TTL_MS=86400000
WIALON_MONTHLY_DISTANCE_CACHE_TTL_MS=600000
GEOFENCE_TRACKING_INTERVAL_MS=60000
DEFAULT_FINISH_GEOFENCE_NAME=Sankyu
```

::: danger Keamanan
- Gunakan password MySQL yang kuat dan user dedicated (bukan root)
- Generate `JWT_SECRET` yang random dan panjang
- Jangan commit `.env` ke git
- Batasi akses file `.env` hanya untuk user yang menjalankan service
:::

### 3. Setup Database

```bash
npm run migrate
```

### 4. Jalankan dengan Process Manager

Menggunakan PM2:

```bash
npm install -g pm2

# Start
pm2 start server.js --name transport-backend

# Auto-start on reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs transport-backend
```

Atau menggunakan systemd:

```ini
# /etc/systemd/system/transport-backend.service
[Unit]
Description=Transport Backend API
After=network.target mysql.service

[Service]
Type=simple
User=transport
WorkingDirectory=/opt/transport/node_backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable transport-backend
sudo systemctl start transport-backend
```

## Deploy Frontend

### 1. Build

```bash
cd /opt/transport/tailadmin-vuejs-1.0.0
npm install
npm run build-only
```

Output build ada di folder `dist/`.

::: info
`npm run build-only` skip type-check untuk build lebih cepat. Gunakan `npm run build` jika ingin type-check sekaligus.
:::

### 2. Konfigurasi API URL

Pastikan `.env.production` mengarah ke URL backend yang benar:

```env
VITE_API_URL=https://sankyu-transport.fun
```

### 3. Serve Static Files

Folder `dist/` berisi static files yang bisa di-serve oleh web server apapun.

**Nginx contoh konfigurasi:**

```nginx
server {
    listen 80;
    server_name sankyu-transport.fun;

    # Frontend static files
    root /opt/transport/tailadmin-vuejs-1.0.0/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ke backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy static uploads
    location /img/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location /doc-data-truck/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location /doc-data-chasis/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location /doc-supir/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## Development Server sebagai Production (Alternatif Sederhana)

Untuk deployment sederhana tanpa Nginx (misalnya internal network):

**Backend:**
```bash
cd node_backend
npm start
```

**Frontend (serve via Vite preview atau dev mode):**
```bash
cd tailadmin-vuejs-1.0.0
npm run dev -- --host 0.0.0.0
```

::: warning
Cara ini tidak direkomendasikan untuk production publik. Gunakan build + web server untuk performa dan keamanan yang lebih baik.
:::

## Update / Redeploy

### Pull Changes

```bash
cd /opt/transport
git pull origin main
```

### Update Backend

```bash
cd node_backend
npm install
npm run migrate    # Jalankan migration baru jika ada
pm2 restart transport-backend
```

### Update Frontend

```bash
cd tailadmin-vuejs-1.0.0
npm install
npm run build-only
# Static files otomatis ter-update karena Nginx serve dari dist/
```

## SSL/HTTPS

Untuk production, gunakan HTTPS. Contoh dengan Certbot (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sankyu-transport.fun
```

## Monitoring Production

### Logs Backend

```bash
# PM2
pm2 logs transport-backend

# Systemd
journalctl -u transport-backend -f
```

### Health Check

```bash
curl http://localhost:3000/api/auth/me
# Expect: 401 (token tidak ditemukan) = server berjalan
```

### Database Backup (Cron)

```bash
# /etc/cron.d/transport-backup
0 2 * * * transport mysqldump -u transport_user -p'password' trucking > /backup/trucking_$(date +\%Y\%m\%d).sql
```

## Checklist Deployment

- [ ] `.env` production sudah dikonfigurasi dengan benar
- [ ] Database migration sudah dijalankan
- [ ] Frontend build berhasil tanpa error
- [ ] Backend berjalan dan merespons di port 3000
- [ ] Reverse proxy (Nginx) dikonfigurasi
- [ ] SSL certificate aktif
- [ ] Process manager (PM2/systemd) dikonfigurasi untuk auto-restart
- [ ] Backup database terjadwal
- [ ] Firewall hanya expose port 80/443
