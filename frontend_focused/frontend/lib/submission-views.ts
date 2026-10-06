import { SortField, SubmissionSearch } from '@/lib/submission-search-params';
import { StatusCount, SubmissionPriority, SubmissionStatus } from '@/lib/types';

export type SubmissionViewId = 'all' | 'mine' | 'open' | 'high-priority';

const OPEN_STATUSES: SubmissionStatus[] = ['new', 'in_review'];

export interface SubmissionView {
  id: SubmissionViewId;
  label: string;
  /** The `status`, `priority` and `ownerId` this view sets; other filters are left alone. */
  preset: (teamMemberId?: number) => Pick<SubmissionSearch, 'status' | 'priority' | 'ownerId'>;
  /** Which statuses this view counts, given counts that already reflect its other presets. */
  countedStatuses?: SubmissionStatus[];
  requiresTeamMember?: boolean;
}

export const SUBMISSION_VIEWS: SubmissionView[] = [
  { id: 'all', label: 'All', preset: () => ({ status: [], priority: [], ownerId: undefined }) },
  {
    id: 'mine',
    label: 'My submissions',
    preset: (teamMemberId) => ({ status: [], priority: [], ownerId: teamMemberId }),
    requiresTeamMember: true,
  },
  {
    id: 'open',
    label: 'Open',
    preset: () => ({ status: OPEN_STATUSES, priority: [], ownerId: undefined }),
    countedStatuses: OPEN_STATUSES,
  },
  {
    id: 'high-priority',
    label: 'High priority',
    preset: () => ({
      status: OPEN_STATUSES,
      priority: ['high'] as SubmissionPriority[],
      ownerId: undefined,
    }),
    countedStatuses: OPEN_STATUSES,
  },
];

function sameValues(first: readonly string[], second: readonly string[]) {
  return first.length === second.length && first.every((value) => second.includes(value));
}

export function availableViews(teamMemberId?: number) {
  return SUBMISSION_VIEWS.filter((view) => !view.requiresTeamMember || teamMemberId !== undefined);
}

/** The view whose preset the search matches exactly, or undefined for a custom combination. */
export function activeViewId(search: SubmissionSearch, teamMemberId?: number) {
  return availableViews(teamMemberId).find((view) => {
    const preset = view.preset(teamMemberId);
    return (
      sameValues(search.status, preset.status) &&
      sameValues(search.priority, preset.priority) &&
      search.ownerId === preset.ownerId
    );
  })?.id;
}

export function countForView(view: SubmissionView, statusCounts: StatusCount[]) {
  return statusCounts
    .filter((item) => !view.countedStatuses || view.countedStatuses.includes(item.status))
    .reduce((total, item) => total + item.count, 0);
}

/** Sort direction a column starts with: dates and priority newest/highest first, text A to Z. */
const DESCENDING_FIRST: SortField[] = ['createdAt', 'priority'];
export const DEFAULT_ORDERING = '-createdAt';

export function nextOrdering(currentOrdering: string | undefined, field: SortField) {
  const ordering = currentOrdering ?? DEFAULT_ORDERING;
  if (ordering === field) return `-${field}`;
  if (ordering === `-${field}`) return field;
  return DESCENDING_FIRST.includes(field) ? `-${field}` : field;
}

export function sortState(currentOrdering: string | undefined, field: SortField) {
  const ordering = currentOrdering ?? DEFAULT_ORDERING;
  if (ordering === field) return 'asc' as const;
  if (ordering === `-${field}`) return 'desc' as const;
  return undefined;
}
