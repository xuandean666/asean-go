import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  PaginationResult,
} from '@shared/api.interface';

interface GetConversationsParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  language?: string;
}

export async function getConversations(
  params: GetConversationsParams = {},
): Promise<PaginationResult<Conversation>> {
  const { data } = await axiosForBackend.get<PaginationResult<Conversation>>(
    '/api/customer-service/conversations',
    { params },
  );
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await axiosForBackend.get<Conversation>(
    `/api/customer-service/conversations/${id}`,
  );
  return data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await axiosForBackend.get<Message[]>(
    `/api/customer-service/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function createConversation(data: {
  title: string;
  projectId?: string;
  languagePair: string;
  meta?: Record<string, unknown>;
}): Promise<Conversation> {
  const { data: result } = await axiosForBackend.post<Conversation>(
    '/api/customer-service/conversations',
    data,
  );
  return result;
}

export async function sendMessage(
  conversationId: string,
  data: SendMessageRequest,
): Promise<Message> {
  const { data: result } = await axiosForBackend.post<Message>(
    `/api/customer-service/conversations/${conversationId}/messages`,
    data,
  );
  return result;
}
