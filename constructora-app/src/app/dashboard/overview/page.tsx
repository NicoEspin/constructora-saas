import PageContainer from '@/components/layout/page-container';
import DashboardView from '@/features/overview/components/dashboard-view';

export const metadata = {
  title: 'Dashboard',
};

export default function OverviewPage() {
  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Resumen general de tu constructora'>
      <DashboardView />
    </PageContainer>
  );
}
