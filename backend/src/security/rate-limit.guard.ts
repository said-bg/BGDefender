import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitOptions,
} from './rate-limit.decorator';

type RateLimitEntry = {
  timestamps: number[];
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  const firstForwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];

  return (
    firstForwardedIp?.trim() ||
    request.ip ||
    request.socket.remoteAddress ||
    'unknown'
  );
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const now = Date.now();
    const windowStart = now - options.windowMs;
    const clientIp = getClientIp(request);
    const key = `${options.keyPrefix}:${clientIp}`;
    const entry = this.entries.get(key) ?? { timestamps: [] };
    const activeTimestamps = entry.timestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    if (activeTimestamps.length >= options.maxRequests) {
      const retryAfterMs = activeTimestamps[0] + options.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      response.setHeader('Retry-After', retryAfterSeconds.toString());
      response.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('X-RateLimit-Reset', (now + retryAfterMs).toString());

      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    activeTimestamps.push(now);
    this.entries.set(key, {
      timestamps: activeTimestamps,
    });

    response.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, options.maxRequests - activeTimestamps.length).toString(),
    );
    response.setHeader(
      'X-RateLimit-Reset',
      (activeTimestamps[0] + options.windowMs).toString(),
    );

    this.cleanupExpiredEntries(windowStart);
    return true;
  }

  private cleanupExpiredEntries(windowStart: number) {
    for (const [key, entry] of this.entries.entries()) {
      const activeTimestamps = entry.timestamps.filter(
        (timestamp) => timestamp > windowStart,
      );

      if (activeTimestamps.length === 0) {
        this.entries.delete(key);
        continue;
      }

      if (activeTimestamps.length !== entry.timestamps.length) {
        this.entries.set(key, { timestamps: activeTimestamps });
      }
    }
  }
}
