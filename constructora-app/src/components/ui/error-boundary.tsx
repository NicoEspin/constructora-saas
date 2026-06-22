'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <TableErrorState
          message={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}

interface TableErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function TableErrorState({ message, onRetry }: TableErrorStateProps) {
  return (
    <div className='border-destructive/20 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border p-10 text-center'>
      <div className='bg-destructive/10 flex size-10 items-center justify-center rounded-full'>
        <Icons.alertCircle className='text-destructive size-5' />
      </div>
      <div className='space-y-1'>
        <p className='text-sm font-medium'>No se pudo cargar la información</p>
        <p className='text-muted-foreground text-xs'>
          {message ?? 'Verificá tu conexión e intentá de nuevo.'}
        </p>
      </div>
      {onRetry && (
        <Button size='sm' variant='outline' onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
