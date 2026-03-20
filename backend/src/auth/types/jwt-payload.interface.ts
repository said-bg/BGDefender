import { UserRole, UserPlan } from '../../entities/user.entity';

/**
 * JWT Payload format
 * Generated in login(), validated in validateUser() and JwtStrategy
 */
export interface JwtPayload {
  sub: number; // user.id
  email: string;
  role: UserRole;
  plan: UserPlan;
}
