import { describe, expect, it } from 'vitest';

import { daysSince, formatDate, formatMoney, parseApiDate, toApiDate } from './format';

describe('dates', () => {
  it('parses API dates as local calendar dates, not UTC midnight', () => {
    const date = parseApiDate('2025-02-18');

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2025, 1, 18]);
  });

  it('round-trips through the API format', () => {
    expect(toApiDate(parseApiDate('2026-01-05'))).toBe('2026-01-05');
  });

  it('formats dates for display with a fallback for missing values', () => {
    expect(formatDate('2025-02-18')).toBe('Feb 18, 2025');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(null, 'Never')).toBe('Never');
  });

  it('counts whole days, ignoring the time of day', () => {
    const lateEvening = new Date(2026, 9, 5, 23, 30);

    expect(daysSince('2026-10-05', lateEvening)).toBe(0);
    expect(daysSince('2025-10-05', lateEvening)).toBe(365);
  });

  it('counts days correctly across a daylight-saving change', () => {
    expect(daysSince('2026-03-01', new Date(2026, 3, 1, 9))).toBe(31);
  });
});

describe('formatMoney', () => {
  it('formats amounts as US dollars', () => {
    expect(formatMoney(81250.5)).toBe('$81,250.50');
    expect(formatMoney(0)).toBe('$0.00');
  });
});
