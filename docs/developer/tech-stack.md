---
title: "Tech Stack"
outline: deep
---

# Tech Stack

## Backend — `node_backend/`

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | Node.js | — |
| Framework | Express.js | ^4.18 |
| Bahasa | JavaScript (CommonJS) | — |
| Database Utama | MySQL | via `mysql2` ^3.9 |
| Database Sekunder | MongoDB | via `mongoose` ^9.1 (legacy) |
| Autentikasi | JWT | `jsonwebtoken` ^9.0 |
| Upload File | Multer | ^2.0 |
| Excel Import/Export | `xlsx` ^0.18, `exceljs` ^4.4 | — |
| Migrasi DB | dbmate | ^2.32 (dev) |
| GPS Integration | Wialon API | — |
| Reverse Geocoding | Geoapify API | — |

### Dependency Utama Backend

```json
{
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "exceljs": "^4.4.0",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^9.1.4",
  "multer": "^2.0.2",
  "mysql2": "^3.9.7",
  "xlsx": "^0.18.5"
}
```

## Frontend — `tailadmin-vuejs-1.0.0/`

| Kategori | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Vue 3 | ^3.5 |
| Bahasa | TypeScript | ~5.7 |
| Build Tool | Vite | ^6.0 |
| CSS Framework | Tailwind CSS | ^4.0 |
| UI Template | TailAdmin Vue Pro | 2.0.1 |
| Router | Vue Router | ^4.5 |
| Maps | Leaflet + MarkerCluster | ^1.9 |
| Icons | Lucide Vue Next, Heroicons | — |
| Charts | ApexCharts (vue3-apexcharts) | ^1.8 |
| Date Picker | Vue Datepicker, Flatpickr | — |
| Linting | ESLint + Prettier | — |
| Type Check | vue-tsc | ^2.2 |

### Dependency Utama Frontend

```json
{
  "vue": "^3.5.13",
  "vue-router": "^4.5.0",
  "leaflet": "^1.9.4",
  "leaflet.markercluster": "^1.5.3",
  "tailwindcss": "^4.0.0",
  "apexcharts": "^4.4.0",
  "lucide-vue-next": "^0.474.0"
}
```

## Documentation — `docs/`

| Kategori | Teknologi |
|----------|-----------|
| Static Site Generator | VitePress ^1.0 |
| Port Development | 5174 |

## External Services

| Service | Fungsi | Catatan |
|---------|--------|---------|
| Wialon | GPS tracking, geofence, trip history | Token di backend `.env` |
| Geoapify | Reverse geocoding (koordinat → alamat) | API key di backend `.env` |
| MySQL | Database utama (data operasional) | Local atau remote |
| MongoDB | Database sekunder (fitur legacy) | Opsional |

## Ports Default

| Service | Port |
|---------|------|
| Backend (Express) | 3000 |
| Frontend (Vite dev) | 5173 |
| Docs (VitePress) | 5174 |
| MySQL | 3306 |
