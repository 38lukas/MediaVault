import type { UserSettings } from '@/types/media';
import { mediaApi } from './baseApi';
import type { UserSettingsUpdate } from './types';

// Current-user settings and avatar endpoints.
export const userEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useUploadAvatarMutation,
} = userEndpoints;
