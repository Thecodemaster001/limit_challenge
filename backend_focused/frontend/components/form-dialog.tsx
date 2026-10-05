'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { PropsWithChildren, SubmitEvent } from 'react';

interface FormDialogProps {
  open: boolean;
  title: string;
  submitLabel: string;
  isPending?: boolean;
  submitDisabled?: boolean;
  /** Error that does not belong to a single field (e.g. a duplicate office). */
  errorMessage?: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

/** Dialog wrapping a form: submit on Enter, a loading submit button, and no closing mid-save. */
export function FormDialog({
  open,
  title,
  submitLabel,
  isPending = false,
  submitDisabled = false,
  errorMessage,
  onSubmit,
  onClose,
  children,
}: PropsWithChildren<FormDialogProps>) {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isPending} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
