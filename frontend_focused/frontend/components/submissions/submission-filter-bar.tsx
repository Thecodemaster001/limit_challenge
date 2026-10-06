'use client';

import { SearchOutlined } from '@mui/icons-material';
import { Box, InputAdornment, Stack } from '@mui/material';

import { DebouncedTextField } from '@/components/debounced-text-field';
import FilterMenu from '@/components/submissions/filter-menu';
import MoreFiltersPopover from '@/components/submissions/more-filters-popover';
import { PriorityBars } from '@/components/submissions/priority-indicator';
import SortMenu from '@/components/submissions/sort-menu';
import { StatusDot } from '@/components/submissions/status-indicator';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/lib/submission-display';
import { SubmissionSearch } from '@/lib/submission-search-params';
import { Broker, StatusCount, SubmissionPriority, SubmissionStatus, TeamMember } from '@/lib/types';

interface SubmissionFilterBarProps {
  search: SubmissionSearch;
  brokers: Broker[];
  teamMembers: TeamMember[];
  statusCounts?: StatusCount[];
  onChange: (changes: Partial<SubmissionSearch>) => void;
}

const priorityMenuOptions = PRIORITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  icon: <PriorityBars priority={option.value} />,
}));

function toIdList(id: number | undefined) {
  return id === undefined ? [] : [String(id)];
}

function fromIdList(ids: string[]) {
  return ids.length ? Number(ids[0]) : undefined;
}

export default function SubmissionFilterBar({
  search,
  brokers,
  teamMembers,
  statusCounts,
  onChange,
}: SubmissionFilterBarProps) {
  const statusMenuOptions = STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    icon: <StatusDot color={option.color} />,
    count: statusCounts?.find((item) => item.status === option.value)?.count,
  }));

  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
      <DebouncedTextField
        value={search.companySearch ?? ''}
        onCommit={(companySearch) => onChange({ companySearch: companySearch || undefined })}
        placeholder="Search companies"
        type="search"
        sx={{ width: { xs: '100%', sm: 240 } }}
        slotProps={{
          htmlInput: { 'aria-label': 'Search companies' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <FilterMenu
        label="Status"
        multiple
        options={statusMenuOptions}
        selected={search.status}
        onChange={(status) => onChange({ status: status as SubmissionStatus[] })}
      />
      <FilterMenu
        label="Priority"
        multiple
        options={priorityMenuOptions}
        selected={search.priority}
        onChange={(priority) => onChange({ priority: priority as SubmissionPriority[] })}
      />
      <FilterMenu
        label="Broker"
        options={brokers.map((broker) => ({ value: String(broker.id), label: broker.name }))}
        selected={toIdList(search.brokerId)}
        onChange={(ids) => onChange({ brokerId: fromIdList(ids) })}
      />
      <FilterMenu
        label="Owner"
        options={teamMembers.map((member) => ({
          value: String(member.id),
          label: member.fullName,
        }))}
        selected={toIdList(search.ownerId)}
        onChange={(ids) => onChange({ ownerId: fromIdList(ids) })}
      />
      <MoreFiltersPopover search={search} onChange={onChange} />
      <Box sx={{ display: { md: 'none' } }}>
        <SortMenu ordering={search.ordering} onChange={(ordering) => onChange({ ordering })} />
      </Box>
    </Stack>
  );
}
