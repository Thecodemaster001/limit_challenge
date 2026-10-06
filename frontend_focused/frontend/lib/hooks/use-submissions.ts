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
import {
  NoteDetail,
  PaginatedResponse,
  SubmissionDetail,
  SubmissionListItem,
  SubmissionTriageUpdate,
} from '@/lib/types';

export const submissionQueryKeys = {
  all: ['submissions'] as const,
  lists: () => [...submissionQueryKeys.all, 'list'] as const,
  list: (query: SubmissionListQuery) => [...submissionQueryKeys.lists(), query] as const,
  detail: (id: string | number) => [...submissionQueryKeys.all, 'detail', String(id)] as const,
  allStatusCounts: () => [...submissionQueryKeys.all, 'status-counts'] as const,
  /** Snapshots of list pages for next/previous; writes don't refresh them on purpose. */
  queues: () => [...submissionQueryKeys.all, 'queue'] as const,
  queue: (query: SubmissionListQuery) => [...submissionQueryKeys.queues(), query] as const,
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

/**
 * A list page frozen when the user opens a submission, so next/previous still work after a
 * change moves the current submission out of the filtered list. It starts from the list
 * the user was looking at, and the list discards it on return.
 */
export function useSubmissionQueuePage(query: SubmissionListQuery, { enabled = true } = {}) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: submissionQueryKeys.queue(query),
    queryFn: () => fetchSubmissions(query),
    staleTime: Infinity,
    initialData: () =>
      queryClient.getQueryData<PaginatedResponse<SubmissionListItem>>(
        submissionQueryKeys.list(query),
      ),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(submissionQueryKeys.list(query))?.dataUpdatedAt,
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

/** All writes to one submission share a key, so the last to settle can refetch it. */
function submissionWriteKey(submissionId: string | number) {
  return [...submissionQueryKeys.detail(submissionId), 'write'] as const;
}

/**
 * Refreshes everything a write may have changed. The detail is refetched only once no other
 * write to it is still pending, so a refetch can't wipe another write's optimistic change.
 */
function useRefreshAfterWrite(submissionId: string | number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: submissionQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: submissionQueryKeys.allStatusCounts() });
    if (queryClient.isMutating({ mutationKey: submissionWriteKey(submissionId) }) === 1) {
      queryClient.invalidateQueries({ queryKey: submissionQueryKeys.detail(submissionId) });
    }
  };
}

interface AddNoteCallbacks {
  /** Runs for every failed note, even when another note was posted after it. */
  onFailure?: (body: string, error: unknown) => void;
}

/** Adds a note right away and removes it again if the server rejects it. */
export function useAddNote(
  submissionId: string | number,
  authorName: string,
  { onFailure }: AddNoteCallbacks = {},
) {
  const queryClient = useQueryClient();
  const detailKey = submissionQueryKeys.detail(submissionId);
  const refreshAfterWrite = useRefreshAfterWrite(submissionId);

  const replaceNote = (noteId: number, replacement?: NoteDetail) =>
    queryClient.setQueryData<SubmissionDetail>(detailKey, (detail) =>
      detail
        ? {
            ...detail,
            notes: replacement
              ? detail.notes.map((note) => (note.id === noteId ? replacement : note))
              : detail.notes.filter((note) => note.id !== noteId),
          }
        : detail,
    );

  return useMutation({
    mutationKey: submissionWriteKey(submissionId),
    mutationFn: (body: string) => postNote(submissionId, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const optimisticNote: NoteDetail = {
        id: -Date.now(),
        authorName,
        body,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<SubmissionDetail>(detailKey, (detail) =>
        detail ? { ...detail, notes: [optimisticNote, ...detail.notes] } : detail,
      );
      return { optimisticNoteId: optimisticNote.id };
    },
    onError: (error, body, context) => {
      if (context) replaceNote(context.optimisticNoteId);
      onFailure?.(body, error);
    },
    onSuccess: (note, _body, context) => replaceNote(context.optimisticNoteId, note),
    onSettled: refreshAfterWrite,
  });
}

async function patchSubmission(submissionId: string | number, update: SubmissionTriageUpdate) {
  const response = await apiClient.patch<SubmissionDetail>(`/submissions/${submissionId}/`, {
    status: update.status,
    priority: update.priority,
    ownerId: update.owner?.id,
  });
  return response.data;
}

export interface TriageChange {
  changes: SubmissionTriageUpdate;
  /** True when this change reverts an earlier one from its Undo action. */
  isUndo?: boolean;
}

interface UpdateSubmissionCallbacks {
  /** Runs for every successful change; `previous` holds the values to restore for Undo. */
  onChanged?: (change: TriageChange, previous: SubmissionTriageUpdate) => void;
  /** Runs for every failed change, even when another change was made after it. */
  onFailure?: (error: unknown) => void;
}

/** The current values in `source` of exactly the fields that `changes` touches. */
function pickTriageFields(source: SubmissionDetail, changes: SubmissionTriageUpdate) {
  const fields: SubmissionTriageUpdate = {};
  if (changes.status) fields.status = source.status;
  if (changes.priority) fields.priority = source.priority;
  if (changes.owner) fields.owner = source.owner;
  return fields;
}

/** Changes status, priority or owner right away and restores only those fields on failure. */
export function useUpdateSubmission(
  submissionId: string | number,
  { onChanged, onFailure }: UpdateSubmissionCallbacks = {},
) {
  const queryClient = useQueryClient();
  const detailKey = submissionQueryKeys.detail(submissionId);
  const refreshAfterWrite = useRefreshAfterWrite(submissionId);

  const mergeIntoDetail = (fields: Partial<SubmissionDetail>) =>
    queryClient.setQueryData<SubmissionDetail>(detailKey, (detail) =>
      detail ? { ...detail, ...fields } : detail,
    );

  return useMutation({
    mutationKey: submissionWriteKey(submissionId),
    mutationFn: ({ changes }: TriageChange) => patchSubmission(submissionId, changes),
    onMutate: async ({ changes }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const detail = queryClient.getQueryData<SubmissionDetail>(detailKey);
      const previous = detail ? pickTriageFields(detail, changes) : {};
      mergeIntoDetail(changes);
      return { previous };
    },
    onError: (error, _change, context) => {
      if (context) mergeIntoDetail(context.previous);
      onFailure?.(error);
    },
    onSuccess: (submission, change, context) => {
      // Only this change's fields: another change may still be pending on the others.
      mergeIntoDetail({
        ...pickTriageFields(submission, change.changes),
        updatedAt: submission.updatedAt,
      });
      onChanged?.(change, context.previous);
    },
    onSettled: refreshAfterWrite,
  });
}
