const LOCALE = 'en-US';
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const monthDayFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric' });

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "Oct 4, 2026" */
export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

/** "Oct 4, 2026, 8:59 AM" */
export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

/** Compact age for dense lists: "just now", "12m ago", "3h ago", "Yesterday", "5d ago", "Aug 14". */
export function formatRelativeTime(value: string, now: Date = new Date()) {
  const date = new Date(value);
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;

  const calendarDays = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY);
  if (calendarDays === 0) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (calendarDays === 1) return 'Yesterday';
  if (calendarDays < 7) return `${calendarDays}d ago`;
  if (date.getFullYear() === now.getFullYear()) return monthDayFormatter.format(date);
  return formatDate(value);
}

/** Formats a Date as an API date ("YYYY-MM-DD") in local time. */
export function toApiDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses an API date ("2026-03-10") as a local calendar date rather than UTC midnight. */
export function parseApiDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** "Mar 10 – Mar 14", "From Mar 10", "Until Mar 14" */
export function formatDateRange(from?: string, to?: string) {
  const format = (value: string) => monthDayFormatter.format(parseApiDate(value));
  if (from && to) return `${format(from)} – ${format(to)}`;
  if (from) return `From ${format(from)}`;
  if (to) return `Until ${format(to)}`;
  return '';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? singular : plural}`;
}
