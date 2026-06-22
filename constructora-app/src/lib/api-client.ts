const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function decodeJwtPayload(token: string): { activeTenantId?: string } | null {
  try {
    const part = token.split('.')[1];
    const decoded =
      typeof Buffer !== 'undefined' ? Buffer.from(part, 'base64url').toString('utf-8') : atob(part);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let url: string;
  const authHeaders: Record<string, string> = {};
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;

  if (typeof window === 'undefined') {
    // Server-side (SSR / prefetch): absolute URL + read cookies via next/headers
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    url = `${BACKEND_URL}/api${endpoint}`;

    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
      const payload = decodeJwtPayload(token);
      if (payload?.activeTenantId) {
        authHeaders['X-Tenant-ID'] = payload.activeTenantId;
      }
    }
  } else {
    // Client-side: relative URL — proxy.ts middleware injects Authorization + X-Tenant-ID
    url = `/api${endpoint}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...(options?.headers as Record<string, string> | undefined)
    }
  });

  if (!res.ok) {
    // Client-side 401: proxy.ts should have refreshed transparently, but if it reaches
    // here both tokens are expired — redirect to login
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/auth/sign-in';
      throw new Error('Sesión expirada');
    }

    const message = await res
      .json()
      .then((body: { message?: string | string[] }) =>
        Array.isArray(body?.message) ? body.message.join(', ') : body?.message
      )
      .catch(() => undefined);

    throw new Error(message || `API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
