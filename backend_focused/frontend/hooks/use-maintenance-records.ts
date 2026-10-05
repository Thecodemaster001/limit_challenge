'use client';

import { useMutation } from '@tanstack/react-query';

import { useInvalidateFleetData } from '@/hooks/use-invalidate-fleet-data';
import {
  createMaintenanceRecord,
  deleteMaintenanceRecord,
  updateMaintenanceRecord,
} from '@/lib/api/maintenance-records';
import type { MaintenanceRecordUpdatePayload } from '@/lib/api/types';

export function useCreateMaintenanceRecord() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: createMaintenanceRecord, onSuccess: invalidateFleetData });
}

export function useUpdateMaintenanceRecord() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({
    mutationFn: ({ id, changes }: { id: number; changes: MaintenanceRecordUpdatePayload }) =>
      updateMaintenanceRecord(id, changes),
    onSuccess: invalidateFleetData,
  });
}

export function useDeleteMaintenanceRecord() {
  const invalidateFleetData = useInvalidateFleetData();
  return useMutation({ mutationFn: deleteMaintenanceRecord, onSuccess: invalidateFleetData });
}
