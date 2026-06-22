import { getDocumentPdfSetting } from '@/features/document-pdf-settings/api/service';
import {
  BudgetPdfPrintPage,
} from '@/features/document-pdf-settings/components/budget-pdf-print-page';
import { buildBudgetPdfDocumentModel } from '@/features/document-pdf-settings/components/budget-pdf-document';
import { getBudget } from '@/features/presupuestos/api/service';
import { getCurrentTenant } from '@/features/tenants/api/service';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BudgetPrintPage({ params }: PageProps) {
  const { id } = await params;
  const [budget, tenant, setting] = await Promise.all([
    getBudget(id),
    getCurrentTenant(),
    getDocumentPdfSetting('BUDGET'),
  ]);
  const model = buildBudgetPdfDocumentModel({ budget, tenantName: tenant.name });

  return <BudgetPdfPrintPage model={model} initialSetting={setting} />;
}
