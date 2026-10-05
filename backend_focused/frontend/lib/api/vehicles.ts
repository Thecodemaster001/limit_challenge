import { apiClient } from '@/lib/api-client';
import type {
  DuplicateCheck,
  DuplicateCheckQuery,
  PaginatedVehicleList,
  PaginatedVehicleMaintenanceRecordList,
  PaginatedVehicleNeedingMaintenanceList,
  Vehicle,
  VehicleCreatePayload,
  VehicleDetail,
  VehicleListQuery,
  VehicleMaintenanceHistoryQuery,
  VehicleOfficeAssignment,
  VehiclesNeedingMaintenanceQuery,
  VehicleUpdatePayload,
} from '@/lib/api/types';

export async function listVehicles(query: VehicleListQuery): Promise<PaginatedVehicleList> {
  const { data } = await apiClient.get<PaginatedVehicleList>('/vehicles/', { params: query });
  return data;
}

export async function createVehicle(payload: VehicleCreatePayload): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>('/vehicles/', payload);
  return data;
}

export async function updateVehicle(id: number, payload: VehicleUpdatePayload): Promise<Vehicle> {
  const { data } = await apiClient.patch<Vehicle>(`/vehicles/${id}/`, payload);
  return data;
}

export async function deleteVehicle(id: number): Promise<void> {
  await apiClient.delete(`/vehicles/${id}/`);
}

export async function checkVehicleDuplicates(query: DuplicateCheckQuery): Promise<DuplicateCheck> {
  const { data } = await apiClient.get<DuplicateCheck>('/vehicles/duplicate-check/', {
    params: query,
  });
  return data;
}

export async function getVehicle(id: number): Promise<VehicleDetail> {
  const { data } = await apiClient.get<VehicleDetail>(`/vehicles/${id}/`);
  return data;
}

export async function listVehicleMaintenanceHistory(
  id: number,
  query: VehicleMaintenanceHistoryQuery,
): Promise<PaginatedVehicleMaintenanceRecordList> {
  const { data } = await apiClient.get<PaginatedVehicleMaintenanceRecordList>(
    `/vehicles/${id}/maintenance-history/`,
    { params: query },
  );
  return data;
}

export async function assignVehicleOffice(
  id: number,
  assignment: VehicleOfficeAssignment,
): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>(`/vehicles/${id}/assign/`, assignment);
  return data;
}

export async function listVehiclesNeedingMaintenance(
  query: VehiclesNeedingMaintenanceQuery,
): Promise<PaginatedVehicleNeedingMaintenanceList> {
  const { data } = await apiClient.get<PaginatedVehicleNeedingMaintenanceList>(
    '/vehicles/needing-maintenance/',
    { params: query },
  );
  return data;
}
