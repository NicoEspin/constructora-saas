'use client';

import { DocumentPdfSettingsSection } from '@/features/document-pdf-settings/components/document-pdf-settings-section';
import type { DocumentPdfSetting, DocumentPdfType } from '@/features/document-pdf-settings/api/types';
import {
  buildSampleProjectReportPdfDocumentModel,
  ProjectReportPdfDocument,
} from './project-report-pdf-document';

type ProjectReportPdfSettingsSectionProps = {
  initialSetting: DocumentPdfSetting;
  tenantName: string;
  documentType: Extract<DocumentPdfType, 'PROJECT_OPERATIONAL_REPORT' | 'PROJECT_EXECUTIVE_REPORT'>;
};

const COPY = {
  PROJECT_OPERATIONAL_REPORT: {
    title: 'PDF de reporte operativo',
    description:
      'Plantilla compartida para reportes de avance, etapas e incidentes de obra.',
    successMessage: 'Plantilla operativa actualizada',
    errorMessage: 'No se pudo guardar la plantilla operativa',
  },
  PROJECT_EXECUTIVE_REPORT: {
    title: 'PDF de reporte gerencial',
    description:
      'Plantilla compartida para snapshots financieros y lectura ejecutiva por obra.',
    successMessage: 'Plantilla gerencial actualizada',
    errorMessage: 'No se pudo guardar la plantilla gerencial',
  },
} as const;

export function ProjectReportPdfSettingsSection({
  initialSetting,
  tenantName,
  documentType,
}: ProjectReportPdfSettingsSectionProps) {
  const copy = COPY[documentType];

  return (
    <DocumentPdfSettingsSection
      initialSetting={initialSetting}
      tenantName={tenantName}
      documentType={documentType}
      title={copy.title}
      description={copy.description}
      logoLabel='Logo del reporte'
      logoDescription='Si no cargás uno, se usa el logo institucional del tenant.'
      successMessage={copy.successMessage}
      errorMessage={copy.errorMessage}
      renderPreview={({ tenantName: currentTenantName, setting, logoUrl }) => (
        <ProjectReportPdfDocument
          model={buildSampleProjectReportPdfDocumentModel({
            tenantName: currentTenantName,
            reportType: documentType,
          })}
          setting={setting}
          logoUrl={logoUrl}
        />
      )}
    />
  );
}
