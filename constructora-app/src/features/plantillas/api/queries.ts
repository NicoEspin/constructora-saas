import { queryOptions } from '@tanstack/react-query';
import { getTemplate, getTemplates, getTemplateStages } from './service';
import type { TemplateFilters } from './types';

export const templateKeys = {
  all: ['project-templates'] as const,
  list: (filters: TemplateFilters) => [...templateKeys.all, 'list', filters] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
  stages: (templateId: string) => [...templateKeys.all, 'stages', templateId] as const,
};

export const templatesQueryOptions = (filters: TemplateFilters) =>
  queryOptions({
    queryKey: templateKeys.list(filters),
    queryFn: () => getTemplates(filters),
  });

export const templateQueryOptions = (id: string) =>
  queryOptions({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplate(id),
  });

export const templateStagesQueryOptions = (templateId: string) =>
  queryOptions({
    queryKey: templateKeys.stages(templateId),
    queryFn: () => getTemplateStages(templateId),
  });
