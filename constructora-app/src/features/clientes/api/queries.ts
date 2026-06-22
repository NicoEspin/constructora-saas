import { queryOptions } from '@tanstack/react-query';
import { getClients } from './service';
import type { ClientFilters } from './types';

export const clientKeys = {
  all: ['clients'] as const,
  list: (filters: ClientFilters) => [...clientKeys.all, 'list', filters] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
};

export const clientsQueryOptions = (filters: ClientFilters) =>
  queryOptions({
    queryKey: clientKeys.list(filters),
    queryFn: () => getClients(filters),
  });
