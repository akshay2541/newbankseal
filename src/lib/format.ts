/** Locale-aware formatters shared by every surface. Indian conventions throughout. */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const COMPACT = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Money is stored in the database as an integer number of paise to avoid float drift.
 * Format converts back to rupees for display.
 */
export function formatPaiseAsInr(paise: number | bigint): string {
  const rupees = Number(paise) / 100;
  return INR.format(rupees);
}

export function formatInr(rupees: number): string {
  return INR.format(rupees);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatCompact(value: number): string {
  return COMPACT.format(value);
}

export function formatDate(value: Date | string): string {
  return DATE.format(typeof value === 'string' ? new Date(value) : value);
}

const DATE_TIME = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/**
 * Auction schedules are legally significant, so they always render with the time and
 * never as a bare date that could be read as end-of-day.
 */
export function formatDateTime(value: Date | string): string {
  return DATE_TIME.format(typeof value === 'string' ? new Date(value) : value);
}
