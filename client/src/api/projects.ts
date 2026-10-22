import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Project,
  PaginationResult,
  CreateProjectRequest,
} from '@shared/api.interface';

interface GetProjectsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
}

export async function getProjects(params: GetProjectsParams = {}): Promise<PaginationResult<Project>> {
  const { data } = await axiosForBackend.get<PaginationResult<Project>>('/api/projects', { params });
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await axiosForBackend.get<Project>(`/api/projects/${id}`);
  return data;
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const res = await axiosForBackend.post<Project>('/api/projects', data);
  return res.data;
}

export async function updateProject(
  id: string,
  data: Partial<CreateProjectRequest> & { status?: string },
): Promise<Project> {
  const res = await axiosForBackend.patch<Project>(`/api/projects/${id}`, data);
  return res.data;
}

export async function deleteProject(id: string): Promise<{ success: true }> {
  const res = await axiosForBackend.delete<{ success: true }>(`/api/projects/${id}`);
  return res.data;
}
