'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { VehicleListQuery } from '@/lib/api/types';
import { listVehicles } from '@/lib/api/vehicles';
import { queryKeys } from '@/lib/query-keys';

export function useVehicleList(query: VehicleListQuery, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.vehicles.list(query),
    queryFn: () => listVehicles(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}
