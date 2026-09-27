import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MediaEntryPayload, MediaItem } from '@/types/media';

export type { MediaEntryPayload };

/** Resolves the RTK Query base URL from env, with a local fallback
 *  Strips trailing slashes and collapses accidental duplicated origins
 * 
 * @returns Absolute API base URL without a trailing slash
 */
function resolveApiBaseUrl(): string {
  let raw = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').trim();

  // Remove markdown links
  const markdownLink = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (markdownLink) {
    raw = markdownLink[1] || markdownLink[2]; 
  }
  raw = raw.replace(/^['"]|['"]$/g, ''); // Remove quotes
  raw = raw.replace(/\/+$/, ''); // Remove trailing slashes so `/entries` joins cleanly once
  raw = raw.replace(/^(https?:\/\/[^/]+)\/\1(?=\/|$)/i, '$1'); // Fix duplicated origin baked into NEXT_PUBLIC_API_URL at build time

  return raw;
}

// RTK Query API slice for media entries and IGDB cover lookup
export const mediaApi = createApi({

  reducerPath: 'mediaApi', 
  baseQuery: fetchBaseQuery({baseUrl: resolveApiBaseUrl()}), 
  tagTypes: ['MediaEntries'], 

  // Endpoints for the API 
  endpoints: (builder) => ({

    // Get all media entries
    getMediaEntries: builder.query<MediaItem[], void>({
      query: () => '/entries',
      transformResponse: (response: MediaItem[]): MediaItem[] =>
        [...response].sort((a, b) => b.id - a.id),
      providesTags: ['MediaEntries'],
    }),

    // Create a new media entry
    createMediaEntry: builder.mutation<MediaItem, MediaEntryPayload>({
      query: (body) => ({
        url: '/entries',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MediaEntries'], // Updates the cache for the media entries
    }),

    // Update a media entry
    updateMediaEntry: builder.mutation<
      MediaItem,
      { id: number; body: MediaEntryPayload }
    >({
      query: ({ id, body }) => ({
        url: `/entries/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['MediaEntries'],
    }),

    // Delete a media entry
    deleteMediaEntry: builder.mutation<void, number>({
      query: (id) => ({
        url: `/entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MediaEntries'],
    }),

    // Fetch the IGDB cover for a media entry
    fetchIgdbCover: builder.query<
      { name: string; external_id: string; poster_path: string },
      string
    >({
      query: (name) => ({
        url: '/igdb/cover',
        params: { name },
      }),
    }),
  }),
});

// Export the hooks from the mediaApi slice
export const {
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useLazyFetchIgdbCoverQuery,
} = mediaApi;
