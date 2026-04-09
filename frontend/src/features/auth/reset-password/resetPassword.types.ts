export type ResetPasswordFieldErrors = {
  newPassword?: string[];
  confirmPassword?: string;
};

export type PasswordRequirement = {
  key: string;
  label: string;
  isValid: boolean;
};