import type { CardSize, SortField } from '@/types/media';

export interface UserSettingsUpdate {
  default_sort_field?: SortField;
  default_card_size?: CardSize;
}

export interface AccountUpdate {
  current_password?: string;
  new_username?: string;
  new_password?: string;
}

export interface AuthUser {
  username: string;
  joined_date: string;
}

export interface IgdbGameLookup {
  name: string;
  external_id: string;
  poster_path: string | null;
  first_release_date: number | null;
  platforms: string[];
  franchises: string[];
  genres: string[];
  developers: string[];
  publishers: string[];
}

// TMDB dates are YYYY-MM-DD strings; movie and TV responses carry different fields.
export interface TmdbLookup {
  name: string;
  external_id: string;
  poster_path: string | null;
  genres: string[];
  production_companies: string[];
  release_date?: string | null;
  collection?: string | null;
  directors?: string[];
  runtime?: number | null;
  first_air_date?: string | null;
  last_air_date?: string | null;
  created_by?: string[];
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  original_title?: string | null;
}

export type TmdbMediaType = 'Movie' | 'Series' | 'Anime';

export interface TmdbSearchResult {
  id: number;
  name: string;
  release_date: string | null;
}

export interface IgdbGameSearchResult {
  id: number;
  name: string;
  first_release_date: number | null;
}

export interface Friend {
  username: string;
  avatar_path: string | null;
}
