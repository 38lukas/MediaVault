import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MediaItem } from '@/components/MediaCard';

/** Raw shape returned by the entries API. */
interface MediaEntryResponse {
  id: number;
  title: string;
  media_type: string;
  status: string;
  external_id: string;
  poster_path?: string | null;
  created_at?: string | null;
}

/** Payload expected by POST/PUT /api/v1/entries. */
export interface MediaEntryPayload {
  title: string;
  media_type: string;
  status: string;
  external_id: string;
  poster_path?: string | null;
}

function toMediaItem(entry: MediaEntryResponse): MediaItem {
  return {
    id: entry.id,
    title: entry.title,
    type: entry.media_type,
    status: entry.status,
    cover_url: entry.poster_path || undefined,
    external_id: entry.external_id,
  };
}

/**
 * RTK Query API slice for media entries.
 * Cache, loading, and error state live here instead of a custom thunk slice.
 */
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  // fetchBaseQuery wraps fetch and prepends this base URL to each endpoint path.
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  }),
  // Tag types let mutations invalidate this cache and trigger a refetch later.
  tagTypes: ['MediaEntries'],
  endpoints: (builder) => ({
    getMediaEntries: builder.query<MediaItem[], void>({
      query: () => '/entries',
      // Newest first (higher id = later insert) so new cards appear on the left.
      transformResponse: (response: MediaEntryResponse[]): MediaItem[] =>
        [...response]
          .sort((a, b) => b.id - a.id)
          .map(toMediaItem),
      providesTags: ['MediaEntries'],
    }),
    // POST a new entry; invalidatesTags refetches the list on success.
    createMediaEntry: builder.mutation<MediaItem, MediaEntryPayload>({
      query: (body) => ({
        url: '/entries',
        method: 'POST',
        body,
      }),
      transformResponse: (entry: MediaEntryResponse) => toMediaItem(entry),
      invalidatesTags: ['MediaEntries'],
    }),
    // PUT updates an existing entry and refreshes the cached list.
    updateMediaEntry: builder.mutation<
      MediaItem,
      { id: number; body: MediaEntryPayload }
    >({
      query: ({ id, body }) => ({
        url: `/entries/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (entry: MediaEntryResponse) => toMediaItem(entry),
      invalidatesTags: ['MediaEntries'],
    }),
    // DELETE removes an entry and refreshes the cached list.
    deleteMediaEntry: builder.mutation<void, number>({
      query: (id) => ({
        url: `/entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MediaEntries'],
    }),
    // Lazy query: resolve a game cover URL from IGDB by title.
    fetchIgdbCover: builder.query<
      { name: string; external_id: string; cover_url: string },
      string
    >({
      query: (name) => ({
        url: '/igdb/cover',
        params: { name },
      }),
    }),
  }),
});

export const {
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useLazyFetchIgdbCoverQuery,
} = mediaApi;
