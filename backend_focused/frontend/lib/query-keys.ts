/**
 * Query keys in one place, nested from broad to specific so a mutation can invalidate
 * everything below a prefix (e.g. `queryKeys.vehicles.all` covers lists and details).
 */
export const queryKeys = {
  offices: {
    all: ['offices'] as const,
    list: (params: object) => [...queryKeys.offices.all, 'list', params] as const,
    summary: () => [...queryKeys.offices.all, 'summary'] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    list: (params: object) => [...queryKeys.vehicles.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.vehicles.all, 'detail', id] as const,
    maintenanceHistory: (id: number, params: object) =>
      [...queryKeys.vehicles.detail(id), 'maintenance-history', params] as const,
    needingMaintenance: (params: object) =>
      [...queryKeys.vehicles.all, 'needing-maintenance', params] as const,
    duplicateCheck: (params: object) =>
      [...queryKeys.vehicles.all, 'duplicate-check', params] as const,
  },
  mechanics: {
    all: ['mechanics'] as const,
    list: (params: object) => [...queryKeys.mechanics.all, 'list', params] as const,
  },
};
