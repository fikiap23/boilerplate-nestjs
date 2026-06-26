# Boilerplate Nest

Production-ready **NestJS** starter for backend APIs — JWT auth, role-based admin management, Prisma + PostgreSQL, and Redis cache built into the repository layer.

Skip weeks of boilerplate. Clone, configure, and ship features on a consistent architecture your team can extend.

---

## Why this boilerplate?

| Problem | How this repo solves it |
|--------|-------------------------|
| Auth from scratch every project | JWT login, guards, role checks, and Passport strategy wired up |
| Inconsistent data access | All DB reads/writes go through `createPrismaRepository` — cache and invalidation stay consistent |
| Cache bugs in production | Redis cache-aside is opt-in per repository, with sensitive-field bypass and documented invalidation rules |
| Messy API responses | Standard `{ isSuccess, message, data, meta? }` format, centralized error handling, Swagger out of the box |
| Docker setup pain | `Makefile` + `build/` for dev, production, and isolated migration workflows |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 11 |
| ORM | Prisma 7 + PostgreSQL 16 |
| Cache | Redis 7 (ioredis), cache-aside at repository level |
| Auth | JWT (Passport), bcrypt password hashing |
| Validation | class-validator, env validation on startup |
| API docs | Swagger UI at `/docs` (HTTP Basic Auth) |
| Runtime | Node.js 20+ |

---

## Features

### Authentication & authorization
- Admin login → JWT access token (7-day expiry)
- `JwtGuard` + `RoleGuard` with `@Roles()` decorator
- Roles: `SUPERADMIN`, `ADMIN`, `EDITOR`, `MODERATOR`
- Admin status: `ACTIVE`, `INACTIVE`

### Admin management
- Full CRUD with pagination, search, and filters (role, status)
- Profile endpoints (read/update own profile)
- Superadmin-only create/update/delete

### Data layer
- Generic `createPrismaRepository` factory — typed CRUD, pagination, transactions
- Redis cache-aside with per-method TTL and automatic invalidation
- PostgreSQL row-level locking (`SELECT … FOR UPDATE`) for race-safe read-modify-write
- Idempotent seed for a default superadmin

### Developer experience
- Swagger at `/docs` with `@SwaggerEndpoint` decorator
- ESLint + Prettier, Jest setup
- Docker Compose for local dev (app, Postgres, Redis, Redis Commander)
- `AGENTS.md` and `docs/CACHE.md` for AI agents and contributors

---

## Architecture

```
HTTP Request
    ↓
Controller   ← guards, validation, Swagger, response formatting
    ↓
Service      ← business logic, authorization (handle* methods)
    ↓
Repository   ← Prisma + Redis cache (createPrismaRepository)
    ↓
PostgreSQL / Redis
```

**Rule:** Services and controllers never call `prisma.*` directly. All database access goes through repositories so caching and invalidation stay correct.

```
src/
├── config/              # Env configs + validation
├── common/              # Guards, decorators, utils, middleware
├── infrastructure/
│   ├── prisma/          # PrismaService, repository factory, row lock
│   └── redis/           # RedisService, cache utilities
├── modules/
│   ├── auth/            # Login, JWT strategy
│   └── admin/           # Admin CRUD
└── shared/              # Cross-module DTOs & interfaces
```

---

## Quick start

### Option A — Docker (recommended)

Fastest path: app, database, and Redis in one command.

```bash
# 1. Create shared Docker network (once)
make network

# 2. Configure environment
cp build/.env.example .env
# Edit JWT_SECRET and passwords before production use

# 3. Start everything
make up
```

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Redis Commander | http://localhost:8081 |

Default Swagger credentials: `admin` / `admin` (set via `SWAGGER_USERNAME` / `SWAGGER_PASSWORD`).

### Option B — Local (Node.js)

Run the app on your machine; connect to local or Docker Postgres/Redis.

```bash
# 1. Install dependencies
yarn install   # or npm install

# 2. Configure environment
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, REDIS_*

# 3. Database setup
npx prisma migrate dev
npx prisma db seed    # optional — creates superadmin

# 4. Start dev server
yarn start:dev
```

---

## Default login (after seed)

| Field | Value |
|-------|-------|
| Email | `superadmin@example.com` |
| Password | `Superadmin123!` (or `SUPER_ADMIN_PASSWORD_SEED` from `.env`) |

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"Superadmin123!"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>` on protected routes.

---

## API overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | — | Login with email & password → `accessToken` |
| `GET` | `/admin/profile` | JWT | Current admin profile |
| `PATCH` | `/admin/profile` | JWT | Update own profile |
| `GET` | `/admin/paginate` | JWT + ADMIN/SUPERADMIN | Paginated list (`page`, `limit`, `search`, `role`, `status`) |
| `GET` | `/admin/:id` | JWT | Get admin by ID |
| `POST` | `/admin` | JWT + SUPERADMIN | Create admin |
| `PATCH` | `/admin/:id` | JWT + SUPERADMIN | Update admin |
| `DELETE` | `/admin/:id` | JWT + SUPERADMIN | Delete admin |

Interactive docs: **http://localhost:3000/docs**

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start:dev` | Development with hot reload |
| `yarn build` | Production build |
| `yarn start:prod` | Run production build |
| `yarn lint` | ESLint with auto-fix |
| `yarn format` | Prettier format |
| `yarn test` | Unit tests (Jest) |
| `yarn test:cov` | Tests with coverage |
| `yarn gen:module <name>` | Scaffold sample module (see below) |

Prisma client is generated automatically on `postinstall` and `prebuild`.

---

## Docker commands

All Docker files live in `build/`. The root `Makefile` wraps common workflows.

### Development

```bash
make up        # Start app + Postgres + Redis, follow logs
make down      # Stop containers
make logs      # Follow app logs
make exec      # Shell into app container
make restart   # Restart app
```

### Production

```bash
cp build/.env.production.example build/.env.production
# Edit DATABASE_URL, JWT_SECRET, REDIS_*, etc.

make up-prod     # Build and start
make down-prod   # Stop
make logs-prod   # Follow logs
make build-prod  # Rebuild images (no cache)
```

### Migrations (isolated DB)

Create migration files without touching your dev database:

```bash
make up-migrate     # Start migrate container + run prisma migrate dev --create-only
make down-migrate   # Stop
make reset-migrate  # Stop and remove migrate volume
```

Env defaults: `build/.env.migrate`.

---

## Environment variables

### Local (`.env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | HTTP port (default `3000`) |
| `REDIS_HOST` | No | Redis host (default `localhost`) |
| `REDIS_PORT` | No | Redis port (default `6379`) |
| `REDIS_PREFIX` | No | Cache key prefix (default `bn`) |
| `REDIS_DEFAULT_TTL` | No | Default cache TTL in seconds |
| `SWAGGER_USERNAME` | No | Swagger Basic Auth username |
| `SWAGGER_PASSWORD` | No | Swagger Basic Auth password |
| `SUPER_ADMIN_PASSWORD_SEED` | No | Password for seeded superadmin |

### Docker dev (`build/.env.example`)

Includes `PORT_BE`, `DB_*`, `POSTGRES_*`, `DATABASE_URL_DEV`, Redis Commander settings, and the same auth/Swagger vars. Copy to project root as `.env` when using `make up`.

---

## Adding a new feature module

### Quick way — generator (recommended)

```bash
# 1. Add Prisma model in prisma/schema.prisma, then migrate
npx prisma migrate dev --name add_product

# 2. Scaffold module samples (folder, repository wiring, app.module, PrismaSelectPayloadMap)
yarn gen:module product
# options: --route products  --no-cache  --dry-run

# 3. Copy endpoint/service/DTO patterns from src/modules/admin/, then customize
```

The generator creates a **sample scaffold** under `src/modules/{name}/` (not full CRUD):

- Wired **repository** (`createPrismaRepository`) + **select presets** (`id` only)
- Sample **GET /:id** endpoint + `handleGetById` service method
- Empty **DTO** / **where** with `TODO` pointers to `src/modules/admin/`
- Auto-registers `{Name}Module` in `app.module.ts` and `PrismaSelectPayloadMap` (unless `--no-cache`)

### Manual way

Follow the **Admin** module as the reference implementation:

1. Add Prisma model → `npx prisma migrate dev`
2. Create repository with `createPrismaRepository` (enable cache if needed)
3. Add select presets (`general`, `minimal`, `withPassword`)
4. Add where builder for list filters
5. DTOs with class-validator + `@ApiProperty`
6. Service (`handle*` methods) → Controller → Module
7. Register module in `src/app.module.ts`

Detailed conventions: [`AGENTS.md`](./AGENTS.md)  
Cache rules: [`docs/CACHE.md`](./docs/CACHE.md)

---

## Requirements

- **Node.js** 20+
- **PostgreSQL** 16
- **Redis** 7 (optional but recommended for repository cache)
- **Docker** & **Docker Compose** (for Makefile workflow)
- **yarn** or **npm**

---

## License

UNLICENSED — internal / private use unless a license is added by the maintainer.
