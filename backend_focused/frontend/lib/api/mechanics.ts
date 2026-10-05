import { apiClient } from '@/lib/api-client';
import type {
  Mechanic,
  MechanicListQuery,
  MechanicPayload,
  MechanicUpdatePayload,
  PaginatedMechanicList,
} from '@/lib/api/types';

export async function listMechanics(query: MechanicListQuery): Promise<PaginatedMechanicList> {
  const { data } = await apiClient.get<PaginatedMechanicList>('/mechanics/', { params: query });
  return data;
}

export async function createMechanic(payload: MechanicPayload): Promise<Mechanic> {
  const { data } = await apiClient.post<Mechanic>('/mechanics/', payload);
  return data;
}

export async function updateMechanic(
  id: number,
  payload: MechanicUpdatePayload,
): Promise<Mechanic> {
  const { data } = await apiClient.patch<Mechanic>(`/mechanics/${id}/`, payload);
  return data;
}

export async function deleteMechanic(id: number): Promise<void> {
  await apiClient.delete(`/mechanics/${id}/`);
}
