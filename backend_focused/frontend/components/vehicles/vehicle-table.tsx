'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  IconButton,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';

import { ActiveStatusChip } from '@/components/active-status-chip';
import type { Vehicle } from '@/lib/api/types';
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination';
import { VehicleSortField } from '@/lib/vehicle-search-params';

const COLUMNS: { label: string; sortField?: VehicleSortField; align?: 'right' }[] = [
  { label: 'License plate', sortField: 'license_plate' },
  { label: 'Make', sortField: 'make' },
  { label: 'Model', sortField: 'model' },
  { label: 'Year', sortField: 'year', align: 'right' },
  { label: 'VIN' },
  { label: 'Office' },
  { label: 'Status' },
];

interface VehicleTableProps {
  vehicles: Vehicle[];
  totalCount: number;
  page: number;
  pageSize: number;
  ordering?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOrderingChange: (ordering: string) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

/** First click sorts ascending, the next one descending. */
function nextOrdering(current: string | undefined, field: VehicleSortField): string {
  return current === field ? `-${field}` : field;
}

export function VehicleTable({
  vehicles,
  totalCount,
  page,
  pageSize,
  ordering,
  onPageChange,
  onPageSizeChange,
  onOrderingChange,
  onEdit,
  onDelete,
}: VehicleTableProps) {
  const sortedField = ordering?.replace(/^-/, '');
  const sortDirection = ordering?.startsWith('-') ? 'desc' : 'asc';

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small" aria-label="Vehicles">
          <TableHead>
            <TableRow>
              {COLUMNS.map(({ label, sortField, align }) => {
                const isSorted = sortField !== undefined && sortField === sortedField;
                return (
                  <TableCell
                    key={label}
                    align={align}
                    sortDirection={isSorted ? sortDirection : false}
                  >
                    {sortField ? (
                      <TableSortLabel
                        active={isSorted}
                        direction={isSorted ? sortDirection : 'asc'}
                        onClick={() => onOrderingChange(nextOrdering(ordering, sortField))}
                      >
                        {label}
                      </TableSortLabel>
                    ) : (
                      label
                    )}
                  </TableCell>
                );
              })}
              <TableCell align="right">Actions</TableCell>
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
                <TableCell>{vehicle.make}</TableCell>
                <TableCell>{vehicle.model}</TableCell>
                <TableCell align="right">{vehicle.year}</TableCell>
                <TableCell sx={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                  {vehicle.vin}
                </TableCell>
                <TableCell>{vehicle.office_name}</TableCell>
                <TableCell>
                  <ActiveStatusChip isActive={vehicle.is_active ?? true} />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      aria-label={`Edit ${vehicle.license_plate}`}
                      onClick={() => onEdit(vehicle)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      aria-label={`Delete ${vehicle.license_plate}`}
                      onClick={() => onDelete(vehicle)}
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
