import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZE, SubmissionSearch } from './submission-search-params';
import {
  activeViewId,
  availableViews,
  countForView,
  nextOrdering,
  sortState,
  SUBMISSION_VIEWS,
} from './submission-views';
import { StatusCount } from './types';

const baseSearch: SubmissionSearch = {
  status: [],
  priority: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function view(id: string) {
  const match = SUBMISSION_VIEWS.find((candidate) => candidate.id === id);
  if (!match) throw new Error(`Unknown view ${id}`);
  return match;
}

describe('activeViewId', () => {
  it('recognises each preset, ignoring unrelated filters', () => {
    expect(activeViewId({ ...baseSearch, brokerId: 4, companySearch: 'acme' })).toBe('all');
    expect(activeViewId({ ...baseSearch, ownerId: 7 }, 7)).toBe('mine');
    expect(activeViewId({ ...baseSearch, status: ['in_review', 'new'] })).toBe('in-progress');
    expect(activeViewId({ ...baseSearch, status: ['new', 'in_review'], priority: ['high'] })).toBe(
      'high-priority',
    );
  });

  it('returns undefined for a custom combination', () => {
    expect(activeViewId({ ...baseSearch, status: ['lost'] })).toBeUndefined();
    expect(activeViewId({ ...baseSearch, ownerId: 3 }, 7)).toBeUndefined();
  });
});

describe('availableViews', () => {
  it('hides "My submissions" for accounts without a team member', () => {
    expect(availableViews().map((candidate) => candidate.id)).not.toContain('mine');
    expect(availableViews(7).map((candidate) => candidate.id)).toContain('mine');
  });
});

describe('countForView', () => {
  const statusCounts: StatusCount[] = [
    { status: 'new', count: 4 },
    { status: 'in_review', count: 6 },
    { status: 'closed', count: 3 },
    { status: 'lost', count: 2 },
  ];

  it('adds every status for unrestricted views', () => {
    expect(countForView(view('all'), statusCounts)).toBe(15);
  });

  it('only adds New and In review for the in-progress view', () => {
    expect(countForView(view('in-progress'), statusCounts)).toBe(10);
  });

  it('describes every view for its hover hint', () => {
    expect(SUBMISSION_VIEWS.every((candidate) => candidate.description.length > 0)).toBe(true);
  });
});

describe('sorting', () => {
  it('treats no ordering as newest first', () => {
    expect(sortState(undefined, 'createdAt')).toBe('desc');
    expect(sortState(undefined, 'company')).toBeUndefined();
  });

  it('starts dates and priority descending, text ascending', () => {
    expect(nextOrdering(undefined, 'priority')).toBe('-priority');
    expect(nextOrdering(undefined, 'company')).toBe('company');
  });

  it('flips the direction of the active column', () => {
    expect(nextOrdering(undefined, 'createdAt')).toBe('createdAt');
    expect(nextOrdering('company', 'company')).toBe('-company');
    expect(nextOrdering('-company', 'company')).toBe('company');
  });
});
