export interface ProjectTemplateStageTask {
  id: string;
  tenantId: string;
  projectTemplateStageId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplateStage {
  id: string;
  tenantId: string;
  projectTemplateId: string;
  name: string;
  description: string | null;
  position: number;
  weightPercent: number | null;
  tasks: ProjectTemplateStageTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplateDetail extends ProjectTemplate {
  stages: ProjectTemplateStage[];
}

export interface ProjectTemplatesResponse {
  items: ProjectTemplate[];
  total: number;
  page: number;
  take: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TemplateFilters {
  page?: number;
  take?: number;
  search?: string;
}

export interface TemplateMutationPayload {
  name: string;
  description?: string;
}

export interface TemplateStageMutationPayload {
  name: string;
  description?: string;
  position?: number;
  weightPercent?: number;
  tasks?: Array<{
    title: string;
  }>;
}
