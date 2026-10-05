'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getOfficeSummary } from '@/lib/api/offices';
import type { VehiclesNeedingMaintenanceQuery } from '@/lib/api/types';
import { listVehiclesNeedingMaintenance } from '@/lib/api/vehicles';
import { queryKeys } from '@/lib/query-keys';

export function useOfficeSummary() {
  return useQuery({ queryKey: queryKeys.offices.summary(), queryFn: getOfficeSummary });
}

export function useVehiclesNeedingMaintenance(query: VehiclesNeedingMaintenanceQuery) {
  return useQuery({
    queryKey: queryKeys.vehicles.needingMaintenance(query),
    queryFn: () => listVehiclesNeedingMaintenance(query),
    placeholderData: keepPreviousData,
  });
}
