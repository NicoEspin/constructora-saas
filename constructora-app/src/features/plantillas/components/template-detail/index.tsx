'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { templateQueryOptions } from '../../api/queries';
import { TemplateFormSheet } from '../template-form-sheet';
import { TemplateStagesList, TemplateStagesListSkeleton } from '../stages/stages-list';

interface TemplateDetailProps {
  templateId: string;
}

export function TemplateDetail({ templateId }: TemplateDetailProps) {
  const { data: template } = useSuspenseQuery(templateQueryOptions(templateId));
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <TemplateFormSheet template={template} open={editOpen} onOpenChange={setEditOpen} />

      <div className='space-y-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{template.name}</h1>
            {template.description && (
              <p className='text-muted-foreground text-sm'>{template.description}</p>
            )}
          </div>
          <div className='flex gap-2 self-start'>
            <Button size='sm' variant='outline' onClick={() => setEditOpen(true)}>
              <Icons.edit className='mr-2 h-4 w-4' />
              Editar
            </Button>
            <Button size='sm' variant='outline' asChild>
              <Link href='/dashboard/plantillas'>
                <Icons.chevronLeft className='mr-2 h-4 w-4' />
                Volver
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        <ErrorBoundary>
          <Suspense fallback={<TemplateStagesListSkeleton />}>
            <TemplateStagesList templateId={templateId} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}

export function TemplateDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='bg-muted h-9 w-64 animate-pulse rounded' />
      <div className='bg-muted h-px w-full' />
      <TemplateStagesListSkeleton />
    </div>
  );
}
