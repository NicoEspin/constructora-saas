import PageContainer from '@/components/layout/page-container';

export default function ProfileViewPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Perfil</h1>
          <p className='text-muted-foreground'>Configuración de tu cuenta</p>
        </div>
        <p className='text-muted-foreground text-sm'>Módulo en construcción.</p>
      </div>
    </PageContainer>
  );
}
