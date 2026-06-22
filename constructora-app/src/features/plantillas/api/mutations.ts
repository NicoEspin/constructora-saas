import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createTemplate,
  createTemplateStage,
  deleteTemplate,
  deleteTemplateStage,
  updateTemplate,
  updateTemplateStage,
} from './service';
import { templateKeys } from './queries';
import type {
  ProjectTemplate,
  ProjectTemplatesResponse,
  TemplateMutationPayload,
  TemplateStageMutationPayload,
} from './types';

export const createTemplateMutation = mutationOptions({
  mutationFn: (data: TemplateMutationPayload) => createTemplate(data),
  onSuccess: (newTemplate: ProjectTemplate) => {
    getQueryClient().setQueriesData<ProjectTemplatesResponse>(
      { queryKey: [...templateKeys.all, 'list'] },
      (old) => old ? { ...old, items: [newTemplate, ...old.items], total: old.total + 1 } : old,
    );
  },
});

export const updateTemplateMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: Partial<TemplateMutationPayload> }) =>
    updateTemplate(id, data),
  onSuccess: (updated: ProjectTemplate) => {
    const qc = getQueryClient();
    qc.setQueriesData<ProjectTemplatesResponse>(
      { queryKey: [...templateKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.map((t) => (t.id === updated.id ? updated : t)) }
          : old,
    );
    qc.invalidateQueries({ queryKey: templateKeys.detail(updated.id) });
  },
});

export const deleteTemplateMutation = mutationOptions({
  mutationFn: (id: string) => deleteTemplate(id),
  onSuccess: (_: void, id: string) => {
    getQueryClient().setQueriesData<ProjectTemplatesResponse>(
      { queryKey: [...templateKeys.all, 'list'] },
      (old) =>
        old
          ? { ...old, items: old.items.filter((t) => t.id !== id), total: old.total - 1 }
          : old,
    );
  },
});

export const createTemplateStageMutation = mutationOptions({
  mutationFn: ({
    templateId,
    data,
  }: {
    templateId: string;
    data: TemplateStageMutationPayload;
  }) => createTemplateStage(templateId, data),
  onSuccess: (stage) => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: templateKeys.stages(stage.projectTemplateId) });
    qc.invalidateQueries({ queryKey: templateKeys.detail(stage.projectTemplateId) });
  },
});

export const updateTemplateStageMutation = mutationOptions({
  mutationFn: ({
    templateId,
    stageId,
    data,
  }: {
    templateId: string;
    stageId: string;
    data: Partial<TemplateStageMutationPayload>;
  }) => updateTemplateStage(templateId, stageId, data),
  onSuccess: (stage) => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: templateKeys.stages(stage.projectTemplateId) });
    qc.invalidateQueries({ queryKey: templateKeys.detail(stage.projectTemplateId) });
  },
});

export const deleteTemplateStageMutation = mutationOptions({
  mutationFn: ({ templateId, stageId }: { templateId: string; stageId: string }) =>
    deleteTemplateStage(templateId, stageId),
  onSuccess: (_, { templateId }) => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: templateKeys.stages(templateId) });
    qc.invalidateQueries({ queryKey: templateKeys.detail(templateId) });
  },
});
