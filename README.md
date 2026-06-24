# boilerplate-nest

NestJS boilerplate with **Auth (JWT)** and **Admin (Prisma)** — template with the same auth flow and a single Prisma model (Admin).

## Features

- **Auth**: Admin login, JWT (7 days), guards (JwtGuard, RoleGuard), Passport JWT strategy
- **Admin**: CRUD for admins (create, list paginate, profile, update, delete). Roles: SUPERADMIN, ADMIN, EDITOR, MODERATOR. Status: ACTIVE, INACTIVE
- **Prisma**: Single model `Admin`, PostgreSQL, paginator, seed for one superadmin
- **Swagger**: `/docs` with HTTP basic auth
- **Helpers**: formatResponse, errorHandler, validateUUID, SwaggerEndpoint decorator

## Requirements

- Node.js 20+
- PostgreSQL 16 (local or Docker)
- npm or yarn

## Setup (local)

```bash
# Install dependencies
npm install

# Copy environment file and edit DATABASE_URL, JWT_SECRET
cp .env.example .env

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

# Run in development
npm run start:dev
```

## Docker (Makefile + build/)

Same layout as backend-quiz: `build/` holds Dockerfiles and compose files, `Makefile` drives dev, production, and migrations.

### Prerequisites

Create the shared network once:

```bash
make network
```

Copy env for **dev** (from project root):

```bash
cp build/.env.example .env
# Edit .env if needed (DB passwords, JWT_SECRET)
```

### Dev (local development in Docker)

```bash
make up      # Start app + PostgreSQL, follow logs
make down    # Stop
make logs    # Follow app logs
make exec    # Shell into app container
make restart # Restart app and follow logs
```

- **API**: http://localhost:3000  
- **Swagger**: http://localhost:3000/docs (basic auth from `SWAGGER_USERNAME` / `SWAGGER_PASSWORD`)  
- **PostgreSQL**: localhost:5432 (user/password from `.env`)

### Production

```bash
cp build/.env.production.example build/.env.production
# Edit build/.env.production (DATABASE_URL, JWT_SECRET, etc.)

make up-prod     # Build and start app + PostgreSQL
make down-prod   # Stop
make logs-prod   # Follow app logs
make exec-prod   # Shell into app container
make build-prod  # Build images only (no cache)
```

### Migration (create new migration files)

Uses a separate PostgreSQL container and creates a migration with `prisma migrate dev --create-only`:

```bash
make up-migrate    # Start migrate DB + run migrate script
make down-migrate  # Stop
make reset-migrate # Stop and remove migrate volume
```

Env for migrate is in `build/.env.migrate` (defaults point at `boilerplate-nest-database-postgres-migrate`).

### Environment variables (build/.env.example)

| Variable | Description |
|----------|-------------|
| `PORT_BE` | Host port for app (default 3000) |
| `DB_HOST`, `DB_PORT`, `POSTGRES_*` | PostgreSQL connection for dev |
| `DATABASE_URL_DEV` | Full PostgreSQL URL for dev (built from above) |
| `JWT_SECRET`, `SUPER_ADMIN_PASSWORD_SEED` | Auth |
| `SWAGGER_USERNAME`, `SWAGGER_PASSWORD` | Swagger UI basic auth |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development with watch |
| `npm run build` | Production build |
| `npm run start:prod` | Run production build |
| `npm run lint` | ESLint with fix |
| `npm run format` | Prettier format |
| `npm run test` | Run unit tests |

## Seeded admin

After seeding, you can log in with:

- **Email:** `superadmin@example.com`
- **Password:** `Superadmin123!` (or the value of `SUPER_ADMIN_PASSWORD_SEED` in `.env`)

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login; body: `{ "email", "password" }` → `{ "accessToken" }` |
| GET | `/admin/profile` | Current admin (header: `Authorization: Bearer <token>`) |
| GET | `/admin/paginate` | Paginated list (query: page, limit, sort, search, role, status). Requires JWT and role SUPERADMIN or ADMIN |
| GET | `/admin/:id` | Get admin by ID (JWT required) |
| POST | `/admin` | Create admin (JWT + SUPERADMIN) |
| PATCH | `/admin/profile` | Update own profile (JWT) |
| PATCH | `/admin/:id` | Update admin by ID (JWT + SUPERADMIN) |
| DELETE | `/admin/:id` | Delete admin by ID (JWT + SUPERADMIN) |

Full interactive docs: **http://localhost:3000/docs** (basic auth from `SWAGGER_USERNAME` / `SWAGGER_PASSWORD`).

## License

UNLICENSED
