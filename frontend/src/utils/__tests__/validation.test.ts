import { validatePassword, validateEmail } from '../validation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('ValidPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password with lowercase only', () => {
      const result = validatePassword('validpass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ code: 'noUppercase' });
    });

    it('should reject password without number', () => {
      const result = validatePassword('ValidPass');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ code: 'noNumber' });
    });

    it('should reject password less than 8 characters', () => {
      const result = validatePassword('Pas1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({ code: 'minLength' });
    });

    it('should report multiple errors', () => {
      const result = validatePassword('pass');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // minLength, noUppercase, noNumber
      expect(result.errors.map((e) => e.code)).toContain('minLength');
      expect(result.errors.map((e) => e.code)).toContain('noUppercase');
      expect(result.errors.map((e) => e.code)).toContain('noNumber');
    });

    it('should accept password with 8 exact characters', () => {
      const result = validatePassword('ValidPa1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept password longer than 12 characters', () => {
      const result = validatePassword('VeryLongValidPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.co.uk')).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(validateEmail('user123@example.com')).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });

    it('should reject email without @ symbol', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject email without dot in domain', () => {
      expect(validateEmail('user@example')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should reject email with multiple @ symbols', () => {
      expect(validateEmail('user@@example.com')).toBe(false);
    });
  });
});
