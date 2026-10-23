import type { MediaItem } from '@/types/media';

export interface MediaListItem {
  id: number;
  position: number;
  entry: MediaItem;
}

export interface MediaList {
  id: number;
  username: string;
  name: string;
  description: string | null;
  items: MediaListItem[];
}

export interface MediaListWrite {
  name: string;
  description: string | null;
}
