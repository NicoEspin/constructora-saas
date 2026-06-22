import { logoutFromBackend } from '@/lib/api/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (refreshToken) {
    await logoutFromBackend(refreshToken);
  }

  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');

  return NextResponse.json({ ok: true });
}
