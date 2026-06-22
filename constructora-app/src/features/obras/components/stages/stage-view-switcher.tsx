'use client';

import { Icons } from '@/components/icons';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type StageView = 'cards' | 'kanban' | 'timeline';

interface StageViewSwitcherProps {
  view: StageView;
  onViewChange: (view: StageView) => void;
}

export function StageViewSwitcher({ view, onViewChange }: StageViewSwitcherProps) {
  return (
    <ToggleGroup
      type='single'
      value={view}
      onValueChange={(v) => {
        if (v) onViewChange(v as StageView);
      }}
      size='sm'
    >
      <ToggleGroupItem value='cards' aria-label='Vista tarjetas'>
        <Icons.dashboard className='h-3.5 w-3.5' />
        <span className='hidden sm:inline ml-1.5'>Tarjetas</span>
      </ToggleGroupItem>
      <ToggleGroupItem value='kanban' aria-label='Vista kanban'>
        <Icons.kanban className='h-3.5 w-3.5' />
        <span className='hidden sm:inline ml-1.5'>Kanban</span>
      </ToggleGroupItem>
      <ToggleGroupItem value='timeline' aria-label='Vista cronograma'>
        <Icons.calendar className='h-3.5 w-3.5' />
        <span className='hidden sm:inline ml-1.5'>Cronograma</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
