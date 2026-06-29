'use client';

import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as z from 'zod';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import {
  createProjectIncidentMutation,
  updateProjectIncidentMutation,
} from '../../api/mutations';
import { stagesQueryOptions } from '../../api/queries';
import type {
  ProjectIncident,
  ProjectIncidentCategory,
  ProjectIncidentMutationPayload,
} from '../../api/types';

const NONE_OPTION_VALUE = '__none__';
const NONE_CATEGORY_OPTION_VALUE = '__none_category__';

const CATEGORY_OPTIONS: Array<{ value: ProjectIncidentCategory; label: string }> = [
  { value: 'WEATHER', label: 'Clima / Lluvia' },
  { value: 'SUPPLIER', label: 'Proveedor' },
  { value: 'CLIENT', label: 'Cliente' },
  { value: 'PERMIT', label: 'Permiso / Habilitación' },
  { value: 'MATERIALS', label: 'Materiales' },
  { value: 'WORKFORCE', label: 'Mano de obra' },
  { value: 'TECHNICAL', label: 'Técnico / Diseño' },
  { value: 'SAFETY', label: 'Seguridad' },
  { value: 'OTHER', label: 'Otro' },
];

const incidentSchema = z.object({
  incidentDate: z.string().min(1, 'La fecha es requerida'),
  reason: z.string().min(1, 'El motivo es requerido').max(500),
  category: z
    .enum([
      'WEATHER',
      'SUPPLIER',
      'CLIENT',
      'PERMIT',
      'MATERIALS',
      'WORKFORCE',
      'TECHNICAL',
      'SAFETY',
      'OTHER',
    ])
    .optional()
    .or(z.literal(NONE_CATEGORY_OPTION_VALUE)),
  projectStageId: z.string().optional(),
  delayDays: z.number().int().min(0),
  delayHours: z.number().int().min(0).max(23),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

function toIncidentFormValues(incident?: ProjectIncident): IncidentFormValues {
  return {
    incidentDate: incident?.incidentDate ? incident.incidentDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    reason: incident?.reason ?? '',
    category: incident?.category ?? NONE_CATEGORY_OPTION_VALUE,
    projectStageId: incident?.projectStageId ?? NONE_OPTION_VALUE,
    delayDays: incident?.delayDays ?? 0,
    delayHours: incident?.delayHours ?? 0,
    notes: incident?.notes ?? '',
  };
}

interface ProjectIncidentFormSheetProps {
  projectId: string;
  incident?: ProjectIncident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectIncidentFormSheet({
  projectId,
  incident,
  open,
  onOpenChange,
}: ProjectIncidentFormSheetProps) {
  const isEditing = !!incident;
  const createMutation = useMutation(createProjectIncidentMutation);
  const updateMutation = useMutation(updateProjectIncidentMutation);

  const { data: stages = [] } = useQuery({
    ...stagesQueryOptions(projectId),
    enabled: open,
  });

  const form = useAppForm({
    defaultValues: toIncidentFormValues(incident),
    validators: { onSubmit: incidentSchema },
    onSubmit: async ({ value }) => {
      const resolvedStageId =
        value.projectStageId === NONE_OPTION_VALUE || !value.projectStageId
          ? null
          : value.projectStageId;
      const payload: ProjectIncidentMutationPayload = {
        projectId,
        incidentDate: value.incidentDate,
        reason: value.reason,
        category:
          value.category && value.category !== NONE_CATEGORY_OPTION_VALUE
            ? (value.category as ProjectIncidentCategory)
            : null,
        projectStageId: resolvedStageId,
        delayDays: value.delayDays,
        delayHours: value.delayHours,
        notes: value.notes || undefined,
      };

      try {
        if (isEditing && incident) {
          await updateMutation.mutateAsync({ id: incident.id, data: payload });
          toast.success('Contratiempo actualizado');
        } else {
          await createMutation.mutateAsync(payload);
          toast.success('Contratiempo registrado');
        }

        onOpenChange(false);
      } catch {
        toast.error(isEditing ? 'No se pudo actualizar el contratiempo' : 'No se pudo registrar el contratiempo');
      }
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(toIncidentFormValues(incident));
  }, [form, incident, open]);

  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<IncidentFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const sortedStages = stages.toSorted((a, b) => a.position - b.position);
  const stageOptions = [
    { value: NONE_OPTION_VALUE, label: 'Sin etapa' },
    ...sortedStages.map((s) => ({ value: s.id, label: `${s.position}. ${s.name}` })),
  ];

  const categoryOptions = [
    { value: NONE_CATEGORY_OPTION_VALUE, label: 'Sin categoría' },
    ...CATEGORY_OPTIONS,
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar contratiempo' : 'Nuevo contratiempo'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Actualizá fecha, motivo y retraso del contratiempo.'
              : 'Registrá un contratiempo con fecha, motivo y retraso acumulado.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='project-incident-form' className='space-y-4'>
              <FormTextField name='incidentDate' label='Fecha' required type='date' />

              <FormTextField
                name='reason'
                label='Motivo'
                required
                placeholder='Lluvia, falta de materiales, inspección pendiente...'
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormSelectField
                  name='category'
                  label='Categoría'
                  options={categoryOptions}
                  placeholder='Sin categoría'
                />

                <FormSelectField
                  name='projectStageId'
                  label='Etapa afectada'
                  options={stageOptions}
                  placeholder='Sin etapa'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormTextField name='delayDays' label='Retraso (días)' type='number' />
                <FormTextField name='delayHours' label='Retraso (horas)' type='number' />
              </div>

              <FormTextareaField
                name='notes'
                label='Notas'
                placeholder='Detalle operativo del contratiempo...'
                rows={3}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='project-incident-form' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Registrar contratiempo'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
