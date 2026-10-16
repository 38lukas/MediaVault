import { palette } from '@/lib/palette';
import { isGameType, type MediaType } from '@/types/media';

// Shared TextField styles for media modal inputs.
export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: palette.fieldBg,
  },
  '& .MuiInputBase-input[type="number"]': {
    MozAppearance: 'textfield',
    '&::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '&::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
};

export const sanitizeIntegerInput = (value: string) => value.replace(/\D/g, '');

export type CoverProvider = 'IGDB' | 'TMDB' | 'Open Library';

// Cover provider by media type (IGDB, TMDB, or Open Library).
export function getCoverProvider(mediaType: MediaType): CoverProvider {
  if (isGameType(mediaType)) return 'IGDB';
  return mediaType === 'Book' ? 'Open Library' : 'TMDB';
}

// Parses a bare IGDB id or igdb_<id> string into a numeric game id.
export function parseIgdbExternalId(value: string): number | null {
  const match = value.trim().match(/^(?:igdb_)?(\d+)$/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// True for ids from IGDB / TMDB / Open Library that other users' entries can share.
export function isMatchableExternalId(externalId: string): boolean {
  return /^(igdb|tmdb|openlibrary)_/.test(externalId.trim());
}

// Parses tmdb_tv_<id> or a season id like tmdb_tv_<id>_s<n> into the TMDB show id.
export function parseTmdbShowId(externalId: string): number | null {
  const match = externalId.trim().match(/^tmdb_tv_(\d+)(?:_s\d+)?$/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
