import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from '../types/safe-user.type';

/**
 * @CurrentUser() decorator
 * Extrait l'utilisateur authentifié depuis la request
 * Le JWT Strategy ajoute user dans request.user
 * Ce décorateur juste le récupère et le type proprement
 *
 * Usage: getCurrentUser(@CurrentUser() user: SafeUser)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SafeUser => {
    const request = ctx.switchToHttp().getRequest<{ user: SafeUser }>();
    return request.user;
  },
);
