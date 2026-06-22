'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

type BudgetPrintActionsProps = {
  onDownload: () => void;
  isDownloading?: boolean;
  isDisabled?: boolean;
};

export function BudgetPrintActions({
  onDownload,
  isDownloading = false,
  isDisabled = false,
}: BudgetPrintActionsProps) {
  return (
    <div className='print:hidden flex flex-wrap items-center gap-3'>
      <Button type='button' variant='outline' onClick={() => window.close()}>
        Cerrar
      </Button>
      <Button
        type='button'
        variant='outline'
        onClick={onDownload}
        isLoading={isDownloading}
        disabled={isDisabled}
      >
        <Icons.fileTypePdf className='mr-2 h-4 w-4' />
        Descargar PDF
      </Button>
      <Button type='button' onClick={() => window.print()} disabled={isDisabled}>
        <Icons.fileTypePdf className='mr-2 h-4 w-4' />
        Imprimir
      </Button>
    </div>
  );
}
