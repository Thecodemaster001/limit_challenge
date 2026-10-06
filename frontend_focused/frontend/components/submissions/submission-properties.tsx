'use client';

import { Box, Link, Typography } from '@mui/material';
import { ReactNode } from 'react';

import { useNotify } from '@/components/notifications';
import PersonAvatar from '@/components/person-avatar';
import RelativeTime from '@/components/relative-time';
import PriorityIndicator from '@/components/submissions/priority-indicator';
import PropertyMenu from '@/components/submissions/property-menu';
import StatusIndicator from '@/components/submissions/status-indicator';
import {
  PRIORITY_MENU_OPTIONS,
  STATUS_MENU_OPTIONS,
} from '@/components/submissions/triage-menu-options';
import { parseApiError } from '@/lib/api-errors';
import { formatDate } from '@/lib/format';
import { useCurrentUser } from '@/lib/hooks/use-auth';
import { useUpdateSubmission } from '@/lib/hooks/use-submissions';
import { useTeamMembers } from '@/lib/hooks/use-team-members';
import { priorityOption, statusOption } from '@/lib/submission-display';
import { touchScreen } from '@/lib/theme';
import { SubmissionDetail, SubmissionTriageUpdate } from '@/lib/types';

function describeChange(changes: SubmissionTriageUpdate) {
  if (changes.status) return `Status changed to ${statusOption(changes.status).label}`;
  if (changes.priority) return `Priority set to ${priorityOption(changes.priority).label}`;
  if (changes.owner) return `Assigned to ${changes.owner.fullName}`;
  return 'Submission updated';
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr)',
        alignItems: 'center',
        gap: 1,
        minHeight: 34,
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

function OwnerValue({ name }: { name: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <PersonAvatar name={name} />
      <Typography variant="body2" noWrap>
        {name}
      </Typography>
    </Box>
  );
}

export default function SubmissionProperties({ submission }: { submission: SubmissionDetail }) {
  const teamMembers = useTeamMembers().data ?? [submission.owner];
  const currentTeamMemberId = useCurrentUser().data?.teamMember?.id;
  const notify = useNotify();
  const updateSubmission = useUpdateSubmission(submission.id, {
    onChanged: ({ changes, isUndo }, previous) => {
      if (isUndo) {
        notify('Change undone');
        return;
      }
      notify(describeChange(changes), {
        action: {
          label: 'Undo',
          onClick: () => updateSubmission.mutate({ changes: previous, isUndo: true }),
        },
      });
    },
    onFailure: (error) =>
      notify(`Couldn't update this submission. ${parseApiError(error).message}`, {
        severity: 'error',
      }),
  });

  function applyChange(changes: SubmissionTriageUpdate) {
    updateSubmission.mutate({ changes });
  }

  const ownerMenuOptions = teamMembers.map((member) => ({
    value: String(member.id),
    label: member.id === currentTeamMemberId ? `${member.fullName} (you)` : member.fullName,
    icon: <PersonAvatar name={member.fullName} size={20} />,
  }));

  return (
    <Box component="dl" sx={{ m: 0 }}>
      <Property label="Status">
        <PropertyMenu
          label="Status"
          value={submission.status}
          options={STATUS_MENU_OPTIONS}
          onSelect={(status) => applyChange({ status })}
        >
          <StatusIndicator status={submission.status} />
        </PropertyMenu>
      </Property>
      <Property label="Priority">
        <PropertyMenu
          label="Priority"
          value={submission.priority}
          options={PRIORITY_MENU_OPTIONS}
          onSelect={(priority) => applyChange({ priority })}
        >
          <PriorityIndicator priority={submission.priority} />
        </PropertyMenu>
      </Property>
      <Property label="Owner">
        <PropertyMenu
          label="Owner"
          value={String(submission.owner.id)}
          options={ownerMenuOptions}
          onSelect={(ownerId) => {
            const owner = teamMembers.find((member) => String(member.id) === ownerId);
            if (owner) applyChange({ owner });
          }}
        >
          <OwnerValue name={submission.owner.fullName} />
        </PropertyMenu>
      </Property>
      <Property label="Broker">
        <Typography
          variant="body2"
          title={submission.broker.name}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {submission.broker.name}
        </Typography>
        {submission.broker.primaryContactEmail && (
          <Link
            href={`mailto:${submission.broker.primaryContactEmail}`}
            variant="caption"
            color="text.secondary"
            title={submission.broker.primaryContactEmail}
            sx={{ display: 'block', [touchScreen]: { py: 1 } }}
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
