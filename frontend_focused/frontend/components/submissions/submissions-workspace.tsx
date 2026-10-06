'use client';

import { InboxOutlined, SearchOffOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';

import { EmptyState, ErrorState } from '@/components/page-states';
import ActiveFilterChips from '@/components/submissions/active-filter-chips';
import SubmissionFilterBar, {
  SEARCH_INPUT_ID,
} from '@/components/submissions/submission-filter-bar';
import SubmissionPagination from '@/components/submissions/submission-pagination';
import SubmissionViewTabs from '@/components/submissions/submission-view-tabs';
import SubmissionTable, {
  SubmissionTableSkeleton,
} from '@/components/submissions/submission-table';
import { useCurrentUser } from '@/lib/hooks/use-auth';
import { useBrokerOptions } from '@/lib/hooks/use-broker-options';
import { useIsHydrated } from '@/lib/hooks/use-is-hydrated';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useStatusCounts } from '@/lib/hooks/use-status-counts';
import { useSubmissionSearch } from '@/lib/hooks/use-submission-search';
import { submissionQueryKeys, useSubmissionsList } from '@/lib/hooks/use-submissions';
import { useTeamMembers } from '@/lib/hooks/use-team-members';
import {
  countActiveFilters,
  DEFAULT_PAGE_SIZE,
  hasInvalidDateRange,
  SubmissionSearch,
  toSubmissionListQuery,
} from '@/lib/submission-search-params';
import { nextIndex } from '@/lib/keyboard-shortcuts';
import { activeViewId, SUBMISSION_VIEWS, SubmissionViewId } from '@/lib/submission-views';

/** The API query for counts: filters only, without sorting or paging. */
function countsQuery(search: SubmissionSearch, changes: Partial<SubmissionSearch> = {}) {
  return toSubmissionListQuery({
    ...search,
    ...changes,
    ordering: undefined,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
}

function PageHeader({ totalCount }: { totalCount?: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
      <Typography variant="h1">Submissions</Typography>
      {totalCount !== undefined && (
        <Typography
          color="text.secondary"
          sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
        >
          {totalCount}
        </Typography>
      )}
    </Box>
  );
}

/** Moves keyboard focus between the visible row links; Enter then opens the focused row. */
function focusAdjacentRow(step: number) {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-submission-link]'),
  ).filter((link) => link.offsetParent !== null);
  const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
  const target = links[nextIndex(currentIndex, step, links.length)];
  target?.focus();
  target?.scrollIntoView({ block: 'nearest' });
}

function isPageOutOfRange(error: unknown, page: number) {
  return page > 1 && isAxiosError(error) && error.response?.status === 404;
}

export default function SubmissionsWorkspace() {
  const { search, updateSearch, clearFilters } = useSubmissionSearch();
  const queryClient = useQueryClient();

  // Back on the list, the next submission opened should start a fresh next/previous queue.
  useEffect(() => {
    queryClient.removeQueries({ queryKey: submissionQueryKeys.queues() });
  }, [queryClient]);
  const invalidDateRange = hasInvalidDateRange(search);
  const submissions = useSubmissionsList(toSubmissionListQuery(search), {
    enabled: !invalidDateRange,
  });
  const brokers = useBrokerOptions().data ?? [];
  const teamMembers = useTeamMembers().data ?? [];
  const currentUser = useCurrentUser().data;
  // The user can be cached before this boundary hydrates; wait so the tabs match the server.
  const teamMemberId = useIsHydrated() ? currentUser?.teamMember?.id : undefined;
  const hasFilters = countActiveFilters(search) > 0;
  const [statusMenuCounts] = useStatusCounts([countsQuery(search, { status: [] })], {
    enabled: !invalidDateRange,
  });

  useKeyboardShortcuts({
    j: () => focusAdjacentRow(1),
    k: () => focusAdjacentRow(-1),
    '/': () => document.getElementById(SEARCH_INPUT_ID)?.focus(),
  });

  function selectView(viewId: SubmissionViewId) {
    const view = SUBMISSION_VIEWS.find((candidate) => candidate.id === viewId);
    if (view) updateSearch(view.preset(teamMemberId));
  }

  function renderResults() {
    if (invalidDateRange) {
      return (
        <EmptyState
          icon={<SearchOffOutlined />}
          title="Check the date range"
          description="The end date is before the start date, so nothing can match."
        />
      );
    }
    if (submissions.isError) {
      if (isPageOutOfRange(submissions.error, search.page)) {
        return (
          <EmptyState
            title="This page is empty"
            description="The list got shorter since this link was made."
            action={
              <Button variant="outlined" onClick={() => updateSearch({ page: 1 })}>
                Go to the first page
              </Button>
            }
          />
        );
      }
      return (
        <ErrorState
          error={submissions.error}
          title="Couldn't load submissions"
          onRetry={() => submissions.refetch()}
        />
      );
    }
    if (!submissions.data) {
      return <SubmissionTableSkeleton rows={Math.min(search.pageSize, 10)} />;
    }
    if (submissions.data.results.length === 0) {
      return hasFilters ? (
        <EmptyState
          icon={<SearchOffOutlined />}
          title="No submissions match these filters"
          description="Try removing a filter or widening the date range."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<InboxOutlined />}
          title="No submissions yet"
          description="New broker submissions will appear here as soon as they arrive."
        />
      );
    }
    return (
      <>
        <SubmissionTable
          submissions={submissions.data.results}
          ordering={search.ordering}
          onOrderingChange={(ordering) => updateSearch({ ordering })}
        />
        <SubmissionPagination
          page={search.page}
          pageSize={search.pageSize}
          totalCount={submissions.data.count}
          onPageChange={(page) => updateSearch({ page })}
          onPageSizeChange={(pageSize) => updateSearch({ pageSize })}
        />
      </>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: 3,
          pb: 2,
          display: 'grid',
          // Without minmax(0, …) a long filter chip widens the column past the screen.
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 2,
        }}
      >
        <PageHeader totalCount={submissions.data?.count} />
        <SubmissionViewTabs
          activeView={activeViewId(search, teamMemberId)}
          baseQuery={countsQuery(search, { status: [], priority: [], ownerId: undefined })}
          teamMemberId={teamMemberId}
          enabled={!invalidDateRange}
          onSelect={selectView}
        />
        <SubmissionFilterBar
          search={search}
          brokers={brokers}
          teamMembers={teamMembers}
          statusCounts={statusMenuCounts?.data}
          onChange={updateSearch}
        />
        <ActiveFilterChips
          search={search}
          brokers={brokers}
          teamMembers={teamMembers}
          onChange={updateSearch}
          onClearAll={clearFilters}
        />
      </Box>
      <Box sx={{ position: 'relative', borderTop: 1, borderColor: 'divider' }}>
        {submissions.isFetching && submissions.isPlaceholderData && (
          <LinearProgress
            aria-label="Updating results"
            sx={{ position: 'absolute', top: -1, left: 0, right: 0, height: 2 }}
          />
        )}
        {renderResults()}
      </Box>
    </Box>
  );
}

export function SubmissionsWorkspaceFallback() {
  return (
    <Box>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 2 }}>
        <PageHeader />
        <Box sx={{ height: 46 }} />
      </Box>
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <SubmissionTableSkeleton />
      </Box>
    </Box>
  );
}
