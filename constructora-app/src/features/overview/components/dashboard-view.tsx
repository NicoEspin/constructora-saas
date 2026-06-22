import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { clientsQueryOptions } from '@/features/clientes/api/queries';
import { budgetsQueryOptions } from '@/features/presupuestos/api/queries';
import { projectsQueryOptions, projectIncomeMonthlySummaryQueryOptions } from '@/features/obras/api/queries';
import { expensesQueryOptions, expenseMonthlySummaryQueryOptions } from '@/features/gastos/api/queries';
import { DashboardMetrics } from './dashboard-metrics';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default async function DashboardView() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(clientsQueryOptions({ page: 1, take: 5 })),
    queryClient.prefetchQuery(budgetsQueryOptions({ page: 1, take: 5 })),
    queryClient.prefetchQuery(projectsQueryOptions({ status: 'ACTIVE', take: 1 })),
    queryClient.prefetchQuery(expensesQueryOptions({ take: 1 })),
    queryClient.prefetchQuery(projectIncomeMonthlySummaryQueryOptions()),
    queryClient.prefetchQuery(expenseMonthlySummaryQueryOptions()),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardMetrics />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='bg-muted h-32 animate-pulse rounded-xl' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className='bg-muted h-32 animate-pulse rounded-xl' />
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='bg-muted h-64 animate-pulse rounded-xl' />
        <div className='bg-muted h-64 animate-pulse rounded-xl' />
      </div>
    </div>
  );
}
