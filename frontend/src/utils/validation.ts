/**
 * Password Validation Utils
 */

export type PasswordErrorCode = 'minLength' | 'noUppercase' | 'noNumber';

export interface PasswordValidationError {
  code: PasswordErrorCode;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: PasswordValidationError[];
}

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;
const PASSWORD_NUMBER_REGEX = /[0-9]/;

/**
 * Validate password according to backend rules:
 * - Min 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * 
 * Returns error codes instead of messages for i18n translation
 */
export const validatePassword = (password: string): PasswordValidation => {
  const errors: PasswordValidationError[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push({ code: 'minLength' });
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(password)) {
    errors.push({ code: 'noUppercase' });
  }

  if (!PASSWORD_NUMBER_REGEX.test(password)) {
    errors.push({ code: 'noNumber' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
