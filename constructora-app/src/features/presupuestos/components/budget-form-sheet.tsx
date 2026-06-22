'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { toast } from 'sonner';
import * as z from 'zod';
import { ConstructionItemCombobox } from '@/components/construction-item-combobox';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Textarea } from '@/components/ui/textarea';
import { clientsQueryOptions } from '@/features/clientes/api/queries';
import { materialsQueryOptions } from '@/features/materiales/api/queries';
import type { Material } from '@/features/materiales/api/types';
import { projectsQueryOptions } from '@/features/obras/api/queries';
import { createBudgetMutation, updateBudgetMutation } from '../api/mutations';
import { budgetQueryOptions } from '../api/queries';
import type {
  Budget,
  BudgetItemCategory,
  BudgetItemMutationPayload,
  BudgetMutationPayload,
  MeasurementUnit,
} from '../api/types';
import {
  BUDGET_ITEM_CATEGORY_OPTIONS,
  MEASUREMENT_UNIT_OPTIONS,
  budgetSchema,
  type BudgetFormValues,
  type BudgetItemFormValues,
} from '../schemas/budget';

const MANUAL_MATERIAL_VALUE = '__manual__';

const EMPTY_ITEM = (): BudgetItemFormValues => ({
  category: 'MATERIAL',
  materialId: '',
  name: '',
  description: '',
  quantity: 1,
  unit: 'UNIT',
  unitPrice: 0,
});

const EMPTY_BUDGET_VALUES = (initialProjectId = ''): BudgetFormValues => ({
  name: '',
  clientId: '',
  projectId: initialProjectId,
  workType: '',
  description: '',
  expiresAt: '',
  commercialTerms: '',
  paymentTerms: '',
  estimatedExecutionTime: '',
  items: [EMPTY_ITEM()],
});

interface BudgetFormSheetProps {
  budgetId?: string;
  initialProjectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function isBudgetItemCategory(value: string): value is BudgetItemCategory {
  return BUDGET_ITEM_CATEGORY_OPTIONS.some((option) => option.value === value);
}

function isMeasurementUnit(value: string): value is MeasurementUnit {
  return MEASUREMENT_UNIT_OPTIONS.some((option) => option.value === value);
}

function toBudgetFormValues(budget?: Budget, initialProjectId?: string): BudgetFormValues {
  if (!budget) {
    return EMPTY_BUDGET_VALUES(initialProjectId);
  }

  return {
    name: budget.name,
    clientId: budget.clientId,
    projectId: budget.projectId ?? '',
    workType: budget.workType ?? '',
    description: budget.description ?? '',
    expiresAt: budget.expiresAt ? budget.expiresAt.slice(0, 10) : '',
    commercialTerms: budget.commercialTerms ?? '',
    paymentTerms: budget.paymentTerms ?? '',
    estimatedExecutionTime: budget.estimatedExecutionTime ?? '',
    items:
      budget.items && budget.items.length > 0
        ? budget.items.map((item) => ({
            category: item.category,
            materialId: item.materialId ?? '',
            name: item.name,
            description: item.description ?? '',
            quantity: toNumber(item.quantity),
            unit: item.unit,
            unitPrice: toNumber(item.unitPrice),
          }))
        : [EMPTY_ITEM()],
  };
}

function toBudgetPayload(values: BudgetFormValues): BudgetMutationPayload {
  const items: BudgetItemMutationPayload[] = values.items.map((item) => ({
    category: item.category,
    materialId: item.materialId || undefined,
    name: item.name,
    description: item.description || undefined,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
  }));

  return {
    name: values.name,
    clientId: values.clientId,
    projectId: values.projectId || undefined,
    workType: values.workType || undefined,
    description: values.description || undefined,
    expiresAt: values.expiresAt || undefined,
    commercialTerms: values.commercialTerms || undefined,
    paymentTerms: values.paymentTerms || undefined,
    estimatedExecutionTime: values.estimatedExecutionTime || undefined,
    items,
  };
}

function applyMaterialSelection(
  items: BudgetItemFormValues[],
  index: number,
  materialId: string,
  materials: Material[],
) {
  const nextItems = [...items];
  const currentItem = nextItems[index] ?? EMPTY_ITEM();

  if (materialId === MANUAL_MATERIAL_VALUE) {
    nextItems[index] = { ...currentItem, materialId: '' };
    return nextItems;
  }

  const material = materials.find((entry) => entry.id === materialId);
  if (!material) {
    return nextItems;
  }

  nextItems[index] = {
    ...currentItem,
    category: 'MATERIAL',
    materialId: material.id,
    name: material.name,
    unit: material.unit,
    unitPrice:
      material.estimatedUnitPrice !== null
        ? toNumber(material.estimatedUnitPrice)
        : currentItem.unitPrice,
  };

  return nextItems;
}

function subtotalForItem(item: BudgetItemFormValues) {
  return roundMoney(item.quantity * item.unitPrice);
}

function applyItemSubtotal(items: BudgetItemFormValues[], index: number, subtotal: number) {
  const nextItems = [...items];
  const currentItem = nextItems[index] ?? EMPTY_ITEM();
  const quantity = currentItem.quantity > 0 ? currentItem.quantity : 1;

  nextItems[index] = {
    ...currentItem,
    unitPrice: roundMoney(subtotal / quantity),
  };

  return nextItems;
}

export function BudgetFormSheet({
  budgetId,
  initialProjectId,
  open,
  onOpenChange,
}: BudgetFormSheetProps) {
  const isEditing = Boolean(budgetId);

  const budgetQuery = useQuery({
    ...budgetQueryOptions(budgetId ?? ''),
    enabled: open && !!budgetId,
  });
  const { data: clientsData } = useQuery(clientsQueryOptions({ take: 100 }));
  const { data: projectsData } = useQuery(projectsQueryOptions({ take: 100 }));
  const { data: materialsData } = useQuery(materialsQueryOptions({ take: 100 }));

  const createMutation = useMutation(createBudgetMutation);
  const updateMutation = useMutation(updateBudgetMutation);

  const form = useAppForm({
    defaultValues: EMPTY_BUDGET_VALUES(initialProjectId),
    validators: { onSubmit: budgetSchema },
    onSubmit: async ({ value }) => {
      const payload = toBudgetPayload(value);

      try {
        if (isEditing && budgetId) {
          await updateMutation.mutateAsync({ id: budgetId, data: payload });
          toast.success('Presupuesto actualizado');
          onOpenChange(false);
          return;
        }

        await createMutation.mutateAsync(payload);
        toast.success('Presupuesto creado');
        onOpenChange(false);
        form.reset(EMPTY_BUDGET_VALUES(initialProjectId));
      } catch {
        toast.error(
          isEditing ? 'No se pudo actualizar el presupuesto' : 'No se pudo crear el presupuesto',
        );
      }
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(toBudgetFormValues(budgetQuery.data, initialProjectId));
  }, [budgetQuery.data, form, initialProjectId, open]);

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<BudgetFormValues>();

  const clientOptions = (clientsData?.items ?? []).map((client) => ({
    value: client.id,
    label: client.name,
  }));
  const projectOptions = (projectsData?.items ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));
  const materials = materialsData?.items ?? [];
  const materialOptions = materials.map((material) => ({
    value: material.id,
    label: material.name,
  }));

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoadingDetail = isEditing && budgetQuery.isLoading;
  const hasDetailError = isEditing && budgetQuery.isError;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-5xl'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Modificá el detalle completo del presupuesto.'
              : 'Completá los datos y cargá la planilla de items del presupuesto.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          {isLoadingDetail ? (
            <div className='flex h-full min-h-64 items-center justify-center'>
              <Icons.spinner className='size-5 animate-spin text-muted-foreground' />
            </div>
          ) : hasDetailError ? (
            <div className='flex min-h-64 flex-col items-center justify-center gap-3 text-center'>
              <p className='text-sm text-muted-foreground'>
                No se pudo cargar el detalle del presupuesto.
              </p>
              <Button type='button' variant='outline' onClick={() => budgetQuery.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <form.AppForm>
              <form.Form id='budget-form-sheet' className='flex flex-col gap-6'>
                <FieldGroup>
                  <FormTextField
                    name='name'
                    label='Nombre'
                    required
                    placeholder='Presupuesto obra Norte'
                    validators={{
                      onBlur: z.string().min(1, 'El nombre es requerido').max(160),
                    }}
                  />

                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormSelectField
                      name='clientId'
                      label='Cliente'
                      required
                      options={clientOptions}
                      placeholder='Seleccioná un cliente'
                      validators={{
                        onBlur: z.string().min(1, 'El cliente es requerido'),
                      }}
                    />

                    <FormSelectField
                      name='projectId'
                      label='Obra'
                      options={projectOptions}
                      placeholder='Seleccioná una obra'
                    />
                  </div>

                  <div className='grid gap-4 md:grid-cols-2'>
                    <FormTextField
                      name='workType'
                      label='Tipo de trabajo'
                      placeholder='Refacción'
                    />
                    <form.AppField name='expiresAt'>
                      {(field) => (
                        <Field>
                          <FieldLabel>Válido hasta</FieldLabel>
                          <DatePicker
                            value={String(field.state.value ?? '')}
                            onChange={(v) => field.handleChange(v ?? '')}
                          />
                        </Field>
                      )}
                    </form.AppField>
                  </div>

                  <FormTextareaField
                    name='description'
                    label='Descripción'
                    placeholder='Descripción del trabajo...'
                    rows={2}
                  />
                </FieldGroup>

                <form.AppField name='items' mode='array'>
                  {(itemsField) => (
                    <FieldGroup className='gap-4 rounded-xl border p-4'>
                      <div className='flex flex-col gap-1'>
                        <h3 className='font-semibold'>Planilla de items</h3>
                        <p className='text-sm text-muted-foreground'>
                          Sumá materiales, mano de obra o ambos. El subtotal se calcula solo.
                        </p>
                      </div>

                      {itemsField.state.value.map((item, index) => (
                        <div key={index} className='rounded-lg border p-4'>
                          <div className='mb-4 flex items-center justify-between gap-3'>
                            <div>
                              <p className='font-medium'>Item {index + 1}</p>
                              <p className='text-sm text-muted-foreground'>
                                Subtotal: {formatCurrency(subtotalForItem(item))}
                              </p>
                            </div>

                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() =>
                                itemsField.state.value.length > 1 && itemsField.removeValue(index)
                              }
                              disabled={itemsField.state.value.length === 1}
                            >
                              <Icons.trash className='h-4 w-4' />
                            </Button>
                          </div>

                          <div className='grid gap-4 lg:grid-cols-[180px_1fr]'>
                            <form.AppField name={`items[${index}].category`}>
                              {(categoryField) => (
                                <Field data-invalid={categoryField.state.meta.isTouched && !categoryField.state.meta.isValid}>
                                  <FieldLabel>Tipo</FieldLabel>
                                  <Select
                                    value={String(categoryField.state.value)}
                                    onValueChange={(value) => {
                                      if (!isBudgetItemCategory(value)) {
                                        return;
                                      }

                                      const nextItems = [...itemsField.state.value];
                                      nextItems[index] = {
                                        ...nextItems[index],
                                        category: value,
                                        materialId: value === 'MATERIAL' ? nextItems[index].materialId : '',
                                      };
                                      itemsField.handleChange(nextItems);
                                    }}
                                  >
                                    <SelectTrigger aria-invalid={categoryField.state.meta.isTouched && !categoryField.state.meta.isValid}>
                                      <SelectValue placeholder='Seleccioná un tipo' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        {BUDGET_ITEM_CATEGORY_OPTIONS.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FieldError errors={categoryField.state.meta.errors} />
                                </Field>
                              )}
                            </form.AppField>

                            <form.AppField name={`items[${index}].materialId`}>
                              {(materialField) => (
                                <Field>
                                  <FieldLabel>Material existente</FieldLabel>
                                  <Select
                                    disabled={item.category !== 'MATERIAL'}
                                    value={String(materialField.state.value || MANUAL_MATERIAL_VALUE)}
                                    onValueChange={(value) => {
                                      itemsField.handleChange(
                                        applyMaterialSelection(
                                          itemsField.state.value,
                                          index,
                                          value,
                                          materials,
                                        ),
                                      );
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder='Elegí un material para autocompletar' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectItem value={MANUAL_MATERIAL_VALUE}>Manual</SelectItem>
                                        {materialOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FieldDescription>
                                    Si seleccionás un material, se completan nombre, unidad y precio estimado.
                                  </FieldDescription>
                                </Field>
                              )}
                            </form.AppField>
                          </div>

                          <div className='mt-4 grid gap-4 lg:grid-cols-2'>
                            <form.AppField
                              name={`items[${index}].name`}
                              validators={{
                                onBlur: z.string().min(1, 'El nombre del item es requerido').max(160),
                              }}
                            >
                              {(nameField) => (
                                <form.AppField name={`items[${index}].description`}>
                                  {(descriptionField) => (
                                    <>
                                      <Field data-invalid={nameField.state.meta.isTouched && !nameField.state.meta.isValid}>
                                        <FieldLabel>Nombre</FieldLabel>
                                        {item.category === 'LABOR' ? (
                                            <ConstructionItemCombobox
                                              value={String(nameField.state.value)}
                                              onChange={(v) => nameField.handleChange(v)}
                                              onBlur={nameField.handleBlur}
                                              onSelect={(item) => {
                                                nameField.handleChange(item.name);
                                                descriptionField.handleChange(item.description);
                                              }}
                                              aria-invalid={nameField.state.meta.isTouched && !nameField.state.meta.isValid}
                                              placeholder='Buscá o escribí el ítem...'
                                            />
                                        ) : (
                                          <Input
                                            value={String(nameField.state.value)}
                                            onChange={(event) => nameField.handleChange(event.target.value)}
                                            onBlur={nameField.handleBlur}
                                            aria-invalid={nameField.state.meta.isTouched && !nameField.state.meta.isValid}
                                            placeholder='Cemento portland'
                                          />
                                        )}
                                        <FieldError errors={nameField.state.meta.errors} />
                                      </Field>

                                      <Field>
                                        <FieldLabel>Descripción</FieldLabel>
                                        <Textarea
                                          rows={2}
                                          value={String(descriptionField.state.value ?? '')}
                                          onChange={(event) => descriptionField.handleChange(event.target.value)}
                                          onBlur={descriptionField.handleBlur}
                                          placeholder={item.category === 'LABOR' ? 'Se completa automáticamente al seleccionar del listado' : 'Detalle adicional del item'}
                                        />
                                        <FieldError errors={descriptionField.state.meta.errors} />
                                      </Field>
                                    </>
                                  )}
                                </form.AppField>
                              )}
                            </form.AppField>
                          </div>

                          <div className='mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                            <form.AppField name={`items[${index}].quantity`}>
                              {(quantityField) => (
                                <Field data-invalid={quantityField.state.meta.isTouched && !quantityField.state.meta.isValid}>
                                  <FieldLabel>Cantidad</FieldLabel>
                                  <Input
                                    type='number'
                                    min='0'
                                    step='0.01'
                                    value={String(quantityField.state.value)}
                                    onChange={(event) => {
                                      const next = event.target.valueAsNumber;
                                      if (!Number.isNaN(next)) {
                                        quantityField.handleChange(next);
                                      }
                                    }}
                                    onBlur={quantityField.handleBlur}
                                    aria-invalid={quantityField.state.meta.isTouched && !quantityField.state.meta.isValid}
                                  />
                                  <FieldError errors={quantityField.state.meta.errors} />
                                </Field>
                              )}
                            </form.AppField>

                            <form.AppField name={`items[${index}].unit`}>
                              {(unitField) => (
                                <Field data-invalid={unitField.state.meta.isTouched && !unitField.state.meta.isValid}>
                                  <FieldLabel>Unidad</FieldLabel>
                                  <Select
                                    value={String(unitField.state.value)}
                                    onValueChange={(value) => {
                                      if (!isMeasurementUnit(value)) {
                                        return;
                                      }

                                      unitField.handleChange(value);
                                    }}
                                  >
                                    <SelectTrigger aria-invalid={unitField.state.meta.isTouched && !unitField.state.meta.isValid}>
                                      <SelectValue placeholder='Unidad' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        {MEASUREMENT_UNIT_OPTIONS.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                  <FieldError errors={unitField.state.meta.errors} />
                                </Field>
                              )}
                            </form.AppField>

                            <form.AppField name={`items[${index}].unitPrice`}>
                              {(unitPriceField) => (
                                <Field data-invalid={unitPriceField.state.meta.isTouched && !unitPriceField.state.meta.isValid}>
                                  <FieldLabel>Precio unitario</FieldLabel>
                                  <Input
                                    type='number'
                                    min='0'
                                    step='0.01'
                                    value={String(unitPriceField.state.value)}
                                    onChange={(event) => {
                                      const next = event.target.valueAsNumber;
                                      if (!Number.isNaN(next)) {
                                        unitPriceField.handleChange(next);
                                      }
                                    }}
                                    onBlur={unitPriceField.handleBlur}
                                    aria-invalid={unitPriceField.state.meta.isTouched && !unitPriceField.state.meta.isValid}
                                  />
                                  <FieldError errors={unitPriceField.state.meta.errors} />
                                </Field>
                              )}
                            </form.AppField>

                            <Field>
                              <FieldLabel>Total</FieldLabel>
                              <Input
                                type='number'
                                min='0'
                                step='0.01'
                                value={String(subtotalForItem(item))}
                                onChange={(event) => {
                                  const next = event.target.valueAsNumber;
                                  if (!Number.isNaN(next)) {
                                    itemsField.handleChange(
                                      applyItemSubtotal(itemsField.state.value, index, next),
                                    );
                                  }
                                }}
                              />
                              <FieldDescription>
                                Se autocalcula desde cantidad x precio unitario, o podés cargarlo directo.
                              </FieldDescription>
                            </Field>
                          </div>
                        </div>
                      ))}

                      <Button
                        type='button'
                        variant='outline'
                        className='self-start'
                        onClick={() => itemsField.pushValue(EMPTY_ITEM())}
                      >
                        <Icons.add className='mr-2 h-4 w-4' />
                        Agregar item
                      </Button>

                      <FieldError errors={itemsField.state.meta.errors} />
                    </FieldGroup>
                  )}
                </form.AppField>

                <FieldGroup>
                  <FormTextareaField
                    name='commercialTerms'
                    label='Condiciones comerciales'
                    placeholder='Validez 15 días...'
                    rows={2}
                  />

                  <FormTextareaField
                    name='paymentTerms'
                    label='Condiciones de pago'
                    placeholder='50% anticipo, 50% contra entrega...'
                    rows={2}
                  />

                  <FormTextField
                    name='estimatedExecutionTime'
                    label='Tiempo estimado de ejecución'
                    placeholder='20 días corridos'
                  />
                </FieldGroup>
              </form.Form>
            </form.AppForm>
          )}
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' form='budget-form-sheet' isLoading={isPending || isLoadingDetail}>
            <Icons.check className='mr-2 h-4 w-4' />
            {isEditing ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function BudgetFormSheetTrigger() {
  const [params, setParams] = useQueryStates({
    create: parseAsString,
    projectId: parseAsString,
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
        Nuevo presupuesto
      </Button>
      <BudgetFormSheet
        open={open}
        onOpenChange={handleOpenChange}
        initialProjectId={params.projectId ?? undefined}
      />
    </>
  );
}
