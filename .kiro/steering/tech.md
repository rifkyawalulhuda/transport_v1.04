# Tech Stack & Build System

## Backend (`node_backend/`)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (CommonJS — `require`/`module.exports`)
- **Primary DB**: MySQL via `mysql2/promise` (connection pool)
- **Secondary DB**: MongoDB via `mongoose` (legacy features)
- **Auth**: JWT (`jsonwebtoken`)
- **File handling**: `multer` (uploads), `xlsx` + `exceljs` (import/export)
- **Migrations**: `dbmate` wrapped via custom Node scripts
- **External APIs**: Wialon (GPS), Geoapify (reverse geocoding)

## Frontend (`tailadmin-vuejs-1.0.0/`)

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build tool**: Vite
- **CSS**: Tailwind CSS 4 + PostCSS
- **UI base**: TailAdmin template
- **Maps**: Leaflet + leaflet.markercluster + OpenStreetMap tiles
- **Icons**: Lucide Vue, Heroicons
- **Linting**: ESLint + Prettier
- **Type checking**: vue-tsc

## Documentation (`docs/`)

- VitePress for project documentation site

## Common Commands

### Backend

```bash
cd node_backend
npm install          # Install dependencies
npm start            # Start Express server (default port 3000)
```

### Frontend

```bash
cd tailadmin-vuejs-1.0.0
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build-only   # Production build (skip type-check)
npm run build        # Type-check + production build
npm run lint         # ESLint fix
npm run format       # Prettier format src/
```

### Database Migrations

```bash
cd node_backend
npm run migrate              # Run all pending migrations
npm run migrate:status       # Check migration status
npm run migrate:new -- name  # Create new migration file
npm run migrate:down         # Rollback last migration
npm run migrate:adopt-existing  # Mark migrations as applied on existing DB
npm run migrate:dump         # Dump current schema to db/schema.sql
```

### Docs

```bash
cd docs
npm run dev          # VitePress dev server on port 5174
npm run build        # Build static docs
```

## Environment

- Backend config via `node_backend/.env` (see `.env.example` for required keys)
- Frontend env via `tailadmin-vuejs-1.0.0/.env.development` and `.env.production`
- Never commit `.env` files with real secrets
