'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { clientsQueryOptions } from '@/features/clientes/api/queries';
import { templatesQueryOptions } from '@/features/plantillas/api/queries';
import { createProjectMutation, updateProjectMutation } from '../api/mutations';
import {
  projectSchema,
  PROJECT_STATUS_OPTIONS,
  type ProjectFormValues,
} from '../schemas/project';
import type { Project, ProjectMutationPayload } from '../api/types';

const NONE_OPTION_VALUE = '__none__';

function toProjectFormValues(project?: Project): ProjectFormValues {
  return {
    name: project?.name ?? '',
    status: project?.status ?? 'PENDING',
    clientId: project?.clientId ?? NONE_OPTION_VALUE,
    projectTemplateId: project?.projectTemplateId ?? NONE_OPTION_VALUE,
    location: project?.location ?? '',
    startDate: project?.startDate ? project.startDate.slice(0, 10) : '',
    estimatedEndDate: project?.estimatedEndDate ? project.estimatedEndDate.slice(0, 10) : '',
    actualStartDate: project?.actualStartDate ? project.actualStartDate.slice(0, 10) : '',
    actualEndDate: project?.actualEndDate ? project.actualEndDate.slice(0, 10) : '',
    notes: project?.notes ?? '',
  };
}

interface ProjectFormSheetProps {
  project?: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectFormSheet({ project, open, onOpenChange }: ProjectFormSheetProps) {
  const isEditing = !!project;
  const { data: clientsData } = useQuery(clientsQueryOptions({ take: 100 }));
  const { data: templatesData } = useQuery(templatesQueryOptions({ take: 100 }));

  const createMutation = useMutation(createProjectMutation);
  const updateMutation = useMutation(updateProjectMutation);

  const form = useAppForm({
    defaultValues: toProjectFormValues(project),
    validators: { onSubmit: projectSchema },
    onSubmit: async ({ value }) => {
      const payload: ProjectMutationPayload = {
        name: value.name,
        status: value.status,
        clientId: value.clientId === NONE_OPTION_VALUE ? null : value.clientId || null,
        projectTemplateId:
          value.projectTemplateId === NONE_OPTION_VALUE ? null : value.projectTemplateId || null,
        location: value.location || undefined,
        startDate: value.startDate || undefined,
        estimatedEndDate: value.estimatedEndDate || undefined,
        actualStartDate: value.actualStartDate || null,
        actualEndDate: value.actualEndDate || null,
        notes: value.notes || undefined,
      };

      try {
        if (isEditing && project) {
          await updateMutation.mutateAsync({ id: project.id, data: payload });
          toast.success('Obra actualizada');
          onOpenChange(false);
        } else {
          await createMutation.mutateAsync(payload);
          toast.success('Obra creada');
          onOpenChange(false);
          form.reset();
        }
      } catch {
        toast.error(isEditing ? 'No se pudo actualizar la obra' : 'No se pudo crear la obra');
      }
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(toProjectFormValues(project));
  }, [form, open, project]);

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<ProjectFormValues>();

  const clientOptions = [
    { value: NONE_OPTION_VALUE, label: 'Sin cliente' },
    ...(clientsData?.items ?? []).map((client) => ({
      value: client.id,
      label: client.name,
    })),
  ];

  const templateOptions = [
    { value: NONE_OPTION_VALUE, label: 'Sin plantilla' },
    ...(templatesData?.items ?? []).map((template) => ({
      value: template.id,
      label: template.name,
    })),
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar obra' : 'Nueva obra'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modificá los datos de la obra.'
              : 'Completá los datos para registrar una nueva obra.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='project-form-sheet' className='space-y-4'>
              <FormTextField
                name='name'
                label='Nombre'
                required
                placeholder='Edificio Palermo III'
                validators={{
                  onBlur: z.string().min(1, 'El nombre es requerido').max(160),
                }}
              />

              <FormSelectField
                name='status'
                label='Estado'
                required
                options={PROJECT_STATUS_OPTIONS}
                placeholder='Seleccioná el estado'
              />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormSelectField
                  name='clientId'
                  label='Cliente'
                  options={clientOptions}
                  placeholder='Seleccioná un cliente'
                />

                <FormSelectField
                  name='projectTemplateId'
                  label='Plantilla'
                  options={templateOptions}
                  placeholder='Seleccioná una plantilla'
                />
              </div>

              <FormTextField
                name='location'
                label='Ubicación'
                placeholder='Av. Corrientes 1234, CABA'
              />

              <div className='grid grid-cols-2 gap-4'>
                <form.AppField name='startDate'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Fecha de inicio</FieldLabel>
                      <DatePicker
                        value={String(field.state.value ?? '')}
                        onChange={(v) => field.handleChange(v ?? '')}
                      />
                    </Field>
                  )}
                </form.AppField>
                <form.AppField name='estimatedEndDate'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Fin estimado</FieldLabel>
                      <DatePicker
                        value={String(field.state.value ?? '')}
                        onChange={(v) => field.handleChange(v ?? '')}
                      />
                    </Field>
                  )}
                </form.AppField>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <form.AppField name='actualStartDate'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Inicio real</FieldLabel>
                      <DatePicker
                        value={String(field.state.value ?? '')}
                        onChange={(v) => field.handleChange(v ?? '')}
                      />
                    </Field>
                  )}
                </form.AppField>
                <form.AppField name='actualEndDate'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Fin real</FieldLabel>
                      <DatePicker
                        value={String(field.state.value ?? '')}
                        onChange={(v) => field.handleChange(v ?? '')}
                      />
                    </Field>
                  )}
                </form.AppField>
              </div>

              <FormTextareaField
                name='notes'
                label='Notas'
                placeholder='Observaciones de la obra...'
                rows={3}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='project-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Crear obra'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function ProjectFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Nueva obra
      </Button>
      <ProjectFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
