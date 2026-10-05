'use client';

import {
  Chip,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';

import type { VehicleNeedingMaintenance } from '@/lib/api/types';
import { formatDate, formatDaysAgo } from '@/lib/format';
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination';

interface VehiclesNeedingMaintenanceTableProps {
  vehicles: VehicleNeedingMaintenance[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function LastServiceChip({ date }: { date: string | null }) {
  if (!date) return <Chip size="small" color="error" label="Never serviced" />;
  return <Chip size="small" color="warning" variant="outlined" label={formatDaysAgo(date)} />;
}

export function VehiclesNeedingMaintenanceTable({
  vehicles,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: VehiclesNeedingMaintenanceTableProps) {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small" aria-label="Vehicles needing maintenance">
          <TableHead>
            <TableRow>
              <TableCell>License plate</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Office</TableCell>
              <TableCell>Last service</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id} hover>
                <TableCell>
                  <MuiLink
                    component={Link}
                    href={`/vehicles/${vehicle.id}`}
                    fontWeight={600}
                    underline="hover"
                  >
                    {vehicle.license_plate}
                  </MuiLink>
                </TableCell>
                <TableCell>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </TableCell>
                <TableCell>{vehicle.office_name}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <LastServiceChip date={vehicle.last_maintenance_date} />
                  {vehicle.last_maintenance_date && (
                    <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                      {formatDate(vehicle.last_maintenance_date)}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
        onPageChange={(_event, zeroBasedPage) => onPageChange(zeroBasedPage + 1)}
        onRowsPerPageChange={(event) => onPageSizeChange(Number(event.target.value))}
      />
    </Paper>
  );
}
