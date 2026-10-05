'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';

import { ActiveStatusChip } from '@/components/active-status-chip';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { MechanicFormDialog, MechanicFormMode } from '@/components/mechanics/mechanic-form-dialog';
import { useNotify } from '@/components/notifications';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/page-states';
import { useDeleteMechanic, useMechanicList, useUpdateMechanic } from '@/hooks/use-mechanics';
import { parseApiError } from '@/lib/api-errors';
import type { Mechanic } from '@/lib/api/types';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/pagination';

type StatusFilter = 'all' | 'active' | 'inactive';
const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function MechanicList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formMode, setFormMode] = useState<MechanicFormMode | null>(null);
  const [mechanicToDelete, setMechanicToDelete] = useState<Mechanic | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  const mechanics = useMechanicList({
    page,
    page_size: pageSize,
    ordering: 'name',
    ...(statusFilter !== 'all' && { is_active: statusFilter === 'active' }),
  });
  const deleteMechanic = useDeleteMechanic();
  const updateMechanic = useUpdateMechanic();
  const notify = useNotify();
  const openCreateForm = () => setFormMode({ kind: 'create' });

  function closeDeleteDialog() {
    setMechanicToDelete(null);
    setDeleteBlockedReason(null);
  }

  function confirmDelete() {
    if (!mechanicToDelete) return;
    const deletesLastRowOfPage = mechanics.data?.results.length === 1 && page > 1;
    deleteMechanic.mutate(mechanicToDelete.id, {
      onSuccess: () => {
        notify(`Mechanic ${mechanicToDelete.name} deleted.`);
        closeDeleteDialog();
        if (deletesLastRowOfPage) setPage(page - 1);
      },
      onError: (error) => {
        const details = parseApiError(error);
        if (details.status === 409) setDeleteBlockedReason(details.message);
        else notify(details.message, 'error');
      },
    });
  }

  function deactivateInstead() {
    if (!mechanicToDelete) return;
    updateMechanic.mutate(
      { id: mechanicToDelete.id, changes: { is_active: false } },
      {
        onSuccess: () => {
          notify(`${mechanicToDelete.name} deactivated. Their maintenance history is kept.`);
          closeDeleteDialog();
        },
        onError: (error) => notify(parseApiError(error).message, 'error'),
      },
    );
  }

  function renderMechanics() {
    if (mechanics.isPending) return <LoadingState label="Loading mechanics" />;
    if (mechanics.isError) {
      return <ErrorState error={mechanics.error} onRetry={() => mechanics.refetch()} />;
    }
    if (mechanics.data.count === 0) {
      return statusFilter === 'all' ? (
        <EmptyState
          title="No mechanics yet"
          description="Add the mechanics who service your fleet."
          action={
            <Button variant="contained" onClick={openCreateForm}>
              Add mechanic
            </Button>
          }
        />
      ) : (
        <EmptyState
          title={`No ${statusFilter} mechanics`}
          action={<Button onClick={() => setStatusFilter('all')}>Show all mechanics</Button>}
        />
      );
    }
    return (
      <Box position="relative" sx={{ opacity: mechanics.isPlaceholderData ? 0.6 : 1 }}>
        {mechanics.isFetching && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        )}
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" aria-label="Mechanics">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Certification number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mechanics.data.results.map((mechanic) => (
                  <TableRow key={mechanic.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{mechanic.name}</TableCell>
                    <TableCell>{mechanic.certification_number}</TableCell>
                    <TableCell>
                      <ActiveStatusChip isActive={mechanic.is_active ?? true} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${mechanic.name}`}
                          onClick={() => setFormMode({ kind: 'edit', mechanic })}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          aria-label={`Delete ${mechanic.name}`}
                          onClick={() => setMechanicToDelete(mechanic)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={mechanics.data.count}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
            onPageChange={(_event, zeroBasedPage) => setPage(zeroBasedPage + 1)}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          />
        </Paper>
      </Box>
    );
  }

  const canDeactivateInstead = deleteBlockedReason && mechanicToDelete?.is_active !== false;

  return (
    <>
      <PageHeader
        title="Mechanics"
        description="People who perform maintenance. Inactive mechanics keep their history."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
            Add mechanic
          </Button>
        }
      />
      <Stack spacing={2}>
        <TextField
          select
          label="Status"
          size="small"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as StatusFilter);
            setPage(1);
          }}
          sx={{ maxWidth: 220 }}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {renderMechanics()}
      </Stack>

      {formMode && <MechanicFormDialog mode={formMode} onClose={() => setFormMode(null)} />}
      <ConfirmDialog
        open={mechanicToDelete !== null}
        title={
          deleteBlockedReason
            ? `${mechanicToDelete?.name} can't be deleted`
            : `Delete ${mechanicToDelete?.name ?? 'mechanic'}?`
        }
        description={
          deleteBlockedReason ? (
            <Alert severity="warning">
              {deleteBlockedReason}{' '}
              {canDeactivateInstead
                ? 'Deactivate them instead: their history is kept and they take no new maintenance.'
                : 'They are already inactive, so their history is kept.'}
            </Alert>
          ) : (
            'The mechanic will be removed permanently.'
          )
        }
        confirmLabel={canDeactivateInstead ? 'Deactivate instead' : 'Delete mechanic'}
        cancelLabel={deleteBlockedReason ? 'Close' : 'Cancel'}
        destructive={!deleteBlockedReason}
        isPending={deleteMechanic.isPending || updateMechanic.isPending}
        onConfirm={
          deleteBlockedReason
            ? canDeactivateInstead
              ? deactivateInstead
              : undefined
            : confirmDelete
        }
        onClose={closeDeleteDialog}
      />
    </>
  );
}
