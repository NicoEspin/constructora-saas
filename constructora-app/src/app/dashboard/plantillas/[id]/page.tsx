import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { TemplateDetail, TemplateDetailSkeleton } from '@/features/plantillas/components/template-detail';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { getQueryClient } from '@/lib/query-client';
import { templateQueryOptions, templateStagesQueryOptions } from '@/features/plantillas/api/queries';

export const metadata = {
  title: 'Dashboard: Plantilla de obra',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlantillaDetailPage(props: PageProps) {
  const { id } = await props.params;

  if (!id) notFound();

  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(templateQueryOptions(id)),
    queryClient.prefetchQuery(templateStagesQueryOptions(id)),
  ]);

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary>
          <Suspense fallback={<TemplateDetailSkeleton />}>
            <TemplateDetail templateId={id} />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </PageContainer>
  );
}
