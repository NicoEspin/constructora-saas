'use client';

import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ProjectTemplate } from '../../api/types';
import type { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<ProjectTemplate>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Nombre' />,
    cell: ({ row }) => (
      <div className='flex flex-col gap-0.5'>
        <Link
          href={`/dashboard/plantillas/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.original.name}
        </Link>
        {row.original.description && (
          <span className='text-muted-foreground text-xs truncate max-w-[280px]'>
            {row.original.description}
          </span>
        )}
      </div>
    ),
    meta: {
      label: 'Nombre',
      placeholder: 'Buscar plantillas...',
      variant: 'text' as const,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Creada',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {row.original.createdAt.slice(0, 10)}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
