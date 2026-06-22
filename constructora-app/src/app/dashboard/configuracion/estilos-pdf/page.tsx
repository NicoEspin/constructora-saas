import PageContainer from '@/components/layout/page-container';
import { BudgetPdfSettingsSection } from '@/features/document-pdf-settings/components/budget-pdf-settings-section';
import { getDocumentPdfSetting } from '@/features/document-pdf-settings/api/service';
import { ProjectReportPdfSettingsSection } from '@/features/reportes/components/project-report-pdf-settings-section';
import { getCurrentTenant } from '@/features/tenants/api/service';
import { TenantLogoSettingsCard } from '@/features/tenants/components/tenant-logo-settings-card';

export const metadata = {
  title: 'Dashboard: Estilos de PDF',
};

export default async function EstilosPdfPage() {
  const [tenant, budgetPdfSetting, operationalReportSetting, executiveReportSetting] = await Promise.all([
    getCurrentTenant(),
    getDocumentPdfSetting('BUDGET'),
    getDocumentPdfSetting('PROJECT_OPERATIONAL_REPORT'),
    getDocumentPdfSetting('PROJECT_EXECUTIVE_REPORT'),
  ]);

  return (
    <PageContainer
      pageTitle='Estilos de PDF'
      pageDescription='Personalizá color institucional, layout y logo para los documentos PDF del tenant'
    >
      <div className='flex flex-col gap-6'>
        <TenantLogoSettingsCard initialTenant={tenant} />
        <BudgetPdfSettingsSection initialSetting={budgetPdfSetting} tenantName={tenant.name} />
        <ProjectReportPdfSettingsSection
          initialSetting={operationalReportSetting}
          tenantName={tenant.name}
          documentType='PROJECT_OPERATIONAL_REPORT'
        />
        <ProjectReportPdfSettingsSection
          initialSetting={executiveReportSetting}
          tenantName={tenant.name}
          documentType='PROJECT_EXECUTIVE_REPORT'
        />
      </div>
    </PageContainer>
  );
}
