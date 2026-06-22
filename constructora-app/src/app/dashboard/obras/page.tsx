import PageContainer from '@/components/layout/page-container';
import ObraListingPage from '@/features/obras/components/obra-listing';
import { ProjectFormSheetTrigger } from '@/features/obras/components/project-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Obras',
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ObrasPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Obras'
      pageDescription='Seguimiento de todas tus obras en curso'
      pageHeaderAction={<ProjectFormSheetTrigger />}
    >
      <ObraListingPage />
    </PageContainer>
  );
}
