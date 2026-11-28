import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { clearUsername } from '@/redux/slices/authSlice';

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
  auth: { token: string | null; viewingAs: string | null };
};

// Own-data reads that have a read-only friend counterpart under /friends/{name}/...
const FRIEND_VIEW_PATHS: Record<string, string> = {
  '/users/me': 'settings',
  '/entries': 'entries',
  '/lists': 'lists',
  '/profile/stats': 'profile/stats',
};

// 401 here means a wrong password, not an expired session.
const NO_LOGOUT_ON_401 = new Set(['login', 'register', 'updateAccount']);

// Attaches the logged-in user's bearer token to every request.
const rawBaseQuery = fetchBaseQuery({
  baseUrl: resolveApiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthStateSlice).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Points an own-data read at the friend's read-only endpoint.
function toFriendView(args: string | FetchArgs, friend: string): string | FetchArgs {
  const url = typeof args === 'string' ? args : args.url;
  const target = FRIEND_VIEW_PATHS[url];
  if (!target) return args;
  const friendUrl = `/friends/${encodeURIComponent(friend)}/${target}`;
  return typeof args === 'string' ? friendUrl : { ...args, url: friendUrl };
}

// In friend view: reads go to the friend endpoints, writes are blocked.
// Logs out when the server rejects the token (expired or invalidated session).
const baseQueryWithViewGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const { viewingAs, token: sentToken } = (api.getState() as AuthStateSlice).auth;
  let requestArgs = args;
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
    requestArgs = toFriendView(args, viewingAs);
  }

  const result = await rawBaseQuery(requestArgs, api, extraOptions);
  // Only log out if the rejected token is still the current one (not a request that was
  // sent before a fresh token arrived).
  const currentToken = (api.getState() as AuthStateSlice).auth.token;
  if (
    result.error?.status === 401 &&
    !NO_LOGOUT_ON_401.has(api.endpoint) &&
    sentToken === currentToken
  ) {
    api.dispatch(clearUsername());
    api.dispatch(mediaApi.util.resetApiState());
  }
  return result;
};

// Empty RTK Query API shell; domain endpoints are injected in sibling files.
export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: baseQueryWithViewGuard,
  tagTypes: ['MediaEntries', 'MediaLists', 'UserSettings', 'ProfileStats', 'Friends'],
  endpoints: () => ({}),
});
