'use client';

import { Alert, Box, LinearProgress, Stack, Typography } from '@mui/material';
import { PropsWithChildren, useState } from 'react';

import { FleetTotals } from '@/components/dashboard/fleet-totals';
import { OfficeSummaryCards } from '@/components/dashboard/office-summary-cards';
import { VehiclesNeedingMaintenanceTable } from '@/components/dashboard/vehicles-needing-maintenance-table';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/page-states';
import { useOfficeSummary, useVehiclesNeedingMaintenance } from '@/hooks/use-dashboard';
import { useAuth } from '@/lib/auth/auth-context';
import { MAINTENANCE_DUE_AFTER_DAYS } from '@/lib/maintenance-due';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';

function Section({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <Stack component="section" spacing={2} aria-label={title}>
      <Box>
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      {children}
    </Stack>
  );
}

export function Dashboard() {
  const { username } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const officeSummary = useOfficeSummary();
  const needingMaintenance = useVehiclesNeedingMaintenance({ page, page_size: pageSize });

  function renderOffices() {
    if (officeSummary.isPending) return <LoadingState rows={3} label="Loading office summary" />;
    if (officeSummary.isError) {
      return <ErrorState error={officeSummary.error} onRetry={() => officeSummary.refetch()} />;
    }
    if (officeSummary.data.length === 0) {
      return <EmptyState title="No offices yet" description="Add an office on the Offices page." />;
    }
    return <OfficeSummaryCards offices={officeSummary.data} />;
  }

  function renderNeedingMaintenance() {
    if (needingMaintenance.isPending) {
      return <LoadingState label="Loading vehicles needing maintenance" />;
    }
    if (needingMaintenance.isError) {
      return (
        <ErrorState error={needingMaintenance.error} onRetry={() => needingMaintenance.refetch()} />
      );
    }
    if (needingMaintenance.data.count === 0) {
      return (
        <Alert severity="success">Every active vehicle has been serviced in the last year.</Alert>
      );
    }
    return (
      <Box position="relative" sx={{ opacity: needingMaintenance.isPlaceholderData ? 0.6 : 1 }}>
        {needingMaintenance.isFetching && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        )}
        <VehiclesNeedingMaintenanceTable
          vehicles={needingMaintenance.data.results}
          totalCount={needingMaintenance.data.count}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
        />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back${username ? `, ${username}` : ''}. Here is the state of your fleet.`}
      />
      <Stack spacing={5}>
        <FleetTotals
          offices={officeSummary.data}
          vehiclesNeedingMaintenance={needingMaintenance.data?.count}
        />
        <Section
          title="Needing maintenance"
          description={`Active vehicles never serviced or last serviced more than ${MAINTENANCE_DUE_AFTER_DAYS} days ago, oldest first.`}
        >
          {renderNeedingMaintenance()}
        </Section>
        <Section
          title="Offices"
          description="Active vehicles, maintenance spend over the last 12 months and the latest service per office."
        >
          {renderOffices()}
        </Section>
      </Stack>
    </>
  );
}
