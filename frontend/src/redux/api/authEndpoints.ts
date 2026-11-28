import type { UserSettings } from '@/types/media';
import { mediaApi } from './baseApi';
import type { AccountUpdate, AuthUser } from './types';

// Auth login, sign-up and account update endpoints.
export const authEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthUser, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    register: builder.mutation<AuthUser, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    // Returns a fresh token: renames and password changes invalidate the old one.
    // No invalidatesTags here: refetching before the new token is stored would send the
    // old one. AccountSection invalidates after saving the token.
    updateAccount: builder.mutation<UserSettings & { access_token: string }, AccountUpdate>({
      query: (body) => ({ url: '/users/me/account', method: 'PATCH', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useUpdateAccountMutation,
} = authEndpoints;
