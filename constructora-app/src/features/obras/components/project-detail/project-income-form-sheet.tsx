'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as z from 'zod';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file-uploader';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import type { Attachment } from '@/features/attachments/api/types';
import { deleteAttachment, getAttachmentAccessUrl, uploadAttachment } from '@/features/attachments/api/service';
import { AttachmentList } from '@/features/attachments/components/attachment-list';
import {
  createProjectIncomeMutation,
  updateProjectIncomeMutation,
} from '../../api/mutations';
import type {
  PaymentMethod,
  ProjectIncome,
  ProjectIncomeStatus,
  ProjectIncomeMutationPayload,
} from '../../api/types';

const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'DEBIT_CARD', label: 'Tarjeta de débito' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'OTHER', label: 'Otro' },
];

const INCOME_STATUS_OPTIONS: Array<{ value: ProjectIncomeStatus; label: string }> = [
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const NONE_OPTION_VALUE = '__none__';

const incomeSchema = z.object({
  receivedAt: z.string().min(1, 'La fecha es requerida'),
  amount: z.number().positive('Ingresá un monto válido mayor a 0'),
  status: z.enum(['CONFIRMED', 'PENDING', 'CANCELLED']).optional().or(z.literal('')),
  budgetId: z.string().optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'CHECK', 'OTHER']).optional().or(z.literal('')),
  reference: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

function toIncomeFormValues(income?: ProjectIncome): IncomeFormValues {
  return {
    receivedAt: income?.receivedAt ? income.receivedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    amount: income?.amount ? Number(income.amount) : 0,
    status: income?.status ?? 'CONFIRMED',
    budgetId: income?.budgetId ?? NONE_OPTION_VALUE,
    description: income?.description ?? '',
    paymentMethod: income?.paymentMethod ?? '',
    reference: income?.reference ?? '',
    notes: income?.notes ?? '',
  };
}

interface ProjectIncomeFormSheetProps {
  projectId: string;
  income?: ProjectIncome;
  budgets?: Array<{ id: string; name: string; status: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectIncomeFormSheet({
  projectId,
  income,
  budgets = [],
  open,
  onOpenChange,
}: ProjectIncomeFormSheetProps) {
  const isEditing = !!income;
  const createMutation = useMutation(createProjectIncomeMutation);
  const updateMutation = useMutation(updateProjectIncomeMutation);
  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: (_, attachmentId) => {
      setExistingAttachments((current) =>
        current.filter((attachment) => attachment.id !== attachmentId),
      );
      toast.success('Adjunto eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el adjunto'),
  });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  const form = useAppForm({
    defaultValues: toIncomeFormValues(income),
    validators: { onSubmit: incomeSchema },
    onSubmit: async ({ value }) => {
      const resolvedBudgetId =
        value.budgetId === NONE_OPTION_VALUE || !value.budgetId ? null : value.budgetId;
      const payload: ProjectIncomeMutationPayload = {
        projectId,
        receivedAt: value.receivedAt,
        amount: value.amount,
        status: (value.status as ProjectIncomeStatus) || undefined,
        budgetId: resolvedBudgetId,
        description: value.description || undefined,
        paymentMethod: (value.paymentMethod as PaymentMethod) || null,
        reference: value.reference || undefined,
        notes: value.notes || undefined,
      };

      try {
        let savedIncome: ProjectIncome;

        if (isEditing && income) {
          savedIncome = await updateMutation.mutateAsync({ id: income.id, data: payload });
          if (attachmentFiles.length > 0) {
            await Promise.all(
              attachmentFiles.map((file) =>
                uploadAttachment(file, {
                  entityType: 'PROJECT_INCOME',
                  entityId: savedIncome.id,
                  kind: 'PAYMENT_PROOF',
                }),
              ),
            );
          }
          toast.success('Ingreso actualizado');
        } else {
          savedIncome = await createMutation.mutateAsync(payload);
          if (attachmentFiles.length > 0) {
            await Promise.all(
              attachmentFiles.map((file) =>
                uploadAttachment(file, {
                  entityType: 'PROJECT_INCOME',
                  entityId: savedIncome.id,
                  kind: 'PAYMENT_PROOF',
                }),
              ),
            );
          }
          toast.success('Ingreso registrado');
        }

        setAttachmentFiles([]);
        onOpenChange(false);
      } catch {
        toast.error(isEditing ? 'No se pudo actualizar el ingreso' : 'No se pudo registrar el ingreso');
      }
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(toIncomeFormValues(income));
    setAttachmentFiles([]);
    setExistingAttachments(income?.attachments ?? []);
  }, [form, income, open]);

  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<IncomeFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const budgetOptions = [
    { value: NONE_OPTION_VALUE, label: 'Sin presupuesto asociado' },
    ...budgets.map((b) => ({ value: b.id, label: `${b.name} (${b.status})` })),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar ingreso' : 'Nuevo ingreso'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Ajustá los datos del cobro real asociado a la obra.'
              : 'Registrá un cobro o ingreso real asociado a la obra.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='project-income-form' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='receivedAt' label='Fecha' required type='date' />
                <FormTextField
                  name='amount'
                  label='Monto ($)'
                  required
                  type='number'
                  placeholder='0.00'
                />
              </div>

              <FormSelectField
                name='status'
                label='Estado'
                options={INCOME_STATUS_OPTIONS}
                placeholder='Seleccioná estado'
              />

              {budgets.length > 0 && (
                <FormSelectField
                  name='budgetId'
                  label='Presupuesto asociado'
                  options={budgetOptions}
                  placeholder='Seleccioná presupuesto'
                />
              )}

              <FormTextField
                name='description'
                label='Concepto'
                placeholder='Anticipo, certificación, saldo final...'
              />

              <FormSelectField
                name='paymentMethod'
                label='Medio de cobro'
                options={PAYMENT_METHOD_OPTIONS}
                placeholder='Seleccioná un medio'
              />

              <FormTextField
                name='reference'
                label='Referencia'
                placeholder='REC-001 / transferencia / observación interna'
              />

              <FormTextareaField
                name='notes'
                label='Notas'
                placeholder='Observaciones del cobro...'
                rows={2}
              />

              <Field>
                <FieldLabel>Comprobantes de cobro</FieldLabel>
                <FileUploader
                  value={attachmentFiles}
                  onValueChange={setAttachmentFiles}
                  accept={{ 'image/*': [], 'application/pdf': [] }}
                  maxFiles={5}
                  maxSize={10 * 1024 * 1024}
                  multiple
                />
              </Field>

              {income ? (
                <Field>
                  <FieldLabel>Adjuntos actuales</FieldLabel>
                  <AttachmentList
                    attachments={existingAttachments}
                    emptyLabel='Este ingreso no tiene comprobantes todavia'
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
          <Button type='submit' form='project-income-form' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Registrar ingreso'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
