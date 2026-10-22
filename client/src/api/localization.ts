import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  CreateLocalizationRequest,
  PaginationResult,
  ProductLocalization,
} from '@shared/api.interface';

export async function getProducts(params: {
  page?: number;
  pageSize?: number;
  platform?: string;
  language?: string;
}): Promise<PaginationResult<ProductLocalization>> {
  const { data } = await axiosForBackend.get('/api/localization/products', {
    params,
  });
  return data;
}

export async function getProduct(id: string): Promise<ProductLocalization> {
  const { data } = await axiosForBackend.get(
    `/api/localization/products/${id}`,
  );
  return data;
}

export async function createProduct(
  data: CreateLocalizationRequest,
): Promise<ProductLocalization> {
  const res = await axiosForBackend.post(
    '/api/localization/products',
    data,
  );
  return res.data;
}

export async function regenerateProduct(
  id: string,
  language: string,
): Promise<ProductLocalization> {
  const res = await axiosForBackend.post(
    `/api/localization/products/${id}/regenerate`,
    { language },
  );
  return res.data;
}
