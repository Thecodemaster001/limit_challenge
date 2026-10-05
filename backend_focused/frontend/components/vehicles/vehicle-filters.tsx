'use client';

import { Button, MenuItem, Paper, TextField } from '@mui/material';

import { DebouncedTextField } from '@/components/debounced-text-field';
import { useOfficeOptions } from '@/hooks/use-offices';
import { hasInvalidDateRange, VehicleSearch } from '@/lib/vehicle-search-params';

const ALL = 'all';
const STATUS_OPTIONS = [
  { value: ALL, label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];
const FIELD_SX = { flex: '1 1 180px', minWidth: 160 };

const textOrUndefined = (value: string) => value || undefined;

interface VehicleFiltersProps {
  search: VehicleSearch;
  hasFilters: boolean;
  onChange: (changes: Partial<VehicleSearch>) => void;
  onClear: () => void;
}

export function VehicleFilters({ search, hasFilters, onChange, onClear }: VehicleFiltersProps) {
  const { data: offices = [], isPending: officesLoading } = useOfficeOptions();
  const selectedOfficeExists = offices.some((office) => office.id === search.office);
  const invalidDateRange = hasInvalidDateRange(search);

  return (
    <Paper
      variant="outlined"
      component="section"
      aria-label="Vehicle filters"
      sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}
    >
      <TextField
        select
        label="Office"
        size="small"
        sx={FIELD_SX}
        value={selectedOfficeExists ? String(search.office) : ALL}
        disabled={officesLoading}
        onChange={(event) =>
          onChange({ office: event.target.value === ALL ? undefined : Number(event.target.value) })
        }
      >
        <MenuItem value={ALL}>All offices</MenuItem>
        {offices.map((office) => (
          <MenuItem key={office.id} value={String(office.id)}>
            {office.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Status"
        size="small"
        sx={FIELD_SX}
        value={search.is_active === undefined ? ALL : String(search.is_active)}
        onChange={(event) =>
          onChange({
            is_active: event.target.value === ALL ? undefined : event.target.value === 'true',
          })
        }
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <DebouncedTextField
        label="Make"
        size="small"
        sx={FIELD_SX}
        value={search.make ?? ''}
        onCommit={(make) => onChange({ make: textOrUndefined(make) })}
      />
      <DebouncedTextField
        label="Model"
        size="small"
        sx={FIELD_SX}
        value={search.model ?? ''}
        onCommit={(model) => onChange({ model: textOrUndefined(model) })}
      />
      <DebouncedTextField
        label="Mechanic certification"
        size="small"
        sx={FIELD_SX}
        value={search.mechanic_certification ?? ''}
        onCommit={(certification) =>
          onChange({ mechanic_certification: textOrUndefined(certification) })
        }
      />
      <TextField
        label="Serviced from"
        type="date"
        size="small"
        sx={FIELD_SX}
        value={search.maintenance_date_from ?? ''}
        onChange={(event) =>
          onChange({ maintenance_date_from: textOrUndefined(event.target.value) })
        }
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="Serviced to"
        type="date"
        size="small"
        sx={FIELD_SX}
        value={search.maintenance_date_to ?? ''}
        onChange={(event) => onChange({ maintenance_date_to: textOrUndefined(event.target.value) })}
        error={invalidDateRange}
        helperText={invalidDateRange ? 'Must be on or after the start date' : undefined}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Button onClick={onClear} disabled={!hasFilters} sx={{ alignSelf: 'center' }}>
        Clear filters
      </Button>
    </Paper>
  );
}
