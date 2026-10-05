'use client';

import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';

/**
 * Vehicle and maintenance changes ripple through lists, details, office statistics and
 * mechanic workload, so they refresh all of them.
 */
export function useInvalidateFleetData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.offices.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.mechanics.all }),
    ]);
}
