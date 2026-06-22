'use client';

import { useMemo } from 'react';
import type { DocumentPdfSetting } from '../api/types';
import { DocumentPdfPrintPage } from './document-pdf-print-page';
import { BudgetPdfDocument, type BudgetPdfDocumentModel } from './budget-pdf-document';

type BudgetPdfPrintPageProps = {
  model: BudgetPdfDocumentModel;
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

export function BudgetPdfPrintPage({ model, initialSetting }: BudgetPdfPrintPageProps) {
  const fileName = useMemo(() => `presupuesto-${toFileName(model.title)}.pdf`, [model.title]);

  return (
    <DocumentPdfPrintPage
      documentType='BUDGET'
      initialSetting={initialSetting}
      fileName={fileName}
      renderDocument={({ setting, logoUrl }) => (
        <BudgetPdfDocument model={model} setting={setting} logoUrl={logoUrl} previewMode='print' />
      )}
    />
  );
}
