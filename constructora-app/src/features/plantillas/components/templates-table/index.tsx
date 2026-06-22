'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { templatesQueryOptions } from '../../api/queries';
import { columns } from './columns';
import { Icons } from '@/components/icons';

export function TemplatesTable() {
  const [params, _setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20),
    search: parseAsString,
  });

  const filters = {
    page: params.page,
    take: params.perPage,
    ...(params.search ? { search: params.search } : {}),
  };

  const { data } = useSuspenseQuery(templatesQueryOptions(filters));

  const pageCount = Math.ceil(data.total / params.perPage);

  const { table } = useDataTable({
    data: data.items ?? [],
    columns,
    pageCount,
    shallow: true,
    debounceMs: 400,
    initialState: {
      columnPinning: { right: ['actions'] },
    },
  });

  const emptyState = (
    <EmptyState
      icon={Icons.galleryVerticalEnd}
      title='No hay plantillas'
      description='Creá la primera plantilla con el botón "Nueva plantilla".'
    />
  );

  return (
    <DataTable table={table} emptyState={emptyState}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function TemplatesTableSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='bg-muted h-10 w-full animate-pulse rounded' />
      <div className='bg-muted h-64 w-full animate-pulse rounded-lg' />
      <div className='bg-muted h-10 w-48 animate-pulse rounded' />
    </div>
  );
}
