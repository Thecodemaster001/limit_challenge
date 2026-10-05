'use client';

import { TextField } from '@mui/material';

import { FormDialog } from '@/components/form-dialog';
import { useNotify } from '@/components/notifications';
import { useFormFields } from '@/hooks/use-form-fields';
import { useCreateOffice, useUpdateOffice } from '@/hooks/use-offices';
import type { Office } from '@/lib/api/types';

export type OfficeFormMode = { kind: 'create' } | { kind: 'edit'; office: Office };

/** Create or edit an office. Mount it only while open so each opening starts fresh. */
export function OfficeFormDialog({ mode, onClose }: { mode: OfficeFormMode; onClose: () => void }) {
  const editedOffice = mode.kind === 'edit' ? mode.office : undefined;
  const { values, setField, fieldErrors, formError, showApiError } = useFormFields({
    name: editedOffice?.name ?? '',
    city: editedOffice?.city ?? '',
  });
  const notify = useNotify();
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();

  function handleSaved(office: Office, action: 'added' | 'updated') {
    notify(`Office ${office.name} ${action}.`);
    onClose();
  }

  function handleSubmit() {
    const payload = { name: values.name.trim(), city: values.city.trim() };
    if (editedOffice) {
      updateOffice.mutate(
        { id: editedOffice.id, changes: payload },
        { onSuccess: (office) => handleSaved(office, 'updated'), onError: showApiError },
      );
    } else {
      createOffice.mutate(payload, {
        onSuccess: (office) => handleSaved(office, 'added'),
        onError: showApiError,
      });
    }
  }

  return (
    <FormDialog
      open
      title={editedOffice ? `Edit ${editedOffice.name}` : 'Add office'}
      submitLabel={editedOffice ? 'Save changes' : 'Add office'}
      isPending={createOffice.isPending || updateOffice.isPending}
      submitDisabled={!values.name.trim() || !values.city.trim()}
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
        label="City"
        value={values.city}
        onChange={(event) => setField('city', event.target.value)}
        error={Boolean(fieldErrors.city)}
        helperText={fieldErrors.city}
        required
      />
    </FormDialog>
  );
}
