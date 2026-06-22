import { cn } from '@/lib/utils';
import type { Icon } from '@/components/icons';

interface EmptyStateProps {
  icon?: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-center',
        className,
      )}
    >
      {IconComponent && (
        <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
          <IconComponent className='text-muted-foreground size-6' />
        </div>
      )}
      <div className='space-y-1'>
        <p className='text-sm font-medium'>{title}</p>
        {description && (
          <p className='text-muted-foreground text-sm'>{description}</p>
        )}
      </div>
      {action && <div className='mt-1'>{action}</div>}
    </div>
  );
}
