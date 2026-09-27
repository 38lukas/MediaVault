import type { MediaItem, SortDirection, SortField } from '@/types/media';
import { dateValue } from '@/lib/dateUtils';

/** Playing → Backlog → Wishlist → Finished; other statuses fall after. */
const STATUS_RANK: Record<string, number> = {
  Playing: 0,
  Watching: 0,
  Backlog: 1,
  Wishlist: 2,
  Watchlist: 2,
  Finished: 3,
  Shelved: 4,
  Dropped: 5,
};

/**
 * Maps a status label to a sort rank.
 * @param status - Media status string.
 * @returns Numeric rank used for status sorting.
 */
function statusRank(status: string): number {
  return STATUS_RANK[status] ?? 99;
}

/**
 * Compares two media items for the library sort controls.
 * @param a - Left item.
 * @param b - Right item.
 * @param field - Active sort field.
 * @param direction - Ascending or descending.
 * @returns Negative/zero/positive comparator result.
 */
export function compareMediaItems(
  a: MediaItem,
  b: MediaItem,
  field: SortField,
  direction: SortDirection
): number {
  let result = 0;

  if (field === 'title') {
    result = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  } else if (field === 'status') {
    result = statusRank(a.status) - statusRank(b.status);
    if (result !== 0) {
      return direction === 'asc' ? result : -result;
    }

    // Fixed secondary sort: finished_at descending within the same status.
    const aDate = dateValue(a.finished_at);
    const bDate = dateValue(b.finished_at);
    if (aDate === null && bDate === null) {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    return bDate - aDate;
  } else {
    const aDate = dateValue(field === 'started_at' ? a.started_at : a.finished_at);
    const bDate = dateValue(field === 'started_at' ? b.started_at : b.finished_at);

    // Empty dates stay at the end in both asc and desc.
    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    result = aDate - bDate;
  }

  return direction === 'asc' ? result : -result;
}
