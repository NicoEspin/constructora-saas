import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { projectsQueryOptions } from '../api/queries';
import { ObrasTable, ObrasTableSkeleton } from './obras-table';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function ObraListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('name');

  const filters = {
    page,
    take: pageLimit,
    ...(search ? { search } : {}),
  };

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(projectsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary>
        <Suspense fallback={<ObrasTableSkeleton />}>
          <ObrasTable />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
