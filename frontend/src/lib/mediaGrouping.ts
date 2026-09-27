import type { MediaItem } from '@/types/media';
import { dateValue } from '@/lib/dateUtils';

export const NO_FINISH_KEY = 'none';

export interface MonthSection {
  key: string;
  label: string;
  items: MediaItem[];
}

/**
 * Builds a YYYY-MM group key from finished_at.
 * @param item - Media entry.
 * @returns Month key, or NO_FINISH_KEY when missing.
 */
export function finishedMonthKey(item: MediaItem): string {
  const time = dateValue(item.finished_at);
  if (time === null) return NO_FINISH_KEY;
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats a month group key for UI display.
 * @param key - YYYY-MM or NO_FINISH_KEY.
 * @returns Human-readable month label.
 */
export function formatFinishedMonthLabel(key: string): string {
  if (key === NO_FINISH_KEY) return 'No finish date';
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Groups media items by finished month (newest months first).
 * @param items - Already filtered/sorted media list.
 * @returns Ordered month sections for divider rendering.
 */
export function groupByFinishedMonth(items: MediaItem[]): MonthSection[] {
  const groups = new Map<string, MediaItem[]>();

  for (const item of items) {
    const key = finishedMonthKey(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === NO_FINISH_KEY) return 1;
      if (b === NO_FINISH_KEY) return -1;
      return b.localeCompare(a);
    })
    .map(([key, sectionItems]) => ({
      key,
      label: formatFinishedMonthLabel(key),
      items: sectionItems,
    }));
}
