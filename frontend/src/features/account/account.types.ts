export type AccountSection = 'profile' | 'security';

export type ProfileFormState = {
  firstName: string;
  lastName: string;
  occupation: string;
};

export type PasswordCheck = {
  key: string;
  label: string;
  isValid: boolean;
};