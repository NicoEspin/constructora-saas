import { apiClient } from '@/lib/api-client';
import type { MaterialFilters, MaterialsResponse } from './types';

export async function getMaterials(filters: MaterialFilters): Promise<MaterialsResponse> {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.take) params.set('take', String(filters.take));
  if (filters.search) params.set('search', filters.search);
  if (filters.supplierId) params.set('supplierId', filters.supplierId);

  return apiClient<MaterialsResponse>(`/materials?${params.toString()}`);
}
