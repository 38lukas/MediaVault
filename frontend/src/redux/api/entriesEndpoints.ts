import type { MediaEntryPayload, MediaItem } from '@/types/media';
import { mediaApi } from './baseApi';

// Media library CRUD endpoints.
export const entriesEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    getMediaEntries: builder.query<MediaItem[], void>({
      query: () => '/entries',
      transformResponse: (response: MediaItem[]) =>
        [...response].sort((a, b) => b.id - a.id),
      providesTags: ['MediaEntries'],
    }),

    createMediaEntry: builder.mutation<MediaItem, MediaEntryPayload>({
      query: (body) => ({ url: '/entries', method: 'POST', body }),
      invalidatesTags: ['MediaEntries', 'ProfileStats'],
    }),

    updateMediaEntry: builder.mutation<MediaItem, { id: number; body: MediaEntryPayload }>({
      query: ({ id, body }) => ({ url: `/entries/${id}`, method: 'PUT', body }),
      invalidatesTags: ['MediaEntries', 'ProfileStats'],
    }),

    deleteMediaEntry: builder.mutation<void, number>({
      query: (id) => ({ url: `/entries/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MediaEntries', 'ProfileStats'],
    }),
  }),
});

export const {
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
} = entriesEndpoints;
