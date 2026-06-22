import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { budgetsQueryOptions } from '../api/queries';
import { PresupuestosTable, PresupuestosTableSkeleton } from './presupuestos-table';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function BudgetListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('name');

  const filters = {
    page,
    take: pageLimit,
    ...(search ? { search } : {}),
  };

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(budgetsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary>
        <Suspense fallback={<PresupuestosTableSkeleton />}>
          <PresupuestosTable />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
