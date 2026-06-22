import { apiClient } from '@/lib/api-client';
import type { Client, ClientFilters, ClientMutationPayload, ClientsResponse } from './types';

export async function getClients(filters: ClientFilters): Promise<ClientsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.take) params.set('take', String(filters.take));
  if (filters.search) params.set('search', filters.search);
  return apiClient<ClientsResponse>(`/clients?${params.toString()}`);
}

export async function getClient(id: string): Promise<Client> {
  return apiClient<Client>(`/clients/${id}`);
}

export async function createClient(data: ClientMutationPayload): Promise<Client> {
  return apiClient<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(id: string, data: ClientMutationPayload): Promise<Client> {
  return apiClient<Client>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: string): Promise<void> {
  await apiClient<void>(`/clients/${id}`, { method: 'DELETE' });
}
