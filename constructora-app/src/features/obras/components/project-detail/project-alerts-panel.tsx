'use client';

import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconCircleX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { ProjectAlert, ProjectWarning } from '../../api/types';

type AlertSeverity = 'danger' | 'warning' | 'info';

const CODE_SEVERITY: Record<string, AlertSeverity> = {
  PROJECT_WITHOUT_APPROVED_BUDGET: 'warning',
  EXPENSES_WITHOUT_BUDGET: 'warning',
  INCOMES_WITHOUT_BUDGET: 'warning',
  STAGES_MISSING_ESTIMATED_DATES: 'warning',
  OVERDUE_PENDING_EXPENSES: 'danger',
  ACCUMULATED_INCIDENT_DELAYS: 'warning',
  PROJECT_OVERDUE: 'danger',
  OVERDUE_STAGES: 'danger',
  NEGATIVE_REAL_GROSS_MARGIN: 'danger',
  EXPENSES_OVER_APPROVED_BUDGET: 'danger',
  PARTIAL_STAGE_WEIGHTS: 'info',
  STAGE_WEIGHTS_SUM_NOT_100: 'warning',
};

const CODE_TITLE: Record<string, string> = {
  PROJECT_WITHOUT_APPROVED_BUDGET: 'Sin presupuesto aprobado',
  EXPENSES_WITHOUT_BUDGET: 'Gastos sin presupuesto asociado',
  INCOMES_WITHOUT_BUDGET: 'Ingresos sin presupuesto asociado',
  STAGES_MISSING_ESTIMATED_DATES: 'Etapas sin fecha estimada',
  OVERDUE_PENDING_EXPENSES: 'Gastos vencidos pendientes',
  ACCUMULATED_INCIDENT_DELAYS: 'Contratiempos con impacto en cronograma',
  PROJECT_OVERDUE: 'Obra vencida',
  OVERDUE_STAGES: 'Etapas vencidas',
  NEGATIVE_REAL_GROSS_MARGIN: 'Margen bruto real negativo',
  EXPENSES_OVER_APPROVED_BUDGET: 'Gastos superan el presupuesto aprobado',
  PARTIAL_STAGE_WEIGHTS: 'Pesos de etapas incompletos',
  STAGE_WEIGHTS_SUM_NOT_100: 'Pesos de etapas no suman 100%',
};

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-yellow-400/40 bg-yellow-50/80 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  info: 'border-blue-300/40 bg-blue-50/80 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
};

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  const cls = 'h-4 w-4 shrink-0 mt-0.5';
  if (severity === 'danger') return <IconCircleX className={cls} />;
  if (severity === 'warning') return <IconAlertTriangle className={cls} />;
  return <IconInfoCircle className={cls} />;
}

interface AlertItemProps {
  code: string;
  message: string;
  severity: AlertSeverity;
}

function AlertItem({ code, message, severity }: AlertItemProps) {
  const title = CODE_TITLE[code] ?? code;
  return (
    <div className={cn('flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm', SEVERITY_STYLES[severity])}>
      <SeverityIcon severity={severity} />
      <div className='min-w-0'>
        <p className='font-medium leading-snug'>{title}</p>
        <p className='mt-0.5 opacity-80 leading-snug'>{message}</p>
      </div>
    </div>
  );
}

interface ProjectAlertsPanelProps {
  alerts?: ProjectAlert[];
  warnings?: ProjectWarning[];
}

export function ProjectAlertsPanel({ alerts = [], warnings = [] }: ProjectAlertsPanelProps) {
  const hasAlerts = alerts.length > 0 || warnings.length > 0;

  if (!hasAlerts) {
    return (
      <div className='flex items-center gap-2.5 rounded-md border border-green-300/40 bg-green-50/80 dark:bg-green-900/20 px-3 py-2.5 text-sm text-green-800 dark:text-green-300'>
        <IconCircleCheck className='h-4 w-4 shrink-0' />
        <p className='font-medium'>Todo en orden. No hay alertas operativas para esta obra.</p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {alerts.map((alert) => (
        <AlertItem
          key={alert.code}
          code={alert.code}
          message={alert.message}
          severity={CODE_SEVERITY[alert.code] ?? 'warning'}
        />
      ))}
      {warnings.map((warning) => (
        <AlertItem
          key={warning.code}
          code={warning.code}
          message={warning.message}
          severity='info'
        />
      ))}
    </div>
  );
}
