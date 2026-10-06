import { describe, expect, it } from 'vitest';

import { locateInList } from './submission-navigation';

const secondPage = { ids: [21, 22, 23], page: 2, pageSize: 3, totalCount: 8 };

describe('locateInList', () => {
  it('finds neighbours on the same page', () => {
    expect(locateInList(secondPage, 22)).toEqual({
      position: 5,
      totalCount: 8,
      previous: { id: 21, page: 2 },
      next: { id: 23, page: 2 },
    });
  });

  it('points to the adjacent page at page boundaries', () => {
    expect(locateInList(secondPage, 21)?.previous).toEqual({ page: 1 });
    expect(locateInList(secondPage, 23)?.next).toEqual({ page: 3 });
  });

  it('has no previous for the first submission and no next for the last', () => {
    const firstPage = { ids: [1, 2, 3], page: 1, pageSize: 3, totalCount: 3 };

    expect(locateInList(firstPage, 1)?.previous).toBeNull();
    expect(locateInList(firstPage, 3)?.next).toBeNull();
  });

  it('returns null when the submission is not on the page', () => {
    expect(locateInList(secondPage, 99)).toBeNull();
  });
});
