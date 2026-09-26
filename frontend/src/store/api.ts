import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MediaItem } from '@/components/MediaCard';

/** Raw shape returned by GET /api/v1/entries. */
interface MediaEntryResponse {
  id: number;
  title: string;
  media_type: string;
  status: string;
  external_id: string;
  poster_path?: string | null;
  created_at?: string | null;
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
      // Map backend field names to the MediaItem props used by the UI.
      transformResponse: (response: MediaEntryResponse[]): MediaItem[] =>
        response.map((entry) => ({
          id: entry.id,
          title: entry.title,
          type: entry.media_type,
          status: entry.status,
          cover_url: entry.poster_path || undefined,
        })),
      providesTags: ['MediaEntries'],
    }),
  }),
});

export const { useGetMediaEntriesQuery } = mediaApi;
