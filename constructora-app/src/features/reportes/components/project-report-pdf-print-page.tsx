'use client';

import { useMemo } from 'react';
import { DocumentPdfPrintPage } from '@/features/document-pdf-settings/components/document-pdf-print-page';
import type { DocumentPdfSetting } from '@/features/document-pdf-settings/api/types';
import {
  ProjectReportPdfDocument,
  type ProjectReportPdfDocumentModel,
} from './project-report-pdf-document';

type ProjectReportPdfPrintPageProps = {
  model: ProjectReportPdfDocumentModel;
  initialSetting: DocumentPdfSetting;
};

function toFileName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function ProjectReportPdfPrintPage({
  model,
  initialSetting,
}: ProjectReportPdfPrintPageProps) {
  const fileName = useMemo(() => `reporte-${toFileName(model.projectName)}.pdf`, [model.projectName]);

  return (
    <DocumentPdfPrintPage
      documentType={model.reportType}
      initialSetting={initialSetting}
      fileName={fileName}
      renderDocument={({ setting, logoUrl }) => (
        <ProjectReportPdfDocument
          model={model}
          setting={setting}
          logoUrl={logoUrl}
          previewMode='print'
        />
      )}
    />
  );
}
