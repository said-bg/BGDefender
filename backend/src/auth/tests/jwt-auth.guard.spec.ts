import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('creates the passport jwt auth guard mixin', () => {
    const guard = new JwtAuthGuard();

    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });
});
