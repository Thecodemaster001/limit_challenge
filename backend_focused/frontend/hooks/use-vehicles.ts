'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { useInvalidateFleetData } from '@/hooks/use-invalidate-fleet-data';
import type {
  DuplicateCheckQuery,
  VehicleListQuery,
  VehicleMaintenanceHistoryQuery,
  VehicleUpdatePayload,
} from '@/lib/api/types';
import {
  assignVehicleOffice,
  checkVehicleDuplicates,
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicleMaintenanceHistory,
  listVehicles,
  updateVehicle,
} from '@/lib/api/vehicles';
import { queryKeys } from '@/lib/query-keys';

export function useVehicleList(query: VehicleListQuery, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.vehicles.list(query),
    queryFn: () => listVehicles(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useVehicleDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: () => getVehicle(id),
  });
}

export function useVehicleMaintenanceHistory(id: number, query: VehicleMaintenanceHistoryQuery) {
  return useQuery({
    queryKey: queryKeys.vehicles.maintenanceHistory(id, query),
    queryFn: () => listVehicleMaintenanceHistory(id, query),
    placeholderData: keepPreviousData,
  });
}

export function useVehicleDuplicateCheck(query: DuplicateCheckQuery) {
  return useQuery({
    queryKey: queryKeys.vehicles.duplicateCheck(query),
    queryFn: () => checkVehicleDuplicates(query),
    enabled: Boolean(query.vin || query.license_plate),
    staleTime: 0,
  });
}

export function useCreateVehicle() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: createVehicle, onSuccess: invalidateFleetData });
}

export function useUpdateVehicle() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: VehicleUpdatePayload }) =>
      updateVehicle(id, changes),
    onSuccess: invalidateFleetData,
  });
}

export function useDeleteVehicle() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: deleteVehicle, onSuccess: invalidateFleetData });
}

export function useAssignVehicleOffice() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({
    mutationFn: ({ id, officeId }: { id: number; officeId: number }) =>
      assignVehicleOffice(id, { office: officeId }),
    onSuccess: invalidateFleetData,
  });
}
