import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  twoFaEnabled?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<{ requiresTwoFa?: boolean }>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password, totpCode) => {
        const { data } = await axios.post(`${API}/api/auth/login`, { email, password, totpCode });
        if (data.requiresTwoFa) return { requiresTwoFa: true };

        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
        return {};
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          await axios.post(`${API}/api/auth/logout`, { refreshToken });
        } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API}/api/auth/refresh`, { refreshToken });
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      },

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    }),
    { 
      name: 'smartstock-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      })
    }
  )
);
