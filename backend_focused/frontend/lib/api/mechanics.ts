import { apiClient } from '@/lib/api-client';
import type { MechanicListQuery, PaginatedMechanicList } from '@/lib/api/types';

export async function listMechanics(query: MechanicListQuery): Promise<PaginatedMechanicList> {
  const { data } = await apiClient.get<PaginatedMechanicList>('/mechanics/', { params: query });
  return data;
}
