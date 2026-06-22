import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { Icon } from '@/components/icons';

export const metadata = {
  title: 'Dashboard: Configuración',
};

type SettingsSection = {
  title: string;
  description: string;
  href: string;
  icon: Icon;
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Estilos de PDF',
    description: 'Color institucional, layout y logo para los documentos PDF del tenant.',
    href: '/dashboard/configuracion/estilos-pdf',
    icon: Icons.fileTypePdf,
  },
];

export default function ConfiguracionPage() {
  return (
    <PageContainer
      pageTitle='Configuración'
      pageDescription='Personalizá plantillas, categorías y salidas compartidas de tu tenant'
    >
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            aria-label={section.title}
            className='block transition-opacity hover:opacity-90'
          >
            <Card className='h-full'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <section.icon className='h-5 w-5 text-muted-foreground' />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                <CardDescription>{section.description}</CardDescription>
                <CardAction>
                  <Icons.chevronRight className='h-4 w-4 text-muted-foreground' />
                </CardAction>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
