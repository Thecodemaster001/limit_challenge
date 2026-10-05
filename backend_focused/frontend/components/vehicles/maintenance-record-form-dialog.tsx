'use client';

import { Box, InputAdornment, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';

import { FormDialog } from '@/components/form-dialog';
import { useNotify } from '@/components/notifications';
import {
  useCreateMaintenanceRecord,
  useUpdateMaintenanceRecord,
} from '@/hooks/use-maintenance-records';
import { useActiveMechanicOptions } from '@/hooks/use-mechanics';
import { parseApiError } from '@/lib/api-errors';
import type { MaintenanceType, VehicleMaintenanceRecord } from '@/lib/api/types';
import { toApiDate } from '@/lib/format';
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPES } from '@/lib/maintenance-types';

export type MaintenanceRecordFormMode =
  | { kind: 'create' }
  | { kind: 'edit'; record: VehicleMaintenanceRecord };

interface MaintenanceRecordFormValues {
  maintenance_date: string;
  maintenance_type: MaintenanceType | '';
  mechanic: string;
  cost: string;
  notes: string;
}

function initialValues(mode: MaintenanceRecordFormMode): MaintenanceRecordFormValues {
  if (mode.kind === 'create') {
    const today = toApiDate(new Date());
    return { maintenance_date: today, maintenance_type: '', mechanic: '', cost: '', notes: '' };
  }
  const { record } = mode;
  return {
    maintenance_date: record.maintenance_date,
    maintenance_type: record.maintenance_type,
    mechanic: String(record.mechanic.id),
    cost: String(record.cost),
    notes: record.notes ?? '',
  };
}

interface MaintenanceRecordFormDialogProps {
  vehicleId: number;
  mode: MaintenanceRecordFormMode;
  onClose: () => void;
}

/** Add or edit a maintenance record. Mount it only while open so each opening starts fresh. */
export function MaintenanceRecordFormDialog({
  vehicleId,
  mode,
  onClose,
}: MaintenanceRecordFormDialogProps) {
  const editedRecord = mode.kind === 'edit' ? mode.record : undefined;
  const [values, setValues] = useState(() => initialValues(mode));
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const notify = useNotify();
  const { data: activeMechanics = [] } = useActiveMechanicOptions();
  const createRecord = useCreateMaintenanceRecord();
  const updateRecord = useUpdateMaintenanceRecord();
  const today = toApiDate(new Date());

  // An existing record may belong to a mechanic who has since been deactivated.
  const currentMechanic = editedRecord?.mechanic;
  const mechanicOptions =
    currentMechanic && !activeMechanics.some((mechanic) => mechanic.id === currentMechanic.id)
      ? [...activeMechanics, currentMechanic]
      : activeMechanics;

  const isIncomplete =
    !values.maintenance_date || !values.maintenance_type || !values.mechanic || !values.cost;

  function setField<Field extends keyof MaintenanceRecordFormValues>(
    field: Field,
    value: MaintenanceRecordFormValues[Field],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setServerErrors((current) => {
      const remaining = { ...current };
      delete remaining[field];
      return remaining;
    });
    setFormError(null);
  }

  function handleError(error: unknown) {
    const details = parseApiError(error);
    setServerErrors(details.fieldErrors);
    setFormError(details.message);
  }

  function handleSaved(action: 'added' | 'updated') {
    notify(`Maintenance record ${action}.`);
    onClose();
  }

  function handleSubmit() {
    if (!values.maintenance_type) return;
    const payload = {
      maintenance_date: values.maintenance_date,
      maintenance_type: values.maintenance_type,
      mechanic: Number(values.mechanic),
      cost: Number(values.cost),
      notes: values.notes.trim(),
    };
    if (editedRecord) {
      updateRecord.mutate(
        { id: editedRecord.id, changes: payload },
        { onSuccess: () => handleSaved('updated'), onError: handleError },
      );
    } else {
      createRecord.mutate(
        { ...payload, vehicle: vehicleId },
        { onSuccess: () => handleSaved('added'), onError: handleError },
      );
    }
  }

  return (
    <FormDialog
      open
      title={editedRecord ? 'Edit maintenance record' : 'Add maintenance record'}
      submitLabel={editedRecord ? 'Save changes' : 'Add record'}
      isPending={createRecord.isPending || updateRecord.isPending}
      submitDisabled={isIncomplete}
      errorMessage={formError}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
        <TextField
          label="Date"
          type="date"
          value={values.maintenance_date}
          onChange={(event) => setField('maintenance_date', event.target.value)}
          error={Boolean(serverErrors.maintenance_date)}
          helperText={serverErrors.maintenance_date}
          required
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
        />
        <TextField
          select
          label="Type"
          value={values.maintenance_type}
          onChange={(event) => setField('maintenance_type', event.target.value as MaintenanceType)}
          error={Boolean(serverErrors.maintenance_type)}
          helperText={serverErrors.maintenance_type}
          required
        >
          {MAINTENANCE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {MAINTENANCE_TYPE_LABELS[type]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Mechanic"
          value={mechanicOptions.length ? values.mechanic : ''}
          onChange={(event) => setField('mechanic', event.target.value)}
          error={Boolean(serverErrors.mechanic)}
          helperText={serverErrors.mechanic ?? 'Only active mechanics can take new work.'}
          required
        >
          {mechanicOptions.map((mechanic) => (
            <MenuItem key={mechanic.id} value={String(mechanic.id)}>
              {mechanic.name} · {mechanic.certification_number}
              {mechanic.is_active === false && ' (inactive)'}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Cost"
          type="number"
          value={values.cost}
          onChange={(event) => setField('cost', event.target.value)}
          error={Boolean(serverErrors.cost)}
          helperText={serverErrors.cost}
          required
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
            htmlInput: { min: 0, step: 0.01, inputMode: 'decimal' },
          }}
        />
        <TextField
          label="Notes"
          value={values.notes}
          onChange={(event) => setField('notes', event.target.value)}
          error={Boolean(serverErrors.notes)}
          helperText={serverErrors.notes}
          multiline
          minRows={2}
          sx={{ gridColumn: { sm: 'span 2' } }}
        />
      </Box>
    </FormDialog>
  );
}
