'use client';

import { Box, Link, Typography } from '@mui/material';
import { ReactNode } from 'react';

import { useNotify } from '@/components/notifications';
import PersonAvatar from '@/components/person-avatar';
import RelativeTime from '@/components/relative-time';
import PriorityIndicator, { PriorityBars } from '@/components/submissions/priority-indicator';
import PropertyMenu from '@/components/submissions/property-menu';
import StatusIndicator, { StatusDot } from '@/components/submissions/status-indicator';
import { parseApiError } from '@/lib/api-errors';
import { formatDate } from '@/lib/format';
import { useCurrentUser } from '@/lib/hooks/use-auth';
import { useUpdateSubmission } from '@/lib/hooks/use-submissions';
import { useTeamMembers } from '@/lib/hooks/use-team-members';
import {
  PRIORITY_OPTIONS,
  priorityOption,
  STATUS_OPTIONS,
  statusOption,
} from '@/lib/submission-display';
import { touchScreen } from '@/lib/theme';
import { SubmissionDetail, SubmissionTriageUpdate } from '@/lib/types';

const statusMenuOptions = STATUS_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  icon: <StatusDot color={option.color} />,
}));

const priorityMenuOptions = PRIORITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  icon: <PriorityBars priority={option.value} />,
}));

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
  const updateSubmission = useUpdateSubmission(submission.id);
  const teamMembers = useTeamMembers().data ?? [submission.owner];
  const currentTeamMemberId = useCurrentUser().data?.teamMember?.id;
  const notify = useNotify();

  function notifyFailure(error: unknown) {
    notify(`Couldn't update this submission. ${parseApiError(error).message}`, {
      severity: 'error',
    });
  }

  function applyChange(update: SubmissionTriageUpdate, description: string) {
    const undo: SubmissionTriageUpdate = {
      ...(update.status && { status: submission.status }),
      ...(update.priority && { priority: submission.priority }),
      ...(update.owner && { owner: submission.owner }),
    };
    updateSubmission.mutate(update, {
      onSuccess: () =>
        notify(description, {
          action: {
            label: 'Undo',
            onClick: () => updateSubmission.mutate(undo, { onError: notifyFailure }),
          },
        }),
      onError: notifyFailure,
    });
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
          options={statusMenuOptions}
          onSelect={(status) =>
            applyChange({ status }, `Status changed to ${statusOption(status).label}`)
          }
        >
          <StatusIndicator status={submission.status} />
        </PropertyMenu>
      </Property>
      <Property label="Priority">
        <PropertyMenu
          label="Priority"
          value={submission.priority}
          options={priorityMenuOptions}
          onSelect={(priority) =>
            applyChange({ priority }, `Priority set to ${priorityOption(priority).label}`)
          }
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
            if (owner) applyChange({ owner }, `Assigned to ${owner.fullName}`);
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
