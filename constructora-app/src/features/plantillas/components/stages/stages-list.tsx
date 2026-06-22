'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { templateStagesQueryOptions } from '../../api/queries';
import { TemplateStageCard } from './stage-card';
import { TemplateStageFormSheetTrigger } from './stage-form-sheet';
import { Icons } from '@/components/icons';

interface StagesListProps {
  templateId: string;
}

export function TemplateStagesList({ templateId }: StagesListProps) {
  const { data: stages } = useSuspenseQuery(templateStagesQueryOptions(templateId));

  const sorted = stages.toSorted((a, b) => a.position - b.position);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>
          Etapas
          {sorted.length > 0 && (
            <span className='text-muted-foreground ml-2 text-sm font-normal'>
              ({sorted.length})
            </span>
          )}
        </h2>
        <TemplateStageFormSheetTrigger templateId={templateId} />
      </div>

      {sorted.length === 0 ? (
        <div className='border-dashed border rounded-lg p-8 text-center'>
          <Icons.galleryVerticalEnd className='text-muted-foreground mx-auto h-8 w-8 mb-3' />
          <p className='text-muted-foreground text-sm'>No hay etapas en esta plantilla.</p>
          <p className='text-muted-foreground text-xs mt-1'>
            Agregá etapas para que se materialicen automáticamente al crear una obra.
          </p>
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {sorted.map((stage) => (
            <TemplateStageCard key={stage.id} stage={stage} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TemplateStagesListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='bg-muted h-6 w-24 animate-pulse rounded' />
        <div className='bg-muted h-8 w-28 animate-pulse rounded' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='bg-muted h-24 animate-pulse rounded-lg' />
        ))}
      </div>
    </div>
  );
}
