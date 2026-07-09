# AGENTS.md — Boilerplate Nest

Guide for AI coding agents so code changes follow this project's patterns and conventions.

User documentation: [`README.md`](README.md) · Cache details: [`docs/CACHE.md`](docs/CACHE.md)

## Project Overview

NestJS boilerplate with **Auth (JWT)**, **Admin CRUD**, **Prisma + PostgreSQL**, and **Redis cache at the repository layer**.

| Component | Version |
|-----------|---------|
| NestJS | 11 |
| Prisma | 7 (driver adapter `@prisma/adapter-pg`) |
| PostgreSQL | 16 |
| Redis | 7 (ioredis) |
| Node.js | 20+ |
| TypeScript | 5.9 |

## Folder Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap, Swagger, ValidationPipe
├── generated/prisma/          # Prisma client (auto-generated, gitignored)
├── config/                    # registerAs configs + env.validation
├── common/                    # Guards, decorators, utils, middleware
├── infrastructure/
│   ├── prisma/                # PrismaService, createPrismaRepository, row lock
│   │   ├── prisma-client.ts   # Re-export Prisma types from generated client
│   │   └── types/             # PrismaSelectPayloadMap, delegate types
│   └── redis/                 # RedisService, cache utils
├── modules/
│   └── {feature}/             # Feature modules (admin, auth, merchant, product, master-data)
│       ├── {feature}.module.ts
│       ├── application/
│       │   └── use-cases/     # Single-responsibility use case classes (1 function/class per file)
│       ├── domain/            # Pure domain layer
│       │   ├── entities/      # Domain models (uses regular setters, no updateDetails helper)
│       │   ├── policies/      # Business rules, validations, and relation compose policies
│       │   ├── repositories/  # Domain repository interfaces (I{Feature}Repository)
│       │   └── exceptions/    # Feature-specific domain exceptions
│       ├── presentation/      # API layer
│       │   ├── controllers/   # Controllers (HTTP logic, guards, response formatting)
│       │   └── dto/           # Input request validation & response mapping DTOs
│       ├── infrastructure/    # Concrete persistence implementations
│       │   ├── repositories/  # Prisma{Feature}Repository implements I{Feature}Repository (wraps low-level repo)
│       │   └── mappers/       # Domain ↔ persistence mapper utilities
│       ├── repositories/      # Low-level repository created with createPrismaRepository
│       │   └── {feature}.repository.ts
│       └── types/             # Select presets, where builders
├── shared/                    # Cross-module DTOs & interfaces
prisma/
├── schema.prisma
├── migrations/
├── seed.ts
├── datas/                     # Seed data
└── paginator/                 # Pagination helper
prisma.config.ts               # Prisma 7: schema path, migrations, seed, datasource URL
build/                         # Docker, compose, compiled output (build/compile/)
docs/
└── CACHE.md                   # Cache guidelines (MUST read when working on cache)
```

## Architecture Layers

```
Presentation (Controller/DTO)  →  Application (Use Case)  →  Domain Interface  →  Infrastructure Repository  →  Base Repository (Prisma/Redis)
```

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Presentation** | HTTP, guards, Swagger, response formatting | No business logic. No direct Prisma or base repository access. Uses DTOs. |
| **Application** | Use case orchestration (thin) | **One class per file** containing a single `execute` method. No private business methods. Throws `CustomError`. Interacts with `Domain Interface`, not persistence details. |
| **Domain** | Core enterprise business rules | Pure TypeScript classes/entities (using regular setters for changes, e.g., `setName()`, no `updateDetails`) and repository interfaces (`I{Feature}Repository`). |
| **Domain Policy** | Validate, compose, map, guard | `@Injectable` class in `domain/policies/` directory. Checks business rules, handles unique constraint assertions, and resolves nested composition. |
| **Infrastructure** | Concrete adapter implementations | `Prisma{Feature}Repository` implements `I{Feature}Repository`, maps entities using `mappers`, and wraps the low-level base `Repository`. |
| **Base Repository** | Generic DB access + cache | Low-level instance created via `createPrismaRepository` factory. |
| **Infrastructure (Global)** | PrismaService, RedisService, config | Global modules (`@Global()`). |

**Hard rule:** Never call `prisma.model.*` or low-level `repositories` directly from use cases or controllers. All DB access must go through the repository interface layer (`I{Feature}Repository`) implemented in infrastructure to preserve Clean Architecture boundaries.

## Import Paths

Use `src/` and `prisma/` aliases (not long relative paths):

```typescript
import { CustomError } from 'src/common/exceptions/custom-error';
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { AdminRepository } from 'src/modules/admin/repositories/admin.repository';
import { paginator } from 'prisma/paginator/paginator';
```

**Prisma types:** import from `src/infrastructure/prisma/prisma-client`, **not** `@prisma/client`.

**Do not edit** files in `src/generated/prisma/` — generated by `prisma generate` (runs automatically on `postinstall` / `prebuild`).

## Prisma 7

### Configuration

- Schema: `prisma/schema.prisma` — generator output to `../src/generated/prisma`
- Config: `prisma.config.ts` — migrations path, seed command, `DATABASE_URL`
- Runtime: `PrismaService` uses `PrismaPg` adapter (`@prisma/adapter-pg` + `pg`)
- Seed: `prisma/seed.ts` — instantiate `PrismaClient` with the same adapter

### Common commands

```bash
npx prisma generate          # Generate client to src/generated/prisma
npx prisma migrate dev       # Dev migration
npx prisma db seed           # Run seed
```

After clone (without `node_modules`), `yarn install` automatically runs `prisma generate`.

### Schema conventions

- Models: `@@map("snake_table")`
- Datetime fields: `@map("snake_field")`
- Enums/status stored as `String` in DB (see `Admin.role`, `Admin.status`)

## Adding a New Feature Module

### Option A — Generator CLI (recommended)

```bash
# 1. Add model in prisma/schema.prisma, then migrate
npx prisma migrate dev --name add_product

# 2. Generate sample scaffold (runs npx prisma generate automatically)
yarn gen:module product
# flags: --route <path>  --cache  --dry-run
```

Generator output: `src/modules/{name}/` with wired **repository**, **select presets** (`id` only), and one sample **GET /:id** endpoint. Also auto-patches `app.module.ts` and `PrismaSelectPayloadMap`.

Then copy endpoint and business logic from `src/modules/admin/`.

### Option B — Manual

Follow `AdminModule` as the template (`src/modules/admin/`).

### 1. Prisma model

Add model in `prisma/schema.prisma`, then:

```bash
npx prisma migrate dev --name add_feature
```

### 2. Repository

```typescript
// src/modules/{feature}/repositories/{feature}.repository.ts
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import {
  createPrismaRepository,
  PrismaRepositoryInstance,
} from 'src/infrastructure/prisma/create-prisma.repository';

export type FeaturePayload<T extends Prisma.FeatureSelect> =
  Prisma.FeatureGetPayload<{ select: T }>;

type FeatureToPayload = <T extends Prisma.FeatureSelect>(
  data: unknown,
) => FeaturePayload<T>;

export const FeatureRepository = createPrismaRepository<
  Prisma.FeatureSelect,
  Prisma.FeatureCreateInput,
  Prisma.FeatureUpdateInput,
  Prisma.FeatureWhereInput,
  Prisma.FeatureOrderByWithRelationInput,
  FeatureToPayload,
  'feature' // required when cache enabled — must match `model` below
>({
  model: 'feature',
  lock: {
    tableName: 'feature', // @@map value from schema.prisma
    columns: { createdAt: 'created_at' }, // all scalar fields with @map
  },
  cache: {
    ttl: 60 * 60 * 24,
    nullTtl: 60,
    sensitiveFields: ['password'],
    methods: {
      getManyPaginate: { ttl: 60 * 60 * 24 },
      getMany: { ttl: 60 * 60 * 24 },
    },
  },
  getDelegate: (client) => client.feature,
  toPayload: <T extends Prisma.FeatureSelect>(data: unknown) =>
    data as FeaturePayload<T>,
  scalarFields: Prisma.FeatureScalarFieldEnum,
  composeHelperToken: forwardRef(() => FeatureComposePolicy),
});

export type FeatureRepository = PrismaRepositoryInstance<
  Prisma.FeatureSelect,
  Prisma.FeatureCreateInput,
  Prisma.FeatureUpdateInput,
  Prisma.FeatureWhereInput,
  Prisma.FeatureOrderByWithRelationInput,
  FeatureToPayload,
  'feature'
>;
```

### 2b. Register model in `PrismaSelectPayloadMap` (required when cache enabled)

```typescript
// src/infrastructure/prisma/types/prisma-select-payload.type.ts
export const PRISMA_SELECT_PAYLOAD_MODEL_KEYS = [
  'admin',
  'feature', // add new entry (runtime — used by validateCacheConfig)
] as const;

export interface PrismaSelectPayloadMap {
  admin: Prisma.AdminSelect;
  feature: Prisma.FeatureSelect; // add new entry
}
```

Without this registration, typed payloads from `select` will not resolve and app startup will fail for cache-configured repositories.

### 3. Select presets

```typescript
// src/modules/{feature}/types/select-{feature}.type.ts
import { Prisma } from 'src/infrastructure/prisma/prisma-client';

type FeatureSelectPresetKey = keyof typeof featureSelectPresets;

export function getFeatureSelect<K extends FeatureSelectPresetKey>(key: K) {
  return featureSelectPresets[key];
}

export const featureSelectPresets = {
  minimal: { id: true } satisfies Prisma.FeatureSelect,
  general: {
    // fields for API response — NO sensitive fields
    id: true,
    name: true,
  } satisfies Prisma.FeatureSelect,
  withPassword: {
    // internal fields needing password/secret — NOT cached
    id: true,
    password: true,
  } satisfies Prisma.FeatureSelect,
};
```

### 4. Where builder

```typescript
// src/modules/{feature}/types/where-{feature}.type.ts
import { Prisma } from 'src/infrastructure/prisma/prisma-client';
import { FilterFeatureDto } from '../dto/{feature}.dto';

export function whereFeatureGetManyPaginate(filter: FilterFeatureDto): {
  where: Prisma.FeatureWhereInput;
} {
  const { search } = filter;
  const where: Prisma.FeatureWhereInput = {
    ...(search ? { name: { contains: search } } : {}),
  };
  return { where };
}
```

### 5. DTO

```typescript
// src/modules/{feature}/dto/{feature}.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { SearchPaginationDto } from 'src/shared/dto/pagination.dto';

export class CreateFeatureDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  name: string;
}

export class FilterFeatureDto extends SearchPaginationDto {
  // filter fields...
}
```

### 6. Use Cases

Create individual files under `application/use-cases/` for each operations. For example, `get-feature-by-id.use-case.ts`:

```typescript
// src/modules/{feature}/application/use-cases/get-feature-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { getFeatureSelect } from '../../types/select-feature.type';
import { IFeatureRepository } from '../../domain/repositories/feature.repository.interface';

@Injectable()
export class GetFeatureByIdUseCase {
  constructor(
    @Inject('IFeatureRepository')
    private readonly featureRepository: IFeatureRepository,
  ) {}

  async execute(id: string) {
    return await this.featureRepository.getThrowById({
      id,
      select: getFeatureSelect('general'),
    });
  }
}
```

### 7. Controller

```typescript
// src/modules/{feature}/presentation/controllers/{feature}.controller.ts
@ApiTags('Feature Management')
@Controller('feature')
export class FeatureController {
  constructor(private readonly getFeatureByIdUseCase: GetFeatureByIdUseCase) {}

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get feature by ID',
    params: [{ name: 'id', description: 'Feature UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'feature');
      const result = await this.getFeatureByIdUseCase.execute(id);
      return formatResponse(res, HttpStatus.OK, result);
    } catch (error) {
      return errorHandler(res, error);
    }
  }
}
```

### 8. Module

```typescript
@Module({
  imports: [JwtModule.register({})],
  controllers: [FeatureController],
  providers: [GetFeatureByIdUseCase, FeatureRepository],
  exports: [GetFeatureByIdUseCase, FeatureRepository],
})
export class FeatureModule {}
```

Register in `src/app.module.ts`.

## Controller Conventions

- Use `@Res() res: Response` + manual response (not direct decorator return).
- Every endpoint: `try/catch` → `formatResponse` / `errorHandler`.
- Swagger: `@SwaggerEndpoint({ summary, body, params, pagination, auth, success })`.
- UUID param: `validateUUID(id, 'entityName')` before use case execution.
- Auth: `@UseGuards(JwtGuard)` or `@UseGuards(JwtGuard, RoleGuard)` + `@Roles(...)`.
- User from JWT: `@CurrentUser() user: IPayloadJWT` — do not use `@Headers('authorization')`.
- Paginate response: `formatResponse(res, HttpStatus.OK, result.data, result.meta)`.

```typescript
try {
  const result = await this.someUseCase.execute(...);
  return formatResponse(res, HttpStatus.OK, result);
} catch (error) {
  return errorHandler(res, error);
}
```

## Use Case Conventions

- Single responsibility: **Each use case must reside in its own file** containing exactly one class with one public `execute` method.
- Class naming: `Create{Feature}UseCase`, `Get{Feature}ByIdUseCase`, `Get{Feature}ManyPaginateUseCase`, `Update{Feature}ByIdUseCase`, `Delete{Feature}ByIdUseCase`.
- Use Cases must remain clean. Move all rules validation, helper checks, uniqueness validations, or cross-module client validations to policies.
- Business errors: policy throws `CustomError({ statusCode, message })`.
- Select presets: always use `getXxxSelect('general')` for API responses.
- Uniqueness check: delegate to a validate policy that calls `getFirst` on repository (without `setCache`).
- User-facing reads: use `getThrowById` / `getManyPaginate` with `setCache: true` when repo has cache config.
- Internal auth (needs password): `getXxxSelect('withPassword')` — never cached even with `setCache`.
- Metadata update: `updateById({ ..., invalidate: 'none' })` for fields like `lastLoginAt`.

## Policy Conventions

Applies to **every** feature module (`admin`, `auth`, `product`, `master-data`, and new modules).

- All rules, validations, credentials assertions, and relation compositions must be located inside `domain/policies/` folder.
- File naming: `{feature}-{responsibility}.policy.ts` (e.g. `product-compose.policy.ts`).
- Policy classes: `@Injectable()`, register in module `providers` (export if used by another module).
- DB/client access still via repository or clients injected into the policy.

```typescript
// use-cases/get-product-by-id.use-case.ts
async execute(id: string) {
  return this.productRepository.getThrowById({
    id,
    select: getProductSelect('general'),
    setCache: true,
  });
}

// domain/policies/product-compose.policy.ts
@Injectable()
export class ProductComposePolicy extends BaseComposeHelper {
  constructor(
    private readonly categoryClient: CategoryClient,
    private readonly merchantClient: MerchantClient,
  ) {
    super({
      category: {
        loader: (ids) => categoryClient.getCategoriesByIds(ids),
        type: 'one',
      },
      merchant: {
        loader: (ids) => merchantClient.getMerchantsByIds(ids),
        type: 'one',
      },
    });
  }
}
```

## Repository Factory (`createPrismaRepository`)

Factory in `src/infrastructure/prisma/create-prisma.repository.ts` produces a class with these methods:

| Method | Prisma | Cache |
|--------|--------|-------|
| `create` | `.create` | invalidate queries (default) |
| `getById` | `.findUnique` | cache-aside when `setCache: true` |
| `getThrowById` | `.findUniqueOrThrow` | cache-aside when `setCache: true` |
| `getFirst` | `.findFirst` | cache-aside when `setCache: true` |
| `getMany` | `.findMany` | cache-aside when `setCache: true` |
| `getManyPaginate` | paginator | cache-aside when `setCache: true` |
| `updateById` | `.update` | invalidate (default `all`) |
| `deleteById` | `.delete` | invalidate (default `all`) |
| `invalidateCache` | — | manual, for post-tx |

Read options: `tx?`, `select?`, `setCache?`, `lock?` (only `getById` / `getThrowById`).
Write options: `tx?`, `invalidate?: 'all' | 'entity' | 'queries' | 'none'`, `tags?: string[] | ((result: any) => string[])`.

All methods support `tx` for transactions — cache is automatically skipped when `tx` is present.

Reads cache only when `setCache: true` **and** repository has `model` + `cache` config. Writes invalidate when repository has `model` + `cache` config.

## Row Level Lock (PostgreSQL)

Opt-in pessimistic lock via `SELECT ... FOR UPDATE` to prevent race conditions in **read-modify-write** patterns (e.g. updating order status).

### When to use

- Two concurrent requests read the same entity, then both update based on stale state.
- **Not** for uniqueness checks (duplicate create) — use DB unique constraint + handle `P2002`.

### Repository setup

Add `lock` config in `createPrismaRepository`. The `columns` field is required for **all** Prisma scalar fields with `@map` — validated automatically at app startup by parsing `prisma/schema.prisma` (`validateLockConfig`). If any `@map` field is missing from `columns`, the factory throws and the app won't start.

```typescript
lock: {
  tableName: 'order',           // @@map in schema
  columns: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
},
```

### Startup validation

`validateLockConfig` reads `prisma/schema.prisma` and ensures:

- `tableName` matches the model (`@@map`)
- Every scalar field with `@map` exists in `columns` with the correct DB name
- Keys in `columns` that don't exist on the model → error

Example error when `lastLoginAt` is missing:

```
Row lock config invalid for table "admin" (model Admin):
  - missing lock.columns["lastLoginAt"] (Prisma @map("last_login_at"))
```

### Usage

```typescript
await this.prisma.execTx(
  async (tx) => {
    const order = await this.orderRepository.getThrowById({
      tx,
      id: orderId,
      select: getOrderSelect('general'),
      lock: { mode: 'noKeyUpdate' },
    });

    if (order.status !== 'PENDING') {
      throw new CustomError({ statusCode: 409, message: 'Order already processed' });
    }

    await this.orderRepository.updateById({
      tx,
      id: orderId,
      data: { status: 'PROCESSING' },
      invalidate: 'none',
    });
  },
  async () => {
    await this.orderRepository.invalidateCache({ id: orderId });
  },
);
```

### Rules

| Rule | Reason |
|------|--------|
| `lock` **required** with `tx` | Lock released on transaction commit/rollback |
| `lock` automatically bypasses cache | Cache is incompatible with row lock |
| Repository must have `lock.tableName` | Raw SQL needs mapped table name |
| Scope v1: `getById`, `getThrowById` only | `getFirst`/`getMany` need a separate SQL builder |

### Lock modes

| `mode` | SQL | Use case |
|--------|-----|----------|
| `noKeyUpdate` (default) | `FOR NO KEY UPDATE` | Update non-key fields (status, qty) |
| `update` | `FOR UPDATE` | Full lock including foreign keys |
| `share` | `FOR SHARE` | Read-only lock within tx |
| `keyShare` | `FOR KEY SHARE` | Lightest lock |

Extra options: `nowait: true` (fail immediately if row is locked), `skipLocked: true` (skip locked rows). These are mutually exclusive.

PG error `55P03` (lock not available) from `nowait` — handle in controller/use case layer (retry or 409).

## Cache Rules (Summary)

Full details: [`docs/CACHE.md`](docs/CACHE.md).

### REQUIRED

1. **Repository config:** `model` + `cache: { ttl, ... }` — or `yarn gen:module <name> --cache`.
2. **Register** model in `PrismaSelectPayloadMap` when using cache config.
3. **Sensitive fields** are never cached — use select presets without password for API responses.
4. **Auth / uniqueness** — do not pass `setCache` on `getFirst` uniqueness write-path checks.
5. **User-facing reads** — `setCache: true` on `getThrowById` / `getManyPaginate` / compose policies.
6. **Metadata-only update** → `invalidate: 'none'`.
7. **All DB access** through repository (don't bypass Prisma directly).
8. **Transactions** → cache skipped; manual invalidation via `afterCommit` in `execTx`.

### Select preset vs cache

| Preset | Cacheable with `setCache` | Use case |
|--------|-----------|----------|
| `minimal` | Yes | Existence check (not uniqueness write-path) |
| `general` | Yes | API response (no sensitive fields) |
| `withPassword` | No | Internal: password verification, auth |

### Transaction + cache invalidation

```typescript
await this.prisma.execTx(
  async (tx) => {
    await this.repo.updateById({ tx, id, data });
  },
  async () => {
    await this.repo.invalidateCache({ id });
  },
);
```

Redis is injected with `@Optional()` — if Redis is down, the app keeps running (fail-open).

## Auth Patterns

- Login: `LoginUseCase.execute` → authenticate via policy → sign token.
- JWT guard: `JwtGuard` (Passport `'jwt'`).
- Role guard: `RoleGuard` + `@Roles(EAdminRole.SUPERADMIN)`.
- JWT strategy validate: `getById` via `AdminClient` using minimal select.
- Token sign: `JwtHelper.signToken(payload, '7d')` via `CommonModule`.
- Circular dep: `forwardRef(() => AdminModule)` between Auth and Admin.

## Error Handling

- Policy / Use case: `throw new CustomError({ statusCode, message })`.
- Controller: `catch (error) { return errorHandler(res, error); }`.
- `errorHandler` automatically maps `CustomError.statusCode` to HTTP response.
- Response format: `{ isSuccess, message, data, meta? }`.

## Config & Environment

- Config files: `src/config/*.config.ts` use `registerAs('name', () => ({...}))`.
- Env validation: `src/config/env.validation.ts` (class-validator) — fail fast on startup.
- Load in `ConfigModule.forRoot({ load: [databaseConfig, appConfig, redisConfig], validate })`.
- Access: `configService.get<string>('redis.host')`, `configService.get<string>('database.url')`.

### Required env

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT |
| `PORT` | HTTP port |
| `SWAGGER_USERNAME` / `SWAGGER_PASSWORD` | Basic auth for `/docs` |

### Optional env (Redis)

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Full Redis URL (alternative to host/port) |
| `REDIS_HOST` | Default `localhost` |
| `REDIS_PORT` | Default `6379` |
| `REDIS_PREFIX` | Cache key prefix (default `bn`) |
| `REDIS_DEFAULT_TTL` | Default TTL in seconds |

Docker dev: copy `build/.env.example` → `.env` in project root, run `make network` then `make up`.

## Prisma & Seed

- Schema: `prisma/schema.prisma`
- Seed: `prisma/seed.ts` + data in `prisma/datas/`
- Passwords hashed with `bcrypt.hashSync` before insert
- Seed skips if email already exists (idempotent)
- Paginator: `prisma/paginator/paginator.ts`

## Build & Scripts

| Command | Description |
|---------|-------------|
| `yarn start:dev` | Dev with hot reload |
| `yarn build` | Compile to `build/compile/` |
| `yarn start:prod` | `node build/compile/src/main` |
| `yarn lint` | ESLint flat config (`eslint.config.mjs`) |
| `yarn test` | Jest |
| `yarn gen:module <name>` | Scaffold sample module (`tools/generate-module/`) |

Build output: `build/compile/` (not `dist/`). ESLint ignores `src/generated/**`.

## Docker & Dev

- Docker files: `build/`. Makefile at project root.
- Dev: `make network` → `make up` (app + postgres + redis + redis-commander).
- Dev env: `build/.env.example` → copy to `.env` in project root.
- Container naming: `boilerplate-nest-{service}-dev`.
- Isolated migrations: `make up-migrate` (see `build/.env.migrate`).

## Code Style

- Minimize scope — smallest correct diff, don't change unrelated code.
- Don't over-engineer — no abstractions for 1–2 lines.
- Follow conventions in surrounding files.
- Comments only for non-obvious logic.
- Import order: `@nestjs/*` → external → `src/*` → relative (within module).
- TypeScript — avoid `any` except at boundaries (`toPayload` cast).
- Don't commit unless the user asks.
- Don't edit plan files (`.cursor/plans/`).
- Don't edit `src/generated/prisma/`.

## Pre-completion Checklist

- [ ] All DB access through repository (not Prisma directly in use case/policy)
- [ ] `PrismaSelectPayloadMap` updated if new repository uses cache
- [ ] Select preset: `general` without sensitive fields, `withPassword` for internal
- [ ] `setCache: true` on user-facing reads only; not on auth/uniqueness checks
- [ ] `invalidate: 'none'` on metadata-only updates
- [ ] Controller: try/catch + formatResponse/errorHandler + SwaggerEndpoint
- [ ] Use Case: single operations in its own file, thin `execute` orchestrator
- [ ] Policies: all rules validation and composings reside under `domain/policies/`
- [ ] DTO: class-validator + @ApiProperty
- [ ] Module: register provider + export if used by other modules
- [ ] `lock.columns` complete for all `@map` fields when using row lock
- [ ] `lock` + `tx` on race-prone read-modify-write
- [ ] `npx tsc --noEmit` passes without errors
- [ ] `yarn lint` passes without new errors

## Reference Files

| Pattern | File |
|---------|------|
| Full module | `src/modules/admin/` |
| Repository factory | `src/infrastructure/prisma/create-prisma.repository.ts` |
| Prisma client re-export | `src/infrastructure/prisma/prisma-client.ts` |
| Select payload map | `src/infrastructure/prisma/types/prisma-select-payload.type.ts` |
| Row lock util | `src/infrastructure/prisma/utils/row-lock.util.ts` |
| Lock config validation | `src/infrastructure/prisma/utils/validate-lock-config.util.ts` |
| Admin repository | `src/modules/admin/repositories/admin.repository.ts` |
| Use Case (Get by ID) | `src/modules/admin/application/use-cases/get-admin-by-id.use-case.ts` |
| Policy (Compose nested cache) | `src/modules/product/domain/policies/product-compose.policy.ts` |
| Policy (Slug validate) | `src/modules/master-data/domain/policies/category-slug-validate.policy.ts` |
| Policy (Email validate) | `src/modules/admin/domain/policies/admin-email-validate.policy.ts` |
| Policy (Auth login credentials) | `src/modules/auth/domain/policies/auth-authenticate.policy.ts` |
| Controller | `src/modules/admin/presentation/controllers/admin.controller.ts` |
| Select presets | `src/modules/admin/types/select-admin.type.ts` |
| Where builder | `src/modules/admin/types/where-admin.type.ts` |
| DTO | `src/modules/admin/presentation/dto/admin.dto.ts` |
| Prisma config | `prisma.config.ts` |
| Cache docs | `docs/CACHE.md` |
| User docs | `README.md` |
