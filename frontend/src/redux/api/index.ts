import './authEndpoints';
import './userEndpoints';
import './entriesEndpoints';
import './profileEndpoints';
import './friendsEndpoints';
import './coversEndpoints';

export { mediaApi, resolveApiBaseUrl } from './baseApi';
export type { MediaEntryPayload } from '@/types/media';
export type {
  AccountUpdate,
  AuthUser,
  Friend,
  IgdbGameLookup,
  IgdbGameSearchResult,
  UserSettingsUpdate,
} from './types';

export {
  useLoginMutation,
  useUpdateAccountMutation,
} from './authEndpoints';

export {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useUploadAvatarMutation,
} from './userEndpoints';

export {
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
} from './entriesEndpoints';

export { useGetProfileStatsQuery } from './profileEndpoints';

export {
  useGetFriendsQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
} from './friendsEndpoints';

export {
  useLazyFetchIgdbCoverQuery,
  useLazySearchIgdbGamesQuery,
  useLazyFetchIgdbGameQuery,
  useLazyFetchTmdbCoverQuery,
  useLazyFetchOpenLibraryCoverQuery,
} from './coversEndpoints';
