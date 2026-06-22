'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteTemplateStageMutation } from '../../api/mutations';
import type { ProjectTemplateStage } from '../../api/types';
import { TemplateStageFormSheet } from './stage-form-sheet';

interface StageCardProps {
  stage: ProjectTemplateStage;
}

export function TemplateStageCard({ stage }: StageCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteTemplateStageMutation,
    onSuccess: () => {
      toast.success('Etapa eliminada');
      setDeleteOpen(false);
    },
    onError: () => toast.error('No se pudo eliminar la etapa'),
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() =>
          deleteMutation.mutate({
            templateId: stage.projectTemplateId,
            stageId: stage.id,
          })
        }
        loading={deleteMutation.isPending}
      />
      <TemplateStageFormSheet
        templateId={stage.projectTemplateId}
        stage={stage}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <div className='bg-card border rounded-lg p-4 space-y-2 min-w-0'>
        <div className='flex items-start justify-between gap-2 min-w-0'>
          <div className='flex items-center gap-1.5 min-w-0'>
            <span className='text-muted-foreground text-sm font-medium tabular-nums shrink-0'>
              {stage.position}.
            </span>
            <span className='font-medium truncate min-w-0'>{stage.name}</span>
          </div>
          <div className='flex items-center gap-1 shrink-0'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
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

        {stage.description && (
          <p className='text-muted-foreground text-sm'>{stage.description}</p>
        )}

        {stage.tasks.length > 0 ? (
          <div className='rounded-md border bg-muted/20 p-2'>
            <div className='mb-2 text-xs font-medium text-muted-foreground'>Tareas por defecto</div>
            <div className='flex flex-col gap-1.5'>
              {stage.tasks.map((task) => (
                <div key={task.id} className='text-sm leading-snug'>
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {stage.weightPercent != null && (
          <p className='text-muted-foreground text-xs'>
            <Icons.coins className='inline h-3 w-3 mr-1' />
            Peso: {stage.weightPercent}%
          </p>
        )}
      </div>
    </>
  );
}
