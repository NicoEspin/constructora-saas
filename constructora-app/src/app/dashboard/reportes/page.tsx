import PageContainer from '@/components/layout/page-container';
import { getProjects } from '@/features/obras/api/service';
import { ReportesDashboard } from '@/features/reportes/components/reportes-dashboard';

export const metadata = {
  title: 'Dashboard: Reportes',
};

export default async function ReportesPage() {
  const projectsResponse = await getProjects({ page: 1, take: 100 });

  return (
    <PageContainer
      pageTitle='Reportes'
      pageDescription='Generá reportes PDF operativos y gerenciales sobre una obra puntual'
    >
      <ReportesDashboard projects={projectsResponse.items} />
    </PageContainer>
  );
}
