'use client';

import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { SubmissionListQuery } from '@/lib/submission-search-params';
import { NoteDetail, PaginatedResponse, SubmissionDetail, SubmissionListItem } from '@/lib/types';

export const submissionQueryKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionQueryKeys.all, 'list'] as const,
  list: (query: SubmissionListQuery) => [...submissionQueryKeys.lists(), query] as const,
  detail: (id: string | number) => [...submissionQueryKeys.all, 'detail', String(id)] as const,
  allStatusCounts: () => [...submissionQueryKeys.all, 'status-counts'] as const,
  statusCounts: (query: SubmissionListQuery) =>
    [...submissionQueryKeys.allStatusCounts(), query] as const,
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

async function postNote(submissionId: string | number, body: string) {
  const response = await apiClient.post<NoteDetail>(`/submissions/${submissionId}/notes/`, {
    body,
  });
  return response.data;
}

/** Optimistic notes get a temporary negative id until the server returns the real one. */
export function isPendingNote(note: NoteDetail) {
  return note.id < 0;
}

/** Adds a note right away and rolls it back if the server rejects it. */
export function useAddNote(submissionId: string | number, authorName: string) {
  const queryClient = useQueryClient();
  const detailKey = submissionQueryKeys.detail(submissionId);

  return useMutation({
    mutationFn: (body: string) => postNote(submissionId, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<SubmissionDetail>(detailKey);
      const optimisticNote: NoteDetail = {
        id: -Date.now(),
        authorName,
        body,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<SubmissionDetail>(detailKey, (detail) =>
        detail ? { ...detail, notes: [optimisticNote, ...detail.notes] } : detail,
      );
      return { previous, optimisticNoteId: optimisticNote.id };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
    onSuccess: (note, _body, context) => {
      queryClient.setQueryData<SubmissionDetail>(detailKey, (detail) =>
        detail
          ? {
              ...detail,
              notes: detail.notes.map((existing) =>
                existing.id === context?.optimisticNoteId ? note : existing,
              ),
            }
          : detail,
      );
    },
    onSettled: () => {
      // The list's note count, latest note and "has notes" counts may all have changed.
      queryClient.invalidateQueries({ queryKey: submissionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: submissionQueryKeys.allStatusCounts() });
    },
  });
}
