'use client';

import { keepPreviousData, useQueries } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { submissionQueryKeys } from '@/lib/hooks/use-submissions';
import { SubmissionListQuery } from '@/lib/submission-search-params';
import { StatusCount } from '@/lib/types';

async function fetchStatusCounts(query: SubmissionListQuery) {
  const response = await apiClient.get<StatusCount[]>('/submissions/status-counts/', {
    params: query,
  });
  return response.data;
}

/**
 * Status counts for several filter combinations at once, e.g. one per saved view.
 * Identical queries are requested once; results line up with the `queries` argument.
 */
export function useStatusCounts(queries: SubmissionListQuery[], { enabled = true } = {}) {
  const queryKeys = queries.map((query) => JSON.stringify(query));
  const uniqueQueries = queries.filter((_, index) => queryKeys.indexOf(queryKeys[index]) === index);

  const results = useQueries({
    queries: uniqueQueries.map((query) => ({
      queryKey: submissionQueryKeys.statusCounts(query),
      queryFn: () => fetchStatusCounts(query),
      placeholderData: keepPreviousData,
      enabled,
    })),
  });

  const uniqueKeys = uniqueQueries.map((query) => JSON.stringify(query));
  return queryKeys.map((key) => results[uniqueKeys.indexOf(key)]);
}
