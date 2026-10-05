import { apiClient } from '@/lib/api-client';
import type {
  DuplicateCheck,
  DuplicateCheckQuery,
  PaginatedVehicleList,
  Vehicle,
  VehicleCreatePayload,
  VehicleListQuery,
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
