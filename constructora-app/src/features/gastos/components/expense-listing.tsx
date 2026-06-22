import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { expenseCategoriesQueryOptions, expensesQueryOptions } from '../api/queries';
import { ExpensesTable, ExpensesTableSkeleton } from './expenses-table';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function ExpenseListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('name');

  const filters = {
    page,
    take: pageLimit,
    ...(search ? { search } : {}),
  };

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(expensesQueryOptions(filters));
  await queryClient.prefetchQuery(expenseCategoriesQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary>
        <Suspense fallback={<ExpensesTableSkeleton />}>
          <ExpensesTable />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
