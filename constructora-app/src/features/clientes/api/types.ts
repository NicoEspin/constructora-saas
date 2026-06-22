export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientsResponse {
  items: Client[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ClientFilters {
  page?: number;
  take?: number;
  search?: string;
}

export interface ClientMutationPayload {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}
