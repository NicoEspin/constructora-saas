'use client';

import { useEffect, useState } from 'react';
import { ConstructionItemCombobox } from '@/components/construction-item-combobox';
import { StageTasksEditor } from '@/components/stage-tasks-editor';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DatePicker } from '@/components/ui/date-picker';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { createStageMutation, updateStageMutation } from '../../api/mutations';
import {
  stageSchema,
  STAGE_STATUS_OPTIONS,
  type StageFormValues,
} from '../../schemas/project';
import { MEASUREMENT_UNIT_OPTIONS } from '@/features/presupuestos/schemas/budget';
import type { ProjectStage, StageMutationPayload } from '../../api/types';

function toStageFormValues(stage?: ProjectStage): StageFormValues {
  return {
    name: stage?.name ?? '',
    description: stage?.description ?? '',
    budgetQuantity: stage?.budgetQuantity ? Number(stage.budgetQuantity) : 1,
    budgetUnit: stage?.budgetUnit ?? 'M2',
    status: stage?.status ?? 'PENDING',
    weightPercent: stage?.weightPercent ?? undefined,
    estimatedStartDate: stage?.estimatedStartDate ? stage.estimatedStartDate.slice(0, 10) : '',
    estimatedEndDate: stage?.estimatedEndDate ? stage.estimatedEndDate.slice(0, 10) : '',
    actualStartDate: stage?.actualStartDate ? stage.actualStartDate.slice(0, 10) : '',
    actualEndDate: stage?.actualEndDate ? stage.actualEndDate.slice(0, 10) : '',
    notes: stage?.notes ?? '',
    tasks: stage?.tasks.map((task) => ({ title: task.title, completed: task.completed })) ?? [],
  };
}

interface StageFormSheetProps {
  projectId: string;
  stage?: ProjectStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageFormSheet({ projectId, stage, open, onOpenChange }: StageFormSheetProps) {
  const isEditing = !!stage;

  const createMutation = useMutation(createStageMutation);
  const updateMutation = useMutation(updateStageMutation);

  const form = useAppForm({
    defaultValues: toStageFormValues(stage),
    validators: { onSubmit: stageSchema },
    onSubmit: async ({ value }) => {
      const payload: StageMutationPayload = {
        name: value.name,
        description: value.description || undefined,
        budgetQuantity: value.budgetQuantity,
        budgetUnit: value.budgetUnit,
        status: value.status,
        weightPercent: value.weightPercent,
        estimatedStartDate: value.estimatedStartDate || undefined,
        estimatedEndDate: value.estimatedEndDate || undefined,
        actualStartDate: value.actualStartDate || null,
        actualEndDate: value.actualEndDate || null,
        notes: value.notes || undefined,
        tasks: value.tasks,
      };

      try {
        if (isEditing && stage) {
          await updateMutation.mutateAsync({ projectId, stageId: stage.id, data: payload });
          toast.success('Etapa actualizada');
          onOpenChange(false);
        } else {
          await createMutation.mutateAsync({ projectId, data: payload });
          toast.success('Etapa creada');
          onOpenChange(false);
          form.reset();
        }
      } catch {
        toast.error(isEditing ? 'No se pudo actualizar la etapa' : 'No se pudo crear la etapa');
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(toStageFormValues(stage));
  }, [form, open, stage]);

  const { FormSelectField, FormSliderField, FormTextareaField } = useFormFields<StageFormValues>();

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar etapa' : 'Nueva etapa'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modificá los datos de la etapa.'
              : 'Completá los datos para registrar una nueva etapa.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='stage-form-sheet' className='space-y-4'>
              <form.AppField
                name='name'
                validators={{ onBlur: z.string().min(1, 'El nombre es requerido').max(160) }}
              >
                {(nameField) => (
                  <form.AppField name='description'>
                    {(descriptionField) => (
                      <>
                        <Field data-invalid={nameField.state.meta.isTouched && !nameField.state.meta.isValid}>
                          <FieldLabel>Nombre *</FieldLabel>
                          <ConstructionItemCombobox
                            value={String(nameField.state.value)}
                            onChange={(v) => nameField.handleChange(v)}
                            onBlur={nameField.handleBlur}
                            onSelect={(item) => {
                              nameField.handleChange(item.name);
                              descriptionField.handleChange(item.description);
                              form.setFieldValue(
                                'tasks',
                                item.defaultTasks.map((title) => ({ title, completed: false })),
                              );
                            }}
                            aria-invalid={nameField.state.meta.isTouched && !nameField.state.meta.isValid}
                            placeholder='Buscá o escribí la etapa...'
                          />
                          <FieldError errors={nameField.state.meta.errors} />
                        </Field>

                        <Field>
                          <FieldLabel>Descripción</FieldLabel>
                          <Textarea
                            rows={2}
                            value={String(descriptionField.state.value ?? '')}
                            onChange={(e) => descriptionField.handleChange(e.target.value)}
                            onBlur={descriptionField.handleBlur}
                            placeholder='Se completa automáticamente al seleccionar del listado'
                          />
                        </Field>
                      </>
                    )}
                  </form.AppField>
                )}
              </form.AppField>

              <FormSelectField
                name='status'
                label='Estado'
                required
                options={STAGE_STATUS_OPTIONS}
                placeholder='Seleccioná el estado'
              />

              <div className='grid grid-cols-2 gap-4'>
                <form.AppField name='budgetQuantity'>
                  {(field) => (
                    <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                      <FieldLabel>Cantidad para presupuesto</FieldLabel>
                      <Input
                        type='number'
                        min='0.01'
                        step='0.01'
                        value={String(field.state.value ?? '')}
                        onChange={(event) => {
                          const next = event.target.valueAsNumber;
                          if (!Number.isNaN(next)) {
                            field.handleChange(next);
                          }
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.AppField>

                <FormSelectField
                  name='budgetUnit'
                  label='Unidad para presupuesto'
                  required
                  options={MEASUREMENT_UNIT_OPTIONS}
                  placeholder='Seleccioná la unidad'
                />
              </div>

              <Field>
                <FieldLabel>Progreso automático</FieldLabel>
                <div className='rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
                  {stage
                    ? `${stage.progressPercent}% calculado según tareas completadas.`
                    : 'Se calculará automáticamente según tareas completadas.'}
                </div>
              </Field>

              <FormSliderField
                name='weightPercent'
                label='Peso en la obra (%)'
                min={0}
                max={100}
                step={5}
              />

              <div className='grid grid-cols-2 gap-4'>
                <form.AppField name='estimatedStartDate'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Inicio estimado</FieldLabel>
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
                placeholder='Observaciones...'
                rows={2}
              />

              <form.AppField name='tasks'>
                {(tasksField) => (
                  <Field>
                    <FieldLabel>Tareas</FieldLabel>
                    <StageTasksEditor
                      tasks={tasksField.state.value}
                      onChange={(tasks) =>
                        tasksField.handleChange(
                          tasks.map((task) => ({
                            title: task.title,
                            completed: Boolean(task.completed),
                          })),
                        )
                      }
                      allowCompletion
                      emptyMessage='Agregá tareas para que la etapa pueda calcular su progreso.'
                    />
                    <FieldError errors={tasksField.state.meta.errors} />
                  </Field>
                )}
              </form.AppField>
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='stage-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Crear etapa'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function StageFormSheetTrigger({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <Icons.add className='h-4 w-4 sm:mr-2' />
        <span className='hidden sm:inline'>Nueva etapa</span>
      </Button>
      <StageFormSheet projectId={projectId} open={open} onOpenChange={setOpen} />
    </>
  );
}
