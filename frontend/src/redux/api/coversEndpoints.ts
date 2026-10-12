import { mediaApi } from './baseApi';
import type { IgdbGameLookup, IgdbGameSearchResult } from './types';

// External cover lookup endpoints (IGDB / TMDB / OpenLibrary).
export const coversEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchIgdbCover: builder.query<IgdbGameLookup, string>({
      query: (name) => ({ url: '/igdb/cover', params: { name } }),
    }),

    searchIgdbGames: builder.query<IgdbGameSearchResult[], string>({
      query: (name) => ({ url: '/igdb/search', params: { name } }),
    }),

    fetchIgdbGame: builder.query<IgdbGameLookup, number>({
      query: (id) => `/igdb/games/${id}`,
    }),

    fetchTmdbCover: builder.query<
      { name: string; external_id: string; poster_path: string },
      { name: string; mediaType: 'Movie' | 'Series' | 'Anime' }
    >({
      query: ({ name, mediaType }) => ({
        url: '/tmdb/cover',
        params: { name, media_type: mediaType },
      }),
    }),

    fetchOpenLibraryCover: builder.query<
      { name: string; external_id: string; poster_path: string },
      string
    >({
      query: (name) => ({ url: '/openlibrary/cover', params: { name } }),
    }),
  }),
});

export const {
  useLazyFetchIgdbCoverQuery,
  useLazySearchIgdbGamesQuery,
  useLazyFetchIgdbGameQuery,
  useLazyFetchTmdbCoverQuery,
  useLazyFetchOpenLibraryCoverQuery,
} = coversEndpoints;
