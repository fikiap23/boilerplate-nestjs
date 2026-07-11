import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EAdminRole } from 'src/common/enums/admin.enum';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  const reflector = {
    get: jest.fn(),
  } as unknown as Reflector;

  const guard = new RoleGuard(reflector);

  const createContext = (user?: { role: string }) =>
    ({
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    expect(guard.canActivate(createContext({ role: EAdminRole.EDITOR }))).toBe(
      true,
    );
  });

  it('allows access when user role matches', () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue([EAdminRole.ADMIN, EAdminRole.SUPERADMIN]);

    expect(guard.canActivate(createContext({ role: EAdminRole.ADMIN }))).toBe(
      true,
    );
  });

  it('throws when user role does not match', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([EAdminRole.SUPERADMIN]);

    expect(() =>
      guard.canActivate(createContext({ role: EAdminRole.MODERATOR })),
    ).toThrow(ForbiddenException);
  });

  it('denies access when user is missing', () => {
    jest.spyOn(reflector, 'get').mockReturnValue([EAdminRole.ADMIN]);

    expect(guard.canActivate(createContext())).toBe(false);
  });
});
