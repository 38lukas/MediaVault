export interface MediaItem {
  id: number;
  username: string;
  title: string;
  media_type: string;
  status: string;
  playtime?: number | null;
  release_date?: string | null;
  platforms?: string[] | null;
  franchises?: string[] | null;
  genres?: string[] | null;
  developers?: string[] | null;
  publishers?: string[] | null;
  platform_played_on?: string | null;
  external_id: string;
  poster_path?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  rating?: number | null;
  played_dates?: string[] | null;
}

export type MediaEntryPayload = Omit<MediaItem, 'id' | 'username'>;

// Supported media type values
export const MEDIA_TYPES = ['Game', 'DLC', 'Movie', 'Series', 'Anime', 'Book'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

// Statuses allowed per media type (mirrors backend ALLOWED_STATUSES)
export const STATUSES_BY_TYPE: Record<MediaType, string[]> = {
  Game: ['Playing', 'Finished', 'Played', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  DLC: ['Playing', 'Finished', 'Played', 'Dropped', 'Shelved', 'Backlog', 'Wishlist'],
  Movie: ['Watching', 'Watched', 'Dropped', 'Watchlist'],
  Series: ['Watching', 'Watched', 'Shelved', 'Dropped', 'Watchlist'],
  Anime: ['Watching', 'Watched', 'Shelved', 'Dropped', 'Watchlist'],
  Book: ['Reading', 'Read', 'Dropped', 'Backlog']
};

// True when value is a known MediaType
export function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPES as readonly string[]).includes(value);
}

// True when the media type is Game or DLC
export function isGameType(mediaType: string): boolean {
  return mediaType === 'Game' || mediaType === 'DLC';
}

export type CardSize = 0 | 1 | 2 | 3 | 4;
export const CARD_SIZE_DEFAULT = 2 as const;

// Card grid density options for the library toolbar
export const CARD_SIZE_OPTIONS: { value: CardSize; label: string }[] = [
  { value: 0, label: 'XL' },
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'S' },
  { value: 4, label: 'XS' },
];

// True when value is a valid CardSize
export function isCardSize(value: unknown): value is CardSize {
  return value === 0 || value === 1 || value === 2 || value === 3 || value === 4;
}
export type TypeFilter = 'All' | 'Game/DLC' | 'Movie' | 'Series' | 'Anime' | 'Book';
export type SortField =
  | 'title'
  | 'status'
  | 'started_at'
  | 'finished_at'
  | 'months'
  | 'rating'
  | 'last_played';
export type SortDirection = 'asc' | 'desc';

// Shared sort options for the library toolbar and settings
export const SORT_FIELD_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
  { value: 'started_at', label: 'Started at' },
  { value: 'finished_at', label: 'Finished at' },
  { value: 'last_played', label: 'Last Played' },
  { value: 'months', label: 'Months' },
];

export type SettingsSection = 'account' | 'general' | 'appearance';

export interface UserSettings {
  username: string;
  joined_date: string;
  default_sort_field: SortField;
  default_card_size: CardSize;
  avatar_path: string | null;
}

// Library type filter options
export const TYPE_FILTERS: TypeFilter[] = [
  'All',
  'Game/DLC',
  'Movie',
  'Series',
  'Anime',
  'Book'
];

// Map a type filter to matching media_type values
export function matchesTypeFilter(mediaType: string, filter: TypeFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Game/DLC') return mediaType === 'Game' || mediaType === 'DLC';
  return mediaType === filter;
}

// Unified status labels used when the type filter is All
export const UNIFIED_STATUS_FILTERS = [
  'Active',
  'Finished',
  'Played',
  'Dropped',
  'Shelved',
  'Queue',
  'Wishlist',
] as const;

export type UnifiedStatusFilter = (typeof UNIFIED_STATUS_FILTERS)[number];

const ACTIVE_STATUSES = new Set(['Playing', 'Watching', 'Reading']);
const FINISHED_STATUSES = new Set(['Finished', 'Watched', 'Read']);
const QUEUE_STATUSES = new Set(['Backlog', 'Watchlist']);

// Status options for the library status dropdown, scoped to the active type filter
export function statusesForTypeFilter(filter: TypeFilter): string[] {
  if (filter === 'All') return [...UNIFIED_STATUS_FILTERS];
  if (filter === 'Game/DLC') return STATUSES_BY_TYPE.Game;
  return STATUSES_BY_TYPE[filter];
}

// True when an entry status matches the selected status filter (supports unified All labels)
export function matchesStatusFilter(
  itemStatus: string,
  statusFilter: string | null
): boolean {
  if (!statusFilter) return true;
  if (statusFilter === 'Active') return ACTIVE_STATUSES.has(itemStatus);
  if (statusFilter === 'Finished') return FINISHED_STATUSES.has(itemStatus);
  if (statusFilter === 'Queue') return QUEUE_STATUSES.has(itemStatus);
  return itemStatus === statusFilter;
}

// Map stored type-specific statuses to a unified section/filter label
export function unifiedStatusLabel(status: string): string {
  if (ACTIVE_STATUSES.has(status)) return 'Active';
  if (FINISHED_STATUSES.has(status)) return 'Finished';
  if (QUEUE_STATUSES.has(status)) return 'Queue';
  return status;
}

// Display labels for type filter chips
export const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
  All: 'All',
  'Game/DLC': 'Games',
  Movie: 'Movies',
  Series: 'Series',
  Anime: 'Anime',
  Book: 'Books',
};
