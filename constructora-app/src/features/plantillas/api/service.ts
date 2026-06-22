import { apiClient } from '@/lib/api-client';
import type {
  ProjectTemplate,
  ProjectTemplateDetail,
  ProjectTemplateStage,
  ProjectTemplatesResponse,
  TemplateFilters,
  TemplateMutationPayload,
  TemplateStageMutationPayload,
} from './types';

export async function getTemplates(filters: TemplateFilters): Promise<ProjectTemplatesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.take) params.set('take', String(filters.take));
  if (filters.search) params.set('search', filters.search);
  return apiClient<ProjectTemplatesResponse>(`/project-templates?${params.toString()}`);
}

export async function getTemplate(id: string): Promise<ProjectTemplateDetail> {
  return apiClient<ProjectTemplateDetail>(`/project-templates/${id}`);
}

export async function createTemplate(data: TemplateMutationPayload): Promise<ProjectTemplate> {
  return apiClient<ProjectTemplate>('/project-templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(
  id: string,
  data: Partial<TemplateMutationPayload>,
): Promise<ProjectTemplate> {
  return apiClient<ProjectTemplate>(`/project-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient<void>(`/project-templates/${id}`, { method: 'DELETE' });
}

// Template Stages
export async function getTemplateStages(templateId: string): Promise<ProjectTemplateStage[]> {
  return apiClient<ProjectTemplateStage[]>(`/project-templates/${templateId}/stages`);
}

export async function createTemplateStage(
  templateId: string,
  data: TemplateStageMutationPayload,
): Promise<ProjectTemplateStage> {
  return apiClient<ProjectTemplateStage>(`/project-templates/${templateId}/stages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplateStage(
  templateId: string,
  stageId: string,
  data: Partial<TemplateStageMutationPayload>,
): Promise<ProjectTemplateStage> {
  return apiClient<ProjectTemplateStage>(`/project-templates/${templateId}/stages/${stageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplateStage(templateId: string, stageId: string): Promise<void> {
  await apiClient<void>(`/project-templates/${templateId}/stages/${stageId}`, {
    method: 'DELETE',
  });
}
