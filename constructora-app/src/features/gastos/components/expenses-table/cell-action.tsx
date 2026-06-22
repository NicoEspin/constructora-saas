'use client';

import { useState } from 'react';
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
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteExpenseMutation, updateExpenseStatusMutation } from '../../api/mutations';
import type { Expense } from '../../api/types';
import { ExpenseFormSheet } from '../expense-form-sheet';

interface CellActionProps {
  data: Expense;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteExpenseMutation,
    onSuccess: () => {
      toast.success('Gasto eliminado');
      setDeleteOpen(false);
    },
    onError: () => toast.error('No se pudo eliminar el gasto'),
  });

  const statusMutation = useMutation({
    ...updateExpenseStatusMutation,
    onSuccess: (expense) => toast.success(`Estado actualizado a ${expense.status}`),
    onError: () => toast.error('No se pudo actualizar el estado'),
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <ExpenseFormSheet expense={data} open={editOpen} onOpenChange={setEditOpen} />
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
          {data.status === 'PENDING' && (
            <DropdownMenuItem
              onClick={() => statusMutation.mutate({ id: data.id, status: 'PAID' })}
            >
              <Icons.check className='mr-2 h-4 w-4' />
              Marcar como pagado
            </DropdownMenuItem>
          )}
          {data.status !== 'CANCELLED' && (
            <DropdownMenuItem
              onClick={() => statusMutation.mutate({ id: data.id, status: 'CANCELLED' })}
              className='text-destructive focus:text-destructive'
            >
              <Icons.circleX className='mr-2 h-4 w-4' />
              Cancelar
            </DropdownMenuItem>
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
