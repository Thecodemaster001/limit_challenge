'use client';

import { useQuery } from '@tanstack/react-query';

import { listOffices } from '@/lib/api/offices';
import { queryKeys } from '@/lib/query-keys';

const OFFICE_OPTIONS_QUERY = { page_size: 100, ordering: 'name' };

/** All offices for select inputs. Fleets have few offices, so one page of 100 covers them. */
export function useOfficeOptions() {
  return useQuery({
    queryKey: queryKeys.offices.list(OFFICE_OPTIONS_QUERY),
    queryFn: () => listOffices(OFFICE_OPTIONS_QUERY),
    select: (page) => page.results,
    staleTime: 5 * 60_000,
  });
}
