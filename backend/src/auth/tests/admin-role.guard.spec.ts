import {
  ForbiddenException,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '../../entities/user.entity';
import { AdminRoleGuard } from '../guards/admin-role.guard';

const createHttpContext = (user?: { role?: UserRole }): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as ExecutionContext;

describe('AdminRoleGuard', () => {
  let guard: AdminRoleGuard;

  beforeEach(() => {
    guard = new AdminRoleGuard();
  });

  it('allows authenticated admins through', () => {
    const context = createHttpContext({ role: UserRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws UnauthorizedException when no user is attached to the request', () => {
    const context = createHttpContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException when the user is not an admin', () => {
    const context = createHttpContext({ role: UserRole.USER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
