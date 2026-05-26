---
title: "Coding Conventions"
outline: deep
---

# Coding Conventions

Standar dan pola yang diikuti dalam project ini.

## Backend (Node.js / Express)

### Bahasa & Module System

- JavaScript (bukan TypeScript)
- CommonJS: `require()` / `module.exports`
- Tidak menggunakan ES Modules di backend

### Struktur File Route

```javascript
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticateToken } = require("../middleware/auth");

// Semua route dalam file ini memerlukan auth
router.use(authenticateToken);

// GET list
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM table_name");
    res.json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

module.exports = router;
```

### Naming Conventions (Backend)

| Item | Convention | Contoh |
|------|-----------|--------|
| File route | camelCase | `salesCost.js`, `dataTruck.js` |
| File service | camelCase | `wialonService.js` |
| Variable | camelCase | `truckId`, `noPolisi` |
| Database column | snake_case | `is_active`, `wialon_unit_id` |
| API endpoint | kebab-case | `/api/sales-costs`, `/api/data-trucks` |
| Error message | Bahasa Indonesia | `"Token tidak ditemukan"` |

### Database Query Pattern

```javascript
// ✅ Parameterized query (aman dari SQL injection)
const [rows] = await pool.query(
  "SELECT * FROM truck WHERE id = ? AND is_active = ?",
  [id, 1]
);

// ❌ String concatenation (JANGAN)
const [rows] = await pool.query(
  `SELECT * FROM truck WHERE id = ${id}`
);
```

### Error Handling Pattern

```javascript
router.post("/", async (req, res) => {
  try {
    // ... logic
    res.status(201).json({ message: "Berhasil", data: result });
  } catch (error) {
    console.error("Deskripsi context:", error);
    res.status(500).json({ message: "Pesan error user-friendly" });
  }
});
```

### Soft Delete Pattern

```javascript
// Deactivate (soft delete)
router.patch("/:id/status", async (req, res) => {
  const { is_active } = req.body;
  await pool.query("UPDATE truck SET is_active = ? WHERE id = ?", [is_active, id]);
});

// Default query: hanya active
const [rows] = await pool.query("SELECT * FROM truck WHERE is_active = 1");

// Admin view: semua
const [rows] = await pool.query("SELECT * FROM truck");
```

### Date Handling

```javascript
// ✅ Preserve local date parts
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ❌ Jangan gunakan (bisa geser 1 hari karena UTC)
const bad = new Date(dateValue).toISOString().slice(0, 10);
```

## Frontend (Vue 3 / TypeScript)

### Bahasa & Style

- TypeScript untuk file baru (`.ts`, `.vue` dengan `<script setup lang="ts">`)
- File legacy boleh tetap `.js` sampai ada kebutuhan refactor
- Vue 3 Composition API dengan `<script setup>`
- Tailwind CSS utility classes

### Struktur Component (Vue SFC)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API_BASE } from '@/config/api'

// Props & emits
const props = defineProps<{
  truckId: number
}>()

// Reactive state
const loading = ref(false)
const data = ref<TruckData | null>(null)

// Methods
const fetchData = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/trucks/${props.truckId}`)
    data.value = await res.json()
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-4">
    <!-- template -->
  </div>
</template>
```

### Naming Conventions (Frontend)

| Item | Convention | Contoh |
|------|-----------|--------|
| Component file | PascalCase | `TruckLocationMap.vue` |
| View folder | PascalCase | `views/Master/`, `views/Monitoring/` |
| Service file | camelCase | `truckLocationService.ts` |
| Composable | camelCase with `use` prefix | `useAuth.ts` |
| Variable/ref | camelCase | `truckList`, `isLoading` |
| CSS class | Tailwind utilities | `class="flex items-center gap-2"` |

### Service Pattern

```typescript
// src/services/truckLocationService.ts
import { API_BASE } from '@/config/api'

export const getTruckLocations = async () => {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/wialon/trucks/location`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}
```

### Path Alias

Gunakan `@/` untuk import dari `src/`:

```typescript
import { API_BASE } from '@/config/api'
import TruckCard from '@/components/TruckCard.vue'
```

### Tailwind CSS Guidelines

- Gunakan utility classes langsung di template
- Hindari custom CSS kecuali benar-benar diperlukan
- Gunakan responsive prefixes: `sm:`, `md:`, `lg:`
- Gunakan dark mode prefix jika diperlukan: `dark:`

```html
<!-- ✅ Tailwind utilities -->
<div class="flex items-center gap-4 p-4 rounded-lg bg-white shadow-sm">

<!-- ❌ Hindari custom class tanpa alasan kuat -->
<div class="truck-card-wrapper">
```

## API Communication

### Request Pattern

- Semua API calls melalui service files di `src/services/`
- Token diambil dari `localStorage`
- Base URL dari `@/config/api`

### Response Handling

```typescript
const res = await fetch(url, { headers })
if (!res.ok) {
  const error = await res.json()
  throw new Error(error.message || 'Request failed')
}
return res.json()
```

## Git Conventions

### Commit Messages

Format: `<type>: <description>`

| Type | Penggunaan |
|------|-----------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `refactor` | Refactoring tanpa perubahan behavior |
| `docs` | Perubahan dokumentasi |
| `style` | Formatting, missing semicolons, dll |
| `chore` | Maintenance, dependency update |

Contoh:
```
feat: add monthly mileage export to Excel
fix: date shift issue on Sales Cost edit
refactor: extract geofence tracking to service
```

### Branch Naming

```
feature/add-truck-mileage
fix/date-shift-sales-cost
refactor/wialon-service-cleanup
```

## File Organization Rules

1. **Satu route file per domain** — jangan gabung multiple domains
2. **Business logic di services** — route hanya handle HTTP
3. **Satu service file per external integration** — e.g., `wialonService.js`
4. **Views by domain** — `views/Master/`, `views/Transaksi/`
5. **Shared components di `components/`** — bukan di dalam `views/`
6. **Migration files tidak boleh diedit** setelah di-apply — buat migration baru

## Bahasa

- **Code**: English (variable names, function names, comments)
- **UI text**: Bahasa Indonesia
- **API error messages**: Bahasa Indonesia
- **Documentation**: Bahasa Indonesia (kecuali technical terms)
- **Git commits**: English
