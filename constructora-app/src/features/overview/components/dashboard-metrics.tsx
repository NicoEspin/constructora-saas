'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { MetricCard } from './metric-card';
import { RecentBudgets, RecentClients } from './recent-activity';
import { clientsQueryOptions } from '@/features/clientes/api/queries';
import { budgetsQueryOptions } from '@/features/presupuestos/api/queries';
import {
  projectsQueryOptions,
  projectIncomeMonthlySummaryQueryOptions,
} from '@/features/obras/api/queries';
import {
  expensesQueryOptions,
  expenseMonthlySummaryQueryOptions,
} from '@/features/gastos/api/queries';
import { formatCurrency } from '@/features/obras/components/shared/format-helpers';
import { Icons } from '@/components/icons';

export function DashboardMetrics() {
  const { data: clientsData } = useSuspenseQuery(clientsQueryOptions({ page: 1, take: 5 }));
  const { data: budgetsData } = useSuspenseQuery(budgetsQueryOptions({ page: 1, take: 5 }));
  const { data: projectsData } = useSuspenseQuery(
    projectsQueryOptions({ status: 'ACTIVE', take: 1 }),
  );
  const { data: expensesData } = useSuspenseQuery(expensesQueryOptions({ take: 1 }));
  const { data: incomeSummary } = useSuspenseQuery(projectIncomeMonthlySummaryQueryOptions());
  const { data: expenseSummary } = useSuspenseQuery(expenseMonthlySummaryQueryOptions());

  const pendingBudgets = budgetsData.items.filter(
    (b) => b.status === 'DRAFT' || b.status === 'SENT',
  ).length;

  const approvedBudgets = budgetsData.items.filter((b) => b.status === 'APPROVED').length;

  return (
    <div className='space-y-6'>
      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          title='Obras activas'
          value={projectsData.total}
          description='En curso actualmente'
          icon={Icons.obras}
          href='/dashboard/obras'
        />
        <MetricCard
          title='Presupuestos'
          value={budgetsData.total}
          description={`${pendingBudgets} pendientes · ${approvedBudgets} aprobados`}
          icon={Icons.forms}
          href='/dashboard/presupuestos'
        />
        <MetricCard
          title='Gastos registrados'
          value={expensesData.total}
          description='Total en el sistema'
          icon={Icons.gastos}
          href='/dashboard/gastos'
        />
        <MetricCard
          title='Clientes'
          value={clientsData.total}
          description='Total registrados'
          icon={Icons.teams}
          href='/dashboard/clientes'
        />
      </div>

      <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2'>
        <MetricCard
          title='Ingresos del mes'
          value={formatCurrency(incomeSummary.currentMonthTotal)}
          description={
            incomeSummary.percentChange === null
              ? 'Sin ingresos confirmados el mes anterior'
              : `Mes anterior: ${formatCurrency(incomeSummary.previousMonthTotal)}`
          }
          icon={Icons.coins}
          trend={
            incomeSummary.percentChange === null
              ? undefined
              : { value: incomeSummary.percentChange, label: 'vs. mes anterior' }
          }
        />
        <MetricCard
          title='Gastos del mes'
          value={formatCurrency(expenseSummary.currentMonthTotal)}
          description={
            expenseSummary.percentChange === null
              ? 'Sin gastos registrados el mes anterior'
              : `Mes anterior: ${formatCurrency(expenseSummary.previousMonthTotal)}`
          }
          icon={Icons.gastos}
          href='/dashboard/gastos'
          trend={
            expenseSummary.percentChange === null
              ? undefined
              : { value: expenseSummary.percentChange, label: 'vs. mes anterior' }
          }
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <RecentBudgets budgets={budgetsData.items} />
        <RecentClients clients={clientsData.items} />
      </div>
    </div>
  );
}
