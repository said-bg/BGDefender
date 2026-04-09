export interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export type RegisterErrorAction =
  | { type: 'SET'; payload: RegisterFormErrors }
  | { type: 'CLEAR_FIELD'; payload: keyof RegisterFormErrors }
  | { type: 'CLEAR' };