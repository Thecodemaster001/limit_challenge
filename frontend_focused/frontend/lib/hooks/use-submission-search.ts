'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import { rememberListQuery } from '@/lib/list-return-path';
import {
  clearSubmissionFilters,
  parseSubmissionSearch,
  serializeSubmissionSearch,
  SubmissionSearch,
  updateSubmissionSearch,
} from '@/lib/submission-search-params';

/** The list search, read from and written to the URL so every view is linkable. */
export function useSubmissionSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const search = useMemo(() => parseSubmissionSearch(searchParams), [searchParams]);

  useEffect(() => rememberListQuery(serializeSubmissionSearch(search)), [search]);

  // The native History API updates useSearchParams immediately, without a server round
  // trip: the list's data is fetched in the browser, so nothing on the server re-renders.
  const replaceSearch = useCallback(
    (nextSearch: SubmissionSearch) => {
      const queryString = serializeSubmissionSearch(nextSearch);
      window.history.replaceState(null, '', queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname],
  );

  const updateSearch = useCallback(
    (changes: Partial<SubmissionSearch>) => replaceSearch(updateSubmissionSearch(search, changes)),
    [replaceSearch, search],
  );

  const clearFilters = useCallback(
    () => replaceSearch(clearSubmissionFilters(search)),
    [replaceSearch, search],
  );

  return { search, updateSearch, clearFilters };
}
