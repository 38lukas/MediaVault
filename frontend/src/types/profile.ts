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

export type AchievementRarity = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  rarity: AchievementRarity;
  image: string | null;
}

export const FAVORITE_CATEGORIES = ['All', 'Game', 'Movie', 'Series', 'Anime', 'Book'] as const;
export type FavoriteCategory = (typeof FAVORITE_CATEGORIES)[number];

export interface FavoriteSlot {
  slot: number;
  title: string | null;
  media_type: string | null;
  external_id: string | null;
  poster_path: string | null;
  is_number_one: boolean;
}

export interface FavoriteGroup {
  category: FavoriteCategory;
  slots: FavoriteSlot[];
}

export interface ProfileStats {
  finished: FinishedCounts;
  finished_this_year: FinishedCounts;
  finished_year: number;
  rating_distribution: RatingBucket[];
  unrated_count: number;
  recent_activity: MediaItem[];
  achievements: Achievement[];
  favorites: FavoriteGroup[];
}
