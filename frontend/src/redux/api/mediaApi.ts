import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type {
  CardSize,
  MediaEntryPayload,
  MediaItem,
  SortField,
  UserSettings,
} from '@/types/media';
import type { ProfileStats } from '@/types/profile';

export type { MediaEntryPayload };

export interface UserSettingsUpdate {
  default_sort_field?: SortField;
  default_card_size?: CardSize;
}

export interface AccountUpdate {
  current_password?: string;
  new_username?: string;
  new_password?: string;
}

export interface AuthUser {
  username: string;
  joined_date: string;
}

export interface IgdbGameLookup {
  name: string;
  external_id: string;
  poster_path: string | null;
  first_release_date: number | null;
  platforms: string[];
  franchises: string[];
  genres: string[];
  developers: string[];
  publishers: string[];
}

export interface IgdbGameSearchResult {
  id: number;
  name: string;
  first_release_date: number | null;
}

export interface Friend {
  username: string;
  avatar_path: string | null;
}

export function resolveApiBaseUrl(): string {
  let raw = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').trim();

  const markdownLink = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (markdownLink) {
    raw = markdownLink[1] || markdownLink[2]; 
  }
  raw = raw.replace(/^['"]|['"]$/g, ''); 
  raw = raw.replace(/\/+$/, ''); 
  raw = raw.replace(/^(https?:\/\/[^/]+)\/\1(?=\/|$)/i, '$1');
  return raw;
}

type AuthStateSlice = {
  auth: { username: string | null; viewingAs: string | null };
};

const FRIENDS_ENDPOINTS = new Set(['getFriends', 'addFriend', 'removeFriend']);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: resolveApiBaseUrl(),
  prepareHeaders: (headers, { getState, endpoint }) => {
    const auth = (getState() as AuthStateSlice).auth;
    const username = FRIENDS_ENDPOINTS.has(endpoint)
      ? auth.username
      : (auth.viewingAs ?? auth.username);
    if (username) {
      headers.set('X-Username', username);
    }
    return headers;
  },
});

const baseQueryWithViewGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const viewingAs = (api.getState() as AuthStateSlice).auth.viewingAs;
  if (viewingAs) {
    const method =
      typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      return {
        error: {
          status: 403,
          data: { detail: 'Read-only while viewing a friend' },
        },
      };
    }
  }
  return rawBaseQuery(args, api, extraOptions);
};

export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: baseQueryWithViewGuard,
  tagTypes: ['MediaEntries', 'UserSettings', 'ProfileStats', 'Friends'],

  endpoints: (builder) => ({

    login: builder.mutation<AuthUser, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    updateAccount: builder.mutation<UserSettings, AccountUpdate>({
      query: (body) => ({ url: '/users/me/account', method: 'PATCH', body }),
      invalidatesTags: ['UserSettings', 'MediaEntries', 'ProfileStats'],
    }),

    getUserSettings: builder.query<UserSettings, void>({
      query: () => '/users/me',
      providesTags: ['UserSettings'],
    }),

    updateUserSettings: builder.mutation<UserSettings, UserSettingsUpdate>({
      query: (body) => ({ url: '/users/me/settings', method: 'PATCH', body }),
      invalidatesTags: ['UserSettings'],
    }),

    uploadAvatar: builder.mutation<UserSettings, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/users/me/avatar', method: 'POST', body };
      },
      invalidatesTags: ['UserSettings'],
    }),

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

    getProfileStats: builder.query<ProfileStats, void>({
      query: () => '/profile/stats',
      providesTags: ['ProfileStats'],
    }),

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
  useLoginMutation,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useUploadAvatarMutation,
  useUpdateAccountMutation,
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
  useGetProfileStatsQuery,
  useGetFriendsQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
  useLazyFetchIgdbCoverQuery,
  useLazySearchIgdbGamesQuery,
  useLazyFetchIgdbGameQuery,
  useLazyFetchTmdbCoverQuery,
  useLazyFetchOpenLibraryCoverQuery,
} = mediaApi;
