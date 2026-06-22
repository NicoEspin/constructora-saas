'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project } from '@/features/obras/api/types';

type ReportesDashboardProps = {
  projects: Project[];
};

const REPORT_CARDS = [
  {
    type: 'PROJECT_OPERATIONAL_REPORT',
    title: 'Reporte operativo',
    description: 'Estado de avance, etapas críticas, contratiempos y alertas de ejecución.',
    href: (projectId: string) => `/dashboard/reportes/operativo/${projectId}/imprimir`,
    icon: Icons.hammer,
  },
  {
    type: 'PROJECT_EXECUTIVE_REPORT',
    title: 'Reporte gerencial',
    description: 'Lectura ejecutiva con presupuesto, gastos, margen y desvíos de obra.',
    href: (projectId: string) => `/dashboard/reportes/gerencial/${projectId}/imprimir`,
    icon: Icons.wallet,
  },
] as const;

export function ReportesDashboard({ projects }: ReportesDashboardProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects],
  );

  if (!projects.length) {
    return (
      <EmptyState
        icon={Icons.obras}
        title='Todavía no hay obras para reportar'
        description='Creá una obra primero. Este primer slice de reportes trabaja sobre una obra puntual, no sobre todo el tenant.'
        action={
          <Button asChild>
            <Link href='/dashboard/obras'>Ir a obras</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='space-y-1'>
              <CardTitle>Seleccioná la obra base</CardTitle>
              <CardDescription>
                Este MVP genera PDFs por obra. Las plantillas visuales son compartidas por tenant.
              </CardDescription>
            </div>
            <Button asChild variant='outline'>
              <Link href='/dashboard/configuracion/estilos-pdf'>Configurar plantillas PDF</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]'>
          <div className='flex flex-col gap-2'>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder='Elegí una obra' />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject ? (
              <div className='rounded-lg border p-3 text-sm text-muted-foreground'>
                <p className='font-medium text-foreground'>{selectedProject.name}</p>
                <p>Estado: {selectedProject.status}</p>
                <p>Cliente: {selectedProject.client?.name ?? 'Sin cliente asignado'}</p>
              </div>
            ) : null}
          </div>
          <div className='rounded-lg border p-4'>
            <Badge variant='secondary'>Slice actual</Badge>
            <p className='mt-3 text-sm font-medium'>Operativo + gerencial</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              PDF únicamente, con branding por tenant y foco en una obra por vez.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 xl:grid-cols-2'>
        {REPORT_CARDS.map((report) => {
          const Icon = report.icon;
          const href = selectedProject ? report.href(selectedProject.id) : '#';

          return (
            <Card key={report.type}>
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <CardTitle className='flex items-center gap-2'>
                      <Icon className='h-5 w-5' />
                      {report.title}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                  <Badge variant='outline'>PDF</Badge>
                </div>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <div className='rounded-lg border border-dashed p-3 text-sm text-muted-foreground'>
                  {report.type === 'PROJECT_OPERATIONAL_REPORT'
                    ? 'Incluye progreso, etapas, ventanas estimadas, incidentes y alertas operativas.'
                    : 'Incluye snapshot financiero, presupuestos vinculados y gastos recientes.'}
                </div>
                <div className='flex flex-wrap gap-3'>
                  {selectedProject ? (
                    <Button asChild>
                      <Link href={href}>Generar PDF</Link>
                    </Button>
                  ) : (
                    <Button disabled>Generar PDF</Button>
                  )}
                  <Button asChild variant='outline'>
                    <Link href='/dashboard/configuracion/estilos-pdf'>Editar plantilla</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
