import { mediaApi } from './baseApi';
import type { Friend } from './types';

// Friends list add/remove endpoints.
export const friendsEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    getFriends: builder.query<Friend[], void>({
      query: () => '/friends',
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
  useAddFriendMutation,
  useRemoveFriendMutation,
} = friendsEndpoints;
