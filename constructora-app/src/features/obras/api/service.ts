import { apiClient } from '@/lib/api-client';
import type {
  ApplyProjectTemplatePayload,
  ApplyProjectTemplateResponse,
  ExportProjectBudgetResponse,
  ProjectDetail,
  ProjectFilters,
  ProjectIncident,
  ProjectIncidentMutationPayload,
  ProjectIncome,
  ProjectIncomeMonthlySummary,
  ProjectIncomeMutationPayload,
  ProjectMutationPayload,
  ProjectStage,
  ProjectsResponse,
  StageMutationPayload,
} from './types';

export async function getProjects(filters: ProjectFilters): Promise<ProjectsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.take) params.set('take', String(filters.take));
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);
  return apiClient<ProjectsResponse>(`/projects?${params.toString()}`);
}

export async function getProject(id: string): Promise<ProjectDetail> {
  return apiClient<ProjectDetail>(`/projects/${id}`);
}

export async function createProject(data: ProjectMutationPayload): Promise<ProjectDetail> {
  return apiClient<ProjectDetail>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: Partial<ProjectMutationPayload>): Promise<ProjectDetail> {
  return apiClient<ProjectDetail>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient<void>(`/projects/${id}`, { method: 'DELETE' });
}

export async function applyProjectTemplate(
  id: string,
  data: ApplyProjectTemplatePayload = { mode: 'append' },
): Promise<ApplyProjectTemplateResponse> {
  return apiClient<ApplyProjectTemplateResponse>(`/projects/${id}/apply-template`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function exportProjectBudget(id: string): Promise<ExportProjectBudgetResponse> {
  return apiClient<ExportProjectBudgetResponse>(`/projects/${id}/export-budget`, {
    method: 'POST',
  });
}

// Stages
export async function getStages(projectId: string): Promise<ProjectStage[]> {
  return apiClient<ProjectStage[]>(`/projects/${projectId}/stages`);
}

export async function getStage(projectId: string, stageId: string): Promise<ProjectStage> {
  return apiClient<ProjectStage>(`/projects/${projectId}/stages/${stageId}`);
}

export async function createStage(projectId: string, data: StageMutationPayload): Promise<ProjectStage> {
  return apiClient<ProjectStage>(`/projects/${projectId}/stages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStage(
  projectId: string,
  stageId: string,
  data: Partial<StageMutationPayload>,
): Promise<ProjectStage> {
  return apiClient<ProjectStage>(`/projects/${projectId}/stages/${stageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStage(projectId: string, stageId: string): Promise<void> {
  await apiClient<void>(`/projects/${projectId}/stages/${stageId}`, { method: 'DELETE' });
}

export async function createProjectIncome(
  data: ProjectIncomeMutationPayload,
): Promise<ProjectIncome> {
  return apiClient<ProjectIncome>('/project-incomes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProjectIncome(
  id: string,
  data: Partial<ProjectIncomeMutationPayload>,
): Promise<ProjectIncome> {
  return apiClient<ProjectIncome>(`/project-incomes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProjectIncome(id: string): Promise<void> {
  await apiClient<void>(`/project-incomes/${id}`, { method: 'DELETE' });
}

export async function getProjectIncomesMonthlySummary(): Promise<ProjectIncomeMonthlySummary> {
  return apiClient<ProjectIncomeMonthlySummary>('/project-incomes/summary/monthly');
}

export async function createProjectIncident(
  data: ProjectIncidentMutationPayload,
): Promise<ProjectIncident> {
  return apiClient<ProjectIncident>('/project-incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProjectIncident(
  id: string,
  data: Partial<ProjectIncidentMutationPayload>,
): Promise<ProjectIncident> {
  return apiClient<ProjectIncident>(`/project-incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProjectIncident(id: string): Promise<void> {
  await apiClient<void>(`/project-incidents/${id}`, { method: 'DELETE' });
}
