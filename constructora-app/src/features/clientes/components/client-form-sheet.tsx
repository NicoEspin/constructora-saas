'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { createClientMutation, updateClientMutation } from '../api/mutations';
import { clientSchema, type ClientFormValues } from '../schemas/client';
import type { Client, ClientMutationPayload } from '../api/types';

interface ClientFormSheetProps {
  client?: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientFormSheet({ client, open, onOpenChange }: ClientFormSheetProps) {
  const isEditing = !!client;

  const createMutation = useMutation(createClientMutation);
  const updateMutation = useMutation(updateClientMutation);

  const form = useAppForm({
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      address: client?.address ?? '',
      taxId: client?.taxId ?? '',
      notes: client?.notes ?? '',
    } as ClientFormValues,
    validators: { onSubmit: clientSchema },
    onSubmit: async ({ value }) => {
      const payload: ClientMutationPayload = {
        name: value.name,
        phone: value.phone || undefined,
        email: value.email || undefined,
        address: value.address || undefined,
        taxId: value.taxId || undefined,
        notes: value.notes || undefined,
      };

      try {
        if (isEditing && client) {
          await updateMutation.mutateAsync({ id: client.id, data: payload });
          toast.success('Cliente actualizado');
          onOpenChange(false);
        } else {
          await createMutation.mutateAsync(payload);
          toast.success('Cliente creado');
          onOpenChange(false);
          form.reset();
        }
      } catch {
        toast.error(isEditing ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente');
      }
    },
  });

  const { FormTextField, FormTextareaField } = useFormFields<ClientFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modificá los datos del cliente.'
              : 'Completá los datos para registrar un nuevo cliente.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='client-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Nombre'
                required
                placeholder='Empresa o persona'
                validators={{
                  onBlur: z.string().min(1, 'El nombre es requerido').max(120),
                }}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField
                  name='phone'
                  label='Teléfono'
                  type='tel'
                  placeholder='+54 11 1234-5678'
                />
                <FormTextField
                  name='taxId'
                  label='CUIT / DNI'
                  placeholder='30-12345678-9'
                />
              </div>

              <FormTextField
                name='email'
                label='Email'
                type='email'
                placeholder='contacto@empresa.com'
                validators={{
                  onBlur: z
                    .string()
                    .email('Email inválido')
                    .max(120)
                    .optional()
                    .or(z.literal('')),
                }}
              />

              <FormTextField
                name='address'
                label='Dirección'
                placeholder='Av. Corrientes 1234, CABA'
              />

              <FormTextareaField
                name='notes'
                label='Notas'
                placeholder='Información adicional...'
                rows={3}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='client-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ClientFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Nuevo cliente
      </Button>
      <ClientFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
