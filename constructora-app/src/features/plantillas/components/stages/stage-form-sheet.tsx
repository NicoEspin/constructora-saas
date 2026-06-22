'use client';

import { useEffect, useState } from 'react';
import { ConstructionItemCombobox } from '@/components/construction-item-combobox';
import { StageTasksEditor } from '@/components/stage-tasks-editor';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
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
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { createTemplateStageMutation, updateTemplateStageMutation } from '../../api/mutations';
import { templateStageSchema, type TemplateStageFormValues } from '../../schemas/template';
import type { ProjectTemplateStage, TemplateStageMutationPayload } from '../../api/types';

function toStageFormValues(stage?: ProjectTemplateStage): TemplateStageFormValues {
  return {
    name: stage?.name ?? '',
    description: stage?.description ?? '',
    position: stage?.position != null ? String(stage.position) : '',
    weightPercent: stage?.weightPercent ?? undefined,
    tasks: stage?.tasks.map((task) => ({ title: task.title })) ?? [],
  };
}

interface StageFormSheetProps {
  templateId: string;
  stage?: ProjectTemplateStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateStageFormSheet({
  templateId,
  stage,
  open,
  onOpenChange,
}: StageFormSheetProps) {
  const isEditing = !!stage;

  const createMutation = useMutation(createTemplateStageMutation);
  const updateMutation = useMutation(updateTemplateStageMutation);

  const form = useAppForm({
    defaultValues: toStageFormValues(stage),
    validators: { onSubmit: templateStageSchema },
    onSubmit: async ({ value }) => {
      const payload: TemplateStageMutationPayload = {
        name: value.name,
        description: value.description || undefined,
        position: value.position ? parseInt(value.position, 10) : undefined,
        weightPercent: value.weightPercent,
        tasks: value.tasks,
      };

      try {
        if (isEditing && stage) {
          await updateMutation.mutateAsync({ templateId, stageId: stage.id, data: payload });
          toast.success('Etapa actualizada');
          onOpenChange(false);
        } else {
          await createMutation.mutateAsync({ templateId, data: payload });
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

  const { FormSliderField, FormTextField } = useFormFields<TemplateStageFormValues>();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar etapa' : 'Añadir etapa a la plantilla'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Modificá los datos de la etapa.' : 'Agregá una etapa a la plantilla.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='template-stage-form-sheet' className='space-y-4'>
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
                                item.defaultTasks.map((title) => ({ title })),
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
                            rows={3}
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

              <FormTextField
                name='position'
                label='Posición (opcional)'
                type='number'
                placeholder='1'
              />

              <FormSliderField
                name='weightPercent'
                label='Peso en la plantilla (%)'
                min={0}
                max={100}
                step={5}
              />

              <form.AppField name='tasks'>
                {(tasksField) => (
                  <Field>
                    <FieldLabel>Tareas por defecto</FieldLabel>
                    <StageTasksEditor
                      tasks={tasksField.state.value}
                      onChange={(tasks) =>
                        tasksField.handleChange(tasks.map((task) => ({ title: task.title })))
                      }
                      emptyMessage='Agregá tareas por defecto para esta etapa de plantilla.'
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
          <Button type='submit' form='template-stage-form-sheet' isLoading={isPending}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Crear etapa'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TemplateStageFormSheetTrigger({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' />
        Añadir etapa
      </Button>
      <TemplateStageFormSheet templateId={templateId} open={open} onOpenChange={setOpen} />
    </>
  );
}
