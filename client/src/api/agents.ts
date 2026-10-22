import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  AgentTask,
  AgentStep,
  PaginationResult,
  PaginationParams,
  CreateAgentTaskRequest,
} from '@shared/api.interface';

export async function getTasks(
  params: PaginationParams,
): Promise<PaginationResult<AgentTask>> {
  const { data } = await axiosForBackend.get<PaginationResult<AgentTask>>(
    '/api/agents/tasks',
    { params },
  );
  return data;
}

export async function getTask(id: string): Promise<AgentTask> {
  const { data } = await axiosForBackend.get<AgentTask>(`/api/agents/tasks/${id}`);
  return data;
}

export async function getTaskSteps(id: string): Promise<AgentStep[]> {
  const { data } = await axiosForBackend.get<AgentStep[]>(
    `/api/agents/tasks/${id}/steps`,
  );
  return data;
}

export async function createTask(data: CreateAgentTaskRequest): Promise<AgentTask> {
  const { data: result } = await axiosForBackend.post<AgentTask>(
    '/api/agents/tasks',
    data,
  );
  return result;
}

export async function rerunStep(taskId: string, stepKey: string): Promise<AgentStep> {
  const { data } = await axiosForBackend.post<AgentStep>(
    `/api/agents/tasks/${taskId}/steps/${stepKey}/rerun`,
  );
  return data;
}
