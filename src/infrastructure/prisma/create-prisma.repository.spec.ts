import { createPrismaRepository } from './create-prisma.repository';

const mockDelegate = {
  findUnique: jest.fn(),
  findUniqueOrThrow: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

function createMockRedis() {
  return {
    isReady: jest.fn().mockReturnValue(true),
    getPrefix: jest.fn().mockReturnValue('test'),
    safeGet: jest.fn().mockResolvedValue(null),
    safeSetWithIndex: jest.fn().mockResolvedValue(undefined),
    safeSetNx: jest.fn().mockResolvedValue(true),
    safeDel: jest.fn().mockResolvedValue(undefined),
    safeInvalidateByIndex: jest.fn().mockResolvedValue(undefined),
  };
}

const AdminRepo = createPrismaRepository({
  model: 'admin',
  cache: {
    ttl: 60,
    nullTtl: 30,
    sensitiveFields: ['password'],
  },
  getDelegate: () => mockDelegate as never,
  toPayload: <T>(data: unknown) => data as T,
});

const NoCacheRepo = createPrismaRepository({
  getDelegate: () => mockDelegate as never,
  toPayload: <T>(data: unknown) => data as T,
});

describe('createPrismaRepository cache', () => {
  let redis: ReturnType<typeof createMockRedis>;
  let adminRepo: InstanceType<typeof AdminRepo>;
  let noCacheRepo: InstanceType<typeof NoCacheRepo>;

  beforeEach(() => {
    redis = createMockRedis();
    adminRepo = new AdminRepo({} as never, redis as never);
    noCacheRepo = new NoCacheRepo({} as never, redis as never);
    jest.clearAllMocks();
    redis.isReady.mockReturnValue(true);
  });

  it('does not read cache without setCache', async () => {
    mockDelegate.findUnique.mockResolvedValue({ id: '1', name: 'Admin' });

    await adminRepo.getById({
      id: '1',
      select: { id: true, name: true },
    });

    expect(redis.safeGet).not.toHaveBeenCalled();
    expect(redis.safeSetWithIndex).not.toHaveBeenCalled();
    expect(mockDelegate.findUnique).toHaveBeenCalled();
  });

  it('uses cache on read when setCache is true', async () => {
    mockDelegate.findUnique.mockResolvedValue({ id: '1', name: 'Admin' });

    await adminRepo.getById({
      id: '1',
      select: { id: true, name: true },
      setCache: true,
    });

    expect(redis.safeGet).toHaveBeenCalled();
    expect(redis.safeSetWithIndex).toHaveBeenCalled();
  });

  it('returns cached entity on hit', async () => {
    redis.safeGet.mockResolvedValue({ id: '1', name: 'Cached' });

    const result = await adminRepo.getById({
      id: '1',
      select: { id: true, name: true },
      setCache: true,
    });

    expect(result).toEqual({ id: '1', name: 'Cached' });
    expect(mockDelegate.findUnique).not.toHaveBeenCalled();
  });

  it('bypasses cache for sensitive select even with setCache', async () => {
    mockDelegate.findUnique.mockResolvedValue({
      id: '1',
      password: 'hash',
    });

    await adminRepo.getById({
      id: '1',
      select: { id: true, password: true },
      setCache: true,
    });

    expect(redis.safeGet).not.toHaveBeenCalled();
    expect(redis.safeSetWithIndex).not.toHaveBeenCalled();
  });

  it('bypasses cache inside transaction even with setCache', async () => {
    mockDelegate.findUnique.mockResolvedValue({ id: '1' });
    const tx = {} as never;

    await adminRepo.getById({
      tx,
      id: '1',
      select: { id: true },
      setCache: true,
    });

    expect(redis.safeGet).not.toHaveBeenCalled();
  });

  it('no-ops setCache when repository has no cache config', async () => {
    mockDelegate.findUnique.mockResolvedValue({ id: '1' });

    await noCacheRepo.getById({
      id: '1',
      select: { id: true },
      setCache: true,
    });

    expect(redis.safeGet).not.toHaveBeenCalled();
    expect(redis.safeSetWithIndex).not.toHaveBeenCalled();
  });

  it('caches null sentinel for getThrowById miss', async () => {
    mockDelegate.findUniqueOrThrow.mockResolvedValue({ id: '1' });

    await adminRepo.getThrowById({
      id: '1',
      select: { id: true },
      setCache: true,
    });

    expect(redis.safeSetWithIndex).toHaveBeenCalledWith(
      expect.any(String),
      { id: '1' },
      expect.any(Number),
      expect.any(String),
    );
  });

  it('invalidates on update when cache configured', async () => {
    mockDelegate.update.mockResolvedValue({ id: '1', name: 'Updated' });

    await adminRepo.updateById({
      id: '1',
      data: { name: 'Updated' },
    });

    expect(redis.safeInvalidateByIndex).toHaveBeenCalled();
  });

  it('does not invalidate on update when cache not configured', async () => {
    mockDelegate.update.mockResolvedValue({ id: '1' });

    await noCacheRepo.updateById({
      id: '1',
      data: { name: 'Updated' },
    });

    expect(redis.safeInvalidateByIndex).not.toHaveBeenCalled();
  });

  it('skips invalidation when invalidate is none', async () => {
    mockDelegate.update.mockResolvedValue({ id: '1' });

    await adminRepo.updateById({
      id: '1',
      data: { lastLoginAt: new Date() },
      invalidate: 'none',
    });

    expect(redis.safeInvalidateByIndex).not.toHaveBeenCalled();
  });

  it('invalidates queries only on create by default', async () => {
    mockDelegate.create.mockResolvedValue({ id: '1' });

    await adminRepo.create({
      data: { email: 'a@b.com' },
    });

    expect(redis.safeInvalidateByIndex).toHaveBeenCalledTimes(1);
    expect(redis.safeInvalidateByIndex).toHaveBeenCalledWith(
      'test:repo:admin:q:__idx',
    );
  });
});
