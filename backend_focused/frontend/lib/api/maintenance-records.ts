import { apiClient } from '@/lib/api-client';
import type {
  MaintenanceRecord,
  MaintenanceRecordCreatePayload,
  MaintenanceRecordUpdatePayload,
} from '@/lib/api/types';

export async function createMaintenanceRecord(
  payload: MaintenanceRecordCreatePayload,
): Promise<MaintenanceRecord> {
  const { data } = await apiClient.post<MaintenanceRecord>('/maintenance-records/', payload);
  return data;
}

export async function updateMaintenanceRecord(
  id: number,
  payload: MaintenanceRecordUpdatePayload,
): Promise<MaintenanceRecord> {
  const { data } = await apiClient.patch<MaintenanceRecord>(`/maintenance-records/${id}/`, payload);
  return data;
}

export async function deleteMaintenanceRecord(id: number): Promise<void> {
  await apiClient.delete(`/maintenance-records/${id}/`);
}
