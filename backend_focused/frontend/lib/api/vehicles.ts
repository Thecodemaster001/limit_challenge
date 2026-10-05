import { apiClient } from '@/lib/api-client';
import type { PaginatedVehicleList, VehicleListQuery } from '@/lib/api/types';

export async function listVehicles(query: VehicleListQuery): Promise<PaginatedVehicleList> {
  const { data } = await apiClient.get<PaginatedVehicleList>('/vehicles/', { params: query });
  return data;
}
