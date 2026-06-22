'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { InteractiveGridPattern } from './interactive-grid';

export default function SignUpViewPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!tenantName || !email || !password) {
      setError('Nombre de la constructora, email y contraseña son requeridos');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName,
          email,
          password,
          displayName: displayName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error al registrar');
        return;
      }
      router.push('/auth/sign-in?registered=1');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Left panel */}
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center gap-2 text-lg font-semibold'>
          <Icons.obras className='size-5' />
          Constructora
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12',
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;Gestioná todas tus obras, presupuestos y gastos desde un solo lugar.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right panel */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='w-full max-w-sm space-y-6'>
          <div className='space-y-2 text-center'>
            <h1 className='text-2xl font-bold tracking-tight'>Crear cuenta</h1>
            <p className='text-muted-foreground text-sm'>Completá los datos para registrarte</p>
          </div>

          {error && (
            <Alert variant='destructive'>
              <Icons.alertCircle className='size-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='tenantName'>Constructora</Label>
              <Input
                id='tenantName'
                type='text'
                placeholder='Constructora Espin'
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                disabled={loading}
                autoComplete='organization'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='displayName'>Nombre (opcional)</Label>
              <Input
                id='displayName'
                type='text'
                placeholder='Juan Pérez'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                autoComplete='name'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='tu@empresa.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete='email'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Contraseña</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Mín. 8 caracteres'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete='new-password'
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors'
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icons.eyeOff className='size-4' />
                </button>
              </div>
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading && <Icons.spinner className='mr-2 size-4 animate-spin' />}
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className='text-muted-foreground text-center text-sm'>
            ¿Ya tenés cuenta?{' '}
            <Link href='/auth/sign-in' className='hover:text-primary underline underline-offset-4'>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
