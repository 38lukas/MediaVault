import type { MediaItem, SortDirection, SortField } from '@/types/media';
import { dateValue, maxDateValue } from '@/utils/date';

// Default Asc/Desc applied when a sort field is selected
export const SORT_FIELD_DEFAULT_DIRECTION: Record<SortField, SortDirection> = {
  title: 'asc',
  status: 'asc',
  rating: 'desc',
  started_at: 'desc',
  finished_at: 'desc',
  months: 'desc',
  last_played: 'desc',
};

// Latest journal day for an entry, or null when none are logged
function lastPlayedValue(item: MediaItem): number | null {
  return maxDateValue(...(item.played_dates ?? []));
}

// Title order; seasons of the same show follow the whole-show entry in season order
function compareTitles(a: MediaItem, b: MediaItem): number {
  const result = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  if (result !== 0) return result;
  return (a.season_number ?? 0) - (b.season_number ?? 0);
}

// Numeric ranks for status sorting (fused groups share a rank)
const STATUS_RANK: Record<string, number> = {
  Playing: 0,
  Watching: 0,
  Reading: 0,
  Active: 0,
  Finished: 1,
  Watched: 1,
  Read: 1,
  Played: 2,
  Dropped: 3,
  Shelved: 4,
  Backlog: 5,
  Watchlist: 5,
  Queue: 5,
  Wishlist: 6,
};

// Map a status label to a sort rank
function getStatusRank(status: string): number {
  return STATUS_RANK[status] ?? 99;
}

// Sort media items by the active field and direction
export function sortMediaItems(
  a: MediaItem,
  b: MediaItem,
  field: SortField,
  direction: SortDirection
): number {
  let result = 0;

  if (field === 'title') {
    result = compareTitles(a, b);
  }

  else if (field === 'status') {
    result = getStatusRank(a.status) - getStatusRank(b.status);
    if (result !== 0) {
      return direction === 'asc' ? result : -result;
    }

    const aDate = dateValue(a.finished_at) ?? dateValue(a.started_at);
    const bDate = dateValue(b.finished_at) ?? dateValue(b.started_at);
    if (aDate === null && bDate === null) {
      return compareTitles(a, b);
    }
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    return bDate - aDate;
  }

  else if (field === 'rating') {
    const aRating = a.rating ?? null;
    const bRating = b.rating ?? null;
    if (aRating === null && bRating === null) {
      return compareTitles(a, b);
    }
    if (aRating === null) return 1;
    if (bRating === null) return -1;
    result = aRating - bRating;
    if (result === 0) {
      return compareTitles(a, b);
    }
  }

  else if (field === 'months') {
    const aDate = dateValue(a.finished_at);
    const bDate = dateValue(b.finished_at);
    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    result = aDate - bDate;
  }

  else if (field === 'last_played') {
    const aDate = lastPlayedValue(a);
    const bDate = lastPlayedValue(b);
    if (aDate === null && bDate === null) {
      return compareTitles(a, b);
    }
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    result = aDate - bDate;
    if (result === 0) {
      return compareTitles(a, b);
    }
  }

  else {
    const aDate = dateValue(field === 'started_at' ? a.started_at : a.finished_at);
    const bDate = dateValue(field === 'started_at' ? b.started_at : b.finished_at);

    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    result = aDate - bDate;
  }

  return direction === 'asc' ? result : -result;
}
