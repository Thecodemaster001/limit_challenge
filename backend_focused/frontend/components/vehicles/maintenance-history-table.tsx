'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import type { VehicleMaintenanceRecord } from '@/lib/api/types';
import { formatDate, formatMoney } from '@/lib/format';
import { MAINTENANCE_TYPE_LABELS } from '@/lib/maintenance-types';
import { PAGE_SIZE_OPTIONS } from '@/lib/vehicle-search-params';

interface MaintenanceHistoryTableProps {
  records: VehicleMaintenanceRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (record: VehicleMaintenanceRecord) => void;
  onDelete: (record: VehicleMaintenanceRecord) => void;
}

export function MaintenanceHistoryTable({
  records,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: MaintenanceHistoryTableProps) {
  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small" aria-label="Maintenance history">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Mechanic</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => {
              const label = `${MAINTENANCE_TYPE_LABELS[record.maintenance_type]} on ${formatDate(record.maintenance_date)}`;
              return (
                <TableRow key={record.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatDate(record.maintenance_date)}
                  </TableCell>
                  <TableCell>{MAINTENANCE_TYPE_LABELS[record.maintenance_type]}</TableCell>
                  <TableCell>
                    {record.mechanic.name}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {record.mechanic.certification_number}
                      {record.mechanic.is_active === false && ' · inactive'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatMoney(record.cost)}</TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" noWrap title={record.notes || undefined}>
                      {record.notes || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        aria-label={`Edit ${label}`}
                        onClick={() => onEdit(record)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        aria-label={`Delete ${label}`}
                        onClick={() => onDelete(record)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
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
