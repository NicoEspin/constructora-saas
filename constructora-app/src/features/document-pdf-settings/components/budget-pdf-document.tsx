import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CSSProperties } from 'react';
import type { Budget } from '@/features/presupuestos/api/types';
import {
  BUDGET_ITEM_CATEGORY_LABELS,
  BUDGET_STATUS_LABELS,
  MEASUREMENT_UNIT_LABELS,
} from '@/features/presupuestos/schemas/budget';
import type { DocumentPdfSetting } from '../api/types';
import { DOCUMENT_PDF_LOGO_SIZE_CLASSES } from '../schemas/document-pdf-setting';

export type BudgetPdfDocumentModel = {
  title: string;
  tenantName: string;
  documentLabel: string;
  statusLabel: string;
  description: string | null;
  clientName: string;
  projectName: string;
  issuedAtLabel: string;
  expiresAtLabel: string;
  items: Array<{
    id: string;
    categoryLabel: string;
    name: string;
    description: string | null;
    quantityLabel: string;
    unitLabel: string;
    unitPriceLabel: string;
    subtotalLabel: string;
  }>;
  subtotalLabel: string;
  discountLabel: string;
  taxLabel: string;
  profitLabel: string;
  totalLabel: string;
  commercialTerms: string | null;
  paymentTerms: string | null;
  estimatedExecutionTime: string | null;
};

type BudgetPdfDocumentProps = {
  model: BudgetPdfDocumentModel;
  setting: DocumentPdfSetting;
  logoUrl?: string | null;
  previewMode?: 'screen' | 'print';
  className?: string;
};

function normalizeHexColor(color: string | null | undefined) {
  const fallback = '#1D4ED8';

  if (!color || !/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color)) {
    return fallback;
  }

  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  }

  return color.toUpperCase();
}

function formatMoney(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  return format(new Date(value), 'dd/MM/yyyy', { locale: es });
}

function documentSurfaceClass(previewMode: 'screen' | 'print') {
  return previewMode === 'screen'
    ? 'mx-auto w-full max-w-5xl rounded-[28px] border border-neutral-200 bg-white p-6 text-black shadow-sm'
    : 'mx-auto flex min-h-screen w-full max-w-5xl flex-col bg-white px-6 py-8 text-black print:max-w-none print:px-0 print:py-0';
}

function topBandStyle(setting: DocumentPdfSetting): CSSProperties {
  return { backgroundColor: normalizeHexColor(setting.primaryColor) };
}

function accentStyle(setting: DocumentPdfSetting): CSSProperties {
  return { borderColor: normalizeHexColor(setting.primaryColor) };
}

function accentBackgroundStyle(setting: DocumentPdfSetting, alpha = 0.08): CSSProperties {
  const color = normalizeHexColor(setting.primaryColor);
  return { backgroundColor: `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}` };
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border border-neutral-200 p-4'>
      <p className='text-xs uppercase tracking-[0.16em] text-neutral-500'>{label}</p>
      <p className='mt-2 text-sm font-medium text-neutral-900'>{value}</p>
    </div>
  );
}

function TotalsCard({ model, setting }: { model: BudgetPdfDocumentModel; setting: DocumentPdfSetting }) {
  return (
    <div className='rounded-2xl border-2 p-5' style={accentStyle(setting)}>
      <div className='flex items-center justify-between border-b border-neutral-200 pb-3'>
        <span className='text-sm text-neutral-600'>Subtotal</span>
        <span className='font-medium'>{model.subtotalLabel}</span>
      </div>
      <div className='mt-3 flex items-center justify-between text-sm text-neutral-600'>
        <span>Descuento</span>
        <span>{model.discountLabel}</span>
      </div>
      <div className='mt-2 flex items-center justify-between text-sm text-neutral-600'>
        <span>Impuestos</span>
        <span>{model.taxLabel}</span>
      </div>
      <div className='mt-2 flex items-center justify-between text-sm text-neutral-600'>
        <span>Utilidad</span>
        <span>{model.profitLabel}</span>
      </div>
      <div className='mt-4 flex items-center justify-between border-t border-neutral-900 pt-4 text-lg font-semibold'>
        <span>Total</span>
        <span>{model.totalLabel}</span>
      </div>
    </div>
  );
}

function TermsSection({ title, content }: { title: string; content: string | null }) {
  if (!content) {
    return null;
  }

  return (
    <div className='rounded-2xl border border-neutral-200 p-4'>
      <h3 className='font-medium'>{title}</h3>
      <p className='mt-2 text-sm leading-6 text-neutral-700'>{content}</p>
    </div>
  );
}

export function buildBudgetPdfDocumentModel({
  budget,
  tenantName,
}: {
  budget: Budget;
  tenantName: string;
}): BudgetPdfDocumentModel {
  return {
    title: budget.name,
    tenantName,
    documentLabel: 'Presupuesto',
    statusLabel: BUDGET_STATUS_LABELS[budget.status],
    description: budget.description ?? null,
    clientName: budget.client.name,
    projectName: budget.project?.name ?? 'Sin obra asociada',
    issuedAtLabel: formatDate(budget.issuedAt),
    expiresAtLabel: formatDate(budget.expiresAt),
    items: (budget.items ?? []).map((item) => ({
      id: item.id,
      categoryLabel: BUDGET_ITEM_CATEGORY_LABELS[item.category],
      name: item.name,
      description: item.description ?? null,
      quantityLabel: Number(item.quantity).toLocaleString('es-AR'),
      unitLabel: MEASUREMENT_UNIT_LABELS[item.unit],
      unitPriceLabel: formatMoney(item.unitPrice),
      subtotalLabel: formatMoney(item.subtotal),
    })),
    subtotalLabel: formatMoney(budget.subtotalAmount),
    discountLabel: formatMoney(budget.discountAmount),
    taxLabel: formatMoney(budget.taxAmount),
    profitLabel: formatMoney(budget.profitAmount),
    totalLabel: formatMoney(budget.totalAmount),
    commercialTerms: budget.commercialTerms ?? null,
    paymentTerms: budget.paymentTerms ?? null,
    estimatedExecutionTime: budget.estimatedExecutionTime ?? null,
  };
}

export function buildSampleBudgetPdfDocumentModel(tenantName: string): BudgetPdfDocumentModel {
  return {
    title: 'Presupuesto remodelación vivienda unifamiliar',
    tenantName,
    documentLabel: 'Presupuesto',
    statusLabel: 'Borrador',
    description:
      'Vista de ejemplo para validar jerarquía visual, color institucional y estructura del PDF.',
    clientName: 'Estudio Arce',
    projectName: 'Obra Barrio Norte',
    issuedAtLabel: formatDate(new Date().toISOString()),
    expiresAtLabel: formatDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString()),
    items: [
      {
        id: 'sample-1',
        categoryLabel: 'Material',
        name: 'Hormigón elaborado H21',
        description: 'Incluye bombeo y descarga en platea principal.',
        quantityLabel: '12',
        unitLabel: 'm3',
        unitPriceLabel: formatMoney(185000),
        subtotalLabel: formatMoney(2220000),
      },
      {
        id: 'sample-2',
        categoryLabel: 'Mano de obra',
        name: 'Cuadrilla de albañilería',
        description: 'Ejecución de muros, revoques y terminaciones base.',
        quantityLabel: '18',
        unitLabel: 'Día',
        unitPriceLabel: formatMoney(95000),
        subtotalLabel: formatMoney(1710000),
      },
      {
        id: 'sample-3',
        categoryLabel: 'Administración',
        name: 'Coordinación técnica y seguimiento',
        description: null,
        quantityLabel: '1',
        unitLabel: 'Unidad',
        unitPriceLabel: formatMoney(430000),
        subtotalLabel: formatMoney(430000),
      },
    ],
    subtotalLabel: formatMoney(4360000),
    discountLabel: formatMoney(0),
    taxLabel: formatMoney(392400),
    profitLabel: formatMoney(250000),
    totalLabel: formatMoney(5002400),
    commercialTerms: 'Incluye acopio inicial, dirección de obra y coordinación con proveedores.',
    paymentTerms: '40% anticipo, 40% avance intermedio, 20% contra entrega.',
    estimatedExecutionTime: '8 semanas corridas desde inicio de obra.',
  };
}

export function BudgetPdfDocument({
  model,
  setting,
  logoUrl = null,
  previewMode = 'screen',
  className = '',
}: BudgetPdfDocumentProps) {
  const rootClassName = `${documentSurfaceClass(previewMode)} ${className}`.trim();

  return (
    <article className={rootClassName}>
      {setting.layout === 'ACCENT' ? <div className='mb-6 h-3 rounded-full' style={topBandStyle(setting)} /> : null}

      <section className='flex flex-col gap-6 border-b border-neutral-200 pb-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <p className='text-sm uppercase tracking-[0.24em] text-neutral-500'>{model.documentLabel}</p>
              <span
                className='rounded-full px-3 py-1 text-xs font-medium text-white'
                style={topBandStyle(setting)}
              >
                {model.statusLabel}
              </span>
            </div>
            <div className='flex flex-col gap-1'>
              <h1 className='text-3xl font-semibold tracking-tight'>{model.title}</h1>
              <p className='text-sm text-neutral-600'>{model.tenantName}</p>
            </div>
          </div>

          <div className='flex flex-col items-start gap-3 md:items-end'>
            {logoUrl ? (
              <div className='rounded-2xl border border-neutral-200 bg-white px-4 py-3'>
                {/* oxlint-disable-next-line next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`Logo de ${model.tenantName}`}
                  className={`${DOCUMENT_PDF_LOGO_SIZE_CLASSES[setting.logoSize]} object-contain`}
                  crossOrigin='anonymous'
                />
              </div>
            ) : null}

            <div
              className='rounded-2xl border px-4 py-3 text-sm text-neutral-700'
              style={setting.layout === 'CLASSIC' ? undefined : accentStyle(setting)}
            >
              <p className='font-medium'>Plantilla {setting.layout.toLowerCase()}</p>
              <p className='mt-1 text-neutral-500'>Color {setting.primaryColor}</p>
            </div>
          </div>
        </div>

        <div className='grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4'>
          <InfoCard label='Cliente' value={model.clientName} />
          <InfoCard label='Obra' value={model.projectName} />
          <InfoCard label='Emitido' value={model.issuedAtLabel} />
          <InfoCard label='Vence' value={model.expiresAtLabel} />
        </div>
      </section>

      <section className='mt-8 flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-lg font-semibold'>Detalle</h2>
          {model.description ? <p className='text-sm text-neutral-600'>{model.description}</p> : null}
        </div>

        <div
          className='overflow-hidden rounded-2xl border border-neutral-200'
          style={setting.layout === 'ACCENT' ? accentBackgroundStyle(setting, 0.04) : undefined}
        >
          <table className='w-full border-collapse text-sm'>
            <thead className='bg-neutral-100 text-left'>
              <tr>
                <th className='px-4 py-3 font-medium'>Tipo</th>
                <th className='px-4 py-3 font-medium'>Item</th>
                <th className='px-4 py-3 font-medium'>Cantidad</th>
                <th className='px-4 py-3 font-medium'>Unidad</th>
                <th className='px-4 py-3 font-medium'>Precio unitario</th>
                <th className='px-4 py-3 text-right font-medium'>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {model.items.map((item) => (
                <tr key={item.id} className='border-t border-neutral-200 align-top'>
                  <td className='px-4 py-3'>{item.categoryLabel}</td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-col gap-1'>
                      <span className='font-medium'>{item.name}</span>
                      {item.description ? (
                        <span className='text-xs leading-5 text-neutral-600'>{item.description}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className='px-4 py-3'>{item.quantityLabel}</td>
                  <td className='px-4 py-3'>{item.unitLabel}</td>
                  <td className='px-4 py-3'>{item.unitPriceLabel}</td>
                  <td className='px-4 py-3 text-right font-medium'>{item.subtotalLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={`mt-8 grid gap-4 ${setting.layout === 'COMPACT' ? 'lg:grid-cols-[1.2fr_320px]' : 'md:grid-cols-[1fr_320px]'}`}
      >
        <div className='flex flex-col gap-4'>
          <TermsSection title='Condiciones comerciales' content={model.commercialTerms} />
          <TermsSection title='Condiciones de pago' content={model.paymentTerms} />
          <TermsSection title='Tiempo estimado de ejecución' content={model.estimatedExecutionTime} />
        </div>

        <TotalsCard model={model} setting={setting} />
      </section>
    </article>
  );
}
