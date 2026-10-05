import { apiClient } from '@/lib/api-client';
import type { OfficeListQuery, PaginatedOfficeList } from '@/lib/api/types';

export async function listOffices(query: OfficeListQuery): Promise<PaginatedOfficeList> {
  const { data } = await apiClient.get<PaginatedOfficeList>('/offices/', { params: query });
  return data;
}
