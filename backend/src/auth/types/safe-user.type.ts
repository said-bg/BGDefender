import { User } from '../../entities/user.entity';
import { UserRole, UserPlan } from '../../entities/user.entity';

export type SafeUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  occupation: string | null;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    occupation: user.occupation,
    role: user.role,
    plan: user.plan,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } as SafeUser;
}
