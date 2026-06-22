'use client';

import { useEffect, useState } from 'react';
import { parseAsString, useQueryStates } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { FileUploader } from '@/components/file-uploader';
import { AttachmentList } from '@/features/attachments/components/attachment-list';
import {
  deleteAttachment,
  getAttachmentAccessUrl,
  uploadAttachment
} from '@/features/attachments/api/service';
import type { Attachment } from '@/features/attachments/api/types';
import { projectsQueryOptions } from '@/features/obras/api/queries';
import {
  createExpenseCategoryMutation,
  createExpenseMutation,
  updateExpenseMutation
} from '../api/mutations';
import { expenseCategoriesQueryOptions, expenseKeys } from '../api/queries';
import { expenseSchema, EXPENSE_STATUS_OPTIONS, type ExpenseFormValues } from '../schemas/expense';
import type { Expense, ExpenseMutationPayload } from '../api/types';

const UNASSIGNED_PROJECT_VALUE = '__unassigned_project__';

function getDefaultExpenseValues(expense?: Expense, initialProjectId?: string): ExpenseFormValues {
  const today = new Date().toISOString().slice(0, 10);

  return {
    categoryId: expense?.categoryId ?? '',
    description: expense?.description ?? '',
    amount: expense?.amount ? parseFloat(expense.amount) : 0,
    date: expense?.expenseDate ? expense.expenseDate.slice(0, 10) : today,
    status: expense?.status ?? 'PENDING',
    projectId: expense?.projectId ?? initialProjectId ?? '',
    supplierId: expense?.supplierId ?? '',
    notes: expense?.notes ?? ''
  };
}

// ---------------------------------------------------------------------------
// Mini dialog for quick inline category creation
// ---------------------------------------------------------------------------

interface CategoryCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (categoryId: string) => void;
}

function CategoryCreateDialog({ open, onOpenChange, onCreated }: CategoryCreateDialogProps) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const createMutation = useMutation(createExpenseCategoryMutation);

  function handleClose() {
    onOpenChange(false);
    setName('');
    setNameError('');
    createMutation.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('El nombre es requerido');
      return;
    }
    createMutation.mutate(
      { name: trimmed },
      {
        onSuccess: (newCategory) => {
          onCreated(newCategory.id);
          toast.success('Categoría creada');
          handleClose();
        },
        onError: () => toast.error('No se pudo crear la categoría')
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-xs'>
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-3 pt-1'>
          <div className='space-y-1.5'>
            <label htmlFor='inline-cat-name' className='text-sm font-medium'>
              Nombre <span className='text-destructive'>*</span>
            </label>
            <Input
              id='inline-cat-name'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder='Ej: Materiales, Mano de obra...'
              className={nameError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {nameError && <p className='text-xs text-destructive'>{nameError}</p>}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' isLoading={createMutation.isPending}>
              <Icons.check className='mr-2 h-4 w-4' />
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Expense form sheet
// ---------------------------------------------------------------------------

interface ExpenseFormSheetProps {
  expense?: Expense;
  initialProjectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseFormSheet({
  expense,
  initialProjectId,
  open,
  onOpenChange
}: ExpenseFormSheetProps) {
  const isEditing = !!expense;
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(
    expense?.attachments ?? []
  );
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery(expenseCategoriesQueryOptions());
  const { data: projectsData } = useQuery(projectsQueryOptions({ take: 100 }));
  const projectOptions = [
    { value: UNASSIGNED_PROJECT_VALUE, label: 'Sin obra asociada' },
    ...(projectsData?.items ?? []).map((project) => ({ value: project.id, label: project.name }))
  ];

  const createMutation = useMutation(createExpenseMutation);
  const updateMutation = useMutation(updateExpenseMutation);
  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: async (_, attachmentId) => {
      setExistingAttachments((current) =>
        current.filter((attachment) => attachment.id !== attachmentId)
      );
      await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      toast.success('Adjunto eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el adjunto')
  });

  const form = useAppForm({
    defaultValues: getDefaultExpenseValues(expense, initialProjectId),
    validators: { onSubmit: expenseSchema },
    onSubmit: async ({ value }) => {
      const normalizedProjectId =
        value.projectId === UNASSIGNED_PROJECT_VALUE ? null : value.projectId || null;

      const payload: ExpenseMutationPayload = {
        categoryId: value.categoryId,
        description: value.description,
        amount: value.amount,
        expenseDate: value.date,
        status: value.status,
        projectId: normalizedProjectId,
        supplierId: value.supplierId || undefined,
        notes: value.notes || undefined
      };

      try {
        let savedExpense: Expense;

        if (isEditing && expense) {
          savedExpense = await updateMutation.mutateAsync({ id: expense.id, data: payload });
          if (attachmentFiles.length > 0) {
            await Promise.all(
              attachmentFiles.map((file) =>
                uploadAttachment(file, {
                  entityType: 'EXPENSE',
                  entityId: savedExpense.id,
                  kind: 'RECEIPT'
                })
              )
            );
            await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
          }
          toast.success('Gasto actualizado');
          setAttachmentFiles([]);
          onOpenChange(false);
        } else {
          savedExpense = await createMutation.mutateAsync(payload);
          if (attachmentFiles.length > 0) {
            await Promise.all(
              attachmentFiles.map((file) =>
                uploadAttachment(file, {
                  entityType: 'EXPENSE',
                  entityId: savedExpense.id,
                  kind: 'RECEIPT'
                })
              )
            );
            await queryClient.invalidateQueries({ queryKey: expenseKeys.all });
          }
          toast.success('Gasto registrado');
          setAttachmentFiles([]);
          onOpenChange(false);
          form.reset(getDefaultExpenseValues(undefined, initialProjectId));
        }
      } catch {
        toast.error(isEditing ? 'No se pudo actualizar el gasto' : 'No se pudo registrar el gasto');
      }
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(getDefaultExpenseValues(expense, initialProjectId));
    setAttachmentFiles([]);
    setExistingAttachments(expense?.attachments ?? []);
  }, [expense, form, initialProjectId, open]);

  const { FormSelectField, FormTextField, FormTextareaField } = useFormFields<ExpenseFormValues>();

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className='flex w-full flex-col sm:max-w-md'>
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Modificá los datos del gasto.'
                : 'Registrá un nuevo gasto en el sistema.'}
            </SheetDescription>
          </SheetHeader>

          <div className='flex-1 overflow-auto'>
            <form.AppForm>
              <form.Form id='expense-form-sheet' className='space-y-4'>
                {/* Category field with inline create */}
                <form.AppField
                  name='categoryId'
                  validators={{ onBlur: z.string().min(1, 'La categoría es requerida') }}
                >
                  {(field) => (
                    <Field
                      data-invalid={
                        field.state.meta.isTouched && !field.state.meta.isValid ? true : undefined
                      }
                    >
                      <FieldLabel>
                        Categoría <span className='text-destructive'>*</span>
                      </FieldLabel>
                      <div className='flex gap-2'>
                        <Select
                          value={field.state.value}
                          onValueChange={(v) => field.handleChange(v)}
                          onOpenChange={(isOpen) => {
                            if (!isOpen) field.handleBlur();
                          }}
                        >
                          <SelectTrigger
                            aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                            className='flex-1'
                          >
                            <SelectValue placeholder='Seleccioná una categoría' />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                            {categories.length === 0 && (
                              <div className='px-3 py-2 text-center text-xs text-muted-foreground'>
                                Sin categorías. Usá + para crear una.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='h-9 w-9 shrink-0'
                          title='Añadir categoría'
                          onClick={() => setCategoryDialogOpen(true)}
                        >
                          <Icons.add className='h-4 w-4' />
                        </Button>
                      </div>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.AppField>

                <FormTextField
                  name='description'
                  label='Descripción'
                  required
                  placeholder='Compra de cemento'
                  validators={{
                    onBlur: z.string().min(1, 'La descripción es requerida').max(400)
                  }}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormTextField
                    name='amount'
                    label='Monto ($)'
                    required
                    type='number'
                    placeholder='0.00'
                    validators={{
                      onBlur: z.number().positive('Ingresá un monto válido mayor a 0')
                    }}
                  />
                  <FormTextField
                    name='date'
                    label='Fecha'
                    required
                    type='date'
                    placeholder='YYYY-MM-DD'
                  />
                </div>

                <FormSelectField
                  name='status'
                  label='Estado'
                  required
                  options={EXPENSE_STATUS_OPTIONS}
                  placeholder='Estado del pago'
                />

                <FormSelectField
                  name='projectId'
                  label='Obra'
                  options={projectOptions}
                  placeholder='Seleccioná una obra'
                />

                <FormTextareaField
                  name='notes'
                  label='Notas'
                  placeholder='Observaciones...'
                  rows={2}
                />

                <Field>
                  <FieldLabel>Comprobantes</FieldLabel>
                  <FileUploader
                    value={attachmentFiles}
                    onValueChange={setAttachmentFiles}
                    accept={{ 'image/*': [], 'application/pdf': [] }}
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024}
                    multiple
                  />
                  <FieldError errors={[]} />
                </Field>

                {expense ? (
                  <Field>
                    <FieldLabel>Adjuntos actuales</FieldLabel>
                    <AttachmentList
                      attachments={existingAttachments}
                      emptyLabel='Este gasto no tiene adjuntos todavia'
                      deletingId={deleteAttachmentMutation.variables ?? null}
                      onOpen={async (attachment, download) => {
                        const access = await getAttachmentAccessUrl(attachment.id, download);
                        window.open(access.url, '_blank', 'noopener,noreferrer');
                      }}
                      onDelete={async (attachment) => {
                        await deleteAttachmentMutation.mutateAsync(attachment.id);
                      }}
                    />
                  </Field>
                ) : null}
              </form.Form>
            </form.AppForm>
          </div>

          <SheetFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type='submit' form='expense-form-sheet' isLoading={isPending}>
              <Icons.check className='mr-2 h-4 w-4' />
              {isEditing ? 'Guardar cambios' : 'Registrar gasto'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CategoryCreateDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={(categoryId) => {
          form.setFieldValue('categoryId', categoryId);
        }}
      />
    </>
  );
}

export function ExpenseFormSheetTrigger() {
  const [params, setParams] = useQueryStates({
    create: parseAsString,
    projectId: parseAsString
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.create === '1') {
      setOpen(true);
    }
  }, [params.create]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && params.create === '1') {
      void setParams({ create: null });
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Nuevo gasto
      </Button>
      <ExpenseFormSheet
        open={open}
        onOpenChange={handleOpenChange}
        initialProjectId={params.projectId ?? undefined}
      />
    </>
  );
}
