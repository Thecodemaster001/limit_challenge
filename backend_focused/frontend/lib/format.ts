const LOCALE = 'en-US';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const moneyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

/**
 * Parses an API date ("2025-02-18") as a local calendar date. `new Date("2025-02-18")`
 * would be UTC midnight, which shows as the previous day west of Greenwich.
 */
export function parseApiDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a Date as an API date ("YYYY-MM-DD") in local time. */
export function toApiDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

export function formatDate(value: string | null | undefined, fallback = '—'): string {
  return value ? dateFormatter.format(parseApiDate(value)) : fallback;
}

/** Whole calendar days between an API date and `today` (0 for today). */
export function daysSince(value: string, today: Date = new Date()): number {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round(
    (startOfToday.getTime() - parseApiDate(value).getTime()) / MILLISECONDS_PER_DAY,
  );
}

/** "today", "1 day ago", "14 days ago". */
export function formatDaysAgo(value: string, today: Date = new Date()): string {
  const days = daysSince(value, today);
  if (days <= 0) return 'today';
  return days === 1 ? '1 day ago' : `${days.toLocaleString(LOCALE)} days ago`;
}
