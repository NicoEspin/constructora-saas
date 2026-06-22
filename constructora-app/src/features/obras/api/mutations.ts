import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  applyProjectTemplate,
  createProject,
  createProjectIncident,
  createProjectIncome,
  updateProject,
  updateProjectIncident,
  updateProjectIncome,
  deleteProject,
  deleteProjectIncident,
  deleteProjectIncome,
  createStage,
  updateStage,
  deleteStage,
} from './service';
import { projectKeys } from './queries';
import type {
  ProjectDetail,
  ProjectIncident,
  ProjectIncidentMutationPayload,
  ProjectIncome,
  ProjectIncomeMutationPayload,
  ProjectMutationPayload,
  ProjectStage,
  ProjectsResponse,
  StageMutationPayload,
} from './types';

export const createProjectMutation = mutationOptions({
  mutationFn: (data: ProjectMutationPayload) => createProject(data),
  onSuccess: (newProject: ProjectDetail) => {
    getQueryClient().setQueriesData<ProjectsResponse>(
      { queryKey: [...projectKeys.all, 'list'] },
      (old) => old ? { ...old, items: [newProject, ...old.items], total: old.total + 1 } : old,
    );
  },
});

export const updateProjectMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<ProjectMutationPayload> }) =>
    updateProject(id, data),
  onSuccess: (updated: ProjectDetail) => {
    const qc = getQueryClient();
    qc.setQueriesData<ProjectsResponse>(
      { queryKey: [...projectKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((p) => (p.id === updated.id ? updated : p)) }
          : old,
    );
    qc.setQueryData(projectKeys.detail(updated.id), updated);
  },
});

export const deleteProjectMutation = mutationOptions({
  mutationFn: (id: string) => deleteProject(id),
  onSuccess: (_: void, id: string) => {
    getQueryClient().setQueriesData<ProjectsResponse>(
      { queryKey: [...projectKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.filter((p) => p.id !== id), total: old.total - 1 }
          : old,
    );
  },
});

export const applyProjectTemplateMutation = mutationOptions({
  mutationFn: ({ id }: { id: string }) => applyProjectTemplate(id, { mode: 'append' }),
  onSuccess: ({ project }) => {
    const qc = getQueryClient();
    qc.setQueryData(projectKeys.detail(project.id), project);
    qc.invalidateQueries({ queryKey: projectKeys.stages(project.id) });
  },
});

export const createStageMutation = mutationOptions({
  mutationFn: ({ projectId, data }: { projectId: string; data: StageMutationPayload }) =>
    createStage(projectId, data),
  onSuccess: (stage: ProjectStage) => {
    const qc = getQueryClient();
    qc.setQueriesData<ProjectStage[]>(
      { queryKey: projectKeys.stages(stage.projectId) },
      (old) => (old ? [...old, stage] : [stage]),
    );
    qc.invalidateQueries({ queryKey: projectKeys.detail(stage.projectId) });
  },
});

export const updateStageMutation = mutationOptions({
  mutationFn: ({
    projectId,
    stageId,
    data,
  }: {
    projectId: string;
    stageId: string;
    data: Partial<StageMutationPayload>;
  }) => updateStage(projectId, stageId, data),
  onSuccess: (stage: ProjectStage) => {
    const qc = getQueryClient();
    qc.setQueriesData<ProjectStage[]>(
      { queryKey: projectKeys.stages(stage.projectId) },
      (old) => (old ? old.map((s) => (s.id === stage.id ? stage : s)) : old),
    );
    qc.invalidateQueries({ queryKey: projectKeys.detail(stage.projectId) });
  },
});

export const deleteStageMutation = mutationOptions({
  mutationFn: ({ projectId, stageId }: { projectId: string; stageId: string }) =>
    deleteStage(projectId, stageId),
  onSuccess: (_: void, { projectId, stageId }: { projectId: string; stageId: string }) => {
    const qc = getQueryClient();
    qc.setQueriesData<ProjectStage[]>(
      { queryKey: projectKeys.stages(projectId) },
      (old) => (old ? old.filter((s) => s.id !== stageId) : old),
    );
    qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  },
});

export const createProjectIncomeMutation = mutationOptions({
  mutationFn: (data: ProjectIncomeMutationPayload) => createProjectIncome(data),
  onSuccess: (income: ProjectIncome) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(income.projectId) });
  },
});

export const updateProjectIncomeMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<ProjectIncomeMutationPayload> }) =>
    updateProjectIncome(id, data),
  onSuccess: (income: ProjectIncome) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(income.projectId) });
  },
});

export const deleteProjectIncomeMutation = mutationOptions({
  mutationFn: ({ id }: { id: string; projectId: string }) => deleteProjectIncome(id),
  onSuccess: (_: void, { projectId }: { id: string; projectId: string }) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  },
});

export const createProjectIncidentMutation = mutationOptions({
  mutationFn: (data: ProjectIncidentMutationPayload) => createProjectIncident(data),
  onSuccess: (incident: ProjectIncident) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(incident.projectId) });
  },
});

export const updateProjectIncidentMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<ProjectIncidentMutationPayload> }) =>
    updateProjectIncident(id, data),
  onSuccess: (incident: ProjectIncident) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(incident.projectId) });
  },
});

export const deleteProjectIncidentMutation = mutationOptions({
  mutationFn: ({ id }: { id: string; projectId: string }) => deleteProjectIncident(id),
  onSuccess: (_: void, { projectId }: { id: string; projectId: string }) => {
    getQueryClient().invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  },
});
