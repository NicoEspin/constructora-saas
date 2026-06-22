'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { createExpenseCategoryMutation, updateExpenseCategoryMutation } from '../../api/mutations';
import { categorySchema, type CategoryFormValues } from '../../schemas/expense';
import type { ExpenseCategory } from '../../api/types';

interface CategoryFormDialogProps {
  category?: ExpenseCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryFormDialog({ category, open, onOpenChange }: CategoryFormDialogProps) {
  const isEditing = !!category;

  const createMutation = useMutation({
    ...createExpenseCategoryMutation,
    onSuccess: () => {
      toast.success('Categoría creada');
      onOpenChange(false);
      form.reset();
    },
    onError: () => toast.error('No se pudo crear la categoría'),
  });

  const updateMutation = useMutation({
    ...updateExpenseCategoryMutation,
    onSuccess: () => {
      toast.success('Categoría actualizada');
      onOpenChange(false);
    },
    onError: () => toast.error('No se pudo actualizar la categoría'),
  });

  const form = useAppForm({
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    } as CategoryFormValues,
    validators: { onSubmit: categorySchema },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name,
        description: value.description || undefined,
      };
      if (isEditing && category) {
        await updateMutation.mutateAsync({ id: category.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    },
  });

  const { FormTextField, FormTextareaField } = useFormFields<CategoryFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modificá el nombre de la categoría.' : 'Creá una categoría de gasto.'}
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <form.Form id='category-form' className='space-y-3'>
            <FormTextField
              name='name'
              label='Nombre'
              required
              placeholder='Materiales de construcción'
              validators={{
                onBlur: z.string().min(1, 'El nombre es requerido').max(100),
              }}
            />
            <FormTextareaField
              name='description'
              label='Descripción'
              placeholder='Descripción opcional...'
              rows={2}
            />
          </form.Form>
        </form.AppForm>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='category-form' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
