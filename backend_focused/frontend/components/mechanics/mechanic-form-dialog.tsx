'use client';

import { FormControlLabel, Switch, TextField } from '@mui/material';

import { FormDialog } from '@/components/form-dialog';
import { useNotify } from '@/components/notifications';
import { useFormFields } from '@/hooks/use-form-fields';
import { useCreateMechanic, useUpdateMechanic } from '@/hooks/use-mechanics';
import type { Mechanic } from '@/lib/api/types';

export type MechanicFormMode = { kind: 'create' } | { kind: 'edit'; mechanic: Mechanic };

/** Create or edit a mechanic. Mount it only while open so each opening starts fresh. */
export function MechanicFormDialog({
  mode,
  onClose,
}: {
  mode: MechanicFormMode;
  onClose: () => void;
}) {
  const editedMechanic = mode.kind === 'edit' ? mode.mechanic : undefined;
  const { values, setField, fieldErrors, formError, showApiError } = useFormFields({
    name: editedMechanic?.name ?? '',
    certification_number: editedMechanic?.certification_number ?? '',
    is_active: editedMechanic?.is_active ?? true,
  });
  const notify = useNotify();
  const createMechanic = useCreateMechanic();
  const updateMechanic = useUpdateMechanic();

  function handleSaved(mechanic: Mechanic, action: 'added' | 'updated') {
    notify(`Mechanic ${mechanic.name} ${action}.`);
    onClose();
  }

  function handleSubmit() {
    const payload = {
      name: values.name.trim(),
      certification_number: values.certification_number.trim(),
      is_active: values.is_active,
    };
    if (editedMechanic) {
      updateMechanic.mutate(
        { id: editedMechanic.id, changes: payload },
        { onSuccess: (mechanic) => handleSaved(mechanic, 'updated'), onError: showApiError },
      );
    } else {
      createMechanic.mutate(payload, {
        onSuccess: (mechanic) => handleSaved(mechanic, 'added'),
        onError: showApiError,
      });
    }
  }

  return (
    <FormDialog
      open
      title={editedMechanic ? `Edit ${editedMechanic.name}` : 'Add mechanic'}
      submitLabel={editedMechanic ? 'Save changes' : 'Add mechanic'}
      isPending={createMechanic.isPending || updateMechanic.isPending}
      submitDisabled={!values.name.trim() || !values.certification_number.trim()}
      errorMessage={formError}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <TextField
        label="Name"
        value={values.name}
        onChange={(event) => setField('name', event.target.value)}
        error={Boolean(fieldErrors.name)}
        helperText={fieldErrors.name}
        required
        autoFocus
      />
      <TextField
        label="Certification number"
        value={values.certification_number}
        onChange={(event) => setField('certification_number', event.target.value)}
        error={Boolean(fieldErrors.certification_number)}
        helperText={fieldErrors.certification_number}
        required
      />
      <FormControlLabel
        control={
          <Switch
            checked={values.is_active}
            onChange={(event) => setField('is_active', event.target.checked)}
          />
        }
        label={
          values.is_active ? 'Active' : 'Inactive: keeps past records, takes no new maintenance'
        }
      />
    </FormDialog>
  );
}
