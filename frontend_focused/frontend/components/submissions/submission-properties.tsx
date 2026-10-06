import { Box, Link, Typography } from '@mui/material';
import { ReactNode } from 'react';

import PersonAvatar from '@/components/person-avatar';
import RelativeTime from '@/components/relative-time';
import PriorityIndicator from '@/components/submissions/priority-indicator';
import StatusIndicator from '@/components/submissions/status-indicator';
import { formatDate } from '@/lib/format';
import { SubmissionDetail } from '@/lib/types';

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr)',
        alignItems: 'center',
        gap: 1,
        minHeight: 32,
      }}
    >
      <Typography variant="body2" color="text.secondary" component="dt">
        {label}
      </Typography>
      <Box component="dd" sx={{ m: 0, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export default function SubmissionProperties({ submission }: { submission: SubmissionDetail }) {
  return (
    <Box component="dl" sx={{ m: 0 }}>
      <Property label="Status">
        <StatusIndicator status={submission.status} />
      </Property>
      <Property label="Priority">
        <PriorityIndicator priority={submission.priority} />
      </Property>
      <Property label="Owner">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAvatar name={submission.owner.fullName} />
          <Typography variant="body2" noWrap>
            {submission.owner.fullName}
          </Typography>
        </Box>
      </Property>
      <Property label="Broker">
        <Typography variant="body2" noWrap title={submission.broker.name}>
          {submission.broker.name}
        </Typography>
        {submission.broker.primaryContactEmail && (
          <Link
            href={`mailto:${submission.broker.primaryContactEmail}`}
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
            noWrap
          >
            {submission.broker.primaryContactEmail}
          </Link>
        )}
      </Property>
      <Property label="Received">
        <Typography variant="body2">{formatDate(submission.createdAt)}</Typography>
      </Property>
      <Property label="Updated">
        <RelativeTime value={submission.updatedAt} color="text.primary" />
      </Property>
    </Box>
  );
}
