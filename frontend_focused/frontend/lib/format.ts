const LOCALE = 'en-US';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Dates are shown and filtered in the team's business time zone, not each browser's, so
 * everyone sees the same "Received" day. Must match Django's TIME_ZONE setting.
 */
export const BUSINESS_TIME_ZONE = 'America/New_York';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeZone: BUSINESS_TIME_ZONE,
});
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
  timeZone: BUSINESS_TIME_ZONE,
});
const monthDayFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  timeZone: BUSINESS_TIME_ZONE,
});
// en-CA formats dates as YYYY-MM-DD, the API's date format.
const apiDateFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
});
// Calendar dates ("2026-03-10") have no time zone; formatting them in UTC never shifts the day.
const calendarMonthDayFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** The business-time-zone calendar date of an instant, as an API date ("2026-10-06"). */
export function businessDate(date: Date) {
  return apiDateFormatter.format(date);
}

function calendarDateToUtc(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function calendarDayNumber(value: string) {
  return calendarDateToUtc(value).getTime() / DAY;
}

/** True for real calendar dates in API format; rejects e.g. 2026-02-31. */
export function isValidApiDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    calendarDateToUtc(value).toISOString().slice(0, 10) === value
  );
}

/** "2026-03-10" plus `days` (negative to go back). */
export function addDaysToApiDate(value: string, days: number) {
  const date = calendarDateToUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** "Oct 4, 2026" */
export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

/** "Oct 4, 2026, 8:59 AM EDT" */
export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

/** Compact age for dense lists: "just now", "12m ago", "3h ago", "Yesterday", "5d ago", "Aug 14". */
export function formatRelativeTime(value: string, now: Date = new Date()) {
  const date = new Date(value);
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;

  const calendarDays = calendarDayNumber(businessDate(now)) - calendarDayNumber(businessDate(date));
  if (calendarDays === 0) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (calendarDays === 1) return 'Yesterday';
  if (calendarDays < 7) return `${calendarDays}d ago`;
  if (businessDate(date).slice(0, 4) === businessDate(now).slice(0, 4)) {
    return monthDayFormatter.format(date);
  }
  return formatDate(value);
}

/** "Mar 10 – Mar 14", "From Mar 10", "Until Mar 14" */
export function formatDateRange(from?: string, to?: string) {
  const format = (value: string) => calendarMonthDayFormatter.format(calendarDateToUtc(value));
  if (from && to) return `${format(from)} – ${format(to)}`;
  if (from) return `From ${format(from)}`;
  if (to) return `Until ${format(to)}`;
  return '';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? singular : plural}`;
}
