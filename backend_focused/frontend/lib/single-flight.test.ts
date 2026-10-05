import { describe, expect, it, vi } from 'vitest';

import { createSingleFlight } from './single-flight';

describe('createSingleFlight', () => {
  it('runs the task once for concurrent callers', async () => {
    const task = vi.fn().mockResolvedValue('new-access-token');
    const refresh = createSingleFlight(task);

    const results = await Promise.all([refresh(), refresh(), refresh()]);

    expect(task).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['new-access-token', 'new-access-token', 'new-access-token']);
  });

  it('starts a new run after the previous one settled', async () => {
    const task = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const refresh = createSingleFlight(task);

    expect(await refresh()).toBe('first');
    expect(await refresh()).toBe('second');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('shares a failure with every caller and allows a retry afterwards', async () => {
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh expired'))
      .mockResolvedValueOnce('recovered');
    const refresh = createSingleFlight(task);

    const outcomes = await Promise.allSettled([refresh(), refresh()]);

    expect(outcomes.map((outcome) => outcome.status)).toEqual(['rejected', 'rejected']);
    expect(await refresh()).toBe('recovered');
    expect(task).toHaveBeenCalledTimes(2);
  });
});
