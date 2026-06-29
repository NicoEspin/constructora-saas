'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useSetBreadcrumbTitle } from '@/hooks/use-breadcrumbs';
import { toast } from 'sonner';
import { expensesQueryOptions } from '@/features/gastos/api/queries';
import {
  deleteProjectIncidentMutation,
  deleteProjectIncomeMutation,
  exportProjectBudgetMutation,
  updateProjectMutation,
} from '../../api/mutations';
import { projectQueryOptions } from '../../api/queries';
import type { ProjectIncident, ProjectIncome, ProjectStatus } from '../../api/types';
import { ProjectFormSheet } from '../project-form-sheet';
import { StatusSelect, PROJECT_STATUS_SELECT_OPTIONS } from '../shared/status-select';
import { StagesList, StagesListSkeleton } from '../stages/stages-list';
import { ProjectIncomeFormSheet } from './project-income-form-sheet';
import { ProjectIncidentFormSheet } from './project-incident-form-sheet';
import { ProjectDocumentsTab } from './project-documents-tab';
import { ProjectExecutiveSummary } from './project-executive-summary';
import { ProjectAlertsPanel } from './project-alerts-panel';
import { ProjectFinanceOverview } from './project-finance-overview';
import { formatDate } from '../shared/format-helpers';

const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  WEATHER: 'Clima',
  SUPPLIER: 'Proveedor',
  CLIENT: 'Cliente',
  PERMIT: 'Permiso',
  MATERIALS: 'Materiales',
  WORKFORCE: 'Mano de obra',
  TECHNICAL: 'Técnico',
  SAFETY: 'Seguridad',
  OTHER: 'Otro',
};

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const { data: project } = useSuspenseQuery(projectQueryOptions(projectId));
  const { data: expenses } = useSuspenseQuery(expensesQueryOptions({ projectId, take: 100 }));

  useSetBreadcrumbTitle(project.name);

  const [editOpen, setEditOpen] = useState(false);
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<ProjectIncome | undefined>();
  const [selectedIncident, setSelectedIncident] = useState<ProjectIncident | undefined>();

  const [projectStatusPending, setProjectStatusPending] = useState(false);

  const deleteIncome = useMutation(deleteProjectIncomeMutation);
  const deleteIncident = useMutation(deleteProjectIncidentMutation);
  const exportBudget = useMutation(exportProjectBudgetMutation);
  const updateProject = useMutation(updateProjectMutation);

  function handleProjectStatusChange(status: string) {
    setProjectStatusPending(true);
    updateProject.mutate(
      { id: projectId, data: { status: status as ProjectStatus } },
      {
        onError: () => toast.error('No se pudo actualizar el estado de la obra'),
        onSettled: () => setProjectStatusPending(false),
      },
    );
  }

  const createExpenseHref = `/dashboard/gastos?create=1&projectId=${encodeURIComponent(projectId)}`;
  const createBudgetHref = `/dashboard/presupuestos?create=1&projectId=${encodeURIComponent(projectId)}`;

  function handleIncomeSheetChange(open: boolean) {
    setIncomeSheetOpen(open);
    if (!open) setSelectedIncome(undefined);
  }

  function handleIncidentSheetChange(open: boolean) {
    setIncidentSheetOpen(open);
    if (!open) setSelectedIncident(undefined);
  }

  async function handleDeleteIncome(income: ProjectIncome) {
    if (!window.confirm('¿Eliminar este ingreso real de la obra?')) return;
    try {
      await deleteIncome.mutateAsync({ id: income.id, projectId });
      toast.success('Ingreso eliminado');
    } catch {
      toast.error('No se pudo eliminar el ingreso');
    }
  }

  async function handleDeleteIncident(incident: ProjectIncident) {
    if (!window.confirm('¿Eliminar este contratiempo de la obra?')) return;
    try {
      await deleteIncident.mutateAsync({ id: incident.id, projectId });
      toast.success('Contratiempo eliminado');
    } catch {
      toast.error('No se pudo eliminar el contratiempo');
    }
  }

  async function handleExportBudget() {
    if (!project.clientId) {
      toast.error('La obra debe tener un cliente vinculado antes de exportar un presupuesto');
      return;
    }

    try {
      const result = await exportBudget.mutateAsync({ id: projectId });
      toast.success(
        result.skippedStagesCount > 0
          ? `Presupuesto creado con ${result.exportedStagesCount} etapas exportadas`
          : 'Presupuesto creado a partir de las etapas',
      );
      router.push(`/dashboard/presupuestos?edit=${encodeURIComponent(result.budgetId)}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo exportar las etapas a presupuesto',
      );
    }
  }

  return (
    <>
      <ProjectFormSheet project={project} open={editOpen} onOpenChange={setEditOpen} />
      <ProjectIncomeFormSheet
        projectId={projectId}
        income={selectedIncome}
        budgets={project.budgets}
        open={incomeSheetOpen}
        onOpenChange={handleIncomeSheetChange}
      />
      <ProjectIncidentFormSheet
        projectId={projectId}
        incident={selectedIncident}
        open={incidentSheetOpen}
        onOpenChange={handleIncidentSheetChange}
      />

      <div className='min-w-0 w-full space-y-5'>
        {/* Header */}
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 space-y-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='break-words text-2xl font-bold tracking-tight sm:text-3xl'>{project.name}</h1>
              <StatusSelect
                  value={project.status}
                  options={PROJECT_STATUS_SELECT_OPTIONS}
                  onChange={handleProjectStatusChange}
                  isPending={projectStatusPending}
                />
            </div>
            {project.client && (
              <p className='text-muted-foreground text-sm'>
                <Icons.teams className='mr-1 inline h-4 w-4 align-text-bottom' />
                {project.client.name}
              </p>
            )}
            {(project.location || project.startDate || project.estimatedEndDate) && (
              <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
                {project.location && (
                  <span className='flex items-center gap-1.5'>
                    <Icons.obras className='h-3.5 w-3.5 shrink-0' />
                    {project.location}
                  </span>
                )}
                {project.startDate && (
                  <span className='flex items-center gap-1.5'>
                    <Icons.calendar className='h-3.5 w-3.5 shrink-0' />
                    Inicio: {project.startDate.slice(0, 10)}
                  </span>
                )}
                {project.estimatedEndDate && (
                  <span className='flex items-center gap-1.5'>
                    <Icons.calendar className='h-3.5 w-3.5 shrink-0' />
                    Fin est.: {project.estimatedEndDate.slice(0, 10)}
                  </span>
                )}
                {project.actualStartDate && (
                  <span className='flex items-center gap-1.5 text-green-600 dark:text-green-400'>
                    <Icons.calendar className='h-3.5 w-3.5 shrink-0' />
                    Inicio real: {project.actualStartDate.slice(0, 10)}
                  </span>
                )}
                {project.actualEndDate && (
                  <span className='flex items-center gap-1.5 text-blue-600 dark:text-blue-400'>
                    <Icons.calendar className='h-3.5 w-3.5 shrink-0' />
                    Fin real: {project.actualEndDate.slice(0, 10)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className='flex shrink-0 gap-2'>
            <Button size='sm' variant='outline' onClick={() => setEditOpen(true)}>
              <Icons.edit className='h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Editar</span>
            </Button>
            <Button size='sm' variant='outline' asChild>
              <Link href='/dashboard/obras'>
                <Icons.chevronLeft className='h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Volver</span>
              </Link>
            </Button>
          </div>
        </div>

        {project.notes && (
          <p className='text-muted-foreground rounded-md bg-muted/50 px-3 py-2 text-sm'>
            {project.notes}
          </p>
        )}

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue='resumen' className='min-w-0 space-y-5'>
          {/* Scrollable tab strip — stays on one row on mobile */}
          <div className='min-w-0 max-w-full overflow-x-auto'>
            <TabsList className='w-max'>
              <TabsTrigger value='resumen'>Resumen</TabsTrigger>
              <TabsTrigger value='finanzas'>
                Finanzas
                {project.incomes.length > 0 && (
                  <span className='ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums'>
                    {project.incomes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='etapas'>Etapas</TabsTrigger>
              <TabsTrigger value='contratiempos'>
                Contratiempos
                {project.incidents.length > 0 && (
                  <span className='ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums'>
                    {project.incidents.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='documentos'>Documentos</TabsTrigger>
            </TabsList>
          </div>

          {/* Resumen tab */}
          <TabsContent value='resumen' className='space-y-5'>
            <ProjectExecutiveSummary project={project} />

            <div>
              <h3 className='text-sm font-semibold mb-2'>Alertas operativas</h3>
              <ProjectAlertsPanel
                alerts={project.summary.alerts}
                warnings={project.summary.warnings}
              />
            </div>

            {/* Client + template info */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm'>Cliente vinculado</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.client ? (
                    <div className='space-y-1 text-sm'>
                      <div className='font-medium'>{project.client.name}</div>
                      {project.client.email && (
                        <div className='break-all text-muted-foreground'>{project.client.email}</div>
                      )}
                      {project.client.phone && (
                        <div className='text-muted-foreground'>Tel: {project.client.phone}</div>
                      )}
                      {project.client.taxId && (
                        <div className='text-muted-foreground'>CUIT/DNI: {project.client.taxId}</div>
                      )}
                      {project.client.address && (
                        <div className='text-muted-foreground'>{project.client.address}</div>
                      )}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>Sin cliente vinculado.</p>
                  )}
                </CardContent>
              </Card>

              {project.projectTemplate ? (
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm'>Plantilla vinculada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-1'>
                      <div className='font-medium text-sm'>{project.projectTemplate.name}</div>
                      {project.projectTemplate.description && (
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {project.projectTemplate.description}
                        </p>
                      )}
                      <Button size='sm' variant='outline' className='mt-2' asChild>
                        <Link href={`/dashboard/plantillas/${project.projectTemplate.id}`}>
                          Ver plantilla
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          {/* Finanzas tab */}
          <TabsContent value='finanzas'>
            <ProjectFinanceOverview
              project={project}
              expenses={expenses}
              onAddIncome={() => {
                setSelectedIncome(undefined);
                setIncomeSheetOpen(true);
              }}
              onEditIncome={(income) => {
                setSelectedIncome(income);
                setIncomeSheetOpen(true);
              }}
              onDeleteIncome={handleDeleteIncome}
              createExpenseHref={createExpenseHref}
              createBudgetHref={createBudgetHref}
            />
          </TabsContent>

          {/* Etapas tab */}
          <TabsContent value='etapas' className='space-y-4'>
            <div className='flex flex-wrap items-center justify-end gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void handleExportBudget()}
                isLoading={exportBudget.isPending}
              >
                <Icons.download className='h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Exportar etapas a presupuesto</span>
                <span className='sm:hidden'>Exportar</span>
              </Button>
            </div>
            <ErrorBoundary>
              <Suspense fallback={<StagesListSkeleton />}>
                <StagesList projectId={projectId} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* Contratiempos tab */}
          <TabsContent value='contratiempos' className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-base font-semibold'>
                Contratiempos
                {project.incidents.length > 0 && (
                  <span className='text-muted-foreground ml-2 text-sm font-normal'>
                    ({project.incidents.length})
                  </span>
                )}
              </h2>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  setSelectedIncident(undefined);
                  setIncidentSheetOpen(true);
                }}
              >
                <Icons.add className='h-4 w-4 sm:mr-2' />
                <span className='hidden sm:inline'>Nuevo</span>
              </Button>
            </div>

            {project.incidents.length > 0 ? (
              <div className='flex flex-col gap-3'>
                {project.incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className='flex items-start justify-between gap-3 rounded-lg border p-3'
                  >
                    <div className='min-w-0 flex-1 space-y-1'>
                      <div className='font-medium line-clamp-2'>{incident.reason}</div>
                      <div className='flex flex-wrap gap-2 text-sm text-muted-foreground'>
                        <span>{formatDate(incident.incidentDate)}</span>
                        <span>· {incident.delayDays}d {incident.delayHours}h</span>
                        {incident.category && (
                          <span>· {INCIDENT_CATEGORY_LABELS[incident.category] ?? incident.category}</span>
                        )}
                        {incident.projectStage && (
                          <span>· {incident.projectStage.name}</span>
                        )}
                      </div>
                      {incident.notes && (
                        <div className='text-sm text-muted-foreground line-clamp-2'>
                          {incident.notes}
                        </div>
                      )}
                      <div className='flex gap-1 pt-1'>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-7 px-2'
                          onClick={() => {
                            setSelectedIncident(incident);
                            setIncidentSheetOpen(true);
                          }}
                        >
                          <Icons.edit className='h-3.5 w-3.5 sm:mr-1.5' />
                          <span className='hidden sm:inline text-xs'>Editar</span>
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-7 px-2 text-destructive hover:text-destructive'
                          onClick={() => handleDeleteIncident(incident)}
                        >
                          <Icons.trash className='h-3.5 w-3.5 sm:mr-1.5' />
                          <span className='hidden sm:inline text-xs'>Eliminar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed p-8 text-center'>
                <Icons.calendar className='text-muted-foreground mx-auto h-8 w-8 mb-3' />
                <p className='text-muted-foreground text-sm'>No hay contratiempos registrados.</p>
                <p className='text-muted-foreground text-xs mt-1'>
                  Registrá eventos que afecten el cronograma.
                </p>
                <Button
                  size='sm'
                  variant='outline'
                  className='mt-4'
                  onClick={() => {
                    setSelectedIncident(undefined);
                    setIncidentSheetOpen(true);
                  }}
                >
                  <Icons.add className='mr-2 h-4 w-4' />
                  Registrar contratiempo
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Documentos tab */}
          <TabsContent value='documentos'>
            <ProjectDocumentsTab projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='space-y-3'>
        <div className='bg-muted h-9 w-64 animate-pulse rounded' />
        <div className='flex gap-4'>
          <div className='bg-muted h-4 w-32 animate-pulse rounded' />
          <div className='bg-muted h-4 w-32 animate-pulse rounded' />
        </div>
      </div>
      <div className='bg-muted h-px w-full' />
      <div className='bg-muted h-10 w-full max-w-md animate-pulse rounded' />
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='bg-muted h-24 animate-pulse rounded-xl' />
        ))}
      </div>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='bg-muted h-20 animate-pulse rounded-lg' />
        ))}
      </div>
      <StagesListSkeleton />
    </div>
  );
}
