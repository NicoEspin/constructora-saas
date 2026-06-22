const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export class BackendProxyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'BackendProxyError';
  }
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  tenantName: string;
  displayName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function parseErrorMessage(res: Response, fallbackMessage: string) {
  const data = await res.json().catch(() => ({}));

  if (typeof data?.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data?.message)) {
    return data.message.join(', ');
  }

  return fallbackMessage;
}

export async function loginToBackend(payload: LoginPayload): Promise<AuthTokens> {
  let res: Response;

  try {
    res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new BackendProxyError(`No se pudo conectar con el backend en ${BACKEND_URL}`, 502);
  }

  if (!res.ok) {
    const message = await parseErrorMessage(res, 'Credenciales inválidas');
    throw new BackendProxyError(message, res.status);
  }

  return res.json();
}

export async function registerToBackend(payload: RegisterPayload): Promise<{ id: string; email: string }> {
  let res: Response;

  try {
    res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new BackendProxyError(`No se pudo conectar con el backend en ${BACKEND_URL}`, 502);
  }

  if (!res.ok) {
    const message = await parseErrorMessage(res, 'Error al registrar el usuario');
    throw new BackendProxyError(message, res.status);
  }

  return res.json();
}

export async function refreshToBackend(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    throw new Error('Sesión expirada');
  }
  return res.json();
}

export async function logoutFromBackend(refreshToken: string): Promise<void> {
  await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}
