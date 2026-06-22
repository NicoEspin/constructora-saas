import { apiClient } from '@/lib/api-client';
import type { ProjectExecutiveReport, ProjectOperationalReport } from './types';

export async function getProjectOperationalReport(
  projectId: string,
): Promise<ProjectOperationalReport> {
  return apiClient<ProjectOperationalReport>(`/reports/projects/${projectId}/operational`);
}

export async function getProjectExecutiveReport(
  projectId: string,
): Promise<ProjectExecutiveReport> {
  return apiClient<ProjectExecutiveReport>(`/reports/projects/${projectId}/executive`);
}
