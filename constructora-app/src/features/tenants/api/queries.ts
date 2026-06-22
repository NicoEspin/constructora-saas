import { queryOptions } from '@tanstack/react-query';
import { getCurrentTenant } from './service';

export const tenantKeys = {
  all: ['tenants'] as const,
  current: () => [...tenantKeys.all, 'current'] as const,
};

export const currentTenantQueryOptions = () =>
  queryOptions({
    queryKey: tenantKeys.current(),
    queryFn: getCurrentTenant,
  });
