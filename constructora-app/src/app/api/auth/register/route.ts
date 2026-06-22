import { BackendProxyError, registerToBackend } from '@/lib/api/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, displayName, tenantName } = body;

  if (!email || !password || !tenantName) {
    return NextResponse.json(
      { message: 'Nombre de la constructora, email y contraseña requeridos' },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { message: 'La contraseña debe tener al menos 8 caracteres' },
      { status: 400 },
    );
  }

  try {
    const user = await registerToBackend({ email, password, displayName, tenantName });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar';
    const status = err instanceof BackendProxyError ? err.status : 500;

    return NextResponse.json({ message }, { status });
  }
}
