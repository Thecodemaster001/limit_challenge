'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { useIsHydrated } from '@/lib/hooks/use-is-hydrated';
import { submissionDetailQueryOptions, useSubmissionsList } from '@/lib/hooks/use-submissions';
import { rememberedListQuery, rememberListQuery } from '@/lib/list-return-path';
import { locateInList, Neighbor } from '@/lib/submission-navigation';
import {
  parseSubmissionSearch,
  serializeSubmissionSearch,
  toSubmissionListQuery,
} from '@/lib/submission-search-params';

/**
 * Previous and next submissions in the list the user came from (same filters, sort and
 * page), so a queue can be worked through without returning to the list each time.
 */
export function useSubmissionNeighbors(submissionId: number) {
  const isHydrated = useIsHydrated();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Read on every render: moving to a neighbour on another page remembers that page.
  const rememberedQuery = isHydrated ? rememberedListQuery() : null;
  const search = useMemo(
    () =>
      rememberedQuery === null ? null : parseSubmissionSearch(new URLSearchParams(rememberedQuery)),
    [rememberedQuery],
  );
  const listQuery = search ? toSubmissionListQuery(search) : {};
  const currentPage = useSubmissionsList(listQuery, { enabled: Boolean(search) });

  const location =
    search && currentPage.data && !currentPage.isPlaceholderData
      ? locateInList(
          {
            ids: currentPage.data.results.map((submission) => submission.id),
            page: search.page,
            pageSize: search.pageSize,
            totalCount: currentPage.data.count,
          },
          submissionId,
        )
      : null;

  const pageQuery = (neighbor: Neighbor | null | undefined) =>
    search && neighbor && neighbor.id === undefined
      ? toSubmissionListQuery({ ...search, page: neighbor.page })
      : null;
  const previousPageQuery = pageQuery(location?.previous);
  const nextPageQuery = pageQuery(location?.next);
  const previousPage = useSubmissionsList(previousPageQuery ?? listQuery, {
    enabled: Boolean(previousPageQuery),
  });
  const nextPage = useSubmissionsList(nextPageQuery ?? listQuery, {
    enabled: Boolean(nextPageQuery),
  });

  const previousId =
    location?.previous?.id ??
    (previousPageQuery ? previousPage.data?.results.at(-1)?.id : undefined);
  const nextId =
    location?.next?.id ?? (nextPageQuery ? nextPage.data?.results.at(0)?.id : undefined);

  useEffect(() => {
    for (const id of [previousId, nextId]) {
      if (id !== undefined) queryClient.prefetchQuery(submissionDetailQueryOptions(id));
    }
  }, [previousId, nextId, queryClient]);

  const goTo = useCallback(
    (id: number | undefined, neighbor: Neighbor | null | undefined) => {
      if (!search || id === undefined || !neighbor) return;
      rememberListQuery(serializeSubmissionSearch({ ...search, page: neighbor.page }));
      router.push(`/submissions/${id}`);
    },
    [router, search],
  );

  return {
    position: location?.position,
    totalCount: location?.totalCount,
    hasPrevious: previousId !== undefined,
    hasNext: nextId !== undefined,
    goToPrevious: () => goTo(previousId, location?.previous),
    goToNext: () => goTo(nextId, location?.next),
  };
}
