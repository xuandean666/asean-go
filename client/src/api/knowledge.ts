import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  KnowledgeItem,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  PaginationResult,
} from '@shared/api.interface';

type GetItemsParams = {
  page: number;
  pageSize: number;
  category?: string;
  country?: string;
  itemType?: string;
  keyword?: string;
};

export async function getItems(
  params: GetItemsParams,
): Promise<PaginationResult<KnowledgeItem>> {
  const { data } = await axiosForBackend.get<PaginationResult<KnowledgeItem>>(
    '/api/knowledge/items',
    { params },
  );
  return data;
}

export async function getItem(id: string): Promise<KnowledgeItem> {
  const { data } = await axiosForBackend.get<KnowledgeItem>(
    `/api/knowledge/items/${id}`,
  );
  return data;
}

export async function searchKnowledge(
  data: KnowledgeSearchRequest,
): Promise<KnowledgeSearchResult> {
  const { data: result } = await axiosForBackend.post<KnowledgeSearchResult>(
    '/api/knowledge/search',
    data,
  );
  return result;
}

export async function createItem(
  data: Omit<KnowledgeItem, 'id' | 'createdAt' | 'status'>,
): Promise<KnowledgeItem> {
  const { data: result } = await axiosForBackend.post<KnowledgeItem>(
    '/api/knowledge/items',
    data,
  );
  return result;
}
