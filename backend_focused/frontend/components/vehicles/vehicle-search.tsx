'use client';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { useNotify } from '@/components/notifications';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/page-states';
import { VehicleFilters } from '@/components/vehicles/vehicle-filters';
import { VehicleFormDialog, VehicleFormMode } from '@/components/vehicles/vehicle-form-dialog';
import { VehicleTable } from '@/components/vehicles/vehicle-table';
import { useDeleteVehicle, useVehicleList } from '@/hooks/use-vehicles';
import { parseApiError } from '@/lib/api-errors';
import type { Vehicle } from '@/lib/api/types';
import {
  clearVehicleFilters,
  hasInvalidDateRange,
  hasVehicleFilters,
  parseVehicleSearch,
  serializeVehicleSearch,
  toVehicleListQuery,
  updateVehicleSearch,
  VehicleSearch as VehicleSearchState,
} from '@/lib/vehicle-search-params';

/** The URL is the single source of truth: every filter, sort and page change navigates. */
export function VehicleSearch() {
  const router = useRouter();
  const search = parseVehicleSearch(useSearchParams());
  const hasFilters = hasVehicleFilters(search);
  const invalidDateRange = hasInvalidDateRange(search);
  const vehicles = useVehicleList(toVehicleListQuery(search), { enabled: !invalidDateRange });
  const deleteVehicle = useDeleteVehicle();
  const notify = useNotify();
  const [formMode, setFormMode] = useState<VehicleFormMode | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [filtersResetCount, setFiltersResetCount] = useState(0);

  function navigate(nextSearch: VehicleSearchState) {
    const query = serializeVehicleSearch(nextSearch);
    router.push(query ? `/vehicles?${query}` : '/vehicles', { scroll: false });
  }
  const currentSearch = () => parseVehicleSearch(new URLSearchParams(window.location.search));
  const changeSearch = (changes: Partial<VehicleSearchState>) =>
    navigate(updateVehicleSearch(currentSearch(), changes));
  function clearFilters() {
    setFiltersResetCount((count) => count + 1);
    navigate(clearVehicleFilters(currentSearch()));
  }
  const openCreateForm = () => setFormMode({ kind: 'create' });

  function confirmDelete() {
    if (!vehicleToDelete) return;
    const deletesLastRowOfPage = vehicles.data?.results.length === 1 && search.page > 1;
    deleteVehicle.mutate(vehicleToDelete.id, {
      onSuccess: () => {
        notify(`Vehicle ${vehicleToDelete.license_plate} deleted.`);
        setVehicleToDelete(null);
        if (deletesLastRowOfPage) changeSearch({ page: search.page - 1 });
      },
      onError: (error) => notify(parseApiError(error).message, 'error'),
    });
  }

  function renderResults() {
    if (invalidDateRange) {
      return (
        <EmptyState
          title="Check the date range"
          description="“Serviced to” must be on or after “Serviced from”."
        />
      );
    }
    if (vehicles.isPending) return <LoadingState label="Loading vehicles" />;
    if (vehicles.isError) {
      if (parseApiError(vehicles.error).status === 404 && search.page > 1) {
        return (
          <EmptyState
            title="This page doesn't exist"
            description="The results may have changed since this link was shared."
            action={<Button onClick={() => changeSearch({ page: 1 })}>Go to the first page</Button>}
          />
        );
      }
      return <ErrorState error={vehicles.error} onRetry={() => vehicles.refetch()} />;
    }
    if (vehicles.data.count === 0) {
      return hasFilters ? (
        <EmptyState
          title="No vehicles match these filters"
          description="Try removing a filter or widening the date range."
          action={<Button onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <EmptyState
          title="No vehicles yet"
          description="Add the first vehicle to start tracking its maintenance."
          action={
            <Button variant="contained" onClick={openCreateForm}>
              Add vehicle
            </Button>
          }
        />
      );
    }

    const { count, results } = vehicles.data;
    return (
      <Stack spacing={1}>
        <Typography color="text.secondary" aria-live="polite">
          {count.toLocaleString()} {count === 1 ? 'vehicle' : 'vehicles'}
          {hasFilters && ' match your filters'}
        </Typography>
        <Box position="relative" sx={{ opacity: vehicles.isPlaceholderData ? 0.6 : 1 }}>
          {vehicles.isFetching && (
            <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
          )}
          <VehicleTable
            vehicles={results}
            totalCount={count}
            page={search.page}
            pageSize={search.page_size}
            ordering={search.ordering}
            onPageChange={(page) => changeSearch({ page })}
            onPageSizeChange={(pageSize) => changeSearch({ page_size: pageSize })}
            onOrderingChange={(ordering) => changeSearch({ ordering })}
            onEdit={(vehicle) => setFormMode({ kind: 'edit', vehicle })}
            onDelete={setVehicleToDelete}
          />
        </Box>
      </Stack>
    );
  }

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Search the fleet by office, status, make, model and maintenance history."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
            Add vehicle
          </Button>
        }
      />
      <Stack spacing={3}>
        <VehicleFilters
          key={filtersResetCount}
          search={search}
          hasFilters={hasFilters}
          onChange={changeSearch}
          onClear={clearFilters}
        />
        {renderResults()}
      </Stack>

      {formMode && <VehicleFormDialog mode={formMode} onClose={() => setFormMode(null)} />}
      <ConfirmDialog
        open={vehicleToDelete !== null}
        title={`Delete ${vehicleToDelete?.license_plate ?? 'vehicle'}?`}
        description="This also deletes its maintenance history. To keep the history, edit the vehicle and mark it inactive instead."
        confirmLabel="Delete vehicle"
        destructive
        isPending={deleteVehicle.isPending}
        onConfirm={confirmDelete}
        onClose={() => setVehicleToDelete(null)}
      />
    </>
  );
}
