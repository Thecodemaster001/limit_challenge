import { describe, expect, it } from 'vitest';

import { formatDaysAgo } from './format';
import { isMaintenanceDue } from './maintenance-due';

const TODAY = new Date(2026, 5, 30, 15, 0);

describe('isMaintenanceDue', () => {
  it.each([
    [null, true],
    ['2025-06-29', true],
    ['2025-06-30', false],
    ['2026-06-01', false],
  ])('last serviced %s → due: %s', (lastMaintenanceDate, expected) => {
    expect(isMaintenanceDue(lastMaintenanceDate, TODAY)).toBe(expected);
  });
});

describe('formatDaysAgo', () => {
  it.each([
    ['2026-06-30', 'today'],
    ['2026-06-29', '1 day ago'],
    ['2023-06-30', '1,096 days ago'],
  ])('%s → %s', (value, expected) => {
    expect(formatDaysAgo(value, TODAY)).toBe(expected);
  });
});
