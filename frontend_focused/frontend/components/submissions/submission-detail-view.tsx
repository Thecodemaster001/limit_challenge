'use client';

import {
  ChevronRightOutlined,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
  SearchOffOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState } from '@/components/page-states';
import SectionHeading from '@/components/section-heading';
import NoteComposer from '@/components/submissions/note-composer';
import SubmissionContacts from '@/components/submissions/submission-contacts';
import SubmissionDocuments from '@/components/submissions/submission-documents';
import SubmissionNotes from '@/components/submissions/submission-notes';
import SubmissionProperties from '@/components/submissions/submission-properties';
import { useIsHydrated } from '@/lib/hooks/use-is-hydrated';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { useSubmissionNeighbors } from '@/lib/hooks/use-submission-neighbors';
import { useSubmissionDetail } from '@/lib/hooks/use-submissions';
import { listReturnPath, SUBMISSIONS_PATH } from '@/lib/list-return-path';
import { touchScreen } from '@/lib/theme';
import { SubmissionDetail } from '@/lib/types';

/** The list URL with the filters the user last had, read after hydration to avoid a mismatch. */
function useListReturnPath() {
  return useIsHydrated() ? listReturnPath() : SUBMISSIONS_PATH;
}

function Breadcrumb({ current }: { current?: string }) {
  const returnPath = useListReturnPath();
  return (
    <Box
      component="nav"
      aria-label="Breadcrumb"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}
    >
      <Link
        component={NextLink}
        href={returnPath}
        variant="body2"
        color="text.secondary"
        underline="hover"
        sx={{ [touchScreen]: { py: 1.25 } }}
      >
        Submissions
      </Link>
      <ChevronRightOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
      <Typography variant="body2" noWrap aria-current="page">
        {current ?? '…'}
      </Typography>
    </Box>
  );
}

const CONTENT_MAX_WIDTH = 1280;

type SubmissionNeighbors = ReturnType<typeof useSubmissionNeighbors>;

/** "3 of 15" with previous/next buttons, following the list the user came from. */
function QueueNavigator({ neighbors }: { neighbors: SubmissionNeighbors }) {
  if (neighbors.position === undefined) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontVariantNumeric: 'tabular-nums', mr: 0.5 }}
      >
        {neighbors.position} of {neighbors.totalCount}
      </Typography>
      <Tooltip title="Previous submission · K">
        <span>
          <IconButton
            aria-label="Previous submission"
            disabled={!neighbors.hasPrevious}
            onClick={neighbors.goToPrevious}
            sx={{ border: 1, borderColor: 'divider' }}
          >
            <KeyboardArrowUpOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Next submission · J">
        <span>
          <IconButton
            aria-label="Next submission"
            disabled={!neighbors.hasNext}
            onClick={neighbors.goToNext}
            sx={{ border: 1, borderColor: 'divider' }}
          >
            <KeyboardArrowDownOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

// Responsive border shorthands reset the colour inside their media query, so set it per breakpoint.
const dividerColor = { xs: 'divider', md: 'divider' };

const sidePanelColumn = {
  px: { xs: 2, md: 3 },
  borderLeft: { md: 1 },
};

/**
 * Two columns on desktop: the conversation on the left, facts on the right. On phones the
 * key properties come first, then summary and notes, then contacts and documents.
 */
function DetailLayout({
  header,
  properties,
  main,
  related,
}: {
  header: React.ReactNode;
  properties: React.ReactNode;
  main: React.ReactNode;
  related: React.ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>{header}</Box>
      </Box>
      <Box
        sx={{
          maxWidth: { md: CONTENT_MAX_WIDTH + 48 },
          mx: 'auto',
          px: { md: 3 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' },
          gridTemplateRows: { md: 'auto 1fr' },
          gridTemplateAreas: {
            xs: '"properties" "main" "related"',
            md: '"main properties" "main related"',
          },
        }}
      >
        <Box
          component="aside"
          aria-label="Properties"
          sx={{
            ...sidePanelColumn,
            gridArea: 'properties',
            pt: 3,
            pb: { xs: 3, md: 0 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: dividerColor,
          }}
        >
          {properties}
        </Box>
        <Box sx={{ gridArea: 'main', px: { xs: 2, md: 0 }, pr: { md: 4 }, py: 3, maxWidth: 860 }}>
          {main}
        </Box>
        <Box
          component="aside"
          aria-label="Contacts and documents"
          sx={{
            ...sidePanelColumn,
            gridArea: 'related',
            pb: 3,
            borderTop: { xs: 1, md: 0 },
            borderColor: dividerColor,
          }}
        >
          <Divider sx={{ display: { xs: 'none', md: 'block' }, my: 3 }} />
          <Box sx={{ pt: { xs: 3, md: 0 } }}>{related}</Box>
        </Box>
      </Box>
    </Box>
  );
}

function DetailHeader({
  submission,
  neighbors,
}: {
  submission: SubmissionDetail;
  neighbors: SubmissionNeighbors;
}) {
  const { company } = submission;
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minHeight: 30 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Breadcrumb current={company.legalName} />
        </Box>
        <QueueNavigator neighbors={neighbors} />
      </Box>
      <Box>
        <Typography variant="h1">{company.legalName}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {[company.industry, company.headquartersCity].filter(Boolean).join(' · ')}
        </Typography>
      </Box>
    </Stack>
  );
}

function SubmissionDetailContent({
  submission,
  neighbors,
}: {
  submission: SubmissionDetail;
  neighbors: SubmissionNeighbors;
}) {
  return (
    <DetailLayout
      header={<DetailHeader submission={submission} neighbors={neighbors} />}
      properties={<SubmissionProperties submission={submission} />}
      related={
        <Stack spacing={3} divider={<Divider flexItem />}>
          <SubmissionContacts contacts={submission.contacts} />
          <SubmissionDocuments documents={submission.documents} />
        </Stack>
      }
      main={
        <Stack spacing={4}>
          <Box component="section" aria-labelledby="summary-heading">
            <SectionHeading>
              <span id="summary-heading">Summary</span>
            </SectionHeading>
            <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
              {submission.summary || 'No summary was provided with this submission.'}
            </Typography>
          </Box>
          <SubmissionNotes
            notes={submission.notes}
            composer={<NoteComposer submissionId={submission.id} />}
          />
        </Stack>
      }
    />
  );
}

function SubmissionDetailSkeleton() {
  return (
    <Box role="status" aria-label="Loading submission">
      <DetailLayout
        header={
          <Stack spacing={1.5}>
            <Skeleton width={180} height={20} />
            <Box>
              <Skeleton width="40%" height={32} />
              <Skeleton width="30%" height={18} />
            </Box>
          </Stack>
        }
        properties={
          <Stack spacing={1.5}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height={22} />
            ))}
          </Stack>
        }
        related={
          <Stack spacing={1.5}>
            <Skeleton width={90} height={24} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        }
        main={
          <Stack spacing={1}>
            <Skeleton width={90} height={24} />
            <Skeleton height={18} />
            <Skeleton height={18} width="85%" />
            <Skeleton width={70} height={24} sx={{ mt: 3 }} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </Stack>
        }
      />
    </Box>
  );
}

export default function SubmissionDetailView({ submissionId }: { submissionId: string }) {
  const detail = useSubmissionDetail(submissionId);
  const neighbors = useSubmissionNeighbors(Number(submissionId));
  const returnPath = useListReturnPath();
  const router = useRouter();

  useKeyboardShortcuts({
    Escape: () => router.push(returnPath),
    j: neighbors.goToNext,
    k: neighbors.goToPrevious,
  });

  if (detail.isPending) return <SubmissionDetailSkeleton />;

  if (detail.isError) {
    const isNotFound = isAxiosError(detail.error) && detail.error.response?.status === 404;
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
        <Breadcrumb current={isNotFound ? 'Not found' : 'Error'} />
        {isNotFound ? (
          <EmptyState
            icon={<SearchOffOutlined />}
            title="Submission not found"
            description="It may have been removed, or the link is wrong."
            action={
              <Button variant="outlined" component={NextLink} href={returnPath}>
                Back to submissions
              </Button>
            }
          />
        ) : (
          <ErrorState
            error={detail.error}
            title="Couldn't load this submission"
            onRetry={() => detail.refetch()}
          />
        )}
      </Box>
    );
  }

  return <SubmissionDetailContent submission={detail.data} neighbors={neighbors} />;
}
