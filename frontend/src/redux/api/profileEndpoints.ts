import type { ProfileStats } from '@/types/profile';
import { mediaApi } from './baseApi';

// Profile stats endpoint.
export const profileEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfileStats: builder.query<ProfileStats, void>({
      query: () => '/profile/stats',
      providesTags: ['ProfileStats'],
    }),
  }),
});

export const { useGetProfileStatsQuery } = profileEndpoints;
