import { getDocumentPdfSetting } from '@/features/document-pdf-settings/api/service';
import { getCurrentTenant } from '@/features/tenants/api/service';
import { getProjectExecutiveReport } from '@/features/reportes/api/service';
import {
  buildProjectReportPdfDocumentModel,
} from '@/features/reportes/components/project-report-pdf-document';
import { ProjectReportPdfPrintPage } from '@/features/reportes/components/project-report-pdf-print-page';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExecutiveProjectReportPrintPage({ params }: PageProps) {
  const { id } = await params;
  const [report, tenant, setting] = await Promise.all([
    getProjectExecutiveReport(id),
    getCurrentTenant(),
    getDocumentPdfSetting('PROJECT_EXECUTIVE_REPORT'),
  ]);

  return (
    <ProjectReportPdfPrintPage
      model={buildProjectReportPdfDocumentModel({ report, tenantName: tenant.name })}
      initialSetting={setting}
    />
  );
}
