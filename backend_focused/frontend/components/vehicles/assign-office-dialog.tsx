'use client';

import { Alert, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';

import { FormDialog } from '@/components/form-dialog';
import { useNotify } from '@/components/notifications';
import { useOfficeOptions } from '@/hooks/use-offices';
import { useAssignVehicleOffice } from '@/hooks/use-vehicles';
import { parseApiError } from '@/lib/api-errors';
import type { Office } from '@/lib/api/types';

interface AssignOfficeDialogProps {
  vehicleId: number;
  licensePlate: string;
  currentOffice: Office;
  onClose: () => void;
}

/** Moves a vehicle to another office. Mount it only while open so each opening starts fresh. */
export function AssignOfficeDialog({
  vehicleId,
  licensePlate,
  currentOffice,
  onClose,
}: AssignOfficeDialogProps) {
  const [officeId, setOfficeId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const notify = useNotify();
  const { data: offices = [], isPending: officesLoading } = useOfficeOptions();
  const assignOffice = useAssignVehicleOffice();
  const otherOffices = offices.filter((office) => office.id !== currentOffice.id);

  function handleSubmit() {
    const targetOffice = otherOffices.find((office) => office.id === Number(officeId));
    if (!targetOffice) return;
    assignOffice.mutate(
      { id: vehicleId, officeId: targetOffice.id },
      {
        onSuccess: () => {
          notify(`${licensePlate} moved to ${targetOffice.name}.`);
          onClose();
        },
        onError: (error) => setErrorMessage(parseApiError(error).message),
      },
    );
  }

  return (
    <FormDialog
      open
      title={`Assign ${licensePlate} to another office`}
      submitLabel="Move vehicle"
      isPending={assignOffice.isPending}
      submitDisabled={!officeId}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <TextField
        label="Current office"
        value={`${currentOffice.name} (${currentOffice.city})`}
        disabled
      />
      {!officesLoading && otherOffices.length === 0 ? (
        <Alert severity="info">There is no other office to move this vehicle to.</Alert>
      ) : (
        <TextField
          select
          label="New office"
          value={officeId}
          onChange={(event) => {
            setOfficeId(event.target.value);
            setErrorMessage(null);
          }}
          disabled={officesLoading}
          required
          autoFocus
        >
          {otherOffices.map((office) => (
            <MenuItem key={office.id} value={String(office.id)}>
              {office.name} ({office.city})
            </MenuItem>
          ))}
        </TextField>
      )}
    </FormDialog>
  );
}
