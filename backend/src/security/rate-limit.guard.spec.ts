import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';
import type { RateLimitOptions } from './rate-limit.decorator';

describe('RateLimitGuard', () => {
  const loginOptions: RateLimitOptions = {
    keyPrefix: 'auth:login',
    maxRequests: 2,
    windowMs: 1000,
  };

  const contactOptions: RateLimitOptions = {
    keyPrefix: 'contact:submit',
    maxRequests: 2,
    windowMs: 1000,
  };

  const createContext = (
    ip = '127.0.0.1',
    headers: Record<string, string> = {},
  ) => {
    const response = {
      setHeader: jest.fn(),
    };

    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () =>
          ({
            ip,
            headers,
            socket: { remoteAddress: ip },
          }) as const,
        getResponse: () => response,
      }),
    } as ExecutionContext;

    return { context, response };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows requests while under the configured limit', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(loginOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);
    const first = createContext();
    const second = createContext();

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(second.context)).toBe(true);
  });

  it('blocks requests that exceed the configured limit', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(loginOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);
    const first = createContext();
    const second = createContext();
    const third = createContext();

    guard.canActivate(first.context);
    guard.canActivate(second.context);

    try {
      guard.canActivate(third.context);
      fail('Expected rate limiter to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect((error as HttpException).message).toBe(
        'Too many requests. Please try again later.',
      );
    }
  });

  it('sets retry and rate-limit headers when the limit is exceeded', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(loginOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);
    const first = createContext();
    const second = createContext();
    const blocked = createContext();

    guard.canActivate(first.context);
    guard.canActivate(second.context);

    expect(() => guard.canActivate(blocked.context)).toThrow(HttpException);
    expect(blocked.response.setHeader).toHaveBeenCalledWith('Retry-After', '1');
    expect(blocked.response.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      loginOptions.maxRequests.toString(),
    );
    expect(blocked.response.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Remaining',
      '0',
    );
  });

  it('uses the forwarded ip when present', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(loginOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);
    const forwardedHeaders = {
      'x-forwarded-for': '203.0.113.10, 10.0.0.2',
    };
    const request = createContext('127.0.0.1', forwardedHeaders);

    expect(() => guard.canActivate(request.context)).not.toThrow();
  });

  it('keeps separate counters for different client ips', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(loginOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);

    expect(guard.canActivate(createContext('127.0.0.1').context)).toBe(true);
    expect(guard.canActivate(createContext('127.0.0.1').context)).toBe(true);
    expect(guard.canActivate(createContext('127.0.0.2').context)).toBe(true);
  });

  it('resets the counter after the rate-limit window expires', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(loginOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);
    const nowSpy = jest.spyOn(Date, 'now');

    nowSpy.mockReturnValueOnce(1_000);
    expect(guard.canActivate(createContext().context)).toBe(true);

    nowSpy.mockReturnValueOnce(1_500);
    expect(guard.canActivate(createContext().context)).toBe(true);

    nowSpy.mockReturnValueOnce(2_001);
    expect(guard.canActivate(createContext().context)).toBe(true);
  });

  it('keeps separate counters for different route prefixes', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(loginOptions)
        .mockReturnValueOnce(loginOptions)
        .mockReturnValueOnce(contactOptions),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);

    expect(guard.canActivate(createContext().context)).toBe(true);
    expect(guard.canActivate(createContext().context)).toBe(true);
    expect(guard.canActivate(createContext().context)).toBe(true);
  });

  it('skips routes without rate limit metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RateLimitGuard(reflector);

    expect(guard.canActivate(createContext().context)).toBe(true);
  });
});
