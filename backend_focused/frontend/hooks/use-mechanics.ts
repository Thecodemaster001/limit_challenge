'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { useInvalidateFleetData } from '@/hooks/use-invalidate-fleet-data';
import { createMechanic, deleteMechanic, listMechanics, updateMechanic } from '@/lib/api/mechanics';
import type { MechanicListQuery, MechanicUpdatePayload } from '@/lib/api/types';
import { queryKeys } from '@/lib/query-keys';

const ACTIVE_MECHANIC_OPTIONS_QUERY = { is_active: true, page_size: 100, ordering: 'name' };

/** Active mechanics for select inputs; only they can be assigned new maintenance. */
export function useActiveMechanicOptions() {
  return useQuery({
    queryKey: queryKeys.mechanics.list(ACTIVE_MECHANIC_OPTIONS_QUERY),
    queryFn: () => listMechanics(ACTIVE_MECHANIC_OPTIONS_QUERY),
    select: (page) => page.results,
    staleTime: 5 * 60_000,
  });
}

export function useMechanicList(query: MechanicListQuery) {
  return useQuery({
    queryKey: queryKeys.mechanics.list(query),
    queryFn: () => listMechanics(query),
    placeholderData: keepPreviousData,
  });
}

// Mechanic names appear in maintenance histories, so changes refresh fleet data too.
export function useCreateMechanic() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: createMechanic, onSuccess: invalidateFleetData });
}

export function useUpdateMechanic() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: MechanicUpdatePayload }) =>
      updateMechanic(id, changes),
    onSuccess: invalidateFleetData,
  });
}

export function useDeleteMechanic() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: deleteMechanic, onSuccess: invalidateFleetData });
}
