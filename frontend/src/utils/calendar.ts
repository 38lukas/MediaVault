/**
 * Formats a local date as a timezone-free day key.
 * @param date - Local date.
 * @returns YYYY-MM-DD in local time (never shifted to UTC).
 */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Builds a fixed 6-week, Monday-first grid for a month view.
 * @param year - Full year.
 * @param month - Month index 0–11.
 * @returns 42 local dates, including leading/trailing days of adjacent months.
 */
export function buildMonthGrid(year: number, month: number): Date[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i));
}
