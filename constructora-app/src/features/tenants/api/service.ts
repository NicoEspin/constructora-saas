import { apiClient } from '@/lib/api-client';
import type { Tenant } from './types';

export async function getCurrentTenant(): Promise<Tenant> {
  return apiClient<Tenant>('/tenants/current');
}

export async function updateCurrentTenant(data: Partial<Pick<Tenant, 'name' | 'logoAttachmentId'>>): Promise<Tenant> {
  return apiClient<Tenant>('/tenants/current', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
