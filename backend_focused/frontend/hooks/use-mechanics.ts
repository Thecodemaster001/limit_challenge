'use client';

import { useQuery } from '@tanstack/react-query';

import { listMechanics } from '@/lib/api/mechanics';
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
