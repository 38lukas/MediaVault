import type { MediaItem } from '@/types/media';
import { dateValue } from '@/utils/date';
import {
  RATING_SECTION_LABELS,
  UNRATED_SECTION_LABEL,
  toStars,
} from '@/utils/rating';

export const NO_FINISH_KEY = 'none';
export const NO_RATING_KEY = 'none';

export interface LibrarySection {
  key: string;
  label: string;
  items: MediaItem[];
  rating?: number | null;
}

/** Groups already-sorted items into consecutive sections.
 * 
 * @param items - Sorted media list.
 * @param keyOf - Section key for each item.
 * @param labelOf - Optional label formatter (defaults to the key).
 * @param ratingOf - Optional DB rating for divider star icons.
 * @returns Ordered sections for divider rendering.
 */
export function groupConsecutive(
  items: MediaItem[],
  keyOf: (item: MediaItem) => string,
  labelOf: (key: string) => string = (key) => key,
  ratingOf?: (item: MediaItem) => number | null | undefined
): LibrarySection[] {
  const sections: LibrarySection[] = [];

  for (const item of items) {
    const key = keyOf(item);
    const last = sections.at(-1);
    if (last?.key === key) last.items.push(item);
    else {
      sections.push({
        key,
        label: labelOf(key),
        items: [item],
        rating: ratingOf?.(item),
      });
    }
  }

  return sections;
}

/** Builds a YYYY-MM group key from finished_at.
 * 
 * @param item - Media entry.
 * @returns Month key, or NO_FINISH_KEY when finished_at is missing.
 */
export function finishedMonthKey(item: MediaItem): string {
  const time = dateValue(item.finished_at);
  if (time === null) return NO_FINISH_KEY;
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Formats a month group key for UI display.
 * 
 * @param key - YYYY-MM or NO_FINISH_KEY.
 * @returns Human-readable month label.
 */
export function formatFinishedMonthLabel(key: string): string {
  if (key === NO_FINISH_KEY) return 'No date';
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
  if (item.status === 'Playing' || item.status === 'Watching' || item.status === 'Reading') return 'Playing / Watching / Reading';
  if (item.status === 'Finished' || item.status === 'Watched' || item.status === 'Read') return 'Finished / Watched / Read';
  return item.status;
}

/** Builds a half-star section key from the DB rating (1–10).
 * 
 * @param item - Media entry.
 * @returns Rating key, or NO_RATING_KEY when unrated.
 */
export function ratingSectionKey(item: MediaItem): string {
  if (item.rating == null) return NO_RATING_KEY;
  return String(item.rating);
}

/** Formats a rating group key for UI display.
 * 
 * @param key - DB rating string or NO_RATING_KEY.
 * @returns Custom label from config (falls back to star count).
 */
export function formatRatingLabel(key: string): string {
  if (key === NO_RATING_KEY) return UNRATED_SECTION_LABEL;
  const stars = toStars(Number(key));
  if (stars == null) return UNRATED_SECTION_LABEL;
  return RATING_SECTION_LABELS[stars] ?? `${stars}`;
}
