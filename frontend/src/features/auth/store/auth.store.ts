import { create } from 'zustand';
import type { AuthState } from '../types/auth.types';
import type { User } from '@/types/user.types';
import { authService } from '../services/auth.service';

const AUTH_STORAGE_KEY = 'auth-user';

function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors — cookie may already be expired
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Show stored user immediately for instant UI
    set({ user: storedUser, isAuthenticated: true, isLoading: true });

    try {
      const freshUser = await authService.getMe();
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
      set({ user: freshUser, isAuthenticated: true, isLoading: false });
    } catch {
      // Cookie expired or invalid — clear state
      localStorage.removeItem(AUTH_STORAGE_KEY);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
