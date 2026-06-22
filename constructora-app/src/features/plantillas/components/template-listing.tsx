import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { templatesQueryOptions } from '../api/queries';
import { TemplatesTable, TemplatesTableSkeleton } from './templates-table';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function TemplateListingPage() {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');
  const search = searchParamsCache.get('name');

  const filters = {
    page,
    take: pageLimit,
    ...(search ? { search } : {}),
  };

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(templatesQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary>
        <Suspense fallback={<TemplatesTableSkeleton />}>
          <TemplatesTable />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}
