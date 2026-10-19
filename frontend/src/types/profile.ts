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

export interface ProfileStats {
  finished: FinishedCounts;
  rating_distribution: RatingBucket[];
  recent_activity: MediaItem[];
  achievements: Achievement[];
}
