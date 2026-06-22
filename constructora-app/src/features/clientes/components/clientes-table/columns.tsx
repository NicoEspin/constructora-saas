'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Client } from '../../api/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Client>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Nombre' />,
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.name}</span>
        {row.original.email && (
          <span className='text-muted-foreground text-xs'>{row.original.email}</span>
        )}
        {row.original.phone && (
          <span className='text-muted-foreground text-xs sm:hidden'>{row.original.phone}</span>
        )}
      </div>
    ),
    meta: {
      label: 'Nombre',
      placeholder: 'Buscar clientes...',
      variant: 'text' as const,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    meta: { className: 'hidden sm:table-cell' },
    cell: ({ cell }) =>
      cell.getValue<string | null>() ?? <span className='text-muted-foreground'>—</span>,
  },
  {
    accessorKey: 'taxId',
    header: 'CUIT/DNI',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ cell }) => {
      const val = cell.getValue<string | null>();
      return val ? (
        <Badge variant='outline'>{val}</Badge>
      ) : (
        <span className='text-muted-foreground'>—</span>
      );
    },
  },
  {
    accessorKey: 'address',
    header: 'Dirección',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ cell }) => (
      <span className='text-muted-foreground max-w-[200px] truncate block'>
        {cell.getValue<string | null>() ?? '—'}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
