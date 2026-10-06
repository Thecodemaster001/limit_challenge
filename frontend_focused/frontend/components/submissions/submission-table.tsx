'use client';

import { DescriptionOutlined, ModeCommentOutlined } from '@mui/icons-material';
import {
  Box,
  Link,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';

import PersonAvatar from '@/components/person-avatar';
import RelativeTime from '@/components/relative-time';
import PriorityIndicator from '@/components/submissions/priority-indicator';
import StatusIndicator from '@/components/submissions/status-indicator';
import { pluralize } from '@/lib/format';
import { submissionDetailQueryOptions } from '@/lib/hooks/use-submissions';
import { SortField } from '@/lib/submission-search-params';
import { DEFAULT_ORDERING, nextOrdering, sortState } from '@/lib/submission-views';
import { SubmissionListItem } from '@/lib/types';

const wideScreenOnly = { display: { xs: 'none', lg: 'table-cell' } };
const extraWideScreenOnly = { display: { xs: 'none', xl: 'table-cell' } };

const stretchedLink = {
  color: 'text.primary',
  fontWeight: 500,
  '&::after': { content: '""', position: 'absolute', inset: 0 },
  '&:focus-visible': { outline: 'none' },
};

const interactiveRow = {
  position: 'relative',
  cursor: 'pointer',
  '&:hover': { bgcolor: 'action.hover' },
  '&:has(a:focus-visible)': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: -2,
  },
  '&:last-of-type td': { borderBottom: 0 },
};

function detailHref(submission: SubmissionListItem) {
  return `/submissions/${submission.id}`;
}

function ActivityCounts({ submission }: { submission: SubmissionListItem }) {
  const counts = [
    {
      key: 'documents',
      count: submission.documentCount,
      icon: <DescriptionOutlined sx={{ fontSize: 15 }} />,
      label: pluralize(submission.documentCount, 'document'),
    },
    {
      key: 'notes',
      count: submission.noteCount,
      icon: <ModeCommentOutlined sx={{ fontSize: 15 }} />,
      label: pluralize(submission.noteCount, 'note'),
    },
  ];
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      {counts.map((item) => (
        <Tooltip key={item.key} title={item.label}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: item.count ? 'text.secondary' : 'text.disabled',
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
            }}
            aria-label={item.label}
          >
            {item.icon}
            {item.count}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

function LatestNote({ submission }: { submission: SubmissionListItem }) {
  const note = submission.latestNote;
  if (!note) {
    return (
      <Typography variant="body2" color="text.disabled">
        No notes yet
      </Typography>
    );
  }
  return (
    <Typography variant="body2" color="text.secondary" noWrap title={note.bodyPreview}>
      <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
        {note.authorName.split(' ')[0]}:
      </Box>{' '}
      {note.bodyPreview}
    </Typography>
  );
}

interface SubmissionTableProps {
  submissions: SubmissionListItem[];
  ordering?: string;
  onOrderingChange: (ordering: string | undefined) => void;
}

export default function SubmissionTable({
  submissions,
  ordering,
  onOrderingChange,
}: SubmissionTableProps) {
  const queryClient = useQueryClient();
  const prefetchDetail = (submission: SubmissionListItem) =>
    queryClient.prefetchQuery(submissionDetailQueryOptions(submission.id));

  function sortableHeader(field: SortField, label: string) {
    const direction = sortState(ordering, field);
    return (
      <TableSortLabel
        active={Boolean(direction)}
        direction={direction ?? 'asc'}
        onClick={() => {
          const next = nextOrdering(ordering, field);
          onOrderingChange(next === DEFAULT_ORDERING ? undefined : next);
        }}
      >
        {label}
      </TableSortLabel>
    );
  }

  return (
    <>
      <Table size="small" sx={{ display: { xs: 'none', md: 'table' }, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ pl: 3, width: { md: '28%', xl: '22%' } }}
              sortDirection={sortState(ordering, 'company') ?? false}
            >
              {sortableHeader('company', 'Company')}
            </TableCell>
            <TableCell sx={{ width: 112 }} sortDirection={sortState(ordering, 'status') ?? false}>
              {sortableHeader('status', 'Status')}
            </TableCell>
            <TableCell sx={{ width: 104 }} sortDirection={sortState(ordering, 'priority') ?? false}>
              {sortableHeader('priority', 'Priority')}
            </TableCell>
            <TableCell sx={{ ...wideScreenOnly, width: '17%' }}>Broker</TableCell>
            <TableCell sx={{ width: '16%' }}>Owner</TableCell>
            <TableCell sx={extraWideScreenOnly}>Latest note</TableCell>
            <TableCell sx={{ width: 96 }}>Activity</TableCell>
            <TableCell
              align="right"
              sx={{ pr: 3, width: 112 }}
              sortDirection={sortState(ordering, 'createdAt') ?? false}
            >
              {sortableHeader('createdAt', 'Received')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow
              key={submission.id}
              sx={interactiveRow}
              onMouseEnter={() => prefetchDetail(submission)}
            >
              <TableCell sx={{ pl: 3 }}>
                <Link component={NextLink} href={detailHref(submission)} sx={stretchedLink} noWrap>
                  {submission.company.legalName}
                </Link>
                <Typography variant="caption" color="text.secondary" component="p" noWrap>
                  {[submission.company.industry, submission.company.headquartersCity]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusIndicator status={submission.status} />
              </TableCell>
              <TableCell>
                <PriorityIndicator priority={submission.priority} />
              </TableCell>
              <TableCell sx={wideScreenOnly}>
                <Typography variant="body2" noWrap title={submission.broker.name}>
                  {submission.broker.name}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <PersonAvatar name={submission.owner.fullName} />
                  <Typography variant="body2" noWrap>
                    {submission.owner.fullName}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={extraWideScreenOnly}>
                <LatestNote submission={submission} />
              </TableCell>
              <TableCell>
                <ActivityCounts submission={submission} />
              </TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>
                <RelativeTime value={submission.createdAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box component="ul" sx={{ display: { md: 'none' }, listStyle: 'none', m: 0, p: 0 }}>
        {submissions.map((submission) => (
          <Box
            component="li"
            key={submission.id}
            sx={{
              ...interactiveRow,
              px: 2,
              py: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              '&:last-of-type': { borderBottom: 0 },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Link component={NextLink} href={detailHref(submission)} sx={stretchedLink} noWrap>
                {submission.company.legalName}
              </Link>
              <RelativeTime value={submission.createdAt} sx={{ fontSize: 12 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
              <StatusIndicator status={submission.status} />
              <PriorityIndicator priority={submission.priority} />
              <ActivityCounts submission={submission} />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              component="p"
              noWrap
              sx={{ mt: 0.5 }}
            >
              {submission.broker.name} · {submission.owner.fullName}
            </Typography>
          </Box>
        ))}
      </Box>
    </>
  );
}

export function SubmissionTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Box role="status" aria-label="Loading submissions">
      {Array.from({ length: rows }, (_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            px: { xs: 2, md: 3 },
            height: 57,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ flexBasis: { xs: '60%', md: '26%' } }}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="45%" height={14} />
          </Box>
          <Skeleton width={72} height={18} sx={{ display: { xs: 'none', md: 'block' } }} />
          <Skeleton width={64} height={18} sx={{ display: { xs: 'none', md: 'block' } }} />
          <Skeleton width="14%" height={18} sx={{ display: { xs: 'none', lg: 'block' } }} />
          <Skeleton width="12%" height={18} sx={{ display: { xs: 'none', md: 'block' } }} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton width={56} height={18} />
        </Box>
      ))}
    </Box>
  );
}
