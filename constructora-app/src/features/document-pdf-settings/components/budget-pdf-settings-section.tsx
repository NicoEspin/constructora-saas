'use client';

import type { DocumentPdfSetting } from '../api/types';
import { buildSampleBudgetPdfDocumentModel, BudgetPdfDocument } from './budget-pdf-document';
import { DocumentPdfSettingsSection } from './document-pdf-settings-section';

type BudgetPdfSettingsSectionProps = {
  initialSetting: DocumentPdfSetting;
  tenantName: string;
};

export function BudgetPdfSettingsSection({
  initialSetting,
  tenantName,
}: BudgetPdfSettingsSectionProps) {
  return (
    <DocumentPdfSettingsSection
      initialSetting={initialSetting}
      tenantName={tenantName}
      documentType='BUDGET'
      title='PDF de presupuestos'
      description='Configurá color institucional y layout base para todas las exportaciones del tenant.'
      logoLabel='Logo del presupuesto'
      logoDescription='Si cargás uno acá, reemplaza solo para presupuestos. Si no, cae al logo del tenant.'
      successMessage='Plantilla PDF actualizada'
      errorMessage='No se pudo guardar la configuración del PDF'
      renderPreview={({ tenantName: currentTenantName, setting, logoUrl }) => (
        <BudgetPdfDocument
          model={buildSampleBudgetPdfDocumentModel(currentTenantName)}
          setting={setting}
          logoUrl={logoUrl}
        />
      )}
    />
  );
}
