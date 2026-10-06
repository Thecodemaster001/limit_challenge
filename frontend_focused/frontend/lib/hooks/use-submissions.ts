'use client';

import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { SubmissionListQuery } from '@/lib/submission-search-params';
import { PaginatedResponse, SubmissionDetail, SubmissionListItem } from '@/lib/types';

export const submissionQueryKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionQueryKeys.all, 'list'] as const,
  list: (query: SubmissionListQuery) => [...submissionQueryKeys.lists(), query] as const,
  detail: (id: string | number) => [...submissionQueryKeys.all, 'detail', String(id)] as const,
};

async function fetchSubmissions(query: SubmissionListQuery) {
  const response = await apiClient.get<PaginatedResponse<SubmissionListItem>>('/submissions/', {
    params: query,
  });
  return response.data;
}

async function fetchSubmissionDetail(id: string | number) {
  const response = await apiClient.get<SubmissionDetail>(`/submissions/${id}/`);
  return response.data;
}

export function submissionDetailQueryOptions(id: string | number) {
  return queryOptions({
    queryKey: submissionQueryKeys.detail(id),
    queryFn: () => fetchSubmissionDetail(id),
    staleTime: 60_000,
  });
}

export function useSubmissionsList(query: SubmissionListQuery, { enabled = true } = {}) {
  return useQuery({
    queryKey: submissionQueryKeys.list(query),
    queryFn: () => fetchSubmissions(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSubmissionDetail(id: string | number) {
  return useQuery({ ...submissionDetailQueryOptions(id), enabled: Boolean(id) });
}
