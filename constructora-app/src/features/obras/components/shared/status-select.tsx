'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { SelectContent, SelectItem } from '@/components/ui/select';

export interface StatusSelectOption {
  value: string;
  label: string;
  badgeClass: string;
}

interface StatusSelectProps {
  value: string;
  options: StatusSelectOption[];
  onChange: (value: string) => void;
  isPending?: boolean;
}

export function StatusSelect({ value, options, onChange, isPending = false }: StatusSelectProps) {
  const current = options.find((o) => o.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={isPending}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
          'cursor-pointer transition-opacity hover:opacity-75',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          current?.badgeClass ??
            'border-transparent bg-secondary text-secondary-foreground',
        )}
      >
        <SelectPrimitive.Value />
        {isPending ? (
          <Icons.spinner className='h-3 w-3 animate-spin' />
        ) : (
          <SelectPrimitive.Icon asChild>
            <Icons.chevronDown className='h-3 w-3 opacity-60' />
          </SelectPrimitive.Icon>
        )}
      </SelectPrimitive.Trigger>
      <SelectContent align='start'>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Status option presets
// ---------------------------------------------------------------------------

export const EXPENSE_STATUS_SELECT_OPTIONS: StatusSelectOption[] = [
  {
    value: 'PENDING',
    label: 'Pendiente',
    badgeClass:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  },
  {
    value: 'PAID',
    label: 'Pagado',
    badgeClass:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelado',
    badgeClass: 'border-transparent bg-secondary text-secondary-foreground',
  },
];

export const INCOME_STATUS_SELECT_OPTIONS: StatusSelectOption[] = [
  {
    value: 'PENDING',
    label: 'Pendiente',
    badgeClass:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  },
  {
    value: 'CONFIRMED',
    label: 'Confirmado',
    badgeClass:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelado',
    badgeClass: 'border-transparent bg-secondary text-secondary-foreground',
  },
];

export const BUDGET_STATUS_SELECT_OPTIONS: StatusSelectOption[] = [
  {
    value: 'DRAFT',
    label: 'Borrador',
    badgeClass: 'border-transparent bg-secondary text-secondary-foreground',
  },
  {
    value: 'SENT',
    label: 'Enviado',
    badgeClass:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  {
    value: 'APPROVED',
    label: 'Aprobado',
    badgeClass:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  {
    value: 'REJECTED',
    label: 'Rechazado',
    badgeClass:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
  {
    value: 'EXPIRED',
    label: 'Vencido',
    badgeClass:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  },
];

export const PROJECT_STATUS_SELECT_OPTIONS: StatusSelectOption[] = [
  {
    value: 'PENDING',
    label: 'Pendiente',
    badgeClass: 'border-transparent bg-secondary text-secondary-foreground',
  },
  {
    value: 'ACTIVE',
    label: 'En curso',
    badgeClass:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  {
    value: 'PAUSED',
    label: 'Pausada',
    badgeClass:
      'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  },
  {
    value: 'COMPLETED',
    label: 'Completada',
    badgeClass:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelada',
    badgeClass:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
];
