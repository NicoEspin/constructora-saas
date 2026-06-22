'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Project, ProjectStatus } from '../../api/types';
import type { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { PROJECT_STATUS_LABELS } from '../../schemas/project';
import { cn } from '@/lib/utils';

function statusClassName(status: ProjectStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-secondary text-secondary-foreground border-transparent';
  }
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={cn(statusClassName(status))}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}

export const columns: ColumnDef<Project>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Nombre' />,
    cell: ({ row }) => (
      <div className='flex flex-col gap-0.5'>
        <Link
          href={`/dashboard/obras/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.original.name}
        </Link>
        {row.original.client && (
          <span className='text-muted-foreground text-xs md:hidden'>
            {row.original.client.name}
          </span>
        )}
        <span className='sm:hidden'>
          <ProjectStatusBadge status={row.original.status} />
        </span>
      </div>
    ),
    meta: {
      label: 'Nombre',
      placeholder: 'Buscar obras...',
      variant: 'text' as const,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => <ProjectStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'progressPercent',
    header: 'Progreso',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ row }) => (
      <div className='flex items-center gap-2 min-w-[90px]'>
        <Progress value={row.original.progressPercent} className='h-1.5 w-16' />
        <span className='text-muted-foreground text-xs tabular-nums'>
          {row.original.progressPercent}%
        </span>
      </div>
    ),
  },
  {
    id: 'client',
    header: 'Cliente',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) =>
      row.original.client ? (
        <span>{row.original.client.name}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      ),
  },
  {
    accessorKey: 'location',
    header: 'Ubicación',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ row }) => (
      <span className='text-muted-foreground max-w-[180px] truncate block'>
        {row.original.location ?? '—'}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
