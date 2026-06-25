/**
 * Manual integration test for PostgreSQL row-level lock.
 * Run: DATABASE_URL="postgresql://app:apppassword@localhost:5432/boilerplate_nest" npx ts-node -r tsconfig-paths/register scripts/test-row-lock.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  assertLockPrerequisites,
  buildLockClause,
  mapDbRowToPrisma,
  queryRowForUpdate,
  selectToDbColumns,
} from 'src/infrastructure/prisma/utils/row-lock.util';
import { validateLockConfig } from 'src/infrastructure/prisma/utils/validate-lock-config.util';
import { getAdminSelect } from 'src/modules/admin/types/select-admin.type';
import 'src/modules/admin/repositories/admin.repository';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

const lockConfig = {
  tableName: 'admin',
  columns: { createdAt: 'created_at', lastLoginAt: 'last_login_at' },
};

const select = getAdminSelect('general');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function testUnitHelpers() {
  console.log('\n--- Unit: helpers ---');

  assert(
    buildLockClause({}) === 'FOR NO KEY UPDATE',
    'default lock clause is FOR NO KEY UPDATE',
  );
  assert(
    buildLockClause({ mode: 'update', nowait: true }) === 'FOR UPDATE NOWAIT',
    'update + nowait clause',
  );

  let threw = false;
  try {
    buildLockClause({ nowait: true, skipLocked: true });
  } catch {
    threw = true;
  }
  assert(threw, 'nowait + skipLocked throws');

  assert(
    selectToDbColumns({ id: true, createdAt: true }, lockConfig.columns!).join(
      ',',
    ) === 'id,created_at',
    'selectToDbColumns maps @map fields',
  );

  const mapped = mapDbRowToPrisma(
    { created_at: new Date('2024-01-01'), id: 'x' },
    lockConfig.columns!,
  );
  assert(mapped.createdAt instanceof Date, 'mapDbRowToPrisma maps created_at');

  try {
    assertLockPrerequisites(undefined, lockConfig);
  } catch (e) {
    assert(
      (e as Error).message.includes('transaction'),
      'assertLockPrerequisites requires tx',
    );
  }
}

function testValidateLockConfig() {
  console.log('\n--- Unit: validateLockConfig (DMMF) ---');

  validateLockConfig(lockConfig);
  assert(true, 'admin lock config passes DMMF validation');

  let threw = false;
  try {
    validateLockConfig({
      tableName: 'admin',
      columns: { createdAt: 'created_at' },
    });
  } catch (e) {
    threw = (e as Error).message.includes('lastLoginAt');
  }
  assert(threw, 'missing @map field in columns throws');

  threw = false;
  try {
    validateLockConfig({
      tableName: 'admin',
      columns: { createdAt: 'wrong_col', lastLoginAt: 'last_login_at' },
    });
  } catch (e) {
    threw = (e as Error).message.includes('createdAt');
  }
  assert(threw, 'wrong db column name throws');

  threw = false;
  try {
    validateLockConfig({ tableName: 'nonexistent_table', columns: {} });
  } catch (e) {
    threw = (e as Error).message.includes('no Prisma model');
  }
  assert(threw, 'unknown tableName throws');

  threw = false;
  try {
    validateLockConfig({
      tableName: 'admin',
      columns: {
        createdAt: 'created_at',
        lastLoginAt: 'last_login_at',
        ghostField: 'ghost',
      },
    });
  } catch (e) {
    threw = (e as Error).message.includes('ghostField');
  }
  assert(threw, 'unknown column key throws');

  assert(true, 'AdminRepository factory init validated lock config');
}

async function testLockedReadReturnsRow() {
  console.log('\n--- Integration: locked read ---');

  const admin = await prisma.admin.findFirst({ select: { id: true } });
  assert(!!admin, 'seed admin exists');

  await prisma.$transaction(async (tx) => {
    const row = await queryRowForUpdate(tx, lockConfig, {
      id: admin!.id,
      select,
      lock: { mode: 'noKeyUpdate' },
    });
    assert(!!row, 'queryRowForUpdate returns row');
    assert(row!.email === 'superadmin@example.com', 'mapped fields readable');
  });
}

async function testConcurrentLockBlocks() {
  console.log('\n--- Integration: concurrent lock blocks ---');

  const admin = await prisma.admin.findFirst({ select: { id: true } });
  const holdMs = 1500;

  let tx2AcquiredAt = 0;
  const tx2StartAt = { value: 0 };

  const tx1 = prisma.$transaction(async (tx) => {
    await queryRowForUpdate(tx, lockConfig, {
      id: admin!.id,
      select,
      lock: { mode: 'noKeyUpdate' },
    });
    await sleep(holdMs);
  });

  await sleep(100);
  tx2StartAt.value = Date.now();

  const tx2 = prisma.$transaction(async (tx) => {
    await queryRowForUpdate(tx, lockConfig, {
      id: admin!.id,
      select,
      lock: { mode: 'noKeyUpdate' },
    });
    tx2AcquiredAt = Date.now();
  });

  await Promise.all([tx1, tx2]);

  const waitMs = tx2AcquiredAt - tx2StartAt.value;
  assert(
    waitMs >= holdMs - 300,
    `tx2 waited for tx1 lock (~${waitMs}ms, expected >= ${holdMs - 300}ms)`,
  );
}

async function testNowaitFailsWhenLocked() {
  console.log('\n--- Integration: nowait fails when row locked ---');

  const admin = await prisma.admin.findFirst({ select: { id: true } });

  const tx1 = prisma.$transaction(async (tx) => {
    await queryRowForUpdate(tx, lockConfig, {
      id: admin!.id,
      select,
      lock: { mode: 'noKeyUpdate' },
    });
    await sleep(2000);
  });

  await sleep(100);

  let nowaitError: { code?: string } | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      await queryRowForUpdate(tx, lockConfig, {
        id: admin!.id,
        select,
        lock: { mode: 'noKeyUpdate', nowait: true },
      });
    });
  } catch (e) {
    nowaitError = e as { code?: string };
  }

  await tx1;

  assert(nowaitError?.code === 'P2010' || nowaitError?.code === '55P03', 'nowait fails with lock error');
}

async function testWithoutLockNoBlocking() {
  console.log('\n--- Integration: without lock, reads do not block ---');

  const admin = await prisma.admin.findFirst({ select: { id: true } });

  let tx2DoneAt = 0;
  const tx2StartAt = { value: 0 };

  const tx1 = prisma.$transaction(async (tx) => {
    await tx.admin.findUnique({ where: { id: admin!.id }, select });
    await sleep(1500);
  });

  await sleep(100);
  tx2StartAt.value = Date.now();

  const tx2 = prisma.$transaction(async (tx) => {
    await tx.admin.findUnique({ where: { id: admin!.id }, select });
    tx2DoneAt = Date.now();
  });

  await Promise.all([tx1, tx2]);

  const elapsed = tx2DoneAt - tx2StartAt.value;
  assert(
    elapsed < 800,
    `without lock tx2 finishes quickly (~${elapsed}ms, expected < 800ms)`,
  );
}

async function main() {
  console.log('Row Level Lock Test');
  console.log('DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  await testUnitHelpers();
  testValidateLockConfig();
  await testLockedReadReturnsRow();
  await testConcurrentLockBlocks();
  await testNowaitFailsWhenLocked();
  await testWithoutLockNoBlocking();

  console.log('\nAll tests passed.');
}

main()
  .catch((e) => {
    console.error('\nTest failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
