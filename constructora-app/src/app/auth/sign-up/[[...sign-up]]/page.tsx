import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Registrá tu cuenta para acceder al sistema.'
};

export default function Page() {
  return <SignUpViewPage />;
}
