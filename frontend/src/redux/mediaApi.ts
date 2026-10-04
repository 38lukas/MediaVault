import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  MediaEntryPayload,
  MediaItem,
  SortField,
  UserSettings,
} from '@/types/media';
import type { ProfileStats } from '@/types/profile';

export type { MediaEntryPayload };

// Partial general-settings update for PATCH /users/me/settings.
export interface UserSettingsUpdate {
  default_sort_field?: SortField;
}

// Account rename/password change for PATCH /users/me/account.
export interface AccountUpdate {
  current_password?: string;
  new_username?: string;
  new_password?: string;
}

// User payload returned by POST /auth/login.
export interface AuthUser {
  username: string;
  joined_date: string;
}

/** Resolves the RTK Query base URL from env, with a local fallback
 *  Strips trailing slashes and collapses accidental duplicated origins
 * 
 * @returns Absolute API base URL without a trailing slash
 */
export function resolveApiBaseUrl(): string {
  let raw = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').trim();

  // Clean up the URL to remove markdown links, quotes, trailing slashes, and duplicated origins.
  const markdownLink = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (markdownLink) {
    raw = markdownLink[1] || markdownLink[2]; 
  }
  raw = raw.replace(/^['"]|['"]$/g, ''); 
  raw = raw.replace(/\/+$/, ''); 
  raw = raw.replace(/^(https?:\/\/[^/]+)\/\1(?=\/|$)/i, '$1');
  return raw;
}

// RTK Query API slice for media entries and cover lookups (IGDB / TMDB / OpenLibrary)
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: resolveApiBaseUrl(),
    prepareHeaders: (headers, { getState }) => {
      const username = (getState() as { auth: { username: string | null } }).auth.username;
      if (username) {
        headers.set('X-Username', username);
      }
      return headers;
    },
  }),
  tagTypes: ['MediaEntries', 'UserSettings', 'ProfileStats'],

  endpoints: (builder) => ({

    // 1. AUTH & ACCOUNT
    login: builder.mutation<AuthUser, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    updateAccount: builder.mutation<UserSettings, AccountUpdate>({
      query: (body) => ({ url: '/users/me/account', method: 'PATCH', body }),
      invalidatesTags: ['UserSettings', 'MediaEntries', 'ProfileStats'],
    }),

    // 2. USER SETTINGS
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

    // 3. MEDIA ENTRIES (CRUD)
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

    // 4. PROFILE STATS
    getProfileStats: builder.query<ProfileStats, void>({
      query: () => '/profile/stats',
      providesTags: ['ProfileStats'],
    }),

    // 5. EXTERNAL COVER LOOKUPS (IGDB / TMDB / OpenLibrary)
    fetchIgdbCover: builder.query<
      { name: string; external_id: string; poster_path: string },
      string
    >({
      query: (name) => ({ url: '/igdb/cover', params: { name } }),
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

// Export the hooks from the mediaApi slice
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
  useLazyFetchIgdbCoverQuery,
  useLazyFetchTmdbCoverQuery,
  useLazyFetchOpenLibraryCoverQuery,
} = mediaApi;
