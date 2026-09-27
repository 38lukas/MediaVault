import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MediaEntryPayload, MediaItem } from '@/types/media';

export type { MediaEntryPayload };

/**
 * RTK Query API slice for media entries and IGDB cover lookup.
 * Field names match the FastAPI MediaEntry schema 1:1.
 */
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  }),
  tagTypes: ['MediaEntries'],
  endpoints: (builder) => ({
    getMediaEntries: builder.query<MediaItem[], void>({
      query: () => '/entries',
      /**
       * Sorts API entries newest-first by id (no field renaming needed).
       * @param response - Raw entry list from GET /entries.
       * @returns MediaItem list for the library UI.
       */
      transformResponse: (response: MediaItem[]): MediaItem[] =>
        [...response].sort((a, b) => b.id - a.id),
      providesTags: ['MediaEntries'],
    }),
    createMediaEntry: builder.mutation<MediaItem, MediaEntryPayload>({
      query: (body) => ({
        url: '/entries',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MediaEntries'],
    }),
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
    deleteMediaEntry: builder.mutation<void, number>({
      query: (id) => ({
        url: `/entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MediaEntries'],
    }),
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

export const {
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useLazyFetchIgdbCoverQuery,
} = mediaApi;
