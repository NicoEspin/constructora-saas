'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { stagesQueryOptions, projectKeys } from '../../api/queries';
import { updateStage } from '../../api/service';
import type { ProjectStage } from '../../api/types';
import { StageCard } from './stage-card';
import { StageFormSheetTrigger } from './stage-form-sheet';
import { StageViewSwitcher, type StageView } from './stage-view-switcher';
import { StagesKanbanView } from './stages-kanban-view';
import { StagesTimelineView } from './stages-timeline-view';
import { Icons } from '@/components/icons';

function SortableStageCard({ stage }: { stage: ProjectStage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StageCard stage={stage} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

interface StagesListProps {
  projectId: string;
}

export function StagesList({ projectId }: StagesListProps) {
  const { data: stages } = useSuspenseQuery(stagesQueryOptions(projectId));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<StageView>('cards');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const sorted = stages.toSorted((a, b) => a.position - b.position);
  const activeStage = activeId ? sorted.find((s) => s.id === activeId) : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = sorted.findIndex((s) => s.id === active.id);
    const newIndex = sorted.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sorted, oldIndex, newIndex);
    const qc = getQueryClient();

    const updated = reordered.map((s, i) => ({ ...s, position: i + 1 }));
    qc.setQueriesData<ProjectStage[]>(
      { queryKey: projectKeys.stages(projectId) },
      () => updated,
    );

    updated.forEach((s, i) => {
      if (sorted[i]?.id !== s.id) {
        updateStage(projectId, s.id, { position: s.position }).catch(() => {
          qc.invalidateQueries({ queryKey: projectKeys.stages(projectId) });
        });
      }
    });
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-lg font-semibold'>
          Etapas
          {sorted.length > 0 && (
            <span className='text-muted-foreground ml-2 text-sm font-normal'>
              ({sorted.length})
            </span>
          )}
        </h2>
        <div className='flex flex-wrap items-center gap-2'>
          <StageViewSwitcher view={view} onViewChange={setView} />
          <StageFormSheetTrigger projectId={projectId} />
        </div>
      </div>

      {view === 'cards' && (
        <>
          {sorted.length === 0 ? (
            <div className='border-dashed border rounded-lg p-8 text-center'>
              <Icons.obras className='text-muted-foreground mx-auto h-8 w-8 mb-3' />
              <p className='text-muted-foreground text-sm'>No hay etapas registradas.</p>
              <p className='text-muted-foreground text-xs mt-1'>
                Creá la primera etapa para hacer seguimiento del avance.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sorted.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {sorted.map((stage) => (
                    <SortableStageCard key={stage.id} stage={stage} />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeStage && <StageCard stage={activeStage} />}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}

      {view === 'kanban' && (
        <StagesKanbanView stages={sorted} />
      )}

      {view === 'timeline' && (
        <StagesTimelineView stages={sorted} />
      )}
    </div>
  );
}

export function StagesListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='bg-muted h-6 w-24 animate-pulse rounded' />
        <div className='bg-muted h-8 w-28 animate-pulse rounded' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='bg-muted h-36 animate-pulse rounded-lg' />
        ))}
      </div>
    </div>
  );
}
