import type { MeasurementUnit } from '@/features/presupuestos/api/types';

export interface Material {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  unit: MeasurementUnit;
  estimatedUnitPrice: string | null;
  supplierId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialsResponse {
  items: Material[];
  page: number;
  take: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MaterialFilters {
  page?: number;
  take?: number;
  search?: string;
  supplierId?: string;
}
