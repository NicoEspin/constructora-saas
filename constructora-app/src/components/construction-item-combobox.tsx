'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { CONSTRUCTION_ITEMS, type ConstructionItem } from '@/data/construction-items';
import { cn } from '@/lib/utils';

interface ConstructionItemComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSelect: (item: ConstructionItem) => void;
  placeholder?: string;
  className?: string;
  'aria-invalid'?: boolean;
}

export function ConstructionItemCombobox({
  value,
  onChange,
  onBlur,
  onSelect,
  placeholder = 'Escribí para buscar o ingresá libremente...',
  className,
  'aria-invalid': ariaInvalid,
}: ConstructionItemComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = CONSTRUCTION_ITEMS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.defaultTasks.some((task) => task.toLowerCase().includes(query)) ||
        cat.label.toLowerCase().includes(query),
    ),
  })).filter((cat) => cat.items.length > 0);

  const showDropdown = open && filtered.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(item: ConstructionItem) {
    onSelect(item);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className='relative w-full'>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(className)}
        aria-invalid={ariaInvalid}
        aria-autocomplete='list'
        aria-expanded={showDropdown}
        autoComplete='off'
      />

      {showDropdown && (
        <div className='absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-lg'>
          <div className='max-h-72 overflow-y-auto overscroll-contain py-1'>
            {filtered.map((category) => (
              <div key={category.label}>
                <div className='sticky top-0 bg-muted/90 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm'>
                  {category.label}
                </div>
                {category.items.map((item) => (
                  <button
                    key={item.name}
                    type='button'
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    className='w-full cursor-default px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground'
                  >
                    <div className='text-sm font-medium'>{item.name}</div>
                    <div className='line-clamp-1 text-xs text-muted-foreground'>
                      {item.description}
                    </div>
                    {item.defaultTasks.length > 0 ? (
                      <div className='mt-1 text-[11px] text-muted-foreground'>
                        {item.defaultTasks.length} tareas por defecto
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
