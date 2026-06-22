import PageContainer from '@/components/layout/page-container';
import BudgetListingPage from '@/features/presupuestos/components/budget-listing';
import { BudgetFormSheetTrigger } from '@/features/presupuestos/components/budget-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Presupuestos',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function PresupuestosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Presupuestos'
      pageDescription='Administrá los presupuestos de tus obras'
      pageHeaderAction={<BudgetFormSheetTrigger />}
    >
      <BudgetListingPage />
    </PageContainer>
  );
}
