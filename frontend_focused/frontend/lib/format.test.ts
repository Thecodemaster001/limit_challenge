import { describe, expect, it } from 'vitest';

import { formatDateRange, formatRelativeTime, parseApiDate, pluralize, toApiDate } from './format';

describe('formatRelativeTime', () => {
  const now = new Date(2026, 9, 6, 15, 0);

  it.each([
    [new Date(2026, 9, 6, 14, 59, 30), 'just now'],
    [new Date(2026, 9, 6, 14, 48), '12m ago'],
    [new Date(2026, 9, 6, 9, 30), '5h ago'],
    [new Date(2026, 9, 5, 23, 0), 'Yesterday'],
    [new Date(2026, 9, 1, 12, 0), '5d ago'],
    [new Date(2026, 7, 14, 12, 0), 'Aug 14'],
    [new Date(2025, 11, 30, 12, 0), 'Dec 30, 2025'],
  ])('formats %s as %s', (date, expected) => {
    expect(formatRelativeTime(date.toISOString(), now)).toBe(expected);
  });
});

describe('API dates', () => {
  it('round-trips a calendar date in local time', () => {
    expect(toApiDate(parseApiDate('2026-03-10'))).toBe('2026-03-10');
  });
});

describe('formatDateRange', () => {
  it.each([
    ['2026-03-10', '2026-03-14', 'Mar 10 – Mar 14'],
    ['2026-03-10', undefined, 'From Mar 10'],
    [undefined, '2026-03-14', 'Until Mar 14'],
    [undefined, undefined, ''],
  ])('formats %s to %s', (from, to, expected) => {
    expect(formatDateRange(from, to)).toBe(expected);
  });
});

describe('pluralize', () => {
  it('picks the singular only for exactly one', () => {
    expect(pluralize(1, 'submission')).toBe('1 submission');
    expect(pluralize(0, 'submission')).toBe('0 submissions');
    expect(pluralize(1200, 'note')).toBe('1,200 notes');
  });
});
