'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { IconClock, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { formatCurrency, formatDate, formatDelayHours } from '../shared/format-helpers';
import type { ProjectDetail } from '../../api/types';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  danger?: boolean;
  positive?: boolean;
}

function MetricCard({ label, value, sub, danger, positive }: MetricCardProps) {
  return (
    <div className='flex min-w-0 flex-col gap-0.5 rounded-lg border p-3'>
      <p className='text-muted-foreground truncate text-xs font-medium uppercase tracking-wide'>{label}</p>
      <p
        className={cn(
          'break-words text-lg font-semibold tabular-nums leading-tight',
          danger && 'text-destructive',
          positive && 'text-green-600 dark:text-green-400',
        )}
      >
        {value}
      </p>
      {sub && <p className='text-muted-foreground truncate text-xs mt-0.5'>{sub}</p>}
    </div>
  );
}

interface ProjectExecutiveSummaryProps {
  project: ProjectDetail;
}

export function ProjectExecutiveSummary({ project }: ProjectExecutiveSummaryProps) {
  const s = project.summary;
  const progress = s.progressPercent ?? project.progressPercent ?? 0;

  // Income
  const confirmed = s.confirmedCollectedAmount ?? s.totalCollectedAmount;
  const pending = s.pendingCollectedAmount ?? '0';
  const remaining = s.remainingToCollectAmount ?? null;

  // Expense
  const totalExpense = s.totalRecordedExpenseAmount;
  const paid = s.paidExpenseAmount ?? null;
  const overdueAmt = s.overdueExpenseAmount ?? '0';
  const isOverdue = Number(overdueAmt) > 0;

  // Budget
  const approved = s.approvedBudgetAmount ?? null;
  const budgetStatus = s.selectedBudgetStatus ?? null;

  // Margin
  const realMargin = s.realGrossMarginAmount ?? s.realizedGrossMarginAmount;
  const projectedMargin = s.projectedGrossMarginAmount ?? s.estimatedBudgetMarginAmount;
  const deviationPct = s.budgetVsExpenseDeviationPercent ?? null;
  const isNegativeMargin = Number(realMargin) < 0;
  const isPositiveMargin = Number(realMargin) > 0;

  // Timeline
  const totalDelayHours = s.totalDelayHours;
  const adjustedEnd = s.adjustedEstimatedEndDate ?? null;
  const incidentCount = s.incidentCount;

  // Stages
  const stagesCount = s.stagesCount ?? 0;
  const completedStages = s.completedStagesCount ?? 0;
  const inProgressStages = s.inProgressStagesCount ?? 0;

  return (
    <div className='space-y-5'>
      {/* Progress */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
            Avance general
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-3xl font-bold tabular-nums'>{progress}%</span>
            {stagesCount > 0 && (
              <span className='text-sm text-muted-foreground'>
                {completedStages}/{stagesCount} etapas completadas
              </span>
            )}
          </div>
          <Progress value={progress} className='h-3' />
          {stagesCount > 0 && (
            <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
              {completedStages > 0 && <span className='text-blue-600 dark:text-blue-400'>● {completedStages} completadas</span>}
              {inProgressStages > 0 && <span className='text-green-600 dark:text-green-400'>● {inProgressStages} en curso</span>}
              {(s.pendingStagesCount ?? 0) > 0 && <span>● {s.pendingStagesCount} pendientes</span>}
              {(s.blockedStagesCount ?? 0) > 0 && <span className='text-yellow-600 dark:text-yellow-400'>● {s.blockedStagesCount} pausadas</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finance grid */}
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {approved ? (
          <MetricCard label='Presupuesto aprobado' value={formatCurrency(approved)} sub={budgetStatus ? `Estado: ${budgetStatus}` : undefined} />
        ) : (
          <MetricCard label='Presupuesto aprobado' value='Sin presupuesto' />
        )}
        <MetricCard label='Cobrado confirmado' value={formatCurrency(confirmed)} sub={Number(pending) > 0 ? `+ ${formatCurrency(pending)} pendiente` : undefined} />
        <MetricCard label='Saldo pendiente' value={remaining ? formatCurrency(remaining) : '—'} />
        <MetricCard
          label='Margen real'
          value={formatCurrency(realMargin)}
          danger={isNegativeMargin}
          positive={isPositiveMargin}
        />
      </div>

      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard label='Gastos registrados' value={formatCurrency(totalExpense)} />
        {paid !== null && <MetricCard label='Gastos pagados' value={formatCurrency(paid)} />}
        <MetricCard
          label='Gastos vencidos'
          value={formatCurrency(overdueAmt)}
          danger={isOverdue}
        />
        {projectedMargin !== null && (
          <MetricCard label='Margen proyectado' value={formatCurrency(projectedMargin)} sub={deviationPct !== null ? `Desvío: ${deviationPct > 0 ? '+' : ''}${deviationPct.toFixed(1)}%` : undefined} />
        )}
      </div>

      {/* Timeline summary */}
      {(totalDelayHours > 0 || adjustedEnd) && (
        <Card>
          <CardContent className='pt-4'>
            <div className='flex flex-wrap items-center gap-4 text-sm'>
              {totalDelayHours > 0 && (
                <div className='flex items-center gap-2 text-yellow-700 dark:text-yellow-400'>
                  <IconClock className='h-4 w-4 shrink-0' />
                  <span>
                    <span className='font-medium'>{incidentCount} contratiempo{incidentCount !== 1 ? 's' : ''}</span>
                    {' · '}retraso acumulado: {formatDelayHours(totalDelayHours)}
                  </span>
                </div>
              )}
              {adjustedEnd && (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <IconTrendingDown className='h-4 w-4 shrink-0' />
                  <span>
                    Fin estimado ajustado: <span className='font-medium text-foreground'>{formatDate(adjustedEnd)}</span>
                    {project.estimatedEndDate && (
                      <span className='ml-1'>(orig. {formatDate(project.estimatedEndDate)})</span>
                    )}
                  </span>
                </div>
              )}
              {!totalDelayHours && project.estimatedEndDate && (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <IconTrendingUp className='h-4 w-4 shrink-0' />
                  <span>Fin estimado: <span className='font-medium text-foreground'>{formatDate(project.estimatedEndDate)}</span></span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
