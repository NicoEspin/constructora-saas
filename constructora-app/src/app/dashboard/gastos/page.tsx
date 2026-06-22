import PageContainer from '@/components/layout/page-container';
import ExpenseListingPage from '@/features/gastos/components/expense-listing';
import { ExpenseFormSheetTrigger } from '@/features/gastos/components/expense-form-sheet';
import { CategoriesManagerTrigger } from '@/features/gastos/components/expense-categories/categories-manager';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gastos',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function GastosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Gastos'
      pageDescription='Registrá y controlá los gastos de cada obra'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <CategoriesManagerTrigger />
          <ExpenseFormSheetTrigger />
        </div>
      }
    >
      <ExpenseListingPage />
    </PageContainer>
  );
}
