import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Ingresá a tu cuenta para acceder al sistema.'
};

export default function Page() {
  return <SignInViewPage />;
}
