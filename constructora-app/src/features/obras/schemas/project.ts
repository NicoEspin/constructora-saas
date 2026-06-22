import * as z from 'zod';
import type { ProjectStatus, ProjectStageStatus } from '../api/types';

const PROJECT_STATUSES = ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;
const STAGE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED'] as const;

export const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(160),
  status: z.enum(PROJECT_STATUSES),
  clientId: z.string().optional(),
  projectTemplateId: z.string().optional(),
  location: z.string().max(255).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  estimatedEndDate: z.string().optional().or(z.literal('')),
  actualStartDate: z.string().optional().or(z.literal('')),
  actualEndDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const stageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(STAGE_STATUSES),
  weightPercent: z.number().int().min(0).max(100).optional(),
  estimatedStartDate: z.string().optional().or(z.literal('')),
  estimatedEndDate: z.string().optional().or(z.literal('')),
  actualStartDate: z.string().optional().or(z.literal('')),
  actualEndDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  tasks: z.array(
    z.object({
      title: z.string().min(1, 'La tarea es requerida').max(240),
      completed: z.boolean(),
    }),
  ),
});

export type StageFormValues = z.infer<typeof stageSchema>;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'En curso',
  PAUSED: 'Pausada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const STAGE_STATUS_LABELS: Record<ProjectStageStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  PAUSED: 'Pausada',
};

export const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({
  value: s,
  label: PROJECT_STATUS_LABELS[s],
}));

export const STAGE_STATUS_OPTIONS = STAGE_STATUSES.map((s) => ({
  value: s,
  label: STAGE_STATUS_LABELS[s],
}));
