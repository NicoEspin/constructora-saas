import { queryOptions } from '@tanstack/react-query';
import { getMaterials } from './service';
import type { MaterialFilters } from './types';

export const materialKeys = {
  all: ['materials'] as const,
  list: (filters: MaterialFilters) => [...materialKeys.all, 'list', filters] as const,
};

export const materialsQueryOptions = (filters: MaterialFilters) =>
  queryOptions({
    queryKey: materialKeys.list(filters),
    queryFn: () => getMaterials(filters),
  });
