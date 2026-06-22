'use client';

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Icon } from '@/components/icons';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; label: string };
  href?: string;
  icon?: Icon;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  href,
  icon: IconComponent,
}: MetricCardProps) {
  const isPositive = trend ? trend.value >= 0 : true;

  const content = (
    <Card className='@container/card from-primary/5 to-card bg-gradient-to-t shadow-xs'>
      <CardHeader>
        <CardDescription className='flex items-center gap-1.5'>
          {IconComponent && <IconComponent className='size-4 shrink-0' />}
          {title}
        </CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant='outline'>
              {isPositive ? (
                <Icons.trendingUp className='size-3' />
              ) : (
                <Icons.trendingDown className='size-3' />
              )}
              {isPositive ? '+' : ''}{trend.value}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {description && (
        <CardFooter className='text-muted-foreground line-clamp-2 text-sm'>
          {description}
        </CardFooter>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className={cn('block transition-opacity hover:opacity-90')}>
        {content}
      </Link>
    );
  }

  return content;
}

export function MetricCardSkeleton() {
  return (
    <Card className='from-primary/5 to-card bg-gradient-to-t shadow-xs'>
      <CardHeader>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='mt-1 h-8 w-16' />
      </CardHeader>
      <CardFooter>
        <Skeleton className='h-4 w-32' />
      </CardFooter>
    </Card>
  );
}
