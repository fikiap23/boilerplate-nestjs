# Repository Cache Guidelines

This project uses Redis as a cache-aside layer integrated into the generic `createPrismaRepository` factory. Reads use cache **only when `setCache: true`** is passed on the repository method.

## Architecture

```
Service → Repository → [Redis cache] → Prisma → PostgreSQL
```

- **Read opt-in:** pass `setCache: true` on `getById`, `getThrowById`, `getFirst`, `getMany`, or `getManyPaginate`.
- **Repository config:** `model` + `cache: { ttl, ... }` defines namespace, TTL, sensitive fields, and write invalidation — not whether reads cache by default.
- Redis is injected with `@Optional()` — if Redis is down the app keeps working (fail-open).
- All cache operations use **safe wrappers** that catch errors and log warnings instead of crashing.

## Two layers

| Layer | What to set | Effect |
|-------|-------------|--------|
| Repository | `model` + `cache: { ttl, sensitiveFields, ... }` | Key namespace, TTL, invalidation on write |
| Read call | `setCache: true` | This read may use Redis |

Repos without `model`/`cache` config ignore `setCache: true` (no-op).

**Tracking:**

- `grep setCache: true` — reads that actively use cache
- `grep "model:" **/repositories` — cache-capable repositories

## Cache Key Schema

```
{prefix}:repo:{model}:e:{id}:{method}:{selectHash}     # entity (by id)
{prefix}:repo:{model}:q:{method}:{queryHash}            # query (where/list)
```

Index SETs track all keys for batch invalidation:

```
{prefix}:repo:{model}:e:{id}:__idx   → entity keys for this id
{prefix}:repo:{model}:q:__idx        → all query keys for this model
```

## Sensitive Fields

Fields listed in `sensitiveFields` (default: `['password']`) are **never cached**, even with `setCache: true`. When a `select` includes any of these fields, the cache layer is bypassed.

| Preset         | Has password? | Cacheable with `setCache`? | Use case                   |
|----------------|---------------|----------------------------|----------------------------|
| `minimal`      | No            | Yes                        | Existence checks           |
| `general`      | No            | Yes                        | API responses              |
| `withPassword` | Yes           | No                         | Internal auth, profile pwd |

## When to use `setCache: true`

Only on **user-facing read paths** that benefit from caching:

- `handleGetById` / `handleGetManyPaginate` in services
- Compose helpers loading related entities for API responses

**Do not** pass `setCache: true` on:

- Authentication lookups (`getFirst` by email)
- Uniqueness checks (`getFirst` by slug/email)
- JWT validation (`getById` in strategy)
- Internal reads before update/delete
- Reads inside transactions (`tx`)

Default (no `setCache`) always hits the database — safe for auth and uniqueness without extra flags.

### Anti-pattern: `setCache: true` on uniqueness `getFirst`

`getFirst` caches negative results (`NULL_SENTINEL`) when `setCache: true`. Using it on uniqueness checks can cause false negatives under race conditions. Keep uniqueness reads without `setCache`.

## Invalidation Modes

Write methods (`create`, `updateById`, `deleteById`) accept an `invalidate` parameter. Invalidation runs when the repository has `model` + `cache` config.

| Mode       | Behavior                                           | Default for          |
|------------|----------------------------------------------------|----------------------|
| `'all'`    | Invalidate entity cache (by id) + all query caches | `updateById`, `deleteById` |
| `'entity'` | Invalidate only entity cache for the given id      | —                    |
| `'queries'`| Invalidate only query caches                       | `create`             |
| `'none'`   | Skip invalidation entirely                         | —                    |

`invalidateCache({ id })` always clears the entity index (if `id` given) **and** the query index.

Use `invalidate: 'none'` for metadata-only updates:

```typescript
await this.adminRepository.updateById({
  id: admin.id,
  data: { lastLoginAt: new Date() },
  invalidate: 'none',
});
```

## Per-Method TTL

```typescript
model: 'admin',
cache: {
  ttl: 300,
  nullTtl: 60,
  sensitiveFields: ['password'],
  methods: {
    getManyPaginate: { ttl: 60 },
    getMany: { ttl: 60 },
    getFirst: { enabled: false }, // optional: disable caching for this method type
  },
},
```

## TTL Jitter

All TTLs are automatically jittered by ±10% to prevent mass expiry (thundering herd).

## Stampede Protection

On cache miss with `setCache: true`, a lightweight lock (`SET NX`) prevents multiple concurrent requests from all hitting the database.

## Transactions (`execTx`)

Cache is **skipped** inside transactions:

- **Reads** bypass cache even with `setCache: true`.
- **Writes** skip invalidation.

After commit, invalidate manually:

```typescript
await this.prisma.execTx(
  async (tx) => {
    await this.adminRepository.updateById({ tx, id, data });
  },
  async () => {
    await this.adminRepository.invalidateCache({ id });
  },
);
```

## Row Level Lock

`lock` on `getById` / `getThrowById` always bypasses cache.

## Redis Failure

When Redis is down: reads go to DB; invalidations are skipped; app continues (fail-open).

## Debugging

### `CACHE_DEBUG=true`

Set in `.env` for development:

- Logs cache `HIT` / `MISS` / `BYPASS` per repository read
- Adds `X-Cache` response header (`HIT`, `MISS`, `BYPASS`, or `SKIP`)

### Makefile (dev Docker)

```bash
make cache-flush              # flush Redis DB
make cache-keys MODEL=admin   # scan keys for a model
```

### Redis Commander

Access at `http://localhost:8081` (dev Docker).

### CLI (manual)

```bash
docker exec boilerplate-nest-redis-dev redis-cli --scan --pattern "bn:repo:admin:*"
docker exec boilerplate-nest-redis-dev redis-cli FLUSHDB
docker exec boilerplate-nest-redis-dev redis-cli SMEMBERS "bn:repo:admin:q:__idx"
```

Prefer `make cache-keys` over `KEYS` in production-like environments (`KEYS` blocks Redis).

## Automatic Nested Relations & Cache Tagging

We support automatic, transparent nested relation composition at the repository layer.

### 1. Repository Configuration (Automated Compose)
Instead of composing relations in the service layer, configure `scalarFields` and `composeHelperToken` in the repository factory:
```typescript
export const ProductRepository = createPrismaRepository<... >({
  model: 'product',
  cache: {
    ttl: 60 * 60 * 24,
    nullTtl: 60,
    sensitiveFields: [],
    getTags: (product: any) => CacheTags.shop(product.merchantId),
  },
  getDelegate: (client) => client.product,
  toPayload: <T extends Prisma.ProductSelect>(data: unknown) =>
    data as ProductPayload<T>,
  scalarFields: Prisma.ProductScalarFieldEnum,
  composeHelperToken: forwardRef(() => ProductComposeHelper),
});
```

### 2. Service Layer remains Clean
Since the repository handles select splitting and helper composition under the hood, the service layer simply calls standard repository CRUD methods without boilerplate:
```typescript
async handleGetById(id: string) {
  return this.productRepository.getThrowById({
    id,
    select: getProductSelect('general'),
    setCache: true,
  });
}
```

### 3. Type-Safe Cache Tagging & Automated Resolution
For tenant-scoped cache invalidation (like multi-merchant shops):
1. **Define central tags** in `src/common/utils/cache-tag.util.ts`:
   ```typescript
   export const CacheTags = {
     shop: (merchantId: unknown): string[] =>
       typeof merchantId === 'string' ? [`shop:${merchantId}`] : [],
   };
   ```
2. **Configure `getTags` in the repository cache options**:
   ```typescript
   getTags: (product: any) => CacheTags.shop(product.merchantId),
   ```
3. **Automated Read Resolution**:
   When querying lists via `getManyPaginate` with `setCache: true`, the repository automatically runs `getTags(where)` on the filter query to tag cached results. No manual `cacheTags` property is required in the service!
4. **Automated Write Invalidation**:
   When writing data (create, update, delete), the repository runs `getTags` on the database returned record to dynamically invalidate only that tenant's tagged cache keys in Redis.

## Checklist for New Repository Modules

1. Run `yarn gen:module <name> --cache` or add `model` + `cache: { ttl, ... }` to `createPrismaRepository`.
2. Register the model in `PrismaSelectPayloadMap` (generator does this with `--cache`).
3. Create select presets — `general` without sensitive fields; `withPassword` for internal auth.
4. Add `setCache: true` only on user-facing reads in services.
5. Use `invalidate: 'none'` for metadata-only updates.
6. In transactions: `afterCommit` → `invalidateCache`.
7. Never use `setCache: true` on auth/uniqueness `getFirst`.
8. Avoid raw `prisma.model.*` in services — bypasses repository invalidation.
