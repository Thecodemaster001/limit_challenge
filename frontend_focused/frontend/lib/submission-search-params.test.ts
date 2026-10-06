import { describe, expect, it } from 'vitest';

import {
  clearSubmissionFilters,
  countActiveFilters,
  DEFAULT_PAGE_SIZE,
  hasInvalidDateRange,
  parseSubmissionSearch,
  serializeSubmissionSearch,
  SubmissionSearch,
  toSubmissionListQuery,
  updateSubmissionSearch,
} from './submission-search-params';

function parse(query: string) {
  return parseSubmissionSearch(new URLSearchParams(query));
}

const emptySearch: SubmissionSearch = {
  status: [],
  priority: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

describe('parseSubmissionSearch', () => {
  it('reads every supported filter', () => {
    const search = parse(
      'status=in_review,new&priority=high&brokerId=3&ownerId=7&companySearch=%20harbor%20' +
        '&createdFrom=2026-03-01&createdTo=2026-03-31&hasDocuments=true&hasNotes=false' +
        '&ordering=-priority&page=2&pageSize=25',
    );

    expect(search).toEqual({
      status: ['new', 'in_review'],
      priority: ['high'],
      brokerId: 3,
      ownerId: 7,
      companySearch: 'harbor',
      createdFrom: '2026-03-01',
      createdTo: '2026-03-31',
      hasDocuments: true,
      hasNotes: false,
      ordering: '-priority',
      page: 2,
      pageSize: 25,
    });
  });

  it('drops invalid values instead of failing', () => {
    const search = parse(
      'status=new,archived,new&priority=urgent&brokerId=abc&ownerId=0&createdFrom=2026-02-31' +
        '&createdTo=yesterday&hasDocuments=yes&ordering=summary&page=-1&pageSize=1000',
    );

    expect(search).toEqual({ ...emptySearch, status: ['new'] });
  });

  it('defaults to the first page of an unfiltered list', () => {
    expect(parse('')).toEqual(emptySearch);
  });
});

describe('serializeSubmissionSearch', () => {
  it('leaves out defaults and keeps commas readable', () => {
    const search = { ...emptySearch, status: ['new', 'in_review'] as SubmissionSearch['status'] };

    expect(serializeSubmissionSearch(search)).toBe('status=new,in_review');
    expect(serializeSubmissionSearch(emptySearch)).toBe('');
  });

  it('round-trips through the URL', () => {
    const query = 'status=new&brokerId=3&companySearch=harbor&hasNotes=true&page=3&pageSize=50';

    expect(serializeSubmissionSearch(parse(query))).toBe(query);
  });
});

describe('toSubmissionListQuery', () => {
  it('produces API parameters without empty values', () => {
    const search = parse('priority=low,high&hasDocuments=false');

    expect(toSubmissionListQuery(search)).toEqual({ priority: 'high,low', hasDocuments: false });
  });
});

describe('updateSubmissionSearch', () => {
  it('returns to the first page when a filter changes', () => {
    const search = { ...emptySearch, page: 4 };

    expect(updateSubmissionSearch(search, { brokerId: 2 }).page).toBe(1);
  });

  it('keeps the requested page when only the page changes', () => {
    expect(updateSubmissionSearch(emptySearch, { page: 3 }).page).toBe(3);
  });
});

describe('filter helpers', () => {
  const filtered = parse(
    'status=new&brokerId=2&createdFrom=2026-03-01&createdTo=2026-03-31&ordering=company&pageSize=25',
  );

  it('counts a date range as one filter', () => {
    expect(countActiveFilters(filtered)).toBe(3);
    expect(countActiveFilters(emptySearch)).toBe(0);
  });

  it('clears filters but keeps sorting and page size', () => {
    expect(clearSubmissionFilters(filtered)).toEqual({
      ...emptySearch,
      ordering: 'company',
      pageSize: 25,
    });
  });

  it('flags a range that ends before it starts', () => {
    expect(hasInvalidDateRange(parse('createdFrom=2026-03-10&createdTo=2026-03-01'))).toBe(true);
    expect(hasInvalidDateRange(filtered)).toBe(false);
  });
});
