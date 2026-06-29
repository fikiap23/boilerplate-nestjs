# Repository Cache Guidelines

This project uses Redis as a cache-aside layer integrated into the generic `createPrismaRepository` factory. Every read/write that goes through the repository automatically participates in caching (when enabled).

## Architecture

```
Service → Repository → [Redis cache] → Prisma → PostgreSQL
```

- Cache is **opt-in per repository** via `cache: { enabled: true, model: 'modelname' }` in factory options (`model` is required for cache to activate).
- Redis is injected with `@Optional()` — if Redis is down the app keeps working (fail-open).
- All cache operations use **safe wrappers** that catch errors and log warnings instead of crashing.

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

Fields listed in `sensitiveFields` (default: `['password']`) are **never cached**. When a `select` includes any of these fields, the cache layer is bypassed entirely — data goes straight to/from the database.

Use select presets to keep this clean:

| Preset         | Has password? | Cacheable? | Use case                   |
|----------------|---------------|------------|----------------------------|
| `minimal`      | No            | Yes        | Existence checks           |
| `general`      | No            | Yes        | API responses              |
| `withPassword` | Yes           | No         | Internal auth, profile pwd |

## When to use `skipCache: true`

Pass `skipCache: true` on any read method to bypass cache for that call:

- **Authentication lookups** — credential verification must always hit the database.
- **Uniqueness checks** — email/username existence before create/update needs fresh data.
- Any read where stale data would cause incorrect business logic.

```typescript
const admin = await this.adminRepository.getFirst({
  where: { email },
  skipCache: true,
});
```

## Invalidation Modes

Write methods (`create`, `updateById`, `deleteById`) accept an `invalidate` parameter:

| Mode       | Behavior                                           | Default for          |
|------------|----------------------------------------------------|----------------------|
| `'all'`    | Invalidate entity cache (by id) + all query caches | `updateById`, `deleteById` |
| `'entity'` | Invalidate only entity cache for the given id      | —                    |
| `'queries'`| Invalidate only query caches                       | `create`             |
| `'none'`   | Skip invalidation entirely                         | —                    |

Use `invalidate: 'none'` for metadata-only updates that don't affect query results:

```typescript
await this.adminRepository.updateById({
  id: admin.id,
  data: { lastLoginAt: new Date() },
  invalidate: 'none',
});
```

## Per-Method TTL

Configure different TTLs per read method. List endpoints typically need shorter TTLs than entity lookups:

```typescript
cache: {
  enabled: true,
  ttl: 300,           // default for entity reads
  nullTtl: 60,        // TTL for null/not-found results
  sensitiveFields: ['password'],
  methods: {
    getManyPaginate: { ttl: 60 },
    getMany: { ttl: 60 },
  },
},
```

## TTL Jitter

All TTLs are automatically jittered by ±10% to prevent mass expiry (thundering herd). No configuration needed.

## Stampede Protection

When a cache miss occurs, a lightweight lock (`SET NX`) prevents multiple concurrent requests from all hitting the database. Only the lock holder populates the cache; others retry the GET a few times before falling through to the database.

## Transactions (`execTx`)

Cache is automatically **skipped** inside transactions:

- **Reads** bypass cache (transaction-local data isn't committed yet).
- **Writes** skip invalidation (avoid invalidating if the transaction rolls back).

After a transaction commits, use the `afterCommit` callback to invalidate:

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

Pass `lock` on `getById` or `getThrowById` to acquire a PostgreSQL row lock (`SELECT ... FOR UPDATE`). This always bypasses cache — no `skipCache` needed.

Requirements:
- Repository must have `lock: { tableName, columns }` in factory options.
- `lock` must be used with `tx` inside `prisma.execTx()`.

```typescript
const order = await this.orderRepository.getThrowById({
  tx,
  id: orderId,
  select: getOrderSelect('general'),
  lock: { mode: 'noKeyUpdate' },
});
```

See [`AGENTS.md`](../AGENTS.md) → Row Level Lock section for full usage patterns.

## Redis Failure

Redis operations are wrapped in safe methods that catch errors and log warnings. When Redis is down or unavailable:

- All reads go directly to the database.
- All write invalidations are silently skipped.
- The application continues to function normally, just without caching.

Monitor `RedisService` log warnings to detect degradation.

## Debugging

### Inspect keys via Redis Commander

Access at `http://localhost:8081` (dev Docker).

### CLI commands

```bash
# List all cache keys for a model
docker exec boilerplate-nest-redis-dev redis-cli KEYS "bn:repo:admin:*"

# Check a specific key
docker exec boilerplate-nest-redis-dev redis-cli GET "bn:repo:admin:e:{id}:getThrowById:{hash}"

# Flush all cache
docker exec boilerplate-nest-redis-dev redis-cli FLUSHDB

# Check index members
docker exec boilerplate-nest-redis-dev redis-cli SMEMBERS "bn:repo:admin:q:__idx"
```

## Nested Relations (Product + Category)

Cache is **per-model**. If you cache a parent read with a nested relation (`select: { category: { select: ... } }`), updating the child only invalidates the child's cache — the parent blob stays stale.

### Anti-pattern

```typescript
// Stale risk: category name changes but product cache still has old nested category
await productRepository.getThrowById({
  id,
  select: { id: true, name: true, category: { select: { id: true, name: true } } },
});
```

### Recommended: compose in service (cache per entity)

Cache each entity with a flat `general` preset (no nested relations). Assemble the API response in the service:

```typescript
const product = await productRepository.getThrowById({
  id,
  select: getProductSelect('general'), // scalars only, includes categoryId
});
const category = await categoryRepository.getThrowById({
  id: product.categoryId,
  select: getCategorySelect('general'),
});
return { ...product, category };
```

For paginated lists, batch-load categories:

```typescript
const categoryIds = [...new Set(products.map((p) => p.categoryId))];
const categories = await categoryRepository.getMany({
  where: { id: { in: categoryIds } },
  select: getCategorySelect('general'),
});
```

When category is updated, its repository invalidates `repo:category:*`. The next product read re-fetches fresh category while product scalars may still be cached — data stays consistent.

Reference implementation: `src/modules/product/services/product.service.ts` + `src/modules/master-data/`.

## Checklist for New Repository Modules

1. Add `model: 'modelname'` and `cache: { enabled: true, ttl: ..., sensitiveFields: [...] }` to `createPrismaRepository` options.
2. Register the model in `PrismaSelectPayloadMap` (`src/infrastructure/prisma/types/prisma-select-payload.type.ts`).
3. Create select presets — separate `general` (cacheable, no sensitive fields) from `withPassword` / `withSecret` (internal only).
4. In services: use `skipCache: true` for uniqueness checks and auth lookups.
5. In services: use `invalidate: 'none'` for metadata-only updates (timestamps, counters).
6. In transactions: use `afterCommit` callback for invalidation.
7. For read-modify-write in transactions: use `lock` on `getById`/`getThrowById` (bypasses cache automatically).
8. Avoid bypassing the repository (raw `prisma.model.*` calls) — those skip cache entirely and leave stale data.
