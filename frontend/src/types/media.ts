// Shared media domain types aligned with the FastAPI MediaEntry schema
export interface MediaItem {
  id: number;
  title: string;
  media_type: string;
  status: string;
  external_id: string;
  poster_path?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
}

// Payload for creating/updating entries
export type MediaEntryPayload = Omit<MediaItem, 'id'>;

export type ViewMode = 'cards' | 'list';
export type TypeFilter = 'All' | 'Game' | 'DLC' | 'Movie' | 'Series' | 'Anime';
export type SortField = 'title' | 'status' | 'started_at' | 'finished_at';
export type SortDirection = 'asc' | 'desc';

export const TYPE_FILTERS: TypeFilter[] = [
  'All',
  'Game',
  'DLC',
  'Movie',
  'Series',
  'Anime',
];
