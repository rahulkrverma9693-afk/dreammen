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
      // SECURITY: Only persist non-sensitive user metadata to localStorage.
      // Access and refresh tokens are intentionally excluded from persistence.
      // Persisting tokens in localStorage exposes them to XSS attacks.
      // The recommended production approach is HTTP-only secure cookies set by the server.
      // For now, tokens live only in memory — users will need to re-login after page refresh.
      // TODO: Implement server-side HTTP-only cookie session management.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: false, // Reset auth on page load; re-validate via /auth/me with stored cookie
      }),
    }
  )
);

