/**
 * Parses an ISO date string into a timestamp.
 * @param value - ISO date/datetime or nullish.
 * @returns Epoch ms, or null when missing/invalid.
 */
export function dateValue(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Formats an ISO date for display.
 * @param value - ISO date/datetime or nullish.
 * @returns Localized short date, or an em dash.
 */
export function formatDisplayDate(value?: string | null): string {
  const time = dateValue(value);
  if (time === null) return '—';
  return new Date(time).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Converts an API ISO datetime to a date-input value.
 * @param value - ISO date/datetime or nullish.
 * @returns YYYY-MM-DD, or empty string.
 */
export function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/**
 * Converts a date-input value to an ISO midnight UTC string.
 * @param value - YYYY-MM-DD from an input.
 * @returns ISO string, or null when empty.
 */
export function toIsoDateOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? `${trimmed}T00:00:00.000Z` : null;
}
