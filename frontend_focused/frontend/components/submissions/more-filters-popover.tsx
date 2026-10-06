'use client';

import { TuneOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { addDaysToApiDate, businessDate } from '@/lib/format';
import { hasInvalidDateRange, SubmissionSearch } from '@/lib/submission-search-params';

interface MoreFiltersPopoverProps {
  search: SubmissionSearch;
  onChange: (changes: Partial<SubmissionSearch>) => void;
}

type Presence = 'any' | 'with' | 'without';

const RECENT_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function toPresence(value: boolean | undefined): Presence {
  if (value === undefined) return 'any';
  return value ? 'with' : 'without';
}

function fromPresence(value: Presence): boolean | undefined {
  if (value === 'any') return undefined;
  return value === 'with';
}

/** The date `days` ago in the business time zone, matching how the API filters. */
function daysAgo(days: number) {
  return addDaysToApiDate(businessDate(new Date()), -days);
}

function PresenceToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        fullWidth
        value={toPresence(value)}
        onChange={(_, nextValue: Presence | null) => nextValue && onChange(fromPresence(nextValue))}
        aria-label={label}
        sx={{ '& .MuiToggleButton-root': { py: 0.5, fontSize: 12, textTransform: 'none' } }}
      >
        <ToggleButton value="any">Any</ToggleButton>
        <ToggleButton value="with">With</ToggleButton>
        <ToggleButton value="without">Without</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

export default function MoreFiltersPopover({ search, onChange }: MoreFiltersPopoverProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const invalidRange = hasInvalidDateRange(search);
  const activeCount = [
    search.createdFrom || search.createdTo,
    search.hasDocuments !== undefined,
    search.hasNotes !== undefined,
  ].filter(Boolean).length;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<TuneOutlined sx={{ fontSize: '16px !important' }} />}
        onClick={(event) => setAnchorElement(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchorElement)}
      >
        More filters
        {activeCount > 0 && (
          <Box
            component="span"
            sx={{
              ml: 0.75,
              px: 0.75,
              borderRadius: 1,
              fontSize: 11,
              lineHeight: '18px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            {activeCount}
          </Box>
        )}
      </Button>
      <Popover
        open={Boolean(anchorElement)}
        anchorEl={anchorElement}
        onClose={() => setAnchorElement(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, p: 2, width: 300 } } }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 0.5 }}>
              Received
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                type="date"
                label="From"
                value={search.createdFrom ?? ''}
                onChange={(event) => onChange({ createdFrom: event.target.value || undefined })}
                slotProps={{ inputLabel: { shrink: true } }}
                error={invalidRange}
                fullWidth
              />
              <TextField
                type="date"
                label="To"
                value={search.createdTo ?? ''}
                onChange={(event) => onChange({ createdTo: event.target.value || undefined })}
                slotProps={{ inputLabel: { shrink: true } }}
                error={invalidRange}
                fullWidth
              />
            </Stack>
            {invalidRange && (
              <Typography variant="caption" color="error" component="p" sx={{ mt: 0.5 }}>
                The end date is before the start date.
              </Typography>
            )}
            <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {RECENT_RANGES.map((range) => (
                <Button
                  key={range.days}
                  size="small"
                  sx={{ minHeight: 26, px: 1, fontSize: 12 }}
                  onClick={() =>
                    onChange({ createdFrom: daysAgo(range.days), createdTo: undefined })
                  }
                >
                  {range.label}
                </Button>
              ))}
            </Stack>
          </Box>
          <PresenceToggle
            label="Documents"
            value={search.hasDocuments}
            onChange={(hasDocuments) => onChange({ hasDocuments })}
          />
          <PresenceToggle
            label="Notes"
            value={search.hasNotes}
            onChange={(hasNotes) => onChange({ hasNotes })}
          />
        </Stack>
      </Popover>
    </>
  );
}
