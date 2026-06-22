'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BUDGET_STATUS_LABELS } from '@/features/presupuestos/schemas/budget';
import type { Budget, BudgetStatus } from '@/features/presupuestos/api/types';
import type { Client } from '@/features/clientes/api/types';

const STATUS_VARIANT: Record<BudgetStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  SENT: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
  EXPIRED: 'secondary',
};

interface RecentBudgetsProps {
  budgets: Budget[];
}

export function RecentBudgets({ budgets }: RecentBudgetsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Presupuestos recientes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {budgets.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No hay presupuestos aún.</p>
        ) : (
          budgets.map((b) => (
            <div key={b.id} className='flex items-center justify-between gap-2'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{b.name}</p>
                {b.client?.name && (
                  <p className='text-muted-foreground truncate text-xs'>{b.client.name}</p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[b.status]} className='shrink-0'>
                {BUDGET_STATUS_LABELS[b.status]}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

interface RecentClientsProps {
  clients: Client[];
}

export function RecentClients({ clients }: RecentClientsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Clientes recientes</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {clients.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No hay clientes aún.</p>
        ) : (
          clients.map((c) => (
            <div key={c.id} className='flex items-center gap-3'>
              <div className='bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{c.name}</p>
                {c.email && (
                  <p className='text-muted-foreground truncate text-xs'>{c.email}</p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-5 w-40' />
      </CardHeader>
      <CardContent className='space-y-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex items-center justify-between gap-2'>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-20' />
            </div>
            <Skeleton className='h-5 w-16 rounded-full' />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
