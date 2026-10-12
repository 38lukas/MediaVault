import type { MediaItem } from '@/types/media';

export interface FinishedCounts {
  total: number;
  game: number;
  dlc: number;
  movie: number;
  series: number;
  anime: number;
  book: number;
}

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface ProfileStats {
  finished: FinishedCounts;
  rating_distribution: RatingBucket[];
  recent_activity: MediaItem[];
}
