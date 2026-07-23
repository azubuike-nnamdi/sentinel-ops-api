import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const createContext = (role?: UserRole): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? { id: '1', email: 'a@b.com', role }
            : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  it('allows when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(createContext(UserRole.OPERATOR))).toBe(true);
  });

  it('allows matching roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMINISTRATOR,
    ]);
    expect(guard.canActivate(createContext(UserRole.ADMINISTRATOR))).toBe(
      true,
    );
  });

  it('denies mismatched roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMINISTRATOR,
    ]);
    expect(() =>
      guard.canActivate(createContext(UserRole.OPERATOR)),
    ).toThrow(ForbiddenException);
  });
});
