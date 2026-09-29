import type { MediaItem, SortDirection, SortField } from '@/types/media';
import { dateValue } from '@/utils/date';

// Default Asc/Desc applied automatically when a sort field is selected.
export const SORT_FIELD_DEFAULT_DIRECTION: Record<SortField, SortDirection> = {
  title: 'asc',
  status: 'asc',
  rating: 'desc',
  started_at: 'desc',
  finished_at: 'desc',
  months: 'desc',
};

const STATUS_RANK: Record<string, number> = {
  Playing: 0,
  Watching: 0,
  Finished: 1,
  Watched: 1,
  Played: 2,
  Dropped: 3,
  Shelved: 4,
  Backlog: 5,
  Wishlist: 6,
  Watchlist: 6,
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
  }

  // Sort by rating (DB 1–10); unrated items stay at the end in both directions.
  else if (field === 'rating') {
    const aRating = a.rating ?? null;
    const bRating = b.rating ?? null;
    if (aRating === null && bRating === null) {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    if (aRating === null) return 1;
    if (bRating === null) return -1;
    result = aRating - bRating;
    if (result === 0) {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
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
