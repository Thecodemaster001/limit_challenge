'use client';

import { Box, Tab, Tabs } from '@mui/material';

import { SubmissionListQuery } from '@/lib/submission-search-params';
import { availableViews, countForView, SubmissionViewId } from '@/lib/submission-views';
import { useStatusCounts } from '@/lib/hooks/use-status-counts';

interface SubmissionViewTabsProps {
  activeView?: SubmissionViewId;
  /** The current API query without `status`, `priority` and `ownerId`, which views control. */
  baseQuery: SubmissionListQuery;
  teamMemberId?: number;
  enabled: boolean;
  onSelect: (viewId: SubmissionViewId) => void;
}

export default function SubmissionViewTabs({
  activeView,
  baseQuery,
  teamMemberId,
  enabled,
  onSelect,
}: SubmissionViewTabsProps) {
  const views = availableViews(teamMemberId);
  const countQueries = views.map((view) => {
    const preset = view.preset(teamMemberId);
    const query: SubmissionListQuery = { ...baseQuery };
    if (preset.priority.length) query.priority = preset.priority.join(',');
    if (preset.ownerId !== undefined) query.ownerId = preset.ownerId;
    return query;
  });
  const counts = useStatusCounts(countQueries, { enabled });

  return (
    <Tabs
      value={activeView ?? false}
      onChange={(_, viewId: SubmissionViewId) => onSelect(viewId)}
      variant="scrollable"
      scrollButtons={false}
      aria-label="Saved views"
      sx={{
        minHeight: 36,
        '& .MuiTabs-indicator': { height: 2 },
        '& .MuiTab-root': {
          minHeight: 36,
          minWidth: 0,
          px: 0,
          mr: 2.5,
          fontSize: 13,
          fontWeight: 500,
          textTransform: 'none',
          color: 'text.secondary',
          '&.Mui-selected': { color: 'text.primary' },
        },
      }}
    >
      {views.map((view, index) => {
        const statusCounts = counts[index]?.data;
        return (
          <Tab
            key={view.id}
            value={view.id}
            label={
              <Box component="span" sx={{ display: 'inline-flex', gap: 0.75 }}>
                {view.label}
                <Box
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 400,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 12,
                  }}
                >
                  {statusCounts ? countForView(view, statusCounts) : ''}
                </Box>
              </Box>
            }
          />
        );
      })}
    </Tabs>
  );
}
