import type { VehicleListQuery } from '@/lib/api/types';
import { parseApiDate, toApiDate } from '@/lib/format';

export const VEHICLE_SORT_FIELDS = ['license_plate', 'make', 'model', 'year'] as const;
export type VehicleSortField = (typeof VEHICLE_SORT_FIELDS)[number];

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
const MAX_TEXT_LENGTH = 100;

export const VEHICLE_FILTER_NAMES = [
  'office',
  'is_active',
  'make',
  'model',
  'maintenance_date_from',
  'maintenance_date_to',
  'mechanic_certification',
] as const;

/** The vehicle search exactly as it appears in the URL; keys match the API's query parameters. */
export interface VehicleSearch {
  office?: number;
  is_active?: boolean;
  make?: string;
  model?: string;
  maintenance_date_from?: string;
  maintenance_date_to?: string;
  mechanic_certification?: string;
  ordering?: string;
  page: number;
  page_size: number;
}

interface ReadableParams {
  get(name: string): string | null;
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return number >= 1 && Number.isSafeInteger(number) ? number : undefined;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseText(value: string | null): string | undefined {
  const text = value?.trim();
  return text ? text.slice(0, MAX_TEXT_LENGTH) : undefined;
}

function parseDate(value: string | null): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  // Rejects impossible dates such as 2026-02-31, which would roll over to March.
  return toApiDate(parseApiDate(value)) === value ? value : undefined;
}

function parseOrdering(value: string | null): string | undefined {
  const field = value?.replace(/^-/, '');
  return VEHICLE_SORT_FIELDS.includes(field as VehicleSortField) ? (value as string) : undefined;
}

function parsePageSize(value: string | null): number {
  const size = parsePositiveInteger(value);
  return PAGE_SIZE_OPTIONS.find((option) => option === size) ?? DEFAULT_PAGE_SIZE;
}

/** Reads the search from the URL, dropping anything invalid instead of failing. */
export function parseVehicleSearch(params: ReadableParams): VehicleSearch {
  return {
    office: parsePositiveInteger(params.get('office')),
    is_active: parseBoolean(params.get('is_active')),
    make: parseText(params.get('make')),
    model: parseText(params.get('model')),
    maintenance_date_from: parseDate(params.get('maintenance_date_from')),
    maintenance_date_to: parseDate(params.get('maintenance_date_to')),
    mechanic_certification: parseText(params.get('mechanic_certification')),
    ordering: parseOrdering(params.get('ordering')),
    page: parsePositiveInteger(params.get('page')) ?? 1,
    page_size: parsePageSize(params.get('page_size')),
  };
}

/** Builds the query string, leaving out empty values and defaults so URLs stay short. */
export function serializeVehicleSearch(search: VehicleSearch): string {
  const params = new URLSearchParams();
  for (const name of VEHICLE_FILTER_NAMES) {
    const value = search[name];
    if (value !== undefined && value !== '') params.set(name, String(value));
  }
  if (search.ordering) params.set('ordering', search.ordering);
  if (search.page > 1) params.set('page', String(search.page));
  if (search.page_size !== DEFAULT_PAGE_SIZE) params.set('page_size', String(search.page_size));
  return params.toString();
}

/** Applies changes; any change other than the page itself returns to the first page. */
export function updateVehicleSearch(
  search: VehicleSearch,
  changes: Partial<VehicleSearch>,
): VehicleSearch {
  const changesResults = Object.keys(changes).some((key) => key !== 'page');
  return { ...search, ...(changesResults ? { page: 1 } : {}), ...changes };
}

export function clearVehicleFilters(search: VehicleSearch): VehicleSearch {
  return { ordering: search.ordering, page: 1, page_size: search.page_size };
}

export function hasVehicleFilters(search: VehicleSearch): boolean {
  return VEHICLE_FILTER_NAMES.some((name) => search[name] !== undefined);
}

export function hasInvalidDateRange(search: VehicleSearch): boolean {
  const { maintenance_date_from: from, maintenance_date_to: to } = search;
  return Boolean(from && to && from > to);
}

/** The API query for this search, without undefined keys so cache keys stay stable. */
export function toVehicleListQuery(search: VehicleSearch): VehicleListQuery {
  return Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined),
  ) as VehicleListQuery;
}
