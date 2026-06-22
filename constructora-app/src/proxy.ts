import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const PROTECTED_PREFIX = '/dashboard';
const AUTH_PATHS = ['/auth/sign-in', '/auth/sign-up'];
const BFF_AUTH_PATHS = ['/api/auth/'];

function isProtected(pathname: string) {
  return pathname.startsWith(PROTECTED_PREFIX);
}

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function isBffRoute(pathname: string) {
  return BFF_AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function decodeJwtPayload(token: string): { activeTenantId?: string; exp?: number } | null {
  try {
    const part = token.split('.')[1];
    const decoded = Buffer.from(part, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp <= Math.floor(Date.now() / 1000);
}

async function attemptRefresh(
  refreshToken: string,
  req: NextRequest,
): Promise<NextResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const tokens: { accessToken: string; refreshToken: string } = await res.json();
    const newToken = tokens.accessToken;
    const payload = decodeJwtPayload(newToken);

    // Forward the current request with the new token injected
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('Authorization', `Bearer ${newToken}`);
    if (payload?.activeTenantId) {
      requestHeaders.set('X-Tenant-ID', payload.activeTenantId);
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    const cookieBase = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    response.cookies.set('access_token', newToken, {
      ...cookieBase,
      httpOnly: false,
      maxAge: 60 * 30,
    });
    response.cookies.set('refresh_token', tokens.refreshToken, {
      ...cookieBase,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('access_token')?.value ?? null;
  const refreshToken = req.cookies.get('refresh_token')?.value ?? null;

  // Protect dashboard routes
  if (isProtected(pathname)) {
    if (!token || isTokenExpired(token)) {
      if (refreshToken) {
        const refreshed = await attemptRefresh(refreshToken, req);
        if (refreshed) return refreshed;
      }
      const url = req.nextUrl.clone();
      url.pathname = '/auth/sign-in';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPath(pathname) && token && !isTokenExpired(token)) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard/overview';
    return NextResponse.redirect(url);
  }

  // Inject auth headers into API requests proxied to NestJS
  if (pathname.startsWith('/api/') && !isBffRoute(pathname) && token) {
    if (isTokenExpired(token)) {
      if (refreshToken) {
        const refreshed = await attemptRefresh(refreshToken, req);
        if (refreshed) return refreshed;
      }
      // Both tokens expired — let it through; backend returns 401, client redirects to login
      return NextResponse.next();
    }

    const payload = decodeJwtPayload(token);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('Authorization', `Bearer ${token}`);
    if (payload?.activeTenantId) {
      requestHeaders.set('X-Tenant-ID', payload.activeTenantId);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
