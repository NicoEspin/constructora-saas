import PageContainer from '@/components/layout/page-container';
import TemplateListingPage from '@/features/plantillas/components/template-listing';
import { TemplateFormSheetTrigger } from '@/features/plantillas/components/template-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Plantillas de obra',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PlantillasPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Plantillas de obra'
      pageDescription='Definí plantillas con etapas para crear obras más rápido'
      pageHeaderAction={<TemplateFormSheetTrigger />}
    >
      <TemplateListingPage />
    </PageContainer>
  );
}
