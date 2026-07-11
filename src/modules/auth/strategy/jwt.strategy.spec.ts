import { ConfigService } from '@nestjs/config';
import { EAdminRole, EAdminStatus } from 'src/common/enums/admin.enum';
import { AdminClient } from 'src/modules/admin/client/admin.client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const adminClient = {
    getAdminById: jest.fn(),
  } as unknown as AdminClient;

  const configService = {
    get: jest.fn().mockReturnValue('test-secret-with-at-least-32-characters'),
  } as unknown as ConfigService;

  const strategy = new JwtStrategy(adminClient, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns refreshed payload for active admin', async () => {
    jest.spyOn(adminClient, 'getAdminById').mockResolvedValue({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@example.com',
      role: EAdminRole.ADMIN,
      status: EAdminStatus.ACTIVE,
    });

    await expect(
      strategy.validate({
        sub: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin',
        role: EAdminRole.ADMIN,
        status: EAdminStatus.ACTIVE,
      }),
    ).resolves.toEqual({
      sub: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin',
      role: EAdminRole.ADMIN,
      status: EAdminStatus.ACTIVE,
    });
  });

  it('rejects inactive admin', async () => {
    jest.spyOn(adminClient, 'getAdminById').mockResolvedValue({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@example.com',
      role: EAdminRole.ADMIN,
      status: EAdminStatus.INACTIVE,
    });

    await expect(
      strategy.validate({
        sub: 'admin-id',
        email: 'admin@example.com',
        name: 'Admin',
        role: EAdminRole.ADMIN,
        status: EAdminStatus.ACTIVE,
      }),
    ).resolves.toBe(false);
  });

  it('rejects missing admin', async () => {
    jest.spyOn(adminClient, 'getAdminById').mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'missing-id',
        email: 'admin@example.com',
        name: 'Admin',
        role: EAdminRole.ADMIN,
        status: EAdminStatus.ACTIVE,
      }),
    ).resolves.toBe(false);
  });
});
