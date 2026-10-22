import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  DocumentFields,
  DocumentRecord,
  PaginationResult,
} from '@shared/api.interface';

export async function getDocuments(params: {
  page?: number;
  pageSize?: number;
  docType?: string;
  status?: string;
}): Promise<PaginationResult<DocumentRecord>> {
  const { data } = await axiosForBackend.get('/api/documents', { params });
  return data;
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const { data } = await axiosForBackend.get(`/api/documents/${id}`);
  return data;
}

export async function uploadDocument(data: {
  fileName: string;
  docType: string;
  projectId?: string;
}): Promise<DocumentRecord> {
  const res = await axiosForBackend.post('/api/documents/upload', data);
  return res.data;
}

export async function crossCheckDocs(docIds: string[]): Promise<{
  docs: DocumentRecord[];
  hasDiscrepancies: boolean;
  discrepancies: {
    field: string;
    fieldLabel: string;
    values: { docId: string; fileName: string; value: string }[];
    severity: string;
  }[];
}> {
  const res = await axiosForBackend.post('/api/documents/cross-check', {
    docIds,
  });
  return res.data;
}

export async function updateDocument(
  id: string,
  data: { extractedFields: Partial<DocumentFields> },
): Promise<DocumentRecord> {
  const res = await axiosForBackend.patch(`/api/documents/${id}`, data);
  return res.data;
}
