import { User } from '../../entities/user.entity';
import { UserRole, UserPlan } from '../../entities/user.entity';

/**
 * SafeUser: Version sécurisée de l'entité User
 * Jamais de password, jamais de données sensibles
 * Explicite: on expose UNIQUEMENT ce qui est autorisé
 * C'est ce qu'on retourne dans toutes les réponses Auth
 */
export type SafeUser = {
  id: number;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Helper pour convertir User → SafeUser
 * Élimine le password automatiquement
 */
export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    plan: user.plan,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } as SafeUser;
}
