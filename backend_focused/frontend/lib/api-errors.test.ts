import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { parseApiError } from './api-errors';

function apiError(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response: AxiosResponse = { config, data, status, statusText: '', headers: {} };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
}

describe('parseApiError', () => {
  it('maps DRF field errors to their fields', () => {
    const error = apiError(400, {
      license_plate: ['An active vehicle with this license plate already exists.'],
      year: ['Ensure this value is less than or equal to 2027.', 'Second message.'],
    });

    expect(parseApiError(error)).toEqual({
      status: 400,
      message: 'Please correct the highlighted fields.',
      fieldErrors: {
        license_plate: 'An active vehicle with this license plate already exists.',
        year: 'Ensure this value is less than or equal to 2027. Second message.',
      },
    });
  });

  it('uses non-field errors as the message', () => {
    const error = apiError(400, {
      non_field_errors: ['An office with this name already exists in this city.'],
    });

    const details = parseApiError(error);

    expect(details.message).toBe('An office with this name already exists in this city.');
    expect(details.fieldErrors).toEqual({});
  });

  it('shows the conflict explanation for 409 responses', () => {
    const error = apiError(409, {
      detail: 'Cannot delete this office: it is still referenced by 3 vehicles.',
    });

    expect(parseApiError(error).message).toBe(
      'Cannot delete this office: it is still referenced by 3 vehicles.',
    );
  });

  it.each([
    [404, { detail: 'No Vehicle matches the given query.' }, 'No Vehicle matches the given query.'],
    [403, { detail: 'Forbidden' }, "You don't have permission to do that."],
    [500, '<html>Server Error</html>', 'The server ran into a problem. Please try again.'],
  ])('describes HTTP %i responses', (status, data, expected) => {
    expect(parseApiError(apiError(status, data)).message).toBe(expected);
  });

  it('explains network failures', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');

    expect(parseApiError(error).message).toBe(
      "Can't reach the server. Check your connection and try again.",
    );
  });

  it('handles non-API errors', () => {
    expect(parseApiError(new Error('boom'))).toEqual({
      message: 'Something went wrong. Please try again.',
      fieldErrors: {},
    });
  });
});
