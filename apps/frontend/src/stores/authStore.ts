import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STYLIST';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  branchName: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'dreamgirl-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
