import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createAuthStore } from './authStore.actions';
import { AuthState } from './authStore.types';

export const useAuthStore = create<AuthState>()(
  devtools(createAuthStore, {
    name: 'Auth Store',
  })
);

export type { AuthState } from './authStore.types';

export default useAuthStore;
