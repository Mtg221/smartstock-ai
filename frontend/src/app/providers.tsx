'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

function AuthInitializer() {
  const { refreshToken, accessToken, refreshTokens, logout } = useAuthStore();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    // Si on a un refreshToken mais pas d'accessToken (rechargement de page), on rafraîchit
    if (refreshToken && !accessToken) {
      refreshTokens().catch(() => logout());
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
