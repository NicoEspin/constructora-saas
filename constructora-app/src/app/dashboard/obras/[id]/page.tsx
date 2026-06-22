import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { ProjectDetail, ProjectDetailSkeleton } from '@/features/obras/components/project-detail';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { getQueryClient } from '@/lib/query-client';
import { projectQueryOptions, stagesQueryOptions } from '@/features/obras/api/queries';
import { expensesQueryOptions } from '@/features/gastos/api/queries';

export const metadata = {
  title: 'Dashboard: Detalle de obra',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ObraDetailPage(props: PageProps) {
  const { id } = await props.params;

  if (!id) notFound();

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(projectQueryOptions(id)),
    queryClient.prefetchQuery(stagesQueryOptions(id)),
    queryClient.prefetchQuery(expensesQueryOptions({ projectId: id, take: 100 })),
  ]);

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary>
          <Suspense fallback={<ProjectDetailSkeleton />}>
            <ProjectDetail projectId={id} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </PageContainer>
  );
}
