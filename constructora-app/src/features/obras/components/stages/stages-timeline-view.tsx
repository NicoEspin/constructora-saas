'use client';

import { cn } from '@/lib/utils';
import { formatDate } from '../shared/format-helpers';
import { STAGE_STATUS_LABELS } from '../../schemas/project';
import type { ProjectStage, ProjectStageStatus } from '../../api/types';

function stageStatusColor(status: ProjectStageStatus): string {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-green-500';
    case 'COMPLETED': return 'bg-blue-500';
    case 'PAUSED': return 'bg-yellow-500';
    default: return 'bg-muted-foreground/40';
  }
}

interface StagesTimelineViewProps {
  stages: ProjectStage[];
}

export function StagesTimelineView({ stages }: StagesTimelineViewProps) {
  const sorted = stages
    .filter((s) => s.estimatedStartDate || s.estimatedEndDate)
    .toSorted((a, b) => {
      const aDate = a.estimatedStartDate ?? a.estimatedEndDate ?? '';
      const bDate = b.estimatedStartDate ?? b.estimatedEndDate ?? '';
      return aDate.localeCompare(bDate);
    });

  const withoutDates = stages.filter((s) => !s.estimatedStartDate && !s.estimatedEndDate);

  if (stages.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-8 text-center'>
        <p className='text-sm text-muted-foreground'>No hay etapas registradas.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {sorted.length === 0 && withoutDates.length > 0 && (
        <p className='text-sm text-muted-foreground'>
          Las etapas no tienen fechas estimadas asignadas. Asigná fechas para ver la línea de tiempo.
        </p>
      )}

      {sorted.length > 0 && (
        <div className='relative'>
          <div className='absolute left-4 top-0 bottom-0 w-px bg-border' />
          <div className='space-y-4 pl-10'>
            {sorted.map((stage) => (
              <div key={stage.id} className='relative'>
                <div
                  className={cn(
                    'absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background',
                    stageStatusColor(stage.status),
                  )}
                />
                <div className='rounded-lg border p-3 space-y-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-1.5 min-w-0'>
                      <span className='text-muted-foreground text-xs tabular-nums shrink-0'>
                        {stage.position}.
                      </span>
                      <span className='font-medium truncate'>{stage.name}</span>
                    </div>
                    <span className='text-xs text-muted-foreground shrink-0'>
                      {STAGE_STATUS_LABELS[stage.status]}
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-3 text-xs text-muted-foreground'>
                    {stage.estimatedStartDate && (
                      <span>Inicio: {formatDate(stage.estimatedStartDate)}</span>
                    )}
                    {stage.estimatedEndDate && (
                      <span>Fin: {formatDate(stage.estimatedEndDate)}</span>
                    )}
                    {stage.actualStartDate && (
                      <span className='text-green-600 dark:text-green-400'>
                        Inicio real: {formatDate(stage.actualStartDate)}
                      </span>
                    )}
                    {stage.actualEndDate && (
                      <span className='text-blue-600 dark:text-blue-400'>
                        Fin real: {formatDate(stage.actualEndDate)}
                      </span>
                    )}
                  </div>
                  {stage.progressPercent > 0 && (
                    <div className='flex items-center gap-2 mt-1'>
                      <div className='flex-1 h-1.5 bg-muted rounded-full overflow-hidden'>
                        <div
                          className={cn('h-full rounded-full', stageStatusColor(stage.status))}
                          style={{ width: `${stage.progressPercent}%` }}
                        />
                      </div>
                      <span className='text-xs tabular-nums text-muted-foreground'>
                        {stage.progressPercent}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {withoutDates.length > 0 && sorted.length > 0 && (
        <div className='space-y-2'>
          <p className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>
            Sin fechas asignadas
          </p>
          <div className='space-y-2'>
            {withoutDates.map((stage) => (
              <div
                key={stage.id}
                className='flex items-center gap-2 rounded-lg border p-2.5 text-sm text-muted-foreground'
              >
                <div
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    stageStatusColor(stage.status),
                  )}
                />
                <span className='truncate'>{stage.position}. {stage.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
