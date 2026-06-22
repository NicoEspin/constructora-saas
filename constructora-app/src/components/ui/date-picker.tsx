'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Seleccioná fecha', className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <Icons.calendar className='mr-2 h-4 w-4' />
          {value ? format(parseISO(value), 'dd/MM/yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, 'yyyy-MM-dd') : undefined);
            setOpen(false);
          }}
        />
        {value && (
          <div className='border-t p-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='w-full text-muted-foreground'
              onClick={() => { onChange(undefined); setOpen(false); }}
            >
              Limpiar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
