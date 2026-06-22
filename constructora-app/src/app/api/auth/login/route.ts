import { BackendProxyError, loginToBackend } from '@/lib/api/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ message: 'Email y contraseña requeridos' }, { status: 400 });
  }

  try {
    const tokens = await loginToBackend({ email, password });
    const cookieStore = await cookies();

    cookieStore.set('access_token', tokens.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 30, // 30 minutes
    });

    cookieStore.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const payload = decodeJwtPayload(tokens.accessToken);

    return NextResponse.json({
      email: payload?.email ?? email,
      activeTenantId: payload?.activeTenantId ?? null,
      roles: payload?.roles ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
    const status = err instanceof BackendProxyError ? err.status : 500;

    return NextResponse.json({ message }, { status });
  }
}
