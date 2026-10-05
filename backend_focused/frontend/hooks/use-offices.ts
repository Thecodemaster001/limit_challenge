'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { useInvalidateFleetData } from '@/hooks/use-invalidate-fleet-data';
import { createOffice, deleteOffice, listOffices, updateOffice } from '@/lib/api/offices';
import type { OfficeListQuery, OfficePayload } from '@/lib/api/types';
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

export function useOfficeList(query: OfficeListQuery) {
  return useQuery({
    queryKey: queryKeys.offices.list(query),
    queryFn: () => listOffices(query),
    placeholderData: keepPreviousData,
  });
}

// Office names appear in vehicle lists and details, so changes refresh fleet data too.
export function useCreateOffice() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: createOffice, onSuccess: invalidateFleetData });
}

export function useUpdateOffice() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: OfficePayload }) =>
      updateOffice(id, changes),
    onSuccess: invalidateFleetData,
  });
}

export function useDeleteOffice() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: deleteOffice, onSuccess: invalidateFleetData });
}
