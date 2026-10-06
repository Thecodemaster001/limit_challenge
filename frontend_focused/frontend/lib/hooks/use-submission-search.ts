'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

  const search = useMemo(() => parseSubmissionSearch(searchParams), [searchParams]);

  useEffect(() => rememberListQuery(serializeSubmissionSearch(search)), [search]);

  const replaceSearch = useCallback(
    (nextSearch: SubmissionSearch) => {
      const queryString = serializeSubmissionSearch(nextSearch);
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router],
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
