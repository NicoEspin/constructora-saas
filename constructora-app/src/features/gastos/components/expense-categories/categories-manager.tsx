'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteExpenseCategoryMutation } from '../../api/mutations';
import { expenseCategoriesQueryOptions } from '../../api/queries';
import type { ExpenseCategory } from '../../api/types';
import { CategoryFormDialog } from './category-form-dialog';

function CategoryRow({ category }: { category: ExpenseCategory }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteExpenseCategoryMutation,
    onSuccess: () => {
      toast.success('Categoría eliminada');
      setDeleteOpen(false);
    },
    onError: () => toast.error('No se puede eliminar — la categoría tiene gastos asociados'),
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(category.id)}
        loading={deleteMutation.isPending}
      />
      <CategoryFormDialog category={category} open={editOpen} onOpenChange={setEditOpen} />
      <div className='flex items-center justify-between py-2'>
        <div>
          <p className='text-sm font-medium'>{category.name}</p>
          {category.description && (
            <p className='text-muted-foreground text-xs'>{category.description}</p>
          )}
        </div>
        <div className='flex gap-1'>
          <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setEditOpen(true)}>
            <Icons.edit className='h-3.5 w-3.5' />
            <span className='sr-only'>Editar</span>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-destructive hover:text-destructive'
            onClick={() => setDeleteOpen(true)}
          >
            <Icons.trash className='h-3.5 w-3.5' />
            <span className='sr-only'>Eliminar</span>
          </Button>
        </div>
      </div>
    </>
  );
}

function CategoriesList() {
  const { data: categories } = useSuspenseQuery(expenseCategoriesQueryOptions());
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <CategoryFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <div className='flex items-center justify-between mb-4'>
        <p className='text-muted-foreground text-sm'>
          {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
        </p>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' />
          Nueva categoría
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className='text-muted-foreground text-sm text-center py-6'>
          No hay categorías. Creá la primera.
        </p>
      ) : (
        <div className='divide-y'>
          {categories.map((cat) => (
            <CategoryRow key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </>
  );
}

export function CategoriesManagerTrigger() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline' size='sm'>
          <Icons.settings className='mr-2 h-4 w-4' />
          Categorías
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full sm:max-w-sm'>
        <SheetHeader>
          <SheetTitle>Categorías de gasto</SheetTitle>
          <SheetDescription>Administrá las categorías para clasificar los gastos.</SheetDescription>
        </SheetHeader>
        <div className='mt-4'>
          <CategoriesList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
