'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { createTemplateMutation, updateTemplateMutation } from '../api/mutations';
import { templateSchema, type TemplateFormValues } from '../schemas/template';
import type { ProjectTemplate, TemplateMutationPayload } from '../api/types';

interface TemplateFormSheetProps {
  template?: ProjectTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateFormSheet({ template, open, onOpenChange }: TemplateFormSheetProps) {
  const isEditing = !!template;
  const router = useRouter();

  const createMutation = useMutation(createTemplateMutation);
  const updateMutation = useMutation(updateTemplateMutation);

  const form = useAppForm({
    defaultValues: {
      name: template?.name ?? '',
      description: template?.description ?? '',
    } as TemplateFormValues,
    validators: { onSubmit: templateSchema },
    onSubmit: async ({ value }) => {
      const payload: TemplateMutationPayload = {
        name: value.name,
        description: value.description || undefined,
      };

      try {
        if (isEditing && template) {
          await updateMutation.mutateAsync({ id: template.id, data: payload });
          toast.success('Plantilla actualizada');
          onOpenChange(false);
        } else {
          const created = await createMutation.mutateAsync(payload);
          toast.success('Plantilla creada');
          onOpenChange(false);
          form.reset();
          router.push(`/dashboard/plantillas/${created.id}`);
        }
      } catch {
        toast.error(
          isEditing ? 'No se pudo actualizar la plantilla' : 'No se pudo crear la plantilla',
        );
      }
    },
  });

  const { FormTextField, FormTextareaField } = useFormFields<TemplateFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar plantilla' : 'Nueva plantilla'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modificá los datos de la plantilla.'
              : 'Las plantillas permiten crear obras con etapas predefinidas.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='template-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Nombre'
                required
                placeholder='Vivienda unifamiliar'
                validators={{
                  onBlur: z.string().min(1, 'El nombre es requerido').max(160),
                }}
              />
              <FormTextareaField
                name='description'
                label='Descripción'
                placeholder='Descripción de la plantilla...'
                rows={3}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='template-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Crear plantilla'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TemplateFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Nueva plantilla
      </Button>
      <TemplateFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
