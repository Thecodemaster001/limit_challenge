import { describe, expect, it } from 'vitest';

import {
  addDaysToApiDate,
  businessDate,
  formatDateRange,
  formatDateTime,
  formatRelativeTime,
  isValidApiDate,
  pluralize,
} from './format';

// All instants are written with explicit offsets, so the results don't depend on the
// time zone of the machine running the tests.
describe('formatRelativeTime', () => {
  const now = new Date('2026-10-06T15:00:00-04:00');

  it.each([
    ['2026-10-06T14:59:30-04:00', 'just now'],
    ['2026-10-06T14:48:00-04:00', '12m ago'],
    ['2026-10-06T09:30:00-04:00', '5h ago'],
    ['2026-10-05T23:00:00-04:00', 'Yesterday'],
    ['2026-10-01T12:00:00-04:00', '5d ago'],
    ['2026-08-14T12:00:00-04:00', 'Aug 14'],
    ['2025-12-30T12:00:00-05:00', 'Dec 30, 2025'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatRelativeTime(value, now)).toBe(expected);
  });

  it('counts calendar days in the business time zone', () => {
    // 11pm in New York is already the next day in UTC; it still reads as yesterday.
    const lateEvening = '2026-10-06T03:00:00Z';
    expect(formatRelativeTime(lateEvening, new Date('2026-10-06T12:00:00-04:00'))).toBe(
      'Yesterday',
    );
  });
});

describe('business time zone', () => {
  it('reads the calendar date in New York, not UTC', () => {
    expect(businessDate(new Date('2026-10-07T02:00:00Z'))).toBe('2026-10-06');
  });

  it('labels timestamps with the zone, switching between EST and EDT', () => {
    expect(formatDateTime('2026-10-04T12:59:00Z')).toBe('Oct 4, 2026, 8:59 AM EDT');
    expect(formatDateTime('2026-01-15T17:30:00Z')).toBe('Jan 15, 2026, 12:30 PM EST');
  });
});

describe('API dates', () => {
  it('validates real calendar dates', () => {
    expect(isValidApiDate('2026-03-10')).toBe(true);
    expect(isValidApiDate('2026-02-31')).toBe(false);
    expect(isValidApiDate('yesterday')).toBe(false);
  });

  it('adds and subtracts days across month boundaries', () => {
    expect(addDaysToApiDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysToApiDate('2026-12-31', 1)).toBe('2027-01-01');
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
