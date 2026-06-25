# AGENTS.md — Boilerplate Nest

Panduan ini untuk AI coding agent agar perubahan kode mengikuti pola dan konvensi project ini.

## Project Overview

NestJS boilerplate dengan **Auth (JWT)**, **Admin CRUD**, **Prisma + PostgreSQL**, dan **Redis cache di level repository**.

Stack: NestJS 10, Prisma 5, PostgreSQL 16, Redis 7 (ioredis), class-validator, Swagger.

## Folder Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap, Swagger, ValidationPipe
├── config/                    # registerAs configs + env.validation
├── common/                    # Shared: guards, decorators, utils, middleware
├── infrastructure/
│   ├── prisma/                # PrismaService, createPrismaRepository factory
│   └── redis/                 # RedisService, cache utils
├── modules/
│   └── {feature}/             # Feature modules (admin, auth, ...)
│       ├── {feature}.module.ts
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── dto/
│       └── types/             # select presets, where builders
├── shared/                    # Cross-module DTOs & interfaces
prisma/
├── schema.prisma
├── seed.ts
└── datas/                     # Seed data
build/                         # Docker, compose, Makefile
docs/
└── CACHE.md                   # Cache guidelines (WAJIB baca saat kerja cache)
```

## Architecture Layers

```
Controller  →  Service  →  Repository  →  Prisma / Redis
```

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Controller** | HTTP, guards, Swagger, response formatting | Tidak ada business logic. Tidak akses Prisma langsung. |
| **Service** | Business logic, authorization checks, orchestration | Method prefix `handle*`. Lempar `CustomError`. Panggil repository, bukan Prisma. |
| **Repository** | Data access + cache | Dibuat via `createPrismaRepository` factory. Semua DB read/write lewat sini. |
| **Infrastructure** | PrismaService, RedisService, config | Global modules (`@Global()`). |

**Aturan keras:** Jangan panggil `prisma.model.*` dari service/controller. Semua akses DB harus lewat repository agar cache & invalidation konsisten.

## Import Paths

Gunakan alias `src/` (bukan relative path panjang):

```typescript
import { CustomError } from 'src/common/exceptions/custom-error';
import { AdminRepository } from 'src/modules/admin/repositories/admin.repository';
```

## Menambah Feature Module Baru

Ikuti pola `AdminModule` sebagai template.

### 1. Prisma model

Tambah model di `prisma/schema.prisma`, jalankan migrate.

### 2. Repository

```typescript
// src/modules/{feature}/repositories/{feature}.repository.ts
import { Prisma } from '@prisma/client';
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
  FeatureToPayload
>({
  model: 'feature',
  lock: {
    tableName: 'feature', // @@map value dari schema.prisma
    columns: { createdAt: 'created_at' }, // field dengan @map
  },
  cache: {
    enabled: true,
    ttl: 300,
    nullTtl: 60,
    sensitiveFields: ['password'], // sesuaikan field sensitif model
    methods: {
      getManyPaginate: { ttl: 60 },
      getMany: { ttl: 60 },
    },
  },
  getDelegate: (client) => client.feature,
  toPayload: <T extends Prisma.FeatureSelect>(data: unknown) =>
    data as FeaturePayload<T>,
});

export type FeatureRepository = PrismaRepositoryInstance<
  Prisma.FeatureSelect,
  Prisma.FeatureCreateInput,
  Prisma.FeatureUpdateInput,
  Prisma.FeatureWhereInput,
  Prisma.FeatureOrderByWithRelationInput,
  FeatureToPayload
>;
```

### 3. Select presets

```typescript
// src/modules/{feature}/types/select-{feature}.type.ts
import { Prisma } from '@prisma/client';

type FeatureSelectPresetKey = keyof typeof featureSelectPresets;

export function getFeatureSelect<K extends FeatureSelectPresetKey>(key: K) {
  return featureSelectPresets[key];
}

export const featureSelectPresets = {
  minimal: { id: true } satisfies Prisma.FeatureSelect,
  general: {
    // field untuk API response — TANPA field sensitif
    id: true,
    name: true,
    // ...
  } satisfies Prisma.FeatureSelect,
  withPassword: {
    // field internal yang butuh password/secret — TIDAK di-cache
    id: true,
    password: true,
    // ...
  } satisfies Prisma.FeatureSelect,
};
```

### 4. Where builder

```typescript
// src/modules/{feature}/types/where-{feature}.type.ts
import { Prisma } from '@prisma/client';
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

### 6. Service

```typescript
// src/modules/{feature}/services/{feature}.service.ts
@Injectable()
export class FeatureService {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async handleCreate(dto: CreateFeatureDto) {
    const created = await this.featureRepository.create({ data: { ... } });
    return created;
  }

  async handleGetById(id: string) {
    return await this.featureRepository.getThrowById({
      id,
      select: getFeatureSelect('general'),
    });
  }
}
```

### 7. Controller

```typescript
// src/modules/{feature}/controllers/{feature}.controller.ts
@ApiTags('Feature Management')
@Controller('feature')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @UseGuards(JwtGuard)
  @Get(':id')
  @SwaggerEndpoint({
    summary: 'Get feature by ID',
    params: [{ name: 'id', description: 'Feature UUID' }],
  })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      validateUUID(id, 'feature');
      const result = await this.featureService.handleGetById(id);
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
  providers: [FeatureService, FeatureRepository],
  exports: [FeatureService, FeatureRepository],
})
export class FeatureModule {}
```

Daftarkan di `app.module.ts`.

## Controller Conventions

- Gunakan `@Res() res: Response` + manual response (bukan `@HttpCode` decorator return).
- Setiap endpoint: `try/catch` → `formatResponse` / `errorHandler`.
- Swagger: `@SwaggerEndpoint({ summary, body, params, pagination, auth })`.
- UUID param: `validateUUID(id, 'entityName')` sebelum service call.
- Auth: `@UseGuards(JwtGuard)` atau `@UseGuards(JwtGuard, RoleGuard)` + `@Roles(...)`.
- User dari JWT: `@CurrentUser() user: IPayloadJWT` — jangan pakai `@Headers('authorization')` (muncul di Swagger).
- Paginate response: `formatResponse(res, HttpStatus.OK, result.data, result.meta)`.

```typescript
try {
  const result = await this.service.handleX(...);
  return formatResponse(res, HttpStatus.OK, result);
} catch (error) {
  return errorHandler(res, error);
}
```

## Service Conventions

- Method naming: `handleCreate`, `handleGetById`, `handleGetManyPaginate`, `handleUpdateById`, `handleDeleteById`.
- Business errors: `throw new CustomError({ statusCode: 4xx, message: '...' })`.
- Password hashing: `hashBcrypt()` / `compareBcrypt()` dari `src/common/utils/bcrypt.util`.
- Select presets: selalu pakai `getXxxSelect('general')` untuk response API.
- Uniqueness check: `getFirst({ where, select: minimal, skipCache: true })`.
- Internal auth (butuh password): `getXxxSelect('withPassword')` — otomatis skip cache.
- Metadata update: `updateById({ ..., invalidate: 'none' })` untuk field seperti `lastLoginAt`.

## Repository Factory (`createPrismaRepository`)

Factory di `src/infrastructure/prisma/create-prisma.repository.ts` menghasilkan class dengan method:

| Method | Prisma | Cache |
|--------|--------|-------|
| `create` | `.create` | invalidate queries (default) |
| `getById` | `.findUnique` | cache-aside |
| `getThrowById` | `.findUniqueOrThrow` | cache-aside |
| `getFirst` | `.findFirst` | cache-aside |
| `getMany` | `.findMany` | cache-aside |
| `getManyPaginate` | paginator | cache-aside |
| `updateById` | `.update` | invalidate (default `all`) |
| `deleteById` | `.delete` | invalidate (default `all`) |
| `invalidateCache` | — | manual, untuk post-tx |

Opsi read: `tx?`, `select?`, `skipCache?`, `lock?` (hanya `getById` / `getThrowById`).
Opsi write: `tx?`, `invalidate?: 'all' | 'entity' | 'queries' | 'none'`.

Semua method support `tx` untuk transaksi — cache otomatis di-skip saat `tx` ada.

## Row Level Lock (PostgreSQL)

Opt-in pessimistic lock via `SELECT ... FOR UPDATE` untuk mencegah race condition pada pola **read-modify-write** (mis. update status order).

### Kapan pakai

- Dua request concurrent membaca entity yang sama, lalu keduanya melakukan update berdasarkan state lama.
- **Bukan** untuk uniqueness check (create duplicate) — gunakan unique constraint DB + handle `P2002`.

### Setup repository

Tambahkan `lock` config di `createPrismaRepository` (lihat template repository di atas). Field `columns` wajib untuk **semua** field Prisma yang punya `@map` — divalidasi otomatis saat app startup lewat Prisma DMMF (`validateLockConfig`). Kalau ada field `@map` yang belum masuk `columns`, factory throw error dan app tidak jalan.

```typescript
lock: {
  tableName: 'order',           // @@map di schema
  columns: { createdAt: 'created_at' }, // hanya field dengan @map
},
```

### Validasi startup

Saat `createPrismaRepository` dipanggil dengan `lock`, config dicek ke `Prisma.dmmf`:

- `tableName` harus match model (`@@map`)
- Setiap field `@map` wajib ada di `columns` dengan nama DB yang benar
- Key di `columns` yang tidak ada di model → error

Contoh error jika lupa `lastLoginAt`:

```
Row lock config invalid for table "admin" (model Admin):
  - missing lock.columns["lastLoginAt"] (Prisma @map("last_login_at"))
```

### Pemakaian

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

### Aturan

| Rule | Alasan |
|------|--------|
| `lock` **wajib** dengan `tx` | Lock dilepas saat transaksi commit/rollback |
| `lock` otomatis bypass cache | Cache tidak kompatibel dengan row lock |
| Repository harus punya `lock.tableName` | Raw SQL butuh nama tabel mapped |
| Scope v1: `getById`, `getThrowById` saja | `getFirst`/`getMany` butuh SQL builder terpisah |

### Lock modes

| `mode` | SQL | Use case |
|--------|-----|----------|
| `noKeyUpdate` (default) | `FOR NO KEY UPDATE` | Update field non-key (status, qty) |
| `update` | `FOR UPDATE` | Lock penuh termasuk foreign key |
| `share` | `FOR SHARE` | Read-only lock dalam tx |
| `keyShare` | `FOR KEY SHARE` | Lock paling ringan |

Opsi tambahan: `nowait: true` (gagal langsung jika row terkunci), `skipLocked: true` (skip row terkunci). Keduanya mutually exclusive.

Error PG `55P03` (lock not available) dari `nowait` — handle di service layer (retry atau 409).

## Cache Rules (Ringkasan)

Detail lengkap: [`docs/CACHE.md`](docs/CACHE.md).

### WAJIB

1. **Opt-in** per repository: `cache: { enabled: true, model: '...' }`.
2. **Sensitive fields** tidak pernah di-cache — pakai select preset tanpa password untuk response API.
3. **Auth lookup** → `skipCache: true`.
4. **Uniqueness check** → `skipCache: true`.
5. **Metadata-only update** → `invalidate: 'none'`.
6. **Semua DB access** lewat repository (jangan bypass Prisma langsung).
7. **Transaksi** → cache di-skip; invalidate manual via `afterCommit` di `execTx`.

### Select preset vs cache

| Preset | Cacheable | Use case |
|--------|-----------|----------|
| `minimal` | Ya | Existence check (bukan uniqueness write-path) |
| `general` | Ya | API response (tanpa field sensitif) |
| `withPassword` | Tidak | Internal: verifikasi password, auth |

### Transaksi + cache invalidation

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

## Auth Patterns

- Login: `AuthService.handleLogin` → `getFirst({ skipCache: true })` → bcrypt compare → JWT.
- JWT guard: `JwtGuard` (Passport `'jwt'`).
- Role guard: `RoleGuard` + `@Roles(EAdminRole.SUPERADMIN)`.
- JWT strategy validate: `getById({ select: getAdminSelect('minimal') })`.
- Token sign: `jwtHelper.signToken(payload, '7d')`.
- Circular dep: `forwardRef(() => AdminModule)` antara Auth dan Admin.

## Error Handling

- Service: `throw new CustomError({ statusCode, message })`.
- Controller: `catch (error) { return errorHandler(res, error); }`.
- `errorHandler` otomatis map `CustomError.statusCode` ke HTTP response.
- Response format: `{ isSuccess, message, data, meta? }`.

## Config & Environment

- Config files: `src/config/*.config.ts` pakai `registerAs('name', () => ({...}))`.
- Validasi env: `src/config/env.validation.ts` (class-validator).
- Load di `ConfigModule.forRoot({ load: [...], validate })`.
- Akses: `configService.get<string>('redis.host')`.

## Prisma & Seed

- Schema: `prisma/schema.prisma`. Model pakai `@@map("snake_table")`, field datetime pakai `@map("snake_field")`.
- Seed: `prisma/seed.ts` + data di `prisma/datas/`. Password di-hash dengan `bcrypt.hashSync` sebelum insert.
- Seed skip jika email sudah ada (idempotent).
- Paginator: `prisma/paginator/paginator.ts`.

## Docker & Dev

- Docker files di `build/`. Makefile di root.
- Dev: `make network` → `make up` (app + postgres + redis + redis-commander).
- Env dev: `build/.env.example` → copy ke `.env` di root.
- Container naming: `boilerplate-nest-{service}-dev`.

## Code Style

- Minimize scope — diff terkecil yang benar, jangan ubah kode tidak terkait.
- Jangan over-engineer — tidak perlu abstraksi untuk 1-2 baris.
- Ikuti konvensi file di sekitar kode yang diedit.
- Comment hanya untuk logic non-obvious.
- Import: `@nestjs/*` → external → `src/*` → relative (dalam module).
- TypeScript strict — hindari `any` kecuali di boundary (toPayload cast).
- Jangan commit kecuali diminta user.
- Jangan edit file plan (`.cursor/plans/`).

## Checklist Sebelum Selesai

- [ ] Semua DB access lewat repository (bukan Prisma langsung di service)
- [ ] Select preset: `general` tanpa field sensitif, `withPassword` untuk internal
- [ ] `skipCache: true` pada auth lookup dan uniqueness check
- [ ] `invalidate: 'none'` pada metadata-only update
- [ ] Controller: try/catch + formatResponse/errorHandler + SwaggerEndpoint
- [ ] Service: handle* naming + CustomError untuk business error
- [ ] DTO: class-validator + @ApiProperty
- [ ] Module: register provider + export jika dipakai modul lain
- [ ] `lock` + `tx` pada read-modify-write yang rentan race condition
- [ ] `npx tsc --noEmit` lolos tanpa error

## Reference Files

Gunakan file ini sebagai acuan saat generate kode baru:

| Pattern | File |
|---------|------|
| Full module | `src/modules/admin/` |
| Repository factory | `src/infrastructure/prisma/create-prisma.repository.ts` |
| Row lock util | `src/infrastructure/prisma/utils/row-lock.util.ts` |
| Lock config validation | `src/infrastructure/prisma/utils/validate-lock-config.util.ts` |
| Admin repository | `src/modules/admin/repositories/admin.repository.ts` |
| Service | `src/modules/admin/services/admin.service.ts` |
| Controller | `src/modules/admin/controllers/admin.controller.ts` |
| Select presets | `src/modules/admin/types/select-admin.type.ts` |
| Where builder | `src/modules/admin/types/where-admin.type.ts` |
| DTO | `src/modules/admin/dto/admin.dto.ts` |
| Auth service | `src/modules/auth/services/auth.service.ts` |
| Cache docs | `docs/CACHE.md` |
