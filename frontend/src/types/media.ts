// Shared media domain types aligned with the FastAPI MediaEntry schema
export interface MediaItem {
  id: number;
  username: string;
  title: string;
  media_type: string;
  status: string;
  playtime?: number | null;
  release_date?: string | null;
  platforms?: string[] | null;
  franchise?: string | null;
  genres?: string[] | null;
  developers?: string[] | null;
  publishers?: string[] | null;
  platform_played_on?: string | null;
  external_id: string;
  poster_path?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  rating?: number | null; // 1–10, or null when unrated
}

// Payload for creating/updating entries (username is set by the backend)
export type MediaEntryPayload = Omit<MediaItem, 'id' | 'username'>;

export type ViewMode = 'cards' | 'list';
/** Card grid density: 0 = extra large … 2 = medium … 4 = extra small. */
export type CardSize = 0 | 1 | 2 | 3 | 4;
export const CARD_SIZE_MIN = 0 as const;
export const CARD_SIZE_MAX = 4 as const;
export const CARD_SIZE_DEFAULT = 2 as const; // medium (= former densest size)
export type TypeFilter = 'All' | 'Game/DLC' | 'Movie' | 'Series' | 'Anime' | 'Book';
export type SortField =
  | 'title'
  | 'status'
  | 'started_at'
  | 'finished_at'
  | 'months'
  | 'rating';
export type SortDirection = 'asc' | 'desc';

// Shared sort options for the library toolbar and settings.
export const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
  { value: 'started_at', label: 'Started at' },
  { value: 'finished_at', label: 'Finished at' },
  { value: 'months', label: 'Months' },
];

// Settings sidebar section keys.
export type SettingsSection = 'account' | 'general';

// Current-user account info and general settings from GET /api/users/me.
export interface UserSettings {
  username: string;
  joined_date: string;
  default_sort_field: SortField;
  avatar_path: string | null;
}

export const TYPE_FILTERS: TypeFilter[] = [
  'All',
  'Game/DLC',
  'Movie',
  'Series',
  'Anime',
  'Book'
];

// Maps a type filter to matching media_type values. 
export function matchesTypeFilter(mediaType: string, filter: TypeFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Game/DLC') return mediaType === 'Game' || mediaType === 'DLC';
  return mediaType === filter;
}
