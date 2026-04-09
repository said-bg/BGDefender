export interface LoginFormState {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  form?: string;
}

export type LoginErrorAction =
  | { type: 'SET'; payload: LoginFormErrors }
  | { type: 'CLEAR_FIELD'; payload: keyof LoginFormErrors }
  | { type: 'CLEAR' };
