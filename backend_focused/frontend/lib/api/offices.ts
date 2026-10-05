import { apiClient } from '@/lib/api-client';
import type {
  Office,
  OfficeListQuery,
  OfficePayload,
  OfficeSummary,
  PaginatedOfficeList,
} from '@/lib/api/types';

export async function listOffices(query: OfficeListQuery): Promise<PaginatedOfficeList> {
  const { data } = await apiClient.get<PaginatedOfficeList>('/offices/', { params: query });
  return data;
}

export async function createOffice(payload: OfficePayload): Promise<Office> {
  const { data } = await apiClient.post<Office>('/offices/', payload);
  return data;
}

export async function updateOffice(id: number, payload: OfficePayload): Promise<Office> {
  const { data } = await apiClient.patch<Office>(`/offices/${id}/`, payload);
  return data;
}

export async function deleteOffice(id: number): Promise<void> {
  await apiClient.delete(`/offices/${id}/`);
}

export async function getOfficeSummary(): Promise<OfficeSummary[]> {
  const { data } = await apiClient.get<OfficeSummary[]>('/offices/summary/');
  return data;
}
