import type { MediaItem, SortDirection, SortField } from '@/types/media';
import { dateValue } from '@/lib/dateUtils';

const STATUS_RANK: Record<string, number> = {
  Playing: 0,
  Watching: 0,
  Finished: 1,
  Dropped: 2,
  Shelved: 3,
  Backlog: 4,
  Wishlist: 5,
  Watchlist: 5,
};

/** Maps a status label to a sort rank.
 * 
 *  @param status - Media status string.
 *  @returns Numeric rank used for status sorting.
 */
function getStatusRank(status: string): number {
  return STATUS_RANK[status] ?? 99;
}

/** Sorts two media items for the library sort controls.
 * 
 *  @param a - Left media item.
 *  @param b - Right media item.
 *  @param field - Active sort field.
 *  @param direction - Ascending or descending.
 *  @returns Negative/zero/positive result.
 */
export function sortMediaItems(
  a: MediaItem,
  b: MediaItem,
  field: SortField,
  direction: SortDirection
): number {
  let result = 0;

  // Sort by title
  if (field === 'title') {
    result = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  }

  // Sort by status
  else if (field === 'status') {
    result = getStatusRank(a.status) - getStatusRank(b.status);
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

    // started_at, finished_at, and months all sort by a date field.
    const dateField = field === 'started_at' ? a.started_at : a.finished_at;
    const dateFieldB = field === 'started_at' ? b.started_at : b.finished_at;
    const aDate = dateValue(dateField);
    const bDate = dateValue(dateFieldB);

    // Empty dates stay at the end in both asc and desc.
    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    result = aDate - bDate;
  }

  return direction === 'asc' ? result : -result;
}
