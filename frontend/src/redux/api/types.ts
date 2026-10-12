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

export interface IgdbGameSearchResult {
  id: number;
  name: string;
  first_release_date: number | null;
}

export interface Friend {
  username: string;
  avatar_path: string | null;
}
