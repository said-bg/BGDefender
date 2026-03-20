/**
 * Constantes de sécurité utilisées IMMÉDIATEMENT en Phase 1
 *
 * ⚠️ Ne pas ajouter de constantes "pour plus tard"
 * Ajouter seulement ce qui est réellement implémenté cette semaine
 */

export const SECURITY_RULES = {
  // Authentification
  JWT_EXPIRES_IN: '1d' as const,
  JWT_ALGORITHM: 'HS256' as const,

  // Validation des mots de passe
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/,

  // Hachage des mots de passe
  BCRYPT_ROUNDS: 10,
} as const;

/**
 * À implémenter dans les phases futures:
 * - MAX_LOGIN_ATTEMPTS + LOCKOUT_DURATION (Phase 2)
 * - ROLE_PERMISSIONS (Phase 2)
 * - PLAN_ACCESS (Phase 2 - géré dans les guards à la place)
 */
