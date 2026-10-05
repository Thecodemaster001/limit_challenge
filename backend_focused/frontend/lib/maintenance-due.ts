import { daysSince } from '@/lib/format';

/** Matches the backend: due when never serviced or last serviced more than 365 days ago. */
export const MAINTENANCE_DUE_AFTER_DAYS = 365;

export function isMaintenanceDue(lastMaintenanceDate: string | null, today: Date = new Date()) {
  return (
    lastMaintenanceDate === null ||
    daysSince(lastMaintenanceDate, today) > MAINTENANCE_DUE_AFTER_DAYS
  );
}
