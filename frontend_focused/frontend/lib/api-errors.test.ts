import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { parseApiError } from './api-errors';

function axiosErrorWith(status: number | undefined, data?: unknown) {
  const config = { headers: new AxiosHeaders() };
  const response = status ? { status, data, statusText: '', headers: {}, config } : undefined;
  return new AxiosError('Request failed', undefined, config, undefined, response);
}

describe('parseApiError', () => {
  it('collects field errors from a validation response', () => {
    const error = axiosErrorWith(400, { ownerId: ['Invalid pk "9" - object does not exist.'] });

    expect(parseApiError(error)).toEqual({
      message: 'Please correct the highlighted fields.',
      fieldErrors: { ownerId: 'Invalid pk "9" - object does not exist.' },
      status: 400,
    });
  });

  it('prefers the server detail for non-field validation errors', () => {
    const error = axiosErrorWith(400, { nonFieldErrors: ['Pick at least one field.'] });

    expect(parseApiError(error).message).toBe('Pick at least one field.');
  });

  it('uses the server message for failed sign-ins', () => {
    const error = axiosErrorWith(401, { detail: 'Incorrect username or password.' });

    expect(parseApiError(error).message).toBe('Incorrect username or password.');
  });

  it.each([
    [403, "You don't have permission to do that."],
    [404, 'This submission no longer exists.'],
    [429, 'Too many attempts. Wait a minute and try again.'],
    [503, 'The server ran into a problem. Please try again.'],
  ])('maps status %i to a readable message', (status, message) => {
    expect(parseApiError(axiosErrorWith(status, {})).message).toBe(message);
  });

  it('explains network failures', () => {
    expect(parseApiError(axiosErrorWith(undefined)).message).toMatch(/can't reach the server/i);
  });

  it('handles errors that are not from axios', () => {
    expect(parseApiError(new Error('boom'))).toEqual({
      message: 'Something went wrong. Please try again.',
      fieldErrors: {},
    });
  });
});
