'use client';

import { Chip } from '@mui/material';

export function VehicleStatusChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      size="small"
      label={isActive ? 'Active' : 'Inactive'}
      color={isActive ? 'success' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
    />
  );
}
