'use client';

import { cn } from '@/lib/utils';
import { StageCard } from './stage-card';
import { Icons } from '@/components/icons';
import { STAGE_STATUS_LABELS } from '../../schemas/project';
import type { ProjectStage, ProjectStageStatus } from '../../api/types';

const COLUMN_ORDER: ProjectStageStatus[] = ['PENDING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED'];

const COLUMN_STYLES: Record<ProjectStageStatus, string> = {
  PENDING: 'border-t-2 border-t-muted-foreground/30',
  IN_PROGRESS: 'border-t-2 border-t-green-500',
  PAUSED: 'border-t-2 border-t-yellow-500',
  COMPLETED: 'border-t-2 border-t-blue-500',
};

interface StagesKanbanViewProps {
  stages: ProjectStage[];
}

export function StagesKanbanView({ stages }: StagesKanbanViewProps) {
  const byStatus = COLUMN_ORDER.reduce<Record<ProjectStageStatus, ProjectStage[]>>(
    (acc, status) => {
      acc[status] = stages.filter((s) => s.status === status).toSorted((a, b) => a.position - b.position);
      return acc;
    },
    { PENDING: [], IN_PROGRESS: [], PAUSED: [], COMPLETED: [] },
  );

  if (stages.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-8 text-center'>
        <Icons.obras className='text-muted-foreground mx-auto h-8 w-8 mb-3' />
        <p className='text-muted-foreground text-sm'>No hay etapas registradas.</p>
        <p className='text-muted-foreground text-xs mt-1'>
          Usá el botón de arriba para crear la primera etapa.
        </p>
      </div>
    );
  }

  return (
    <div className='grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {COLUMN_ORDER.map((status) => {
        const statusStages = byStatus[status];
        return (
          <div key={status} className={cn('min-w-0 rounded-lg border bg-muted/20 p-3 space-y-3', COLUMN_STYLES[status])}>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium'>{STAGE_STATUS_LABELS[status]}</h3>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {statusStages.length}
              </span>
            </div>
            {statusStages.length > 0 ? (
              <div className='space-y-2'>
                {statusStages.map((stage) => (
                  <StageCard key={stage.id} stage={stage} />
                ))}
              </div>
            ) : (
              <p className='text-center text-xs text-muted-foreground py-4'>Sin etapas</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
