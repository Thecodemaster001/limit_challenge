'use client';

import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import Link from 'next/link';

import type { OfficeSummary } from '@/lib/api/types';
import { formatDate, formatDaysAgo, formatMoney } from '@/lib/format';

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} textAlign="right">
        {value}
      </Typography>
    </Box>
  );
}

export function OfficeSummaryCards({ offices }: { offices: OfficeSummary[] }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }}
      gap={2}
    >
      {offices.map((office) => (
        <Card key={office.id} variant="outlined">
          <CardActionArea component={Link} href={`/vehicles?office=${office.id}`}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box mb={0.5}>
                <Typography variant="h6" component="h3">
                  {office.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {office.city}
                </Typography>
              </Box>
              <SummaryRow
                label="Active vehicles"
                value={office.active_vehicle_count.toLocaleString()}
              />
              <SummaryRow
                label="Spent, last 12 months"
                value={formatMoney(office.maintenance_cost_last_year)}
              />
              <SummaryRow
                label="Last maintenance"
                value={
                  office.last_maintenance
                    ? `${formatDate(office.last_maintenance)} (${formatDaysAgo(office.last_maintenance)})`
                    : 'None yet'
                }
              />
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
