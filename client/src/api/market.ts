import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  MarketReport,
  PaginationResult,
  PaginationParams,
  CreateMarketReportRequest,
} from '@shared/api.interface';

export async function getReports(params: PaginationParams): Promise<PaginationResult<MarketReport>> {
  const { data } = await axiosForBackend.get<PaginationResult<MarketReport>>(
    '/api/market/reports',
    { params },
  );
  return data;
}

export async function getReport(id: string): Promise<MarketReport> {
  const { data } = await axiosForBackend.get<MarketReport>(`/api/market/reports/${id}`);
  return data;
}

export async function createReport(data: CreateMarketReportRequest): Promise<MarketReport> {
  const { data: result } = await axiosForBackend.post<MarketReport>(
    '/api/market/reports',
    data,
  );
  return result;
}
