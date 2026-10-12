import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

// Normalizes NEXT_PUBLIC_API_URL into a clean base URL for RTK Query.
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

// Attaches X-Username from auth state (owner for friends, viewingAs otherwise).
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

// Blocks non-GET mutations while viewing a friend's library.
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

// Empty RTK Query API shell; domain endpoints are injected in sibling files.
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: baseQueryWithViewGuard,
  tagTypes: ['MediaEntries', 'UserSettings', 'ProfileStats', 'Friends'],
  endpoints: () => ({}),
});
