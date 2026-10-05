'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { PropsWithChildren, ReactNode, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { useNotify } from '@/components/notifications';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/page-states';
import { AssignOfficeDialog } from '@/components/vehicles/assign-office-dialog';
import { MaintenanceHistoryTable } from '@/components/vehicles/maintenance-history-table';
import {
  MaintenanceRecordFormDialog,
  MaintenanceRecordFormMode,
} from '@/components/vehicles/maintenance-record-form-dialog';
import { VehicleFormDialog } from '@/components/vehicles/vehicle-form-dialog';
import { VehicleStatusChip } from '@/components/vehicles/vehicle-status-chip';
import { useDeleteMaintenanceRecord } from '@/hooks/use-maintenance-records';
import { useVehicleDetail, useVehicleMaintenanceHistory } from '@/hooks/use-vehicles';
import { parseApiError } from '@/lib/api-errors';
import type { Vehicle, VehicleDetail, VehicleMaintenanceRecord } from '@/lib/api/types';
import { formatDate, formatDaysAgo, formatMoney } from '@/lib/format';
import { isMaintenanceDue } from '@/lib/maintenance-due';
import { DEFAULT_PAGE_SIZE } from '@/lib/vehicle-search-params';

function InfoCard({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

function Detail({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography component="div" textAlign="right">
        {children}
      </Typography>
    </Box>
  );
}

/** The detail endpoint returns the office as an object; the vehicle form expects the list shape. */
function toVehicle(detail: VehicleDetail): Vehicle {
  return { ...detail, office: detail.office.id, office_name: detail.office.name };
}

export function VehicleDetails({ vehicleId }: { vehicleId: number }) {
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [isAssigningOffice, setIsAssigningOffice] = useState(false);
  const [recordFormMode, setRecordFormMode] = useState<MaintenanceRecordFormMode | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<VehicleMaintenanceRecord | null>(null);

  const vehicle = useVehicleDetail(vehicleId);
  const history = useVehicleMaintenanceHistory(vehicleId, {
    page: historyPage,
    page_size: historyPageSize,
  });
  const deleteRecord = useDeleteMaintenanceRecord();
  const notify = useNotify();

  const backLink = (
    <MuiLink
      component={Link}
      href="/vehicles"
      underline="hover"
      display="inline-flex"
      gap={0.5}
      mb={2}
    >
      <ArrowBackIcon fontSize="small" /> All vehicles
    </MuiLink>
  );

  if (vehicle.isPending) return <LoadingState label="Loading vehicle" />;
  if (vehicle.isError) {
    return (
      <>
        {backLink}
        {parseApiError(vehicle.error).status === 404 ? (
          <EmptyState
            title="Vehicle not found"
            description="It may have been deleted, or the link is incorrect."
            action={
              <Button component={Link} href="/vehicles" variant="contained">
                Back to vehicles
              </Button>
            }
          />
        ) : (
          <ErrorState error={vehicle.error} onRetry={() => vehicle.refetch()} />
        )}
      </>
    );
  }

  const details = vehicle.data;
  const records = details.maintenance_records;
  const lastMaintenanceDate = records[0]?.maintenance_date ?? null;
  const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
  const isDue = (details.is_active ?? true) && isMaintenanceDue(lastMaintenanceDate);
  const openCreateRecord = () => setRecordFormMode({ kind: 'create' });

  function confirmDeleteRecord() {
    if (!recordToDelete) return;
    const deletesLastRowOfPage = history.data?.results.length === 1 && historyPage > 1;
    deleteRecord.mutate(recordToDelete.id, {
      onSuccess: () => {
        notify('Maintenance record deleted.');
        setRecordToDelete(null);
        if (deletesLastRowOfPage) setHistoryPage(historyPage - 1);
      },
      onError: (error) => notify(parseApiError(error).message, 'error'),
    });
  }

  function renderHistory() {
    if (history.isPending) return <LoadingState label="Loading maintenance history" />;
    if (history.isError) {
      return <ErrorState error={history.error} onRetry={() => history.refetch()} />;
    }
    if (history.data.count === 0) {
      return (
        <EmptyState
          title="No maintenance recorded yet"
          description="Record the first service to start this vehicle's history."
          action={
            <Button variant="contained" onClick={openCreateRecord}>
              Add maintenance
            </Button>
          }
        />
      );
    }
    return (
      <Box position="relative" sx={{ opacity: history.isPlaceholderData ? 0.6 : 1 }}>
        {history.isFetching && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        )}
        <MaintenanceHistoryTable
          records={history.data.results}
          totalCount={history.data.count}
          page={historyPage}
          pageSize={historyPageSize}
          onPageChange={setHistoryPage}
          onPageSizeChange={(pageSize) => {
            setHistoryPageSize(pageSize);
            setHistoryPage(1);
          }}
          onEdit={(record) => setRecordFormMode({ kind: 'edit', record })}
          onDelete={setRecordToDelete}
        />
      </Box>
    );
  }

  return (
    <>
      {backLink}
      <PageHeader
        title={details.license_plate}
        description={`${details.year} ${details.make} ${details.model}`}
        actions={
          <>
            <Button variant="outlined" onClick={() => setIsEditingVehicle(true)}>
              Edit vehicle
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateRecord}>
              Add maintenance
            </Button>
          </>
        }
      />

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2} mb={4}>
        <InfoCard title="Vehicle">
          <Detail label="VIN">
            <Box component="span" sx={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {details.vin}
            </Box>
          </Detail>
          <Detail label="Year">{details.year}</Detail>
          <Detail label="Status">
            <VehicleStatusChip isActive={details.is_active ?? true} />
          </Detail>
        </InfoCard>
        <InfoCard
          title="Office"
          action={
            <Button size="small" onClick={() => setIsAssigningOffice(true)}>
              Assign office
            </Button>
          }
        >
          <Typography variant="h6" component="p">
            {details.office.name}
          </Typography>
          <Typography color="text.secondary">{details.office.city}</Typography>
        </InfoCard>
        <InfoCard
          title="Maintenance"
          action={isDue && <Chip size="small" color="warning" label="Due for maintenance" />}
        >
          <Detail label="Records">{records.length.toLocaleString()}</Detail>
          <Detail label="Total spent">{formatMoney(totalCost)}</Detail>
          <Detail label="Last service">
            {lastMaintenanceDate
              ? `${formatDate(lastMaintenanceDate)} (${formatDaysAgo(lastMaintenanceDate)})`
              : 'Never serviced'}
          </Detail>
        </InfoCard>
      </Box>

      <Stack spacing={2}>
        <Typography variant="h5" component="h2">
          Maintenance history
        </Typography>
        {renderHistory()}
      </Stack>

      {isEditingVehicle && (
        <VehicleFormDialog
          mode={{ kind: 'edit', vehicle: toVehicle(details) }}
          onClose={() => setIsEditingVehicle(false)}
        />
      )}
      {isAssigningOffice && (
        <AssignOfficeDialog
          vehicleId={details.id}
          licensePlate={details.license_plate}
          currentOffice={details.office}
          onClose={() => setIsAssigningOffice(false)}
        />
      )}
      {recordFormMode && (
        <MaintenanceRecordFormDialog
          vehicleId={details.id}
          mode={recordFormMode}
          onClose={() => setRecordFormMode(null)}
        />
      )}
      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete this maintenance record?"
        description={
          recordToDelete
            ? `The ${formatDate(recordToDelete.maintenance_date)} record (${formatMoney(recordToDelete.cost)}) will be removed from the history and from cost reports.`
            : ''
        }
        confirmLabel="Delete record"
        destructive
        isPending={deleteRecord.isPending}
        onConfirm={confirmDeleteRecord}
        onClose={() => setRecordToDelete(null)}
      />
    </>
  );
}
