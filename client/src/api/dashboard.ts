import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { DashboardStats, IndustryData, Conversation, AgentTask, PaginationResult } from '@shared/api.interface';

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await axiosForBackend.get<DashboardStats>('/api/analytics/dashboard');
  return data;
}

export async function getIndustryData(): Promise<IndustryData> {
  const { data } = await axiosForBackend.get<IndustryData>('/api/analytics/industry-data');
  return data;
}

export async function getRecentConversations(): Promise<PaginationResult<Conversation>> {
  const { data } = await axiosForBackend.get<PaginationResult<Conversation>>(
    '/api/customer-service/conversations',
    { params: { page: 1, pageSize: 5 } },
  );
  return data;
}

export async function getRecentAgentTasks(): Promise<PaginationResult<AgentTask>> {
  const { data } = await axiosForBackend.get<PaginationResult<AgentTask>>(
    '/api/agents/tasks',
    { params: { page: 1, pageSize: 5 } },
  );
  return data;
}
