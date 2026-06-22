import PageContainer from '@/components/layout/page-container';
import ClientListingPage from '@/features/clientes/components/client-listing';
import { ClientFormSheetTrigger } from '@/features/clientes/components/client-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Clientes',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ClientesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Clientes'
      pageDescription='Administrá los clientes de tu constructora'
      pageHeaderAction={<ClientFormSheetTrigger />}
    >
      <ClientListingPage />
    </PageContainer>
  );
}
