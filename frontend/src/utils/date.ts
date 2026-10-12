// Parse an ISO date string into an epoch timestamp
export function dateValue(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

// Return the latest valid timestamp among the given date strings
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

// Format an ISO date for localized short display
export function formatDisplayDate(value?: string | null): string {
  const time = dateValue(value);
  if (time === null) return '—';
  return new Date(time).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Convert an API ISO datetime to a YYYY-MM-DD date-input value
export function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

// Convert a YYYY-MM-DD date-input value to an ISO midnight UTC string
export function toIsoDateOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? `${trimmed}T00:00:00.000Z` : null;
}
