import { palette } from '@/lib/palette';
import { isGameType, type MediaType } from '@/types/media';

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

/** Cover provider by media type: IGDB for games, TMDB for film/TV, Open Library for books. */
export function getCoverProvider(mediaType: MediaType): CoverProvider {
  if (isGameType(mediaType)) return 'IGDB';
  return mediaType === 'Book' ? 'Open Library' : 'TMDB';
}

/**
 * Parses a bare IGDB id or `igdb_<id>` string from the Cover details field.
 *
 * @param value - Raw external-id input.
 * @returns Numeric IGDB game id, or null if the value is not an IGDB id.
 */
export function parseIgdbExternalId(value: string): number | null {
  const match = value.trim().match(/^(?:igdb_)?(\d+)$/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
