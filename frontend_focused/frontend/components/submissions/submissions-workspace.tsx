'use client';

import { InboxOutlined, SearchOffOutlined } from '@mui/icons-material';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import { EmptyState, ErrorState } from '@/components/page-states';
import ActiveFilterChips from '@/components/submissions/active-filter-chips';
import SubmissionFilterBar from '@/components/submissions/submission-filter-bar';
import SubmissionPagination from '@/components/submissions/submission-pagination';
import SubmissionTable, {
  SubmissionTableSkeleton,
} from '@/components/submissions/submission-table';
import { useBrokerOptions } from '@/lib/hooks/use-broker-options';
import { useSubmissionSearch } from '@/lib/hooks/use-submission-search';
import { useSubmissionsList } from '@/lib/hooks/use-submissions';
import { useTeamMembers } from '@/lib/hooks/use-team-members';
import {
  countActiveFilters,
  hasInvalidDateRange,
  toSubmissionListQuery,
} from '@/lib/submission-search-params';

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

function isPageOutOfRange(error: unknown, page: number) {
  return page > 1 && isAxiosError(error) && error.response?.status === 404;
}

export default function SubmissionsWorkspace() {
  const { search, updateSearch, clearFilters } = useSubmissionSearch();
  const invalidDateRange = hasInvalidDateRange(search);
  const submissions = useSubmissionsList(toSubmissionListQuery(search), {
    enabled: !invalidDateRange,
  });
  const brokers = useBrokerOptions().data ?? [];
  const teamMembers = useTeamMembers().data ?? [];
  const hasFilters = countActiveFilters(search) > 0;

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
        <SubmissionTable submissions={submissions.data.results} />
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
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 2, display: 'grid', gap: 2 }}>
        <PageHeader totalCount={submissions.data?.count} />
        <SubmissionFilterBar
          search={search}
          brokers={brokers}
          teamMembers={teamMembers}
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
