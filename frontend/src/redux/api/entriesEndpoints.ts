import {
  statusesForUnifiedLabel,
  type MediaEntryPayload,
  type MediaItem,
  type StatusCount,
} from '@/types/media';
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

    // Entries of one unified status label (e.g. 'Active' = Playing + Watching + Reading), cached per label.
    getMediaEntriesByStatus: builder.query<MediaItem[], string>({
      query: (label) => ({
        url: '/entries',
        params: { statuses: statusesForUnifiedLabel(label).join(',') },
      }),
      transformResponse: (response: MediaItem[]) =>
        [...response].sort((a, b) => b.id - a.id),
      providesTags: ['MediaEntries'],
    }),

    getEntryStatusCounts: builder.query<StatusCount[], void>({
      query: () => '/entries/status-counts',
      providesTags: ['MediaEntries'],
    }),

    createMediaEntry: builder.mutation<MediaItem, MediaEntryPayload>({
      query: (body) => ({ url: '/entries', method: 'POST', body }),
      invalidatesTags: ['MediaEntries', 'MediaLists', 'ProfileStats'],
    }),

    updateMediaEntry: builder.mutation<MediaItem, { id: number; body: MediaEntryPayload }>({
      query: ({ id, body }) => ({ url: `/entries/${id}`, method: 'PUT', body }),
      invalidatesTags: ['MediaEntries', 'MediaLists', 'ProfileStats'],
    }),

    deleteMediaEntry: builder.mutation<void, number>({
      query: (id) => ({ url: `/entries/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MediaEntries', 'MediaLists', 'ProfileStats'],
    }),
  }),
});

export const {
  useGetMediaEntriesQuery,
  useGetEntryStatusCountsQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
} = entriesEndpoints;
