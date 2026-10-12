import type { UserSettings } from '@/types/media';
import { mediaApi } from './baseApi';
import type { AccountUpdate, AuthUser } from './types';

// Auth login and account update endpoints.
export const authEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthUser, { username: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    updateAccount: builder.mutation<UserSettings, AccountUpdate>({
      query: (body) => ({ url: '/users/me/account', method: 'PATCH', body }),
      invalidatesTags: ['UserSettings', 'MediaEntries', 'ProfileStats'],
    }),
  }),
});

export const {
  useLoginMutation,
  useUpdateAccountMutation,
} = authEndpoints;
