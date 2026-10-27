import type { FavoriteCategory, FavoriteGroup, ProfileStats } from '@/types/profile';
import { mediaApi } from './baseApi';

export interface FavoriteSlotUpdate {
  slot: number;
  category: FavoriteCategory;
  title: string | null;
  media_type: string | null;
  external_id: string | null;
  poster_path: string | null;
  is_number_one: boolean;
}

// Profile stats endpoint.
export const profileEndpoints = mediaApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfileStats: builder.query<ProfileStats, void>({
      query: () => '/profile/stats',
      providesTags: ['ProfileStats'],
    }),
    updateFavoriteSlot: builder.mutation<FavoriteGroup[], FavoriteSlotUpdate>({
      query: ({ slot, ...body }) => ({
        url: `/profile/favorites/${slot}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ProfileStats'],
    }),
  }),
});

export const { useGetProfileStatsQuery, useUpdateFavoriteSlotMutation } = profileEndpoints;
