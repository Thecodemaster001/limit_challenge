import { parseApiDate, toApiDate } from '@/lib/format';
import { SUBMISSION_PRIORITIES, SUBMISSION_STATUSES } from '@/lib/submission-display';
import { SubmissionPriority, SubmissionStatus } from '@/lib/types';

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const SORT_FIELDS = ['createdAt', 'company', 'status', 'priority'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

const MAX_SEARCH_LENGTH = 100;

/** The list search exactly as it appears in the URL; keys match the API's query parameters. */
export interface SubmissionSearch {
  status: SubmissionStatus[];
  priority: SubmissionPriority[];
  brokerId?: number;
  ownerId?: number;
  companySearch?: string;
  createdFrom?: string;
  createdTo?: string;
  hasDocuments?: boolean;
  hasNotes?: boolean;
  ordering?: string;
  page: number;
  pageSize: number;
}

export type SubmissionListQuery = Record<string, string | number | boolean>;

const SCALAR_FILTER_NAMES = [
  'brokerId',
  'ownerId',
  'companySearch',
  'createdFrom',
  'createdTo',
  'hasDocuments',
  'hasNotes',
] as const;

interface ReadableParams {
  get(name: string): string | null;
}

function parsePositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return number >= 1 && Number.isSafeInteger(number) ? number : undefined;
}

function parseBoolean(value: string | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseText(value: string | null) {
  const text = value?.trim();
  return text ? text.slice(0, MAX_SEARCH_LENGTH) : undefined;
}

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  // Rejects impossible dates such as 2026-02-31, which would roll over to March.
  return toApiDate(parseApiDate(value)) === value ? value : undefined;
}

/** Keeps known values once each, in their canonical order, so equal searches share a cache key. */
function parseList<Value extends string>(value: string | null, allowed: readonly Value[]) {
  const requested = new Set(value?.split(',') ?? []);
  return allowed.filter((option) => requested.has(option));
}

function parseOrdering(value: string | null) {
  const field = value?.replace(/^-/, '');
  return SORT_FIELDS.includes(field as SortField) ? (value as string) : undefined;
}

function parsePageSize(value: string | null) {
  const size = parsePositiveInteger(value);
  return PAGE_SIZE_OPTIONS.find((option) => option === size) ?? DEFAULT_PAGE_SIZE;
}

/** Reads the search from the URL, dropping anything invalid instead of failing. */
export function parseSubmissionSearch(params: ReadableParams): SubmissionSearch {
  return {
    status: parseList(params.get('status'), SUBMISSION_STATUSES),
    priority: parseList(params.get('priority'), SUBMISSION_PRIORITIES),
    brokerId: parsePositiveInteger(params.get('brokerId')),
    ownerId: parsePositiveInteger(params.get('ownerId')),
    companySearch: parseText(params.get('companySearch')),
    createdFrom: parseDate(params.get('createdFrom')),
    createdTo: parseDate(params.get('createdTo')),
    hasDocuments: parseBoolean(params.get('hasDocuments')),
    hasNotes: parseBoolean(params.get('hasNotes')),
    ordering: parseOrdering(params.get('ordering')),
    page: parsePositiveInteger(params.get('page')) ?? 1,
    pageSize: parsePageSize(params.get('pageSize')),
  };
}

/** The API query for this search: lists comma-joined, empty values and defaults left out. */
export function toSubmissionListQuery(search: SubmissionSearch): SubmissionListQuery {
  const query: SubmissionListQuery = {};
  if (search.status.length) query.status = search.status.join(',');
  if (search.priority.length) query.priority = search.priority.join(',');
  for (const name of SCALAR_FILTER_NAMES) {
    const value = search[name];
    if (value !== undefined && value !== '') query[name] = value;
  }
  if (search.ordering) query.ordering = search.ordering;
  if (search.page > 1) query.page = search.page;
  if (search.pageSize !== DEFAULT_PAGE_SIZE) query.pageSize = search.pageSize;
  return query;
}

/** Builds the URL query string; it carries the same keys as the API query. */
export function serializeSubmissionSearch(search: SubmissionSearch) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(toSubmissionListQuery(search))) {
    params.set(name, String(value));
  }
  // Commas are valid in a query string; keeping them literal makes the URL readable.
  return params.toString().replaceAll('%2C', ',');
}

/** Applies changes; any change other than the page itself returns to the first page. */
export function updateSubmissionSearch(
  search: SubmissionSearch,
  changes: Partial<SubmissionSearch>,
): SubmissionSearch {
  const changesResults = Object.keys(changes).some((key) => key !== 'page');
  return { ...search, ...(changesResults ? { page: 1 } : {}), ...changes };
}

export function clearSubmissionFilters(search: SubmissionSearch): SubmissionSearch {
  return {
    status: [],
    priority: [],
    ordering: search.ordering,
    page: 1,
    pageSize: search.pageSize,
  };
}

export function countActiveFilters(search: SubmissionSearch) {
  const scalarCount = SCALAR_FILTER_NAMES.filter((name) => {
    if (name === 'createdTo') return false;
    if (name === 'createdFrom') return Boolean(search.createdFrom || search.createdTo);
    return search[name] !== undefined;
  }).length;
  return scalarCount + (search.status.length ? 1 : 0) + (search.priority.length ? 1 : 0);
}

export function hasInvalidDateRange(search: SubmissionSearch) {
  return Boolean(search.createdFrom && search.createdTo && search.createdFrom > search.createdTo);
}
