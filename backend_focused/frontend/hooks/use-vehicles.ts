'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { DuplicateCheckQuery, VehicleListQuery, VehicleUpdatePayload } from '@/lib/api/types';
import {
  checkVehicleDuplicates,
  createVehicle,
  deleteVehicle,
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

export function useVehicleDuplicateCheck(query: DuplicateCheckQuery) {
  return useQuery({
    queryKey: queryKeys.vehicles.duplicateCheck(query),
    queryFn: () => checkVehicleDuplicates(query),
    enabled: Boolean(query.vin || query.license_plate),
    staleTime: 0,
  });
}

/** Vehicle changes affect vehicle lists, details and the office statistics. */
function useInvalidateFleetData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.offices.all }),
    ]);
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
