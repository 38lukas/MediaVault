import type { MediaItem } from '@/types/media';
import { dateValue } from '@/lib/dateUtils';

export const NO_FINISH_KEY = 'none';

export interface LibrarySection {
  key: string;
  label: string;
  items: MediaItem[];
}

/**
 * Groups already-sorted items into consecutive sections.
 * @param items - Sorted media list.
 * @param keyOf - Section key for each item.
 * @param labelOf - Optional label formatter (defaults to the key).
 * @returns Ordered sections for divider rendering.
 */
export function groupConsecutive(
  items: MediaItem[],
  keyOf: (item: MediaItem) => string,
  labelOf: (key: string) => string = (key) => key
): LibrarySection[] {
  const sections: LibrarySection[] = [];

  for (const item of items) {
    const key = keyOf(item);
    const last = sections.at(-1);
    if (last?.key === key) last.items.push(item);
    else sections.push({ key, label: labelOf(key), items: [item] });
  }

  return sections;
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

/** Section key so equivalent statuses share one divider.
 * 
 * @param item - Media entry.
 * @returns Section key.
 */
export function statusSectionKey(item: MediaItem): string {
  if (item.status === 'Playing' || item.status === 'Watching') return 'Playing / Watching';
  if (item.status === 'Finished' || item.status === 'Watched') return 'Finished / Watched';
  return item.status;
}
