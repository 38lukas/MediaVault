import type { MediaItem } from '@/types/media';

// All-time finished counts: total plus one count per media type
export interface FinishedCounts {
  total: number;
  game: number;
  dlc: number;
  movie: number;
  series: number;
  anime: number;
  book: number;
}

// Histogram bucket for a single rating value (1–10)
export interface RatingBucket {
  rating: number;
  count: number;
}

// Aggregated profile stats from GET /api/profile/stats
export interface ProfileStats {
  finished: FinishedCounts;
  rating_distribution: RatingBucket[];
  recently_finished: MediaItem[];
}
