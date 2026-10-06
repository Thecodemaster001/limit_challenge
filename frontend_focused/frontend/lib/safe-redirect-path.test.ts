import { describe, expect, it } from 'vitest';

import { DEFAULT_PATH, safeRedirectPath } from './safe-redirect-path';

describe('safeRedirectPath', () => {
  it.each([
    ['/submissions?status=new&page=2', '/submissions?status=new&page=2'],
    ['/submissions/12', '/submissions/12'],
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
    ['/\t/evil.example'],
    ['/\n/evil.example'],
    ['/\r\n/evil.example'],
    ['javascript:alert(1)'],
    ['/login?next=/submissions'],
  ])('falls back to the submissions list for %s', (candidate) => {
    expect(safeRedirectPath(candidate)).toBe(DEFAULT_PATH);
  });
});
