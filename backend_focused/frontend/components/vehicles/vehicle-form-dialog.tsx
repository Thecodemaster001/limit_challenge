'use client';

import { Box, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { useState } from 'react';

import { FormDialog } from '@/components/form-dialog';
import { useNotify } from '@/components/notifications';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useOfficeOptions } from '@/hooks/use-offices';
import { useCreateVehicle, useUpdateVehicle, useVehicleDuplicateCheck } from '@/hooks/use-vehicles';
import { parseApiError } from '@/lib/api-errors';
import type { Vehicle } from '@/lib/api/types';

export type VehicleFormMode = { kind: 'create' } | { kind: 'edit'; vehicle: Vehicle };

interface VehicleFormValues {
  vin: string;
  license_plate: string;
  make: string;
  model: string;
  year: string;
  office: string;
  is_active: boolean;
}

const VIN_LENGTH = 17;
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 1;
const CONFLICT_MESSAGES = {
  vin: 'Another vehicle already has this VIN.',
  license_plate: 'An active vehicle already uses this license plate.',
};

function initialValues(mode: VehicleFormMode): VehicleFormValues {
  if (mode.kind === 'create') {
    return {
      vin: '',
      license_plate: '',
      make: '',
      model: '',
      year: '',
      office: '',
      is_active: true,
    };
  }
  const { vehicle } = mode;
  return {
    vin: vehicle.vin,
    license_plate: vehicle.license_plate,
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    office: String(vehicle.office),
    is_active: vehicle.is_active ?? true,
  };
}

const normalizeIdentifier = (value: string) => value.trim().toUpperCase();

/** Create or edit a vehicle. Mount it only while open so each opening starts fresh. */
export function VehicleFormDialog({
  mode,
  onClose,
}: {
  mode: VehicleFormMode;
  onClose: () => void;
}) {
  const editedVehicle = mode.kind === 'edit' ? mode.vehicle : undefined;
  const [values, setValues] = useState(() => initialValues(mode));
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const notify = useNotify();
  const { data: offices = [] } = useOfficeOptions();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const isPending = createVehicle.isPending || updateVehicle.isPending;

  const vin = normalizeIdentifier(values.vin);
  const licensePlate = normalizeIdentifier(values.license_plate);
  const debouncedVin = useDebouncedValue(vin);
  const debouncedLicensePlate = useDebouncedValue(licensePlate);
  const { data: duplicateCheck } = useVehicleDuplicateCheck({
    vin: debouncedVin.length === VIN_LENGTH ? debouncedVin : undefined,
    license_plate: values.is_active && debouncedLicensePlate ? debouncedLicensePlate : undefined,
    exclude_id: editedVehicle?.id,
  });
  const conflicts = duplicateCheck?.conflicts ?? [];
  // Only trust a check that was made for what is currently typed.
  const vinConflict = conflicts.includes('vin') && debouncedVin === vin;
  const licensePlateConflict =
    values.is_active &&
    conflicts.includes('license_plate') &&
    debouncedLicensePlate === licensePlate;

  const errors: Partial<Record<keyof VehicleFormValues, string>> = {
    ...serverErrors,
    ...(vinConflict && { vin: CONFLICT_MESSAGES.vin }),
    ...(licensePlateConflict && { license_plate: CONFLICT_MESSAGES.license_plate }),
  };
  const isIncomplete =
    !vin ||
    !licensePlate ||
    !values.make.trim() ||
    !values.model.trim() ||
    !values.year ||
    (!editedVehicle && !values.office);

  function setField<Field extends keyof VehicleFormValues>(
    field: Field,
    value: VehicleFormValues[Field],
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

  function handleSaved(vehicle: Vehicle, action: 'added' | 'updated') {
    notify(`Vehicle ${vehicle.license_plate} ${action}.`);
    onClose();
  }

  function handleSubmit() {
    const payload = {
      vin,
      license_plate: licensePlate,
      make: values.make.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      is_active: values.is_active,
    };
    if (editedVehicle) {
      updateVehicle.mutate(
        { id: editedVehicle.id, changes: payload },
        { onSuccess: (vehicle) => handleSaved(vehicle, 'updated'), onError: handleError },
      );
    } else {
      createVehicle.mutate(
        { ...payload, office: Number(values.office) },
        { onSuccess: (vehicle) => handleSaved(vehicle, 'added'), onError: handleError },
      );
    }
  }

  return (
    <FormDialog
      open
      title={editedVehicle ? `Edit ${editedVehicle.license_plate}` : 'Add vehicle'}
      submitLabel={editedVehicle ? 'Save changes' : 'Add vehicle'}
      isPending={isPending}
      submitDisabled={isIncomplete || vinConflict || licensePlateConflict}
      errorMessage={formError}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
        <TextField
          label="VIN"
          value={values.vin}
          onChange={(event) => setField('vin', event.target.value)}
          error={Boolean(errors.vin)}
          helperText={errors.vin ?? `${vin.length}/${VIN_LENGTH} characters, no I, O or Q`}
          required
          autoFocus
          slotProps={{ htmlInput: { maxLength: VIN_LENGTH + 4, autoCapitalize: 'characters' } }}
          sx={{ gridColumn: { sm: 'span 2' } }}
        />
        <TextField
          label="License plate"
          value={values.license_plate}
          onChange={(event) => setField('license_plate', event.target.value)}
          error={Boolean(errors.license_plate)}
          helperText={errors.license_plate}
          required
          slotProps={{ htmlInput: { maxLength: 20, autoCapitalize: 'characters' } }}
        />
        <TextField
          label="Year"
          type="number"
          value={values.year}
          onChange={(event) => setField('year', event.target.value)}
          error={Boolean(errors.year)}
          helperText={errors.year}
          required
          slotProps={{ htmlInput: { min: MIN_YEAR, max: MAX_YEAR, inputMode: 'numeric' } }}
        />
        <TextField
          label="Make"
          value={values.make}
          onChange={(event) => setField('make', event.target.value)}
          error={Boolean(errors.make)}
          helperText={errors.make}
          required
        />
        <TextField
          label="Model"
          value={values.model}
          onChange={(event) => setField('model', event.target.value)}
          error={Boolean(errors.model)}
          helperText={errors.model}
          required
        />
        {editedVehicle ? (
          <TextField
            label="Office"
            value={editedVehicle.office_name}
            disabled
            helperText="To move this vehicle, use “Assign office” on its page."
            sx={{ gridColumn: { sm: 'span 2' } }}
          />
        ) : (
          <TextField
            select
            label="Office"
            value={values.office}
            onChange={(event) => setField('office', event.target.value)}
            error={Boolean(errors.office)}
            helperText={errors.office}
            required
            sx={{ gridColumn: { sm: 'span 2' } }}
          >
            {offices.map((office) => (
              <MenuItem key={office.id} value={String(office.id)}>
                {office.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={values.is_active}
              onChange={(event) => setField('is_active', event.target.checked)}
            />
          }
          label={values.is_active ? 'Active' : 'Inactive (retired or out of service)'}
          sx={{ gridColumn: { sm: 'span 2' } }}
        />
      </Box>
    </FormDialog>
  );
}
