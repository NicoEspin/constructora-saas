import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { clientsQueryOptions } from '../api/queries';
import { ClientesTable, ClientesTableSkeleton } from './clientes-table';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function ClientListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('name');

  const filters = {
    page,
    take: pageLimit,
    ...(search ? { search } : {}),
  };

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(clientsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary>
        <Suspense fallback={<ClientesTableSkeleton />}>
          <ClientesTable />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
