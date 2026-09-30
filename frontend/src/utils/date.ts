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
 * Returns the latest valid timestamp among the given date strings.
 * @param values - ISO date/datetime strings (nullish ignored).
 * @returns Epoch ms of the newest date, or null when none are valid.
 */
export function maxDateValue(
  ...values: Array<string | null | undefined>
): number | null {
  let max: number | null = null;
  for (const value of values) {
    const time = dateValue(value);
    if (time !== null && (max === null || time > max)) max = time;
  }
  return max;
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
