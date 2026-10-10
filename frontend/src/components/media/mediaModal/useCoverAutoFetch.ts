import { useEffect } from 'react';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  useLazyFetchOpenLibraryCoverQuery,
  useLazyFetchTmdbCoverQuery,
} from '@/redux/api/mediaApi';
import { applyFetchedCover, coverQueryKey, setFetchError } from '@/redux/slices/mediaModalSlice';
import { getCoverProvider, type CoverProvider } from './constants';

/** Wait for typing to settle before auto-fetching a cover. */
const AUTO_FETCH_DEBOUNCE_MS = 650;
/** Ignore short / incomplete titles for auto-fetch. */
const AUTO_FETCH_MIN_TITLE_LENGTH = 3;

/**
 * Builds a short cover-fetch error from an RTK / HTTP failure.
 *
 * @param err - Error thrown by a lazy query unwrap.
 * @param provider - IGDB, TMDB or Open Library label for the message.
 * @returns Short user-facing error text.
 */
export function coverFetchErrorMessage(err: unknown, provider: CoverProvider): string {
  const status: number | string | null =
    err && typeof err === 'object' && 'status' in err
      ? ((err as { status: number | string }).status ?? null)
      : null;

  if (status === 404) {
    return provider === 'IGDB' ? 'No IGDB game found' : `No ${provider} cover found`;
  }
  if (status === 400) {
    return provider === 'Open Library'
      ? `${provider} rejected the request`
      : `${provider} is not configured`;
  }
  if (status === 502) return `${provider} unavailable`;

  const detail = getApiErrorMessage(err, '');
  if (detail && detail.length <= 80) return detail;

  return `${provider} cover fetch failed`;
}

function isAbortError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'AbortError'
  );
}

/**
 * Debounced TMDB / Open Library cover lookup while the title is being typed.
 * Games use the IGDB search instead.
 *
 * @returns True while a cover request is in flight.
 */
export function useCoverAutoFetch(): boolean {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.mediaModal.isOpen);
  const title = useAppSelector((state) => state.mediaModal.form.title);
  const mediaType = useAppSelector((state) => state.mediaModal.form.mediaType);
  const lastKey = useAppSelector((state) => state.mediaModal.lastCoverQueryKey);
  const [fetchOpenLibraryCover, openLibraryState] = useLazyFetchOpenLibraryCoverQuery();
  const [fetchTmdbCover, tmdbState] = useLazyFetchTmdbCoverQuery();
  const provider = getCoverProvider(mediaType);

  useEffect(() => {
    const trimmed = title.trim();
    if (!open || provider === 'IGDB' || trimmed.length < AUTO_FETCH_MIN_TITLE_LENGTH) return;
    if (coverQueryKey(trimmed, mediaType) === lastKey) return;

    const timer = window.setTimeout(async () => {
      dispatch(setFetchError(null));
      try {
        const result =
          provider === 'TMDB'
            ? await fetchTmdbCover(
                { name: trimmed, mediaType: mediaType as 'Movie' | 'Series' | 'Anime' },
                true,
              ).unwrap()
            : await fetchOpenLibraryCover(trimmed, true).unwrap();
        dispatch(
          applyFetchedCover({
            title: trimmed,
            mediaType,
            posterUrl: result.poster_path,
            externalId: result.external_id,
          }),
        );
      } catch (err) {
        if (!isAbortError(err)) dispatch(setFetchError(coverFetchErrorMessage(err, provider)));
      }
    }, AUTO_FETCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [open, title, mediaType, lastKey, provider, dispatch, fetchTmdbCover, fetchOpenLibraryCover]);

  return tmdbState.isFetching || openLibraryState.isFetching;
}
