import type { MediaList, MediaListWrite } from '@/types/lists';
import { mediaApi } from './baseApi';

type ListsApi = typeof listsEndpoints;

// Assigned after injectEndpoints so mutation handlers can patch this cache.
let listsApi: ListsApi;

function replaceList(
  draft: MediaList[],
  next: MediaList,
) {
  const index = draft.findIndex((list) => list.id === next.id);
  if (index >= 0) draft[index] = next;
  else draft.push(next);
}

// Named lists of library entries, kept in a user-defined order.
export const listsEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    getMediaLists: builder.query<MediaList[], void>({
      query: () => '/lists',
      providesTags: ['MediaLists'],
    }),

    createMediaList: builder.mutation<MediaList, MediaListWrite>({
      query: (body) => ({ url: '/lists', method: 'POST', body }),
      invalidatesTags: ['MediaLists'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
              replaceList(draft, data);
            }),
          );
        } catch {
          // The tag refetch still runs after a successful create.
        }
      },
    }),

    updateMediaList: builder.mutation<MediaList, { id: number; body: MediaListWrite }>({
      query: ({ id, body }) => ({ url: `/lists/${id}`, method: 'PUT', body }),
      invalidatesTags: ['MediaLists'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
              replaceList(draft, data);
            }),
          );
        } catch {
          // Leave the previous list in the cache when the save fails.
        }
      },
    }),

    deleteMediaList: builder.mutation<void, number>({
      query: (id) => ({ url: `/lists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MediaLists'],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
            const index = draft.findIndex((list) => list.id === id);
            if (index >= 0) draft.splice(index, 1);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    addMediaListItem: builder.mutation<MediaList, { listId: number; entryId: number }>({
      query: ({ listId, entryId }) => ({
        url: `/lists/${listId}/items`,
        method: 'POST',
        body: { entry_id: entryId },
      }),
      invalidatesTags: ['MediaLists'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
              replaceList(draft, data);
            }),
          );
        } catch {
          // A failed add leaves the list unchanged.
        }
      },
    }),

    removeMediaListItem: builder.mutation<MediaList, { listId: number; itemId: number }>({
      query: ({ listId, itemId }) => ({
        url: `/lists/${listId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MediaLists'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
              replaceList(draft, data);
            }),
          );
        } catch {
          // A failed remove leaves the list unchanged.
        }
      },
    }),

    reorderMediaList: builder.mutation<MediaList, { listId: number; itemIds: number[] }>({
      query: ({ listId, itemIds }) => ({
        url: `/lists/${listId}/order`,
        method: 'PUT',
        body: { item_ids: itemIds },
      }),
      invalidatesTags: ['MediaLists'],
      async onQueryStarted({ listId, itemIds }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
            const list = draft.find((entry) => entry.id === listId);
            if (!list) return;
            const byId = new Map(list.items.map((item) => [item.id, item]));
            const next = [];
            for (const [position, id] of itemIds.entries()) {
              const item = byId.get(id);
              if (!item) return;
              item.position = position;
              next.push(item);
            }
            list.items = next;
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            listsApi.util.updateQueryData('getMediaLists', undefined, (draft) => {
              replaceList(draft, data);
            }),
          );
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

listsApi = listsEndpoints;

export const {
  useGetMediaListsQuery,
  useCreateMediaListMutation,
  useUpdateMediaListMutation,
  useDeleteMediaListMutation,
  useAddMediaListItemMutation,
  useRemoveMediaListItemMutation,
  useReorderMediaListMutation,
} = listsEndpoints;
