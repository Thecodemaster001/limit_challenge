'use client';

import { Button, Chip, Stack } from '@mui/material';

import { formatDateRange } from '@/lib/format';
import { priorityOption, statusOption } from '@/lib/submission-display';
import { SubmissionSearch } from '@/lib/submission-search-params';
import { Broker, TeamMember } from '@/lib/types';

interface ActiveFilterChipsProps {
  search: SubmissionSearch;
  brokers: Broker[];
  teamMembers: TeamMember[];
  onChange: (changes: Partial<SubmissionSearch>) => void;
  onClearAll: () => void;
}

interface ActiveFilter {
  key: string;
  label: string;
  clear: Partial<SubmissionSearch>;
}

function presenceLabel(value: boolean, noun: string) {
  return value ? `With ${noun}` : `Without ${noun}`;
}

function describeFilters(
  search: SubmissionSearch,
  brokers: Broker[],
  teamMembers: TeamMember[],
): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  if (search.companySearch) {
    filters.push({
      key: 'companySearch',
      label: `Company: “${search.companySearch}”`,
      clear: { companySearch: undefined },
    });
  }
  if (search.status.length) {
    const labels = search.status.map((status) => statusOption(status).label).join(', ');
    filters.push({ key: 'status', label: `Status: ${labels}`, clear: { status: [] } });
  }
  if (search.priority.length) {
    const labels = search.priority.map((priority) => priorityOption(priority).label).join(', ');
    filters.push({ key: 'priority', label: `Priority: ${labels}`, clear: { priority: [] } });
  }
  if (search.brokerId !== undefined) {
    const broker = brokers.find((candidate) => candidate.id === search.brokerId);
    filters.push({
      key: 'brokerId',
      label: `Broker: ${broker?.name ?? `#${search.brokerId}`}`,
      clear: { brokerId: undefined },
    });
  }
  if (search.ownerId !== undefined) {
    const owner = teamMembers.find((candidate) => candidate.id === search.ownerId);
    filters.push({
      key: 'ownerId',
      label: `Owner: ${owner?.fullName ?? `#${search.ownerId}`}`,
      clear: { ownerId: undefined },
    });
  }
  if (search.createdFrom || search.createdTo) {
    filters.push({
      key: 'created',
      label: `Received: ${formatDateRange(search.createdFrom, search.createdTo)}`,
      clear: { createdFrom: undefined, createdTo: undefined },
    });
  }
  if (search.hasDocuments !== undefined) {
    filters.push({
      key: 'hasDocuments',
      label: presenceLabel(search.hasDocuments, 'documents'),
      clear: { hasDocuments: undefined },
    });
  }
  if (search.hasNotes !== undefined) {
    filters.push({
      key: 'hasNotes',
      label: presenceLabel(search.hasNotes, 'notes'),
      clear: { hasNotes: undefined },
    });
  }
  return filters;
}

export default function ActiveFilterChips({
  search,
  brokers,
  teamMembers,
  onChange,
  onClearAll,
}: ActiveFilterChipsProps) {
  const filters = describeFilters(search, brokers, teamMembers);
  if (filters.length === 0) return null;

  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
      {filters.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.label}
          size="small"
          variant="outlined"
          onDelete={() => onChange(filter.clear)}
          sx={{ maxWidth: { xs: '100%', sm: 320 }, bgcolor: 'background.paper' }}
        />
      ))}
      <Button size="small" onClick={onClearAll} sx={{ minHeight: 24, color: 'text.secondary' }}>
        Clear all
      </Button>
    </Stack>
  );
}
