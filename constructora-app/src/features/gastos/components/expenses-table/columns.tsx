'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Expense, ExpenseStatus } from '../../api/types';
import type { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { EXPENSE_STATUS_LABELS } from '../../schemas/expense';
import { cn } from '@/lib/utils';

function statusClassName(status: ExpenseStatus): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
  }
}

export function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return <Badge className={cn(statusClassName(status))}>{EXPENSE_STATUS_LABELS[status]}</Badge>;
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  return isNaN(num)
    ? amount
    : num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });
}

export const columns: ColumnDef<Expense>[] = [
  {
    id: 'description',
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Descripción' />,
    cell: ({ row }) => (
      <div className='flex flex-col gap-0.5'>
        <span className='font-medium'>{row.original.description}</span>
        <span className='text-muted-foreground text-xs'>{row.original.category.name}</span>
        {row.original.attachments.length > 0 ? (
          <span className='text-xs text-muted-foreground'>
            {row.original.attachments.length} adjunto
            {row.original.attachments.length === 1 ? '' : 's'}
          </span>
        ) : null}
        <div className='flex flex-wrap items-center gap-2 sm:hidden'>
          <ExpenseStatusBadge status={row.original.status} />
          <span className='text-muted-foreground text-xs font-medium tabular-nums'>
            {formatAmount(row.original.amount)}
          </span>
        </div>
      </div>
    ),
    meta: {
      label: 'Descripción',
      placeholder: 'Buscar gastos...',
      variant: 'text' as const
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => <ExpenseStatusBadge status={row.original.status} />
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => (
      <span className='font-medium tabular-nums'>{formatAmount(row.original.amount)}</span>
    )
  },
  {
    accessorKey: 'expenseDate',
    header: 'Fecha',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {row.original.expenseDate?.slice(0, 10) ?? '—'}
      </span>
    )
  },
  {
    id: 'project',
    header: 'Obra',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ row }) =>
      row.original.project ? (
        <span className='text-sm'>{row.original.project.name}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
