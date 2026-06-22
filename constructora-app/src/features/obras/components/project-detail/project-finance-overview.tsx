'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { getQueryClient } from '@/lib/query-client';
import { updateExpenseStatusMutation } from '@/features/gastos/api/mutations';
import { updateBudgetStatusMutation } from '@/features/presupuestos/api/mutations';
import type { ExpenseStatus } from '@/features/gastos/api/types';
import type { BudgetStatus } from '@/features/presupuestos/api/types';
import { updateProjectIncomeMutation } from '../../api/mutations';
import { projectKeys } from '../../api/queries';
import type { ProjectDetail, ProjectIncome, ProjectIncomeStatus } from '../../api/types';
import { formatCurrency, formatDate } from '../shared/format-helpers';
import {
  StatusSelect,
  EXPENSE_STATUS_SELECT_OPTIONS,
  INCOME_STATUS_SELECT_OPTIONS,
  BUDGET_STATUS_SELECT_OPTIONS,
} from '../shared/status-select';

interface ProjectFinanceOverviewProps {
  project: ProjectDetail;
  expenses: {
    items: Array<{
      id: string;
      description: string;
      amount: string;
      expenseDate: string;
      status: string;
      category: { name: string };
    }>;
  };
  onAddIncome: () => void;
  onEditIncome: (income: ProjectIncome) => void;
  onDeleteIncome: (income: ProjectIncome) => void;
  createExpenseHref: string;
  createBudgetHref: string;
}

export function ProjectFinanceOverview({
  project,
  expenses,
  onAddIncome,
  onEditIncome,
  onDeleteIncome,
  createExpenseHref,
  createBudgetHref,
}: ProjectFinanceOverviewProps) {
  const s = project.summary;

  // Track pending IDs per entity type for per-row loading state
  const [pendingExpenseId, setPendingExpenseId] = useState<string | null>(null);
  const [pendingIncomeId, setPendingIncomeId] = useState<string | null>(null);
  const [pendingBudgetId, setPendingBudgetId] = useState<string | null>(null);

  const updateExpenseStatus = useMutation(updateExpenseStatusMutation);
  const updateIncomeStatus = useMutation(updateProjectIncomeMutation);
  const updateBudgetStatus = useMutation(updateBudgetStatusMutation);

  function handleExpenseStatusChange(id: string, status: string) {
    setPendingExpenseId(id);
    updateExpenseStatus.mutate(
      { id, status: status as ExpenseStatus },
      {
        onSuccess: () => {
          // Refresh project summary (financial totals change when expense status changes)
          getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(project.id) });
        },
        onError: () => toast.error('No se pudo actualizar el estado del gasto'),
        onSettled: () => setPendingExpenseId(null),
      },
    );
  }

  function handleIncomeStatusChange(id: string, status: string) {
    setPendingIncomeId(id);
    updateIncomeStatus.mutate(
      { id, data: { status: status as ProjectIncomeStatus } },
      {
        onSuccess: (updatedIncome) => {
          // Instantly update income status in project detail cache
          getQueryClient().setQueryData<ProjectDetail>(
            projectKeys.detail(project.id),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                incomes: old.incomes.map((i) =>
                  i.id === updatedIncome.id ? updatedIncome : i,
                ),
              };
            },
          );
        },
        onError: () => toast.error('No se pudo actualizar el estado del ingreso'),
        onSettled: () => setPendingIncomeId(null),
      },
    );
  }

  function handleBudgetStatusChange(id: string, status: string) {
    setPendingBudgetId(id);
    updateBudgetStatus.mutate(
      { id, status: status as BudgetStatus },
      {
        onSuccess: (updatedBudget) => {
          // Instantly update budget status in project detail cache
          getQueryClient().setQueryData<ProjectDetail>(
            projectKeys.detail(project.id),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                budgets: old.budgets.map((b) =>
                  b.id === updatedBudget.id ? { ...b, status: updatedBudget.status } : b,
                ),
              };
            },
          );
        },
        onError: () => toast.error('No se pudo actualizar el estado del presupuesto'),
        onSettled: () => setPendingBudgetId(null),
      },
    );
  }

  return (
    <div className='space-y-4'>
      {/* Summary row */}
      <div className='grid gap-3 grid-cols-1 sm:grid-cols-3'>
        <div className='min-w-0 rounded-lg border p-3 space-y-0.5'>
          <p className='truncate text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Cobrado total
          </p>
          <p className='break-words text-lg font-semibold tabular-nums'>
            {formatCurrency(s.confirmedCollectedAmount ?? s.totalCollectedAmount)}
          </p>
          {s.pendingCollectedAmount && Number(s.pendingCollectedAmount) > 0 && (
            <p className='text-xs text-muted-foreground'>
              + {formatCurrency(s.pendingCollectedAmount)} pendiente
            </p>
          )}
        </div>
        <div className='min-w-0 rounded-lg border p-3 space-y-0.5'>
          <p className='truncate text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Gastos registrados
          </p>
          <p className='break-words text-lg font-semibold tabular-nums'>
            {formatCurrency(s.totalRecordedExpenseAmount)}
          </p>
          {s.overdueExpenseAmount && Number(s.overdueExpenseAmount) > 0 && (
            <p className='text-xs text-destructive'>
              {formatCurrency(s.overdueExpenseAmount)} vencidos
            </p>
          )}
        </div>
        <div className='min-w-0 rounded-lg border p-3 space-y-0.5'>
          <p className='truncate text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Margen bruto real
          </p>
          <p
            className={`break-words text-lg font-semibold tabular-nums ${
              Number(s.realGrossMarginAmount ?? s.realizedGrossMarginAmount) < 0
                ? 'text-destructive'
                : ''
            }`}
          >
            {formatCurrency(s.realGrossMarginAmount ?? s.realizedGrossMarginAmount)}
          </p>
          {s.budgetVsExpenseDeviationPercent != null && (
            <p className='text-xs text-muted-foreground'>
              Desvío: {s.budgetVsExpenseDeviationPercent > 0 ? '+' : ''}
              {s.budgetVsExpenseDeviationPercent.toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Presupuestos</CardTitle>
          <CardAction>
            <Button size='sm' variant='outline' asChild>
              <Link href={createBudgetHref}>
                <Icons.add className='h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Nuevo</span>
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {project.budgets.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {project.budgets.map((budget) => (
                <div
                  key={budget.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
                >
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='truncate font-medium text-sm'>{budget.name}</div>
                    {budget.profitAmount && (
                      <div className='text-xs text-muted-foreground'>
                        Margen: {formatCurrency(budget.profitAmount)}
                      </div>
                    )}
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <StatusSelect
                      value={budget.status}
                      options={BUDGET_STATUS_SELECT_OPTIONS}
                      onChange={(status) => handleBudgetStatusChange(budget.id, status)}
                      isPending={pendingBudgetId === budget.id}
                    />
                    <span className='text-sm font-medium tabular-nums'>
                      {formatCurrency(budget.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-lg border-dashed border py-6 text-center'>
              <p className='text-sm text-muted-foreground'>No hay presupuestos asociados.</p>
              <Button size='sm' variant='outline' className='mt-3' asChild>
                <Link href={createBudgetHref}>
                  <Icons.add className='mr-2 h-4 w-4' />
                  Crear presupuesto
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingresos */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Ingresos / cobros reales</CardTitle>
          <CardAction>
            <Button size='sm' variant='outline' onClick={onAddIncome}>
              <Icons.add className='h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Nuevo</span>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {project.incomes.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {project.incomes.map((income) => (
                <div
                  key={income.id}
                  className='flex min-w-0 items-start justify-between gap-3 rounded-lg border p-3'
                >
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='truncate font-medium'>
                      {income.description || 'Cobro sin descripción'}
                    </div>
                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <span>{formatDate(income.receivedAt)}</span>
                      {income.reference && <span>· Ref: {income.reference}</span>}
                      <StatusSelect
                        value={income.status ?? 'PENDING'}
                        options={INCOME_STATUS_SELECT_OPTIONS}
                        onChange={(status) => handleIncomeStatusChange(income.id, status)}
                        isPending={pendingIncomeId === income.id}
                      />
                    </div>
                    {income.notes && (
                      <div className='text-xs text-muted-foreground line-clamp-1'>
                        {income.notes}
                      </div>
                    )}
                    <div className='flex gap-1 pt-1'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-7 px-2'
                        onClick={() => onEditIncome(income)}
                      >
                        <Icons.edit className='h-3.5 w-3.5 sm:mr-1.5' />
                        <span className='hidden sm:inline text-xs'>Editar</span>
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-7 px-2 text-destructive hover:text-destructive'
                        onClick={() => onDeleteIncome(income)}
                      >
                        <Icons.trash className='h-3.5 w-3.5 sm:mr-1.5' />
                        <span className='hidden sm:inline text-xs'>Eliminar</span>
                      </Button>
                    </div>
                  </div>
                  <div className='shrink-0 text-right text-sm font-medium tabular-nums'>
                    {formatCurrency(income.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-lg border-dashed border py-6 text-center'>
              <p className='text-sm text-muted-foreground'>No hay ingresos registrados.</p>
              <Button size='sm' variant='outline' className='mt-3' onClick={onAddIncome}>
                <Icons.add className='mr-2 h-4 w-4' />
                Registrar ingreso
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Gastos asociados</CardTitle>
          <CardAction>
            <Button size='sm' variant='outline' asChild>
              <Link href={createExpenseHref}>
                <Icons.add className='h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Nuevo</span>
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {expenses.items.length > 0 ? (
            <div className='flex flex-col gap-2'>
              {expenses.items.map((expense) => (
                <div
                  key={expense.id}
                  className='flex min-w-0 items-start justify-between gap-3 rounded-lg border p-3'
                >
                  <div className='min-w-0 flex-1 space-y-1'>
                    <div className='truncate font-medium text-sm'>{expense.description}</div>
                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <span>{expense.category.name}</span>
                      <span>·</span>
                      <span>{formatDate(expense.expenseDate)}</span>
                      <StatusSelect
                        value={expense.status}
                        options={EXPENSE_STATUS_SELECT_OPTIONS}
                        onChange={(status) => handleExpenseStatusChange(expense.id, status)}
                        isPending={pendingExpenseId === expense.id}
                      />
                    </div>
                  </div>
                  <div className='shrink-0 text-right text-sm font-medium tabular-nums'>
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='rounded-lg border-dashed border py-6 text-center'>
              <p className='text-sm text-muted-foreground'>No hay gastos asociados.</p>
              <Button size='sm' variant='outline' className='mt-3' asChild>
                <Link href={createExpenseHref}>
                  <Icons.add className='mr-2 h-4 w-4' />
                  Registrar gasto
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
