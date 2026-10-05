import { describe, expect, it } from 'vitest';

import { safeRedirectPath } from './safe-redirect-path';

describe('safeRedirectPath', () => {
  it.each([
    ['/vehicles?make=ford&page=2', '/vehicles?make=ford&page=2'],
    ['/vehicles/12', '/vehicles/12'],
    ['/', '/'],
  ])('keeps in-app path %s', (candidate, expected) => {
    expect(safeRedirectPath(candidate)).toBe(expected);
  });

  it.each([
    [null],
    [''],
    ['https://evil.example'],
    ['//evil.example'],
    ['/\\evil.example'],
    ['javascript:alert(1)'],
    ['/login?next=/vehicles'],
  ])('falls back to the dashboard for %s', (candidate) => {
    expect(safeRedirectPath(candidate)).toBe('/');
  });
});
