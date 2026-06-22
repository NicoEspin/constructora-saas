'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AuthSession {
  email: string;
  activeTenantId: string | null;
  roles: string[];
  isLoaded: boolean;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const DEFAULT_SESSION: AuthSession = {
  email: '',
  activeTenantId: null,
  roles: [],
  isLoaded: false,
};

export function useAuth(): AuthSession & { logout: () => Promise<void> } {
  const [session, setSession] = useState<AuthSession>(DEFAULT_SESSION);

  useEffect(() => {
    const token = getAccessTokenFromCookie();
    if (!token) {
      setSession({ ...DEFAULT_SESSION, isLoaded: true });
      return;
    }
    const payload = decodeJwtPayload(token);
    setSession({
      email: (payload?.email as string) ?? '',
      activeTenantId: (payload?.activeTenantId as string) ?? null,
      roles: (payload?.roles as string[]) ?? [],
      isLoaded: true,
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/sign-in';
  }, []);

  return { ...session, logout };
}
