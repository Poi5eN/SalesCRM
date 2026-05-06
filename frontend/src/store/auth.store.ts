import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  tenant: any | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string, tenant: any) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  tenant: null,
  isAuthenticated: false,
  setAuth: (user, token, tenant) => set({ user, token, tenant, isAuthenticated: true }),
  clearAuth: () => set({ user: null, token: null, tenant: null, isAuthenticated: false }),
}));
