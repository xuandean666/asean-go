import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ComplianceReport,
  PaginationResult,
  PaginationParams,
  CreateComplianceRequest,
} from '@shared/api.interface';

export async function getReports(params: PaginationParams): Promise<PaginationResult<ComplianceReport>> {
  const { data } = await axiosForBackend.get<PaginationResult<ComplianceReport>>(
    '/api/compliance/reports',
    { params },
  );
  return data;
}

export async function getReport(id: string): Promise<ComplianceReport> {
  const { data } = await axiosForBackend.get<ComplianceReport>(`/api/compliance/reports/${id}`);
  return data;
}

export async function createReport(data: CreateComplianceRequest): Promise<ComplianceReport> {
  const { data: result } = await axiosForBackend.post<ComplianceReport>(
    '/api/compliance/reports',
    data,
  );
  return result;
}
