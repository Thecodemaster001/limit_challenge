'use client';

import { ChevronRightOutlined, SearchOffOutlined } from '@mui/icons-material';
import { Box, Button, Divider, Link, Skeleton, Stack, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import NextLink from 'next/link';
import { useSyncExternalStore } from 'react';

import { EmptyState, ErrorState } from '@/components/page-states';
import SectionHeading from '@/components/section-heading';
import NoteComposer from '@/components/submissions/note-composer';
import SubmissionContacts from '@/components/submissions/submission-contacts';
import SubmissionDocuments from '@/components/submissions/submission-documents';
import SubmissionNotes from '@/components/submissions/submission-notes';
import SubmissionProperties from '@/components/submissions/submission-properties';
import { formatDate } from '@/lib/format';
import { useSubmissionDetail } from '@/lib/hooks/use-submissions';
import { listReturnPath } from '@/lib/list-return-path';
import { SubmissionDetail } from '@/lib/types';

const LIST_PATH = '/submissions';

function subscribeToNothing() {
  return () => {};
}

/** The list URL with the filters the user last had, read after hydration to avoid a mismatch. */
function useListReturnPath() {
  return useSyncExternalStore(subscribeToNothing, listReturnPath, () => LIST_PATH);
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

function DetailLayout({
  header,
  main,
  aside,
}: {
  header: React.ReactNode;
  main: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <Box>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        {header}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' },
        }}
      >
        <Box
          component="aside"
          sx={{
            order: { xs: 0, md: 1 },
            px: { xs: 2, md: 3 },
            py: 3,
            borderLeft: { md: 1 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: { xs: 'divider', md: 'divider' },
          }}
        >
          {aside}
        </Box>
        <Box sx={{ order: { xs: 1, md: 0 }, px: { xs: 2, md: 4 }, py: 3, maxWidth: 820 }}>
          {main}
        </Box>
      </Box>
    </Box>
  );
}

function DetailHeader({ submission }: { submission: SubmissionDetail }) {
  const { company } = submission;
  return (
    <Stack spacing={1.5}>
      <Breadcrumb current={company.legalName} />
      <Box>
        <Typography variant="h1">{company.legalName}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {[
            company.industry,
            company.headquartersCity,
            `Received ${formatDate(submission.createdAt)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
      </Box>
    </Stack>
  );
}

function SubmissionDetailContent({ submission }: { submission: SubmissionDetail }) {
  return (
    <DetailLayout
      header={<DetailHeader submission={submission} />}
      aside={
        <Stack spacing={3} divider={<Divider flexItem />}>
          <SubmissionProperties submission={submission} />
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
        aside={
          <Stack spacing={1.5}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height={22} />
            ))}
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
  const returnPath = useListReturnPath();

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

  return <SubmissionDetailContent submission={detail.data} />;
}
