'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Budget, BudgetStatus } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { BUDGET_STATUS_LABELS } from '../../schemas/budget';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_VARIANT: Record<BudgetStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  SENT: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'secondary',
};

export const columns: ColumnDef<Budget>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Nombre' />,
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        {row.original.client?.name && (
          <span className='text-muted-foreground text-xs'>{row.original.client.name}</span>
        )}
        <span className='sm:hidden mt-0.5'>
          <Badge variant={STATUS_VARIANT[row.original.status]} className='text-xs'>
            {BUDGET_STATUS_LABELS[row.original.status]}
          </Badge>
        </span>
      </div>
    ),
    meta: {
      label: 'Nombre',
      placeholder: 'Buscar presupuestos...',
      variant: 'text' as const,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ cell }) => {
      const status = cell.getValue<BudgetStatus>();
      return (
        <Badge variant={STATUS_VARIANT[status]}>
          {BUDGET_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
  },
  {
    id: 'project',
    header: 'Obra',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => (
      <span className='text-muted-foreground'>
        {row.original.project?.name ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ cell }) => {
      const val = cell.getValue<string | null>();
      if (!val) return <span className='text-muted-foreground'>—</span>;
      return (
        <span className='font-medium tabular-nums'>
          ${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      );
    },
  },
  {
    accessorKey: 'expiresAt',
    header: 'Válido hasta',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ cell }) => {
      const val = cell.getValue<string | null>();
      if (!val) return <span className='text-muted-foreground'>—</span>;
      return (
        <span className='text-sm'>
          {format(new Date(val), 'dd/MM/yyyy', { locale: es })}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
