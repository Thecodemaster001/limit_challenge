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
  Link as MuiLink,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { useNotify } from '@/components/notifications';
import { OfficeFormDialog, OfficeFormMode } from '@/components/offices/office-form-dialog';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/page-states';
import { useDeleteOffice, useOfficeList } from '@/hooks/use-offices';
import { parseApiError } from '@/lib/api-errors';
import type { Office } from '@/lib/api/types';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/pagination';

const vehiclesOfOffice = (office: Office) => `/vehicles?office=${office.id}`;

export function OfficeList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [formMode, setFormMode] = useState<OfficeFormMode | null>(null);
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  const offices = useOfficeList({ page, page_size: pageSize, ordering: 'name' });
  const deleteOffice = useDeleteOffice();
  const notify = useNotify();
  const openCreateForm = () => setFormMode({ kind: 'create' });

  function closeDeleteDialog() {
    setOfficeToDelete(null);
    setDeleteBlockedReason(null);
  }

  function confirmDelete() {
    if (!officeToDelete) return;
    const deletesLastRowOfPage = offices.data?.results.length === 1 && page > 1;
    deleteOffice.mutate(officeToDelete.id, {
      onSuccess: () => {
        notify(`Office ${officeToDelete.name} deleted.`);
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

  function renderOffices() {
    if (offices.isPending) return <LoadingState label="Loading offices" />;
    if (offices.isError) {
      return <ErrorState error={offices.error} onRetry={() => offices.refetch()} />;
    }
    if (offices.data.count === 0) {
      return (
        <EmptyState
          title="No offices yet"
          description="Vehicles are assigned to offices, so start by adding one."
          action={
            <Button variant="contained" onClick={openCreateForm}>
              Add office
            </Button>
          }
        />
      );
    }
    return (
      <Box position="relative" sx={{ opacity: offices.isPlaceholderData ? 0.6 : 1 }}>
        {offices.isFetching && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        )}
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small" aria-label="Offices">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offices.data.results.map((office) => (
                  <TableRow key={office.id} hover>
                    <TableCell>
                      <MuiLink
                        component={Link}
                        href={vehiclesOfOffice(office)}
                        underline="hover"
                        fontWeight={600}
                      >
                        {office.name}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{office.city}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${office.name}`}
                          onClick={() => setFormMode({ kind: 'edit', office })}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          aria-label={`Delete ${office.name}`}
                          onClick={() => setOfficeToDelete(office)}
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
            count={offices.data.count}
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

  return (
    <>
      <PageHeader
        title="Offices"
        description="Locations vehicles are assigned to. Select an office to see its vehicles."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
            Add office
          </Button>
        }
      />
      <Stack spacing={2}>{renderOffices()}</Stack>

      {formMode && <OfficeFormDialog mode={formMode} onClose={() => setFormMode(null)} />}
      <ConfirmDialog
        open={officeToDelete !== null}
        title={
          deleteBlockedReason
            ? `${officeToDelete?.name} can't be deleted`
            : `Delete ${officeToDelete?.name ?? 'office'}?`
        }
        description={
          deleteBlockedReason && officeToDelete ? (
            <Alert severity="warning">
              {deleteBlockedReason} Move its vehicles to another office first.{' '}
              <MuiLink component={Link} href={vehiclesOfOffice(officeToDelete)}>
                View its vehicles
              </MuiLink>
            </Alert>
          ) : (
            'The office will be removed permanently.'
          )
        }
        confirmLabel="Delete office"
        cancelLabel={deleteBlockedReason ? 'Close' : 'Cancel'}
        destructive
        isPending={deleteOffice.isPending}
        onConfirm={deleteBlockedReason ? undefined : confirmDelete}
        onClose={closeDeleteDialog}
      />
    </>
  );
}
