'use client';

import { useEffect, useState } from 'react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteStageMutation, updateStageMutation } from '../../api/mutations';
import type { ProjectStage, ProjectStageStatus } from '../../api/types';
import { STAGE_STATUS_LABELS } from '../../schemas/project';
import { StageFormSheet } from './stage-form-sheet';
import { cn } from '@/lib/utils';
import { MEASUREMENT_UNIT_LABELS, MEASUREMENT_UNIT_OPTIONS } from '@/features/presupuestos/schemas/budget';

function stageStatusClassName(status: ProjectStageStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'PAUSED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    default:
      return 'bg-secondary text-secondary-foreground border-transparent';
  }
}

function formatDate(iso: string): string {
  return format(parseISO(iso.slice(0, 10)), 'dd/MM/yyyy');
}

function getStageHighlight(stage: ProjectStage) {
  if (stage.status === 'COMPLETED') {
    return {
      cardClassName: 'border-blue-300 dark:border-blue-800',
      dateClassName: 'text-blue-700 dark:text-blue-400',
    };
  }

  if (!stage.estimatedStartDate || !stage.estimatedEndDate) {
    return {
      cardClassName: 'border-yellow-300 dark:border-yellow-800',
      dateClassName: 'text-yellow-700 dark:text-yellow-400',
    };
  }

  const estimatedEndDate = parseISO(stage.estimatedEndDate.slice(0, 10));

  if (isBefore(estimatedEndDate, startOfDay(new Date()))) {
    return {
      cardClassName: 'border-red-300 dark:border-red-800',
      dateClassName: 'text-red-700 dark:text-red-400',
    };
  }

  return {
    cardClassName: '',
    dateClassName: 'text-muted-foreground',
  };
}

interface StageCardProps {
  stage: ProjectStage;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function StageCard({ stage, dragHandleProps }: StageCardProps) {
  const stageHighlight = getStageHighlight(stage);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budgetQuantityValue, setBudgetQuantityValue] = useState(stage.budgetQuantity ?? '1');
  const [budgetUnitValue, setBudgetUnitValue] = useState(stage.budgetUnit);

  const deleteStage = useMutation(deleteStageMutation);
  const updateStage = useMutation(updateStageMutation);

  useEffect(() => {
    setBudgetQuantityValue(stage.budgetQuantity ?? '1');
    setBudgetUnitValue(stage.budgetUnit);
  }, [stage.budgetQuantity, stage.budgetUnit]);

  function handleToggleTask(taskId: string, completed: boolean) {
    updateStage.mutate(
      {
        projectId: stage.projectId,
        stageId: stage.id,
        data: {
          tasks: stage.tasks.map((task) =>
            task.id === taskId ? { title: task.title, completed } : { title: task.title, completed: task.completed },
          ),
        },
      },
      {
        onError: () => toast.error('No se pudo actualizar la tarea'),
      },
    );
  }

  function handleDateChange(field: 'estimatedStartDate' | 'estimatedEndDate', date: Date | undefined) {
    const value = date ? format(date, 'yyyy-MM-dd') : undefined;
    updateStage.mutate(
      { projectId: stage.projectId, stageId: stage.id, data: { [field]: value } },
      {
        onSuccess: () => toast.success('Fecha actualizada'),
        onError: () => toast.error('No se pudo actualizar la fecha'),
      },
    );
    if (field === 'estimatedStartDate') setStartDateOpen(false);
    else setEndDateOpen(false);
  }

  function handleBudgetSave() {
    const parsedQuantity = Number(budgetQuantityValue);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Ingresá una cantidad mayor a 0');
      return;
    }

    updateStage.mutate(
      {
        projectId: stage.projectId,
        stageId: stage.id,
        data: { budgetQuantity: parsedQuantity, budgetUnit: budgetUnitValue },
      },
      {
        onSuccess: () => {
          toast.success('Cantidad actualizada');
          setBudgetOpen(false);
        },
        onError: () => toast.error('No se pudo actualizar la cantidad'),
      },
    );
  }

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteStage.mutate(
            { projectId: stage.projectId, stageId: stage.id },
            {
              onSuccess: () => {
                toast.success('Etapa eliminada');
                setDeleteOpen(false);
              },
              onError: () => toast.error('No se pudo eliminar la etapa'),
            },
          )
        }
        loading={deleteStage.isPending}
      />
      <StageFormSheet
        projectId={stage.projectId}
        stage={stage}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <div className={cn('bg-card border rounded-lg overflow-hidden min-w-0', stageHighlight.cardClassName)}>
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center h-6 bg-muted/40 border-b cursor-grab active:cursor-grabbing transition-colors hover:bg-muted/70',
            dragHandleProps ? '' : 'cursor-default',
          )}
        >
          <Icons.gripVertical className='h-3 w-3 text-muted-foreground' />
        </div>

        <div className='p-3 space-y-2.5'>
          {/* Nombre + acciones */}
          <div className='flex items-start justify-between gap-2 min-w-0'>
            <div className='flex min-w-0 items-center gap-1.5'>
              <span className='text-muted-foreground shrink-0 text-xs font-medium tabular-nums'>
                {stage.position}.
              </span>
              <span className='min-w-0 truncate font-medium text-sm leading-snug'>
                {stage.name}
              </span>
            </div>
            <div className='flex shrink-0 items-center gap-0.5'>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                onClick={() => setEditOpen(true)}
              >
                <Icons.edit className='h-3.5 w-3.5' />
                <span className='sr-only'>Editar etapa</span>
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-destructive hover:text-destructive'
                onClick={() => setDeleteOpen(true)}
              >
                <Icons.trash className='h-3.5 w-3.5' />
                <span className='sr-only'>Eliminar etapa</span>
              </Button>
            </div>
          </div>

          {/* Badge de estado en su propia fila */}
          <Badge className={cn('text-xs', stageStatusClassName(stage.status))}>
            {STAGE_STATUS_LABELS[stage.status]}
          </Badge>

          {stage.description && (
            <p className='text-muted-foreground break-words text-sm'>{stage.description}</p>
          )}

          <div className='space-y-1 rounded-md -mx-1 px-1 py-0.5'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-muted-foreground'>Progreso</span>
              <span className='font-medium tabular-nums text-primary'>{stage.progressPercent}%</span>
            </div>
            <Progress value={stage.progressPercent} className='h-2' />
            <p className='text-[11px] text-muted-foreground'>Calculado automáticamente según tareas completadas.</p>
          </div>

          <Popover
            open={budgetOpen}
            onOpenChange={(open) => {
              setBudgetOpen(open);
              if (open) {
                setBudgetQuantityValue(stage.budgetQuantity ?? '1');
                setBudgetUnitValue(stage.budgetUnit);
              }
            }}
          >
            <PopoverTrigger asChild>
              <button className='flex w-full items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-left transition-colors hover:text-foreground'>
                <div className='flex flex-col gap-1'>
                  <span className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                    Cantidad y unidad
                  </span>
                  <div className='flex items-baseline gap-1.5'>
                    <span className='text-base font-semibold text-foreground'>
                      {stage.budgetQuantity ?? '—'}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {MEASUREMENT_UNIT_LABELS[stage.budgetUnit]}
                    </span>
                  </div>
                </div>
                <Icons.edit className='h-3.5 w-3.5 text-green-600 dark:text-green-400' />
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-72 space-y-3' align='start'>
              <div className='space-y-1'>
                <p className='text-sm font-medium'>Cantidad para presupuesto</p>
                <p className='text-xs text-muted-foreground'>Editá cantidad y unidad desde la card.</p>
              </div>
              <div className='grid grid-cols-[1fr_120px] gap-2'>
                <Input
                  type='number'
                  min='0.01'
                  step='0.01'
                  value={budgetQuantityValue}
                  onChange={(event) => setBudgetQuantityValue(event.target.value)}
                  disabled={updateStage.isPending}
                />
                <Select value={budgetUnitValue} onValueChange={(value) => setBudgetUnitValue(value as typeof stage.budgetUnit)}>
                  <SelectTrigger className='w-full' disabled={updateStage.isPending}>
                    <SelectValue placeholder='Unidad' />
                  </SelectTrigger>
                  <SelectContent align='start'>
                    {MEASUREMENT_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex justify-end'>
                <Button type='button' size='sm' onClick={handleBudgetSave} disabled={updateStage.isPending}>
                  Guardar
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {stage.tasks.length > 0 ? (
            <div className='rounded-md border bg-muted/20 p-2'>
              <div className='mb-2 flex items-center justify-between gap-2'>
                <span className='text-xs font-medium text-muted-foreground'>Checklist</span>
                <span className='text-xs text-muted-foreground'>
                  {stage.tasks.filter((task) => task.completed).length}/{stage.tasks.length}
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                {stage.tasks.map((task) => (
                  <label key={task.id} className='flex items-start gap-2 text-sm'>
                    <Checkbox
                      checked={task.completed}
                      disabled={updateStage.isPending}
                      onCheckedChange={(checked) => handleToggleTask(task.id, checked === true)}
                    />
                    <span className={cn('leading-snug', task.completed && 'text-muted-foreground line-through')}>
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className='rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground'>
              Esta etapa no tiene tareas. Editala para cargar una checklist y habilitar progreso automático.
            </div>
          )}

          <div className={cn('flex flex-wrap gap-3 text-xs', stageHighlight.dateClassName)}>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <button className={cn('flex items-center gap-1 rounded transition-colors hover:text-foreground', stageHighlight.dateClassName)}>
                  <Icons.calendar className='h-3 w-3' />
                  <span>
                    {stage.estimatedStartDate
                      ? `Inicio est.: ${formatDate(stage.estimatedStartDate)}`
                      : 'Inicio est.: —'}
                  </span>
                  <Icons.edit className='h-2.5 w-2.5 text-green-600 dark:text-green-400' />
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={stage.estimatedStartDate ? parseISO(stage.estimatedStartDate.slice(0, 10)) : undefined}
                  onSelect={(date) => handleDateChange('estimatedStartDate', date)}
                />
                {stage.estimatedStartDate && (
                  <div className='border-t p-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='w-full text-muted-foreground'
                      onClick={() => handleDateChange('estimatedStartDate', undefined)}
                    >
                      Limpiar fecha
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <button className={cn('flex items-center gap-1 rounded transition-colors hover:text-foreground', stageHighlight.dateClassName)}>
                  <Icons.calendar className='h-3 w-3' />
                  <span>
                    {stage.estimatedEndDate
                      ? `Fin est.: ${formatDate(stage.estimatedEndDate)}`
                      : 'Fin est.: —'}
                  </span>
                  <Icons.edit className='h-2.5 w-2.5 text-green-600 dark:text-green-400' />
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={stage.estimatedEndDate ? parseISO(stage.estimatedEndDate.slice(0, 10)) : undefined}
                  onSelect={(date) => handleDateChange('estimatedEndDate', date)}
                />
                {stage.estimatedEndDate && (
                  <div className='border-t p-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='w-full text-muted-foreground'
                      onClick={() => handleDateChange('estimatedEndDate', undefined)}
                    >
                      Limpiar fecha
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {stage.actualStartDate && (
              <span className='flex items-center gap-1 text-green-600 dark:text-green-400'>
                <Icons.calendar className='h-3 w-3' />
                Inicio real: {formatDate(stage.actualStartDate)}
              </span>
            )}

            {stage.actualEndDate && (
              <span className='flex items-center gap-1 text-blue-600 dark:text-blue-400'>
                <Icons.calendar className='h-3 w-3' />
                Fin real: {formatDate(stage.actualEndDate)}
              </span>
            )}

            {stage.weightPercent != null && (
              <span className='flex items-center gap-1'>
                <Icons.coins className='h-3 w-3' />
                Peso: {stage.weightPercent}%
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
