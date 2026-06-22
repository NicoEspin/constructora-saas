import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createClient, updateClient, deleteClient } from './service';
import { clientKeys } from './queries';
import type { Client, ClientMutationPayload, ClientsResponse } from './types';

export const createClientMutation = mutationOptions({
  mutationFn: (data: ClientMutationPayload) => createClient(data),
  onSuccess: (newClient: Client) => {
    getQueryClient().setQueriesData<ClientsResponse>(
      { queryKey: [...clientKeys.all, 'list'] },
      (old) => old ? { ...old, items: [newClient, ...old.items], total: old.total + 1 } : old,
    );
  },
});

export const updateClientMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: ClientMutationPayload }) =>
    updateClient(id, data),
  onSuccess: (updated: Client) => {
    getQueryClient().setQueriesData<ClientsResponse>(
      { queryKey: [...clientKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((c) => (c.id === updated.id ? updated : c)) }
          : old,
    );
  },
});

export const deleteClientMutation = mutationOptions({
  mutationFn: (id: string) => deleteClient(id),
  onSuccess: (_: void, id: string) => {
    getQueryClient().setQueriesData<ClientsResponse>(
      { queryKey: [...clientKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.filter((c) => c.id !== id), total: old.total - 1 }
          : old,
    );
  },
});
