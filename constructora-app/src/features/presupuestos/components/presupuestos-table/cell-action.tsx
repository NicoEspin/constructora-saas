'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteBudgetMutation, updateBudgetStatusMutation } from '../../api/mutations';
import type { Budget, BudgetStatus } from '../../api/types';
import { BudgetFormSheet } from '../budget-form-sheet';
import { BUDGET_STATUS_LABELS } from '../../schemas/budget';

const STATUS_TRANSITIONS: Record<BudgetStatus, BudgetStatus[]> = {
  DRAFT: ['SENT', 'APPROVED', 'REJECTED', 'EXPIRED'],
  SENT: ['APPROVED', 'REJECTED', 'EXPIRED'],
  APPROVED: [],
  REJECTED: ['DRAFT'],
  EXPIRED: ['DRAFT'],
};

interface CellActionProps {
  data: Budget;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteBudgetMutation,
    onSuccess: () => {
      toast.success('Presupuesto eliminado');
      setDeleteOpen(false);
    },
    onError: () => toast.error('No se pudo eliminar el presupuesto'),
  });

  const statusMutation = useMutation({
    ...updateBudgetStatusMutation,
    onSuccess: () => toast.success('Estado actualizado'),
    onError: () => toast.error('No se pudo cambiar el estado'),
  });

  const allowedTransitions = STATUS_TRANSITIONS[data.status] ?? [];

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <BudgetFormSheet budgetId={data.id} open={editOpen} onOpenChange={setEditOpen} />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Abrir menú</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open(`/dashboard/presupuestos/${data.id}/imprimir`, '_blank')}
          >
            <Icons.fileTypePdf className='mr-2 h-4 w-4' />
            Exportar PDF
          </DropdownMenuItem>
          {allowedTransitions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
                Cambiar estado
              </DropdownMenuLabel>
              {allowedTransitions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => statusMutation.mutate({ id: data.id, status })}
                  disabled={statusMutation.isPending}
                >
                  {BUDGET_STATUS_LABELS[status]}
                </DropdownMenuItem>
              ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className='text-destructive focus:text-destructive'
          >
            <Icons.trash className='mr-2 h-4 w-4' />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
