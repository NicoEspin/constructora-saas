'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteTemplateMutation } from '../../api/mutations';
import type { ProjectTemplate } from '../../api/types';
import { TemplateFormSheet } from '../template-form-sheet';

interface CellActionProps {
  data: ProjectTemplate;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    ...deleteTemplateMutation,
    onSuccess: () => {
      toast.success('Plantilla eliminada');
      setDeleteOpen(false);
    },
    onError: () => toast.error('No se pudo eliminar la plantilla'),
  });

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.id)}
        loading={deleteMutation.isPending}
      />
      <TemplateFormSheet template={data} open={editOpen} onOpenChange={setEditOpen} />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Abrir menú</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/plantillas/${data.id}`}>
              <Icons.externalLink className='mr-2 h-4 w-4' />
              Ver etapas
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className='text-destructive focus:text-destructive'
          >
            <Icons.trash className='mr-2 h-4 w-4' />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
