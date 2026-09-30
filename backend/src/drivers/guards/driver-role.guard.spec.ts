import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../database/enums';
import { DriverRoleGuard } from './driver-role.guard';

const contextFor = (role: UserRole): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  }) as ExecutionContext;

describe('DriverRoleGuard', () => {
  it('rejects passengers', () => {
    const guard = new DriverRoleGuard();

    expect(() => guard.canActivate(contextFor(UserRole.PASSENGER))).toThrow(
      ForbiddenException,
    );
  });

  it('allows drivers', () => {
    const guard = new DriverRoleGuard();

    expect(guard.canActivate(contextFor(UserRole.DRIVER))).toBe(true);
  });
});