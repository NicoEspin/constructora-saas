import { queryOptions } from '@tanstack/react-query';
import { getProject, getProjectIncomesMonthlySummary, getProjects, getStages } from './service';
import type { ProjectFilters } from './types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.all, 'list', filters] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  stages: (projectId: string) => [...projectKeys.all, 'stages', projectId] as const,
};

export const projectIncomeKeys = {
  all: ['project-incomes'] as const,
  monthlySummary: () => [...projectIncomeKeys.all, 'monthly-summary'] as const,
};

export const projectsQueryOptions = (filters: ProjectFilters) =>
  queryOptions({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters),
  });

export const projectQueryOptions = (id: string) =>
  queryOptions({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
  });

export const stagesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: projectKeys.stages(projectId),
    queryFn: () => getStages(projectId),
  });

export const projectIncomeMonthlySummaryQueryOptions = () =>
  queryOptions({
    queryKey: projectIncomeKeys.monthlySummary(),
    queryFn: () => getProjectIncomesMonthlySummary(),
  });
