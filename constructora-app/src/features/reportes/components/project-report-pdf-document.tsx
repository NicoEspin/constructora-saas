import type { CSSProperties } from 'react';
import type {
  ProjectExecutiveReport,
  ProjectOperationalReport,
  ReportDocumentType,
} from '../api/types';
import type { DocumentPdfSetting } from '@/features/document-pdf-settings/api/types';
import { DOCUMENT_PDF_LOGO_SIZE_CLASSES } from '@/features/document-pdf-settings/schemas/document-pdf-setting';
import { formatCurrency, formatDate, formatDelayHours, formatPercent } from '@/features/obras/components/shared/format-helpers';

export type ProjectReportPdfDocumentModel = {
  reportType: ReportDocumentType;
  title: string;
  tenantName: string;
  projectName: string;
  statusLabel: string;
  clientName: string;
  managerName: string;
  location: string | null;
  generatedAtLabel: string;
  summaryCards: Array<{
    label: string;
    value: string;
    helper?: string | null;
  }>;
  highlights: string[];
  stageRows: Array<{
    id: string;
    name: string;
    statusLabel: string;
    progressLabel: string;
    dateRangeLabel: string;
  }>;
  incidentRows: Array<{
    id: string;
    title: string;
    dateLabel: string;
    impactLabel: string;
    note?: string | null;
  }>;
  budgetRows: Array<{
    id: string;
    name: string;
    statusLabel: string;
    totalLabel: string;
    helper?: string | null;
  }>;
  expenseRows: Array<{
    id: string;
    description: string;
    categoryLabel: string;
    amountLabel: string;
    statusLabel: string;
    helper?: string | null;
  }>;
  alerts: string[];
  warnings: string[];
};

type ProjectReportPdfDocumentProps = {
  model: ProjectReportPdfDocumentModel;
  setting: DocumentPdfSetting;
  logoUrl?: string | null;
  previewMode?: 'screen' | 'print';
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const PROJECT_STAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  PAUSED: 'Pausada',
};

const BUDGET_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  EXPIRED: 'Vencido',
};

const EXPENSE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
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

function InfoCard({ label, value, helper }: { label: string; value: string; helper?: string | null }) {
  return (
    <div className='rounded-2xl border border-neutral-200 p-4'>
      <p className='text-xs uppercase tracking-[0.16em] text-neutral-500'>{label}</p>
      <p className='mt-2 text-sm font-medium text-neutral-900'>{value}</p>
      {helper ? <p className='mt-1 text-xs text-neutral-500'>{helper}</p> : null}
    </div>
  );
}

function MessageList({
  title,
  items,
  setting,
}: {
  title: string;
  items: string[];
  setting: DocumentPdfSetting;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className='rounded-2xl border border-neutral-200 p-5'>
      <div className='mb-3 flex items-center gap-3'>
        <div className='h-2.5 w-2.5 rounded-full' style={topBandStyle(setting)} />
        <h3 className='text-base font-semibold'>{title}</h3>
      </div>
      <ul className='flex flex-col gap-2 text-sm text-neutral-700'>
        {items.map((item) => (
          <li key={item} className='rounded-xl border border-neutral-200 px-3 py-2'>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TableSection({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  if (!rows.length) {
    return null;
  }

  return (
    <section className='rounded-2xl border border-neutral-200'>
      <div className='border-b border-neutral-200 px-5 py-4'>
        <h3 className='text-base font-semibold'>{title}</h3>
      </div>
      <div className='overflow-hidden'>
        <table className='w-full border-collapse text-sm'>
          <thead className='bg-neutral-100 text-left'>
            <tr>
              {headers.map((header) => (
                <th key={header} className='px-4 py-3 font-medium'>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`} className='border-t border-neutral-200 align-top'>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${rowIndex}-${cellIndex}`} className='px-4 py-3 text-neutral-700'>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function buildProjectReportPdfDocumentModel({
  report,
  tenantName,
}: {
  report: ProjectOperationalReport | ProjectExecutiveReport;
  tenantName: string;
}): ProjectReportPdfDocumentModel {
  if (report.reportType === 'PROJECT_OPERATIONAL_REPORT') {
    return {
      reportType: report.reportType,
      title: report.title,
      tenantName,
      projectName: report.project.name,
      statusLabel: PROJECT_STATUS_LABELS[report.project.status] ?? report.project.status,
      clientName: report.project.clientName,
      managerName: report.project.managerName,
      location: report.project.location,
      generatedAtLabel: formatDate(report.generatedAt),
      summaryCards: [
        {
          label: 'Avance general',
          value: formatPercent(report.project.progressPercent, 0),
          helper: `${report.stageSummary.completedStagesCount}/${report.stageSummary.stagesCount} etapas completadas`,
        },
        {
          label: 'Fin estimado',
          value: formatDate(report.project.adjustedEstimatedEndDate ?? report.project.estimatedEndDate),
          helper: report.project.adjustedEstimatedEndDate
            ? `Original ${formatDate(report.project.estimatedEndDate)}`
            : null,
        },
        {
          label: 'Retraso acumulado',
          value: formatDelayHours(report.project.totalDelayHours),
          helper: `${report.incidents.length} contratiempos registrados`,
        },
        {
          label: 'Etapas en curso',
          value: String(report.stageSummary.inProgressStagesCount),
          helper: `${report.stageSummary.pendingStagesCount} pendientes · ${report.stageSummary.blockedStagesCount} pausadas`,
        },
      ],
      highlights: [
        `Responsable: ${report.project.managerName}`,
        `Cliente: ${report.project.clientName}`,
        `Ubicación: ${report.project.location ?? 'Sin ubicación cargada'}`,
      ],
      stageRows: report.stages.map((stage) => ({
        id: stage.id,
        name: `${stage.position}. ${stage.name}`,
        statusLabel: PROJECT_STAGE_STATUS_LABELS[stage.status] ?? stage.status,
        progressLabel: formatPercent(stage.progressPercent, 0),
        dateRangeLabel: `${formatDate(stage.estimatedStartDate)} -> ${formatDate(stage.estimatedEndDate)}`,
      })),
      incidentRows: report.incidents.map((incident) => ({
        id: incident.id,
        title: `${incident.category ?? 'OTRO'} · ${incident.reason}`,
        dateLabel: formatDate(incident.incidentDate),
        impactLabel: formatDelayHours(incident.delayDays * 24 + incident.delayHours),
        note: incident.notes,
      })),
      budgetRows: [],
      expenseRows: [],
      alerts: report.alerts.map((item) => item.message),
      warnings: report.warnings.map((item) => item.message),
    };
  }

  return {
    reportType: report.reportType,
    title: report.title,
    tenantName,
    projectName: report.project.name,
    statusLabel: PROJECT_STATUS_LABELS[report.project.status] ?? report.project.status,
    clientName: report.project.clientName,
    managerName: report.project.managerName,
    location: report.project.location,
    generatedAtLabel: formatDate(report.generatedAt),
    summaryCards: [
      {
        label: 'Cobrado confirmado',
        value: formatCurrency(report.financialSnapshot.confirmedCollectedAmount),
        helper:
          Number(report.financialSnapshot.pendingCollectedAmount) > 0
            ? `+ ${formatCurrency(report.financialSnapshot.pendingCollectedAmount)} pendiente`
            : null,
      },
      {
        label: 'Gastos registrados',
        value: formatCurrency(report.financialSnapshot.totalRecordedExpenseAmount),
        helper:
          Number(report.financialSnapshot.overdueExpenseAmount) > 0
            ? `${formatCurrency(report.financialSnapshot.overdueExpenseAmount)} vencidos`
            : null,
      },
      {
        label: 'Margen real',
        value: formatCurrency(report.financialSnapshot.realGrossMarginAmount),
        helper:
          report.financialSnapshot.projectedGrossMarginAmount != null
            ? `Proyectado ${formatCurrency(report.financialSnapshot.projectedGrossMarginAmount)}`
            : null,
      },
      {
        label: 'Saldo por cobrar',
        value: formatCurrency(report.financialSnapshot.remainingToCollectAmount),
        helper:
          report.financialSnapshot.budgetVsExpenseDeviationPercent != null
            ? `Desvío ${formatPercent(report.financialSnapshot.budgetVsExpenseDeviationPercent)}`
            : null,
      },
    ],
    highlights: [
      `Avance de obra: ${formatPercent(report.project.progressPercent, 0)}`,
      `Contratiempos acumulados: ${report.financialSnapshot.incidentCount}`,
      `Ubicación: ${report.project.location ?? 'Sin ubicación cargada'}`,
    ],
    stageRows: [],
    incidentRows: [],
    budgetRows: report.budgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
      statusLabel: BUDGET_STATUS_LABELS[budget.status] ?? budget.status,
      totalLabel: formatCurrency(budget.totalAmount),
      helper: `Margen ${formatCurrency(budget.profitAmount)}`,
    })),
    expenseRows: report.recentExpenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      categoryLabel: expense.categoryName,
      amountLabel: formatCurrency(expense.amount),
      statusLabel: EXPENSE_STATUS_LABELS[expense.status] ?? expense.status,
      helper: expense.supplierName
        ? `${expense.supplierName} · ${formatDate(expense.expenseDate)}`
        : formatDate(expense.expenseDate),
    })),
    alerts: report.alerts.map((item) => item.message),
    warnings: report.warnings.map((item) => item.message),
  };
}

export function buildSampleProjectReportPdfDocumentModel({
  tenantName,
  reportType,
}: {
  tenantName: string;
  reportType: ReportDocumentType;
}): ProjectReportPdfDocumentModel {
  if (reportType === 'PROJECT_OPERATIONAL_REPORT') {
    return {
      reportType,
      title: 'Reporte operativo · Obra Barrio Norte',
      tenantName,
      projectName: 'Obra Barrio Norte',
      statusLabel: 'Activa',
      clientName: 'Estudio Arce',
      managerName: 'Luciano Gómez',
      location: 'CABA',
      generatedAtLabel: formatDate(new Date().toISOString()),
      summaryCards: [
        { label: 'Avance general', value: '64%', helper: '7/11 etapas completadas' },
        { label: 'Fin estimado', value: '2026-07-18', helper: 'Original 2026-07-12' },
        { label: 'Retraso acumulado', value: '4 d 6 h', helper: '3 contratiempos registrados' },
        { label: 'Etapas en curso', value: '2', helper: '1 pendiente · 1 pausada' },
      ],
      highlights: [
        'Responsable: Luciano Gómez',
        'Cliente: Estudio Arce',
        'Ubicación: CABA',
      ],
      stageRows: [
        {
          id: 's1',
          name: '1. Movimiento de suelo',
          statusLabel: 'Completada',
          progressLabel: '100%',
          dateRangeLabel: '2026-05-01 -> 2026-05-08',
        },
        {
          id: 's2',
          name: '2. Estructura',
          statusLabel: 'En curso',
          progressLabel: '72%',
          dateRangeLabel: '2026-05-09 -> 2026-06-21',
        },
      ],
      incidentRows: [
        {
          id: 'i1',
          title: 'WEATHER · Lluvias intensas en platea',
          dateLabel: '2026-06-04',
          impactLabel: '2 d',
        },
      ],
      budgetRows: [],
      expenseRows: [],
      alerts: ['Hay una etapa vencida sin cierre operativo.'],
      warnings: ['La obra acumula retraso frente al plan original.'],
    };
  }

  return {
    reportType,
    title: 'Reporte ejecutivo · Obra Barrio Norte',
    tenantName,
    projectName: 'Obra Barrio Norte',
    statusLabel: 'Activa',
    clientName: 'Estudio Arce',
    managerName: 'Luciano Gómez',
    location: 'CABA',
    generatedAtLabel: formatDate(new Date().toISOString()),
    summaryCards: [
      { label: 'Cobrado confirmado', value: formatCurrency(12500000), helper: '+ ARS 1.250.000,00 pendiente' },
      { label: 'Gastos registrados', value: formatCurrency(9830000), helper: 'ARS 420.000,00 vencidos' },
      { label: 'Margen real', value: formatCurrency(2670000), helper: `Proyectado ${formatCurrency(3310000)}` },
      { label: 'Saldo por cobrar', value: formatCurrency(1740000), helper: 'Desvío 7.5%' },
    ],
    highlights: ['Avance de obra: 64%', 'Contratiempos acumulados: 3', 'Ubicación: CABA'],
    stageRows: [],
    incidentRows: [],
    budgetRows: [
      {
        id: 'b1',
        name: 'Presupuesto reestructurado mayo',
        statusLabel: 'Aprobado',
        totalLabel: formatCurrency(15850000),
        helper: `Margen ${formatCurrency(3250000)}`,
      },
    ],
    expenseRows: [
      {
        id: 'e1',
        description: 'Hormigón y bombeo',
        categoryLabel: 'Materiales',
        amountLabel: formatCurrency(1840000),
        statusLabel: 'Pagado',
        helper: 'Hormisur · 2026-06-02',
      },
    ],
    alerts: ['El margen real bajó por mayor costo de materiales.'],
    warnings: ['Hay gastos pendientes con vencimiento dentro de la semana.'],
  };
}

export function ProjectReportPdfDocument({
  model,
  setting,
  logoUrl = null,
  previewMode = 'screen',
}: ProjectReportPdfDocumentProps) {
  return (
    <article className={documentSurfaceClass(previewMode)}>
      {setting.layout === 'ACCENT' ? <div className='mb-6 h-3 rounded-full' style={topBandStyle(setting)} /> : null}

      <section className='flex flex-col gap-6 border-b border-neutral-200 pb-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-3'>
              <p className='text-sm uppercase tracking-[0.24em] text-neutral-500'>
                {model.reportType === 'PROJECT_OPERATIONAL_REPORT'
                  ? 'Estado operativo'
                  : 'Resumen ejecutivo'}
              </p>
              <span className='rounded-full px-3 py-1 text-xs font-medium text-white' style={topBandStyle(setting)}>
                {model.statusLabel}
              </span>
            </div>
            <div className='flex flex-col gap-1'>
              <h1 className='text-3xl font-semibold tracking-tight'>{model.projectName}</h1>
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

            <div className='rounded-2xl border px-4 py-3 text-sm text-neutral-700' style={accentStyle(setting)}>
              <p className='font-medium'>Emitido {model.generatedAtLabel}</p>
              <p className='mt-1 text-neutral-500'>Color {setting.primaryColor}</p>
            </div>
          </div>
        </div>

        <div className='grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4'>
          <InfoCard label='Cliente' value={model.clientName} />
          <InfoCard label='Responsable' value={model.managerName} />
          <InfoCard label='Ubicación' value={model.location ?? 'Sin ubicación cargada'} />
          <InfoCard label='Tipo de reporte' value={model.reportType === 'PROJECT_OPERATIONAL_REPORT' ? 'Operativo' : 'Gerencial'} />
        </div>
      </section>

      <section className='mt-8'>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {model.summaryCards.map((card) => (
            <InfoCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
          ))}
        </div>
      </section>

      <section className='mt-8 rounded-2xl border border-neutral-200 p-5'>
        <h2 className='text-base font-semibold'>Highlights</h2>
        <ul className='mt-3 flex flex-col gap-2 text-sm text-neutral-700'>
          {model.highlights.map((highlight) => (
            <li key={highlight} className='rounded-xl border border-neutral-200 px-3 py-2'>
              {highlight}
            </li>
          ))}
        </ul>
      </section>

      <div className='mt-8 flex flex-col gap-6'>
        <TableSection
          title='Etapas relevantes'
          headers={['Etapa', 'Estado', 'Avance', 'Ventana']}
          rows={model.stageRows.map((row) => [row.name, row.statusLabel, row.progressLabel, row.dateRangeLabel])}
        />

        <TableSection
          title='Contratiempos recientes'
          headers={['Incidente', 'Fecha', 'Impacto', 'Nota']}
          rows={model.incidentRows.map((row) => [row.title, row.dateLabel, row.impactLabel, row.note ?? '—'])}
        />

        <TableSection
          title='Presupuestos vinculados'
          headers={['Presupuesto', 'Estado', 'Monto total', 'Detalle']}
          rows={model.budgetRows.map((row) => [row.name, row.statusLabel, row.totalLabel, row.helper ?? '—'])}
        />

        <TableSection
          title='Gastos recientes'
          headers={['Concepto', 'Categoría', 'Monto', 'Estado', 'Detalle']}
          rows={model.expenseRows.map((row) => [row.description, row.categoryLabel, row.amountLabel, row.statusLabel, row.helper ?? '—'])}
        />

        <MessageList title='Alertas' items={model.alerts} setting={setting} />
        <MessageList title='Observaciones' items={model.warnings} setting={setting} />
      </div>
    </article>
  );
}
