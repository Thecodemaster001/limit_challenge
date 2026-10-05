import { isAxiosError } from 'axios';

export interface ApiErrorDetails {
  /** One sentence suitable for an alert or snackbar. */
  message: string;
  /** DRF validation messages per field, e.g. `{ license_plate: 'An active vehicle ...' }`. */
  fieldErrors: Record<string, string>;
  status?: number;
}

const NON_FIELD_KEYS = new Set(['non_field_errors', 'detail']);

function toText(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const messages = value.map(toText).filter((message): message is string => !!message);
    return messages.length ? messages.join(' ') : null;
  }
  return null;
}

function messageForStatus(status: number | undefined, detail: string | null): string {
  if (status === undefined) return "Can't reach the server. Check your connection and try again.";
  if (status === 401) return 'Your session expired. Please sign in again.';
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return detail ?? 'This item no longer exists.';
  if (status >= 500) return 'The server ran into a problem. Please try again.';
  return detail ?? 'Something went wrong. Please try again.';
}

/** Turns an API failure (DRF validation, conflict, network, ...) into displayable messages. */
export function parseApiError(error: unknown): ApiErrorDetails {
  if (!isAxiosError(error)) {
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
  }

  const status = error.response?.status;
  const data: unknown = error.response?.data;
  const body = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const entries = Object.entries(body as Record<string, unknown>);

  const fieldErrors: Record<string, string> = {};
  for (const [field, value] of entries) {
    const text = toText(value);
    if (text && !NON_FIELD_KEYS.has(field)) fieldErrors[field] = text;
  }

  const detail =
    toText((body as Record<string, unknown>).detail) ??
    toText((body as Record<string, unknown>).non_field_errors);

  if (status === 400) {
    const fallback = Object.keys(fieldErrors).length
      ? 'Please correct the highlighted fields.'
      : 'The request was not valid.';
    return { message: detail ?? fallback, fieldErrors, status };
  }
  return { message: messageForStatus(status, detail), fieldErrors, status };
}
