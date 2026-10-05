'use client';

import { Box, Paper, Skeleton, Typography } from '@mui/material';

import type { OfficeSummary } from '@/lib/api/types';
import { formatMoney } from '@/lib/format';

interface FleetTotalsProps {
  offices: OfficeSummary[] | undefined;
  vehiclesNeedingMaintenance: number | undefined;
}

function StatTile({ label, value }: { label: string; value: string | undefined }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" component="p" fontWeight={600}>
        {value ?? <Skeleton width="60%" />}
      </Typography>
    </Paper>
  );
}

export function FleetTotals({ offices, vehiclesNeedingMaintenance }: FleetTotalsProps) {
  const activeVehicles = offices?.reduce((sum, office) => sum + office.active_vehicle_count, 0);
  const costLastYear = offices?.reduce((sum, office) => sum + office.maintenance_cost_last_year, 0);

  return (
    <Box
      component="section"
      aria-label="Fleet totals"
      display="grid"
      gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }}
      gap={2}
    >
      <StatTile label="Offices" value={offices?.length.toLocaleString()} />
      <StatTile label="Active vehicles" value={activeVehicles?.toLocaleString()} />
      <StatTile
        label="Maintenance cost, last 12 months"
        value={costLastYear === undefined ? undefined : formatMoney(costLastYear)}
      />
      <StatTile label="Needing maintenance" value={vehiclesNeedingMaintenance?.toLocaleString()} />
    </Box>
  );
}
