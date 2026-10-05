import type { MaintenanceType } from '@/lib/api/types';

/** Display labels; typed as a full record so a new backend type fails the build until labelled. */
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: 'Oil change',
  tire_rotation: 'Tire rotation',
  brake_service: 'Brake service',
  inspection: 'Inspection',
  engine_repair: 'Engine repair',
  transmission_service: 'Transmission service',
  battery: 'Battery',
  other: 'Other',
};

export const MAINTENANCE_TYPES = Object.keys(MAINTENANCE_TYPE_LABELS) as MaintenanceType[];
