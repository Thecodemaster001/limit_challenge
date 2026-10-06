'use client';

import { keepPreviousData, useQueries } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { SubmissionListQuery } from '@/lib/submission-search-params';
import { submissionQueryKeys } from '@/lib/hooks/use-submissions';
import { StatusCount } from '@/lib/types';

async function fetchStatusCounts(query: SubmissionListQuery) {
  const response = await apiClient.get<StatusCount[]>('/submissions/status-counts/', {
    params: query,
  });
  return response.data;
}

/** Status counts for several filter combinations at once, e.g. one per saved view. */
export function useStatusCounts(queries: SubmissionListQuery[], { enabled = true } = {}) {
  return useQueries({
    queries: queries.map((query) => ({
      queryKey: submissionQueryKeys.statusCounts(query),
      queryFn: () => fetchStatusCounts(query),
      placeholderData: keepPreviousData,
      enabled,
    })),
  });
}
