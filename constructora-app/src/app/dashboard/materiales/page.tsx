import PageContainer from '@/components/layout/page-container';

export default function MaterialesPage() {
  return (
    <PageContainer>
      <div className='space-y-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Materiales</h1>
          <p className='text-muted-foreground'>Base de materiales e insumos para presupuestos</p>
        </div>
        <p className='text-muted-foreground text-sm'>Módulo en construcción.</p>
      </div>
    </PageContainer>
  );
}
