import { mediaApi } from './baseApi';
import type { Friend, FriendEntry } from './types';

// Friends list add/remove endpoints.
export const friendsEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    getFriends: builder.query<Friend[], void>({
      query: () => '/friends',
      providesTags: ['Friends'],
    }),

    // Friends' entries for the media with this external id.
    getFriendEntries: builder.query<FriendEntry[], string>({
      query: (externalId) => ({ url: '/friends/entries', params: { external_id: externalId } }),
      providesTags: ['Friends'],
    }),

    addFriend: builder.mutation<Friend, string>({
      query: (username) => ({
        url: '/friends',
        method: 'POST',
        body: { username },
      }),
      invalidatesTags: ['Friends'],
    }),

    removeFriend: builder.mutation<void, string>({
      query: (username) => ({
        url: `/friends/${encodeURIComponent(username)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Friends'],
    }),
  }),
});

export const {
  useGetFriendsQuery,
  useGetFriendEntriesQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
} = friendsEndpoints;
